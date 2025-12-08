"""
WebSocket server for Pong game - allows human players to play against AI agent
Messages from client:
- {"type":"reset"}
- {"type":"action","player":1,"action":0}  # player 1 or 2, action 0=stay, 1=up, 2=down
- {"type":"mode","player":1,"mode":"human"} # mode can be "human", "ai"
- {"type":"get_state"}

Messages from server:
- {"type":"state","ball":[x,y],"paddle1":y,"paddle2":y,"score1":n,"score2":n,"done":false}
- {"type":"mode","player":1,"mode":"human"}
"""

import asyncio
import json
import argparse
import sys
import os

# Set headless mode BEFORE importing pygame
os.environ["SDL_VIDEODRIVER"] = "dummy"
os.environ["SDL_AUDIODRIVER"] = "dummy"

# Add parent directory to path to import game modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from aiohttp import web
except ImportError:
    print("aiohttp not installed. Run: pip install aiohttp")
    sys.exit(1)

from backend.core.game import Pong
from training.agent import Agent

class PongServer:
    def __init__(self, host="0.0.0.0", port=8765, http_port=None, model_path="models/latest.pt"):
        self.host = host
        self.port = port
        self.http_port = http_port or port  # Use same port for HTTP and WebSocket
        
        # Initialize game with render mode that doesn't require display
        # CRITICAL: Keep same dimensions and settings as training!
        self.game = Pong(
            window_width=1280,
            window_height=960,
            fps=60,
            player1="human",
            player2="ai",
            render_mode="rgb_array",
            step_repeat=4,
            bot_difficulty="hard"
        )
        
        # Load AI agent
        self.agent = None
        self.model_path = model_path
        if os.path.exists(model_path):
            try:
                print(f"Loading AI model from {model_path}...")
                # Use hidden_layer=756 to match your trained model
                self.agent = Agent(eval=True, frame_stack=3, hidden_layer=756)
                # Actually load the model weights!
                self.agent.model.load_the_model(filename=model_path)
                print("AI Agent loaded successfully!")
            except Exception as e:
                print(f"Error loading AI model: {e}")
                print("AI mode will not be available")
        else:
            print(f"Model file not found at {model_path}")
            print("AI mode will not be available")
        
        # Track player modes
        self.player1_mode = "human"  # human or ai
        self.player2_mode = "ai"
        
        # Game state
        self.running = False
        self.clients = set()
        
    def get_game_state(self):
        """Extract current game state to send to clients"""
        return {
            "type": "state",
            "ball": {
                "x": float(self.game.ball.x),
                "y": float(self.game.ball.y),
                "vx": float(self.game.ball.vx),
                "vy": float(self.game.ball.vy)
            },
            "paddle1": {
                "y": float(self.game.player_1_paddle.y)
            },
            "paddle2": {
                "y": float(self.game.player_2_paddle.y)
            },
            "score1": int(self.game.player_1_score),
            "score2": int(self.game.player_2_score),
            "done": bool(self.game.player_1_score >= self.game.top_score or 
                        self.game.player_2_score >= self.game.top_score)
        }
    
    async def http_health_handler(self, request):
        """HTTP health check endpoint for Render"""
        return web.Response(text="OK", status=200)
    
    async def http_status_handler(self, request):
        """HTTP status endpoint"""
        status = {
            "status": "running",
            "clients": len(self.clients),
            "ai_loaded": self.agent is not None,
            "game_score": f"{self.game.player_1_score}-{self.game.player_2_score}"
        }
        return web.json_response(status)
    
    def get_player_action(self, player, obs):
        """Get action for a player based on their mode"""
        mode = self.player1_mode if player == 1 else self.player2_mode
        
        if mode == "human":
            # Return pending action or default to no action
            if player == 1:
                return getattr(self, 'pending_action_p1', 0)
            else:
                return getattr(self, 'pending_action_p2', 0)
        
        elif mode == "ai":
            if self.agent is None:
                print("AI not available")
                return 0
            
            # Process observation through agent
            processed_obs = self.agent.process_observation(obs)
            action = self.agent.get_action(processed_obs, player=player, eval_mode=True)
            return action
        
        return 0  # default: no action
    
    async def game_loop(self):
        """Main game loop that updates game state"""
        self.running = True
        target_fps = 60  # Game simulation speed
        frame_time = 1.0 / target_fps
        broadcast_interval = 2  # Broadcast every 2 frames for less network traffic
        frame_counter = 0
        
        print("Game loop started")
        print(f"Running at {target_fps} FPS, broadcasting every {broadcast_interval} frames")
        
        # Initialize pending actions
        self.pending_action_p1 = 0
        self.pending_action_p2 = 0
        
        while self.running:
            start_time = asyncio.get_event_loop().time()
            frame_counter += 1
            
            # Check if game is already over (someone reached 20 points)
            if self.game.player_1_score >= 20 or self.game.player_2_score >= 20:
                # Just broadcast state and wait, don't step
                await self.broadcast_state_aiohttp()
                await asyncio.sleep(frame_time)
                continue
            
            # Get current observation
            obs = self.game._get_obs()
            
            # Get actions for both players (don't reset them)
            player1_action = self.get_player_action(1, obs)
            player2_action = self.get_player_action(2, obs)
            
            # Step the game
            observation, p1_reward, p2_reward, done, truncated, info = self.game.step(
                player_1_action=player1_action,
                player_2_action=player2_action
            )
            
            # Broadcast state every N frames to reduce network load
            if frame_counter % broadcast_interval == 0:
                await self.broadcast_state_aiohttp()
            
            # Maintain target FPS
            elapsed = asyncio.get_event_loop().time() - start_time
            sleep_time = max(0, frame_time - elapsed)
            await asyncio.sleep(sleep_time)
    
    async def start(self):
        """Start the unified HTTP/WebSocket server"""
        print(f"Starting Pong server on {self.host}:{self.http_port}")
        print(f"AI Agent: {'Loaded' if self.agent else 'Not available'}")
        
        # Create HTTP app with WebSocket support
        app = web.Application()
        app.router.add_get('/', self.http_health_handler)
        app.router.add_get('/health', self.http_health_handler)
        app.router.add_get('/status', self.http_status_handler)
        app.router.add_get('/ws', self.websocket_handler)  # WebSocket endpoint
        
        # Start unified server
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, self.host, self.http_port)
        await site.start()
        print(f"Server running on http://{self.host}:{self.http_port}")
        print(f"WebSocket endpoint: ws://{self.host}:{self.http_port}/ws")
        
        # Start game loop
        game_task = asyncio.create_task(self.game_loop())
        
        print(f"Server ready!")
        
        # Keep running
        try:
            await asyncio.Future()  # run forever
        except KeyboardInterrupt:
            print("\nShutting down...")
            self.running = False
            await game_task
            await runner.cleanup()
    
    async def websocket_handler(self, request):
        """Handle WebSocket connections through aiohttp"""
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        
        self.clients.add(ws)
        print(f"Client connected. Total clients: {len(self.clients)}")
        
        # Send initial state
        await ws.send_str(json.dumps(self.get_game_state()))
        
        try:
            async for msg in ws:
                if msg.type == web.WSMsgType.TEXT:
                    try:
                        data = json.loads(msg.data)
                        await self.handle_message_aiohttp(data, ws)
                    except json.JSONDecodeError:
                        print(f"Invalid JSON: {msg.data}")
                    except Exception as e:
                        print(f"Error handling message: {e}")
                elif msg.type == web.WSMsgType.ERROR:
                    print(f'WebSocket error: {ws.exception()}')
        finally:
            self.clients.discard(ws)
            print(f"Client disconnected. Total clients: {len(self.clients)}")
        
        return ws
    
    async def handle_message_aiohttp(self, data, websocket):
        """Process messages from clients (aiohttp version)"""
        msg_type = data.get("type")
        
        if msg_type == "reset":
            self.game.reset()
            await self.broadcast_state_aiohttp()
            
        elif msg_type == "action":
            player = data.get("player", 1)
            action = data.get("action", 0)
            
            # Store action persistently
            if player == 1:
                self.pending_action_p1 = action
            else:
                self.pending_action_p2 = action
                
        elif msg_type == "mode":
            player = data.get("player", 1)
            mode = data.get("mode", "human")
            
            if mode in ["human", "ai"]:
                if player == 1:
                    self.player1_mode = mode
                    self.game.player1 = mode
                else:
                    self.player2_mode = mode
                    self.game.player2 = mode
                
                # Confirm mode change
                await websocket.send_str(json.dumps({
                    "type": "mode",
                    "player": player,
                    "mode": mode
                }))
                
        elif msg_type == "get_state":
            await websocket.send_str(json.dumps(self.get_game_state()))
    
    async def broadcast_state_aiohttp(self):
        """Send current game state to all connected clients (aiohttp version)"""
        if self.clients:
            state = self.get_game_state()
            message = json.dumps(state)
            for client in list(self.clients):
                try:
                    if not client.closed:
                        await client.send_str(message)
                except Exception as e:
                    print(f"Error broadcasting to client: {e}")
                    self.clients.discard(client)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pong WebSocket Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", default=8765, type=int, help="WebSocket port")
    parser.add_argument("--http-port", default=None, type=int, help="HTTP port (defaults to PORT env or same as WebSocket)")
    parser.add_argument("--model", default="models/latest.pt", help="Path to trained model")
    args = parser.parse_args()
    
    # Use PORT env variable if set (Render requirement)
    http_port = args.http_port or int(os.environ.get("PORT", args.port))
    
    server = PongServer(host=args.host, port=args.port, http_port=http_port, model_path=args.model)
    asyncio.run(server.start())

