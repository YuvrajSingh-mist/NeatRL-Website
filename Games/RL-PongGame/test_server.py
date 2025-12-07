#!/usr/bin/env python3
"""
Test script to verify the server works correctly
"""
import asyncio
import json
try:
    from aiohttp import ClientSession
except ImportError:
    print("Please install aiohttp: pip install aiohttp")
    exit(1)

async def test_server(host="localhost", port=8765):
    """Test HTTP and WebSocket endpoints"""
    
    print(f"Testing server at {host}:{port}")
    print("-" * 50)
    
    async with ClientSession() as session:
        # Test HTTP health endpoint
        print("\n1. Testing HTTP health endpoint...")
        try:
            async with session.get(f"http://{host}:{port}/health") as resp:
                text = await resp.text()
                print(f"   ✅ Health check: {resp.status} - {text}")
        except Exception as e:
            print(f"   ❌ Health check failed: {e}")
            return False
        
        # Test HTTP status endpoint
        print("\n2. Testing HTTP status endpoint...")
        try:
            async with session.get(f"http://{host}:{port}/status") as resp:
                data = await resp.json()
                print(f"   ✅ Status: {json.dumps(data, indent=2)}")
        except Exception as e:
            print(f"   ❌ Status check failed: {e}")
            return False
        
        # Test WebSocket connection
        print("\n3. Testing WebSocket connection...")
        try:
            async with session.ws_connect(f"ws://{host}:{port}/ws") as ws:
                print(f"   ✅ WebSocket connected")
                
                # Wait for initial state message
                msg = await ws.receive()
                if msg.type == 1:  # TEXT message
                    state = json.loads(msg.data)
                    print(f"   ✅ Received initial state:")
                    print(f"      - Ball: ({state['ball']['x']:.1f}, {state['ball']['y']:.1f})")
                    print(f"      - Score: {state['score1']} - {state['score2']}")
                    print(f"      - Clients: {data['clients']}")
                
                # Send a test action
                print("\n4. Testing game actions...")
                await ws.send_str(json.dumps({"type": "action", "player": 1, "action": 1}))
                print(f"   ✅ Sent player action")
                
                # Receive a few state updates
                for i in range(3):
                    msg = await ws.receive()
                    if msg.type == 1:
                        state = json.loads(msg.data)
                        print(f"   ✅ State update {i+1}: Score {state['score1']}-{state['score2']}")
                
                await ws.close()
                print(f"   ✅ WebSocket closed gracefully")
        
        except Exception as e:
            print(f"   ❌ WebSocket test failed: {e}")
            return False
    
    print("\n" + "=" * 50)
    print("✅ ALL TESTS PASSED!")
    print("=" * 50)
    return True

if __name__ == "__main__":
    import sys
    host = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8765
    
    result = asyncio.run(test_server(host, port))
    sys.exit(0 if result else 1)
