// Pong Game - WebSocket Synchronized Version
// This version receives game state from Python backend via WebSocket

// Import WebSocket client
import { wsClient } from './ws_client.js';

// Paddle class (for rendering only)
class Paddle {
    constructor(x, y, playerColor, windowHeight, width = 20, height = 120) {
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.playerColor = playerColor;
        this.windowHeight = windowHeight;
    }

    draw(ctx) {
        ctx.fillStyle = this.playerColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// Ball class (for rendering only)
class Ball {
    constructor(windowHeight, windowWidth, width = 20, height = 20) {
        this.height = height;
        this.width = width;
        this.windowHeight = windowHeight;
        this.windowWidth = windowWidth;
        this.ballColor = 'rgb(255, 255, 255)';
        this.x = windowWidth / 2;
        this.y = windowHeight / 2;
    }

    draw(ctx) {
        ctx.fillStyle = this.ballColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// Pong Game class
class PongClient {
    constructor(windowWidth = 1280, windowHeight = 960) {
        this.windowWidth = windowWidth;
        this.windowHeight = windowHeight;

        this.player1Color = 'rgb(50, 205, 50)';  // Green
        this.player2Color = 'rgb(138, 43, 226)'; // Purple

        this.backgroundColor = 'rgb(0, 0, 0)';

        this.paddleHeight = 120;
        this.paddleWidth = 20;
        this.paddleSpeed = 8; // Local prediction speed

        // Setup canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.windowWidth;
        this.canvas.height = this.windowHeight;

        // Key states
        this.keys = {};
        this.lastSentAction1 = 0;
        this.lastSentAction2 = 0;
        this.actionSendInterval = null;

        // Player modes
        this.player1Mode = "human";
        this.player2Mode = "ai";
        
        // Client-side prediction
        this.localPaddle1Y = 0;
        this.localPaddle2Y = 0;
        this.predictionEnabled = true;

        // Game state from server
        this.gameState = {
            ball: { x: windowWidth / 2, y: windowHeight / 2 },
            paddle1: { y: windowHeight / 2 - 60 },
            paddle2: { y: windowHeight / 2 - 60 },
            score1: 0,
            score2: 0,
            done: false
        };

        console.log("Creating Pong client");

        this.initializeRenderObjects();
        this.setupEventListeners();
        this.setupWebSocket();
        this.startRenderLoop();
    }

    initializeRenderObjects() {
        // Create render objects
        this.player1Paddle = new Paddle(
            this.windowWidth - 2 * (this.windowWidth / 64),
            (this.windowHeight / 2) - (this.paddleHeight / 2),
            this.player1Color,
            this.windowHeight,
            this.paddleWidth,
            this.paddleHeight
        );

        this.player2Paddle = new Paddle(
            this.windowWidth / 64,
            (this.windowHeight / 2) - (this.paddleHeight / 2),
            this.player2Color,
            this.windowHeight,
            this.paddleWidth,
            this.paddleHeight
        );

        this.ball = new Ball(
            this.windowHeight,
            this.windowWidth,
            20,
            20
        );
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            
            // Prevent page scrolling for game controls
            if (['arrowup', 'arrowdown', 'w', 's', ' '].includes(key)) {
                e.preventDefault();
            }
            
            this.keys[key] = true;
            
            if (key === 'r') {
                wsClient.sendReset();
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            
            // Prevent page scrolling for game controls
            if (['arrowup', 'arrowdown', 'w', 's', ' '].includes(key)) {
                e.preventDefault();
            }
            
            this.keys[key] = false;
        });
    }

    setupWebSocket() {
        // Connect to WebSocket server
        wsClient.setOnStateUpdate((state) => {
            this.updateGameState(state);
        });

        wsClient.setOnModeUpdate((data) => {
            console.log(`Player ${data.player} mode changed to ${data.mode}`);
            if (data.player === 1) {
                this.player1Mode = data.mode;
                this.updateModeButtons();
            } else if (data.player === 2) {
                this.player2Mode = data.mode;
                this.updateModeButtons();
            }
        });

        wsClient.connect();
    }

    updateGameState(state) {
        this.gameState = state;
        
        // Update ball (always use server position)
        this.ball.x = state.ball.x;
        this.ball.y = state.ball.y;
        
        // Update paddles with prediction correction
        const serverPaddle1Y = Math.max(0, Math.min(state.paddle1.y, this.windowHeight - this.paddleHeight));
        const serverPaddle2Y = Math.max(0, Math.min(state.paddle2.y, this.windowHeight - this.paddleHeight));
        
        // For human players, use local prediction; for AI, use server position
        if (this.player1Mode === 'human' && this.predictionEnabled) {
            // Sync local prediction with server (gradual correction to avoid jitter)
            const diff1 = serverPaddle1Y - this.localPaddle1Y;
            if (Math.abs(diff1) > 20) {
                this.localPaddle1Y = serverPaddle1Y; // Snap if too far
            } else {
                this.localPaddle1Y += diff1 * 0.3; // Smooth correction
            }
            this.player1Paddle.y = this.localPaddle1Y;
        } else {
            this.player1Paddle.y = serverPaddle1Y;
            this.localPaddle1Y = serverPaddle1Y;
        }
        
        if (this.player2Mode === 'human' && this.predictionEnabled) {
            const diff2 = serverPaddle2Y - this.localPaddle2Y;
            if (Math.abs(diff2) > 20) {
                this.localPaddle2Y = serverPaddle2Y;
            } else {
                this.localPaddle2Y += diff2 * 0.3;
            }
            this.player2Paddle.y = this.localPaddle2Y;
        } else {
            this.player2Paddle.y = serverPaddle2Y;
            this.localPaddle2Y = serverPaddle2Y;
        }
    }

    updateModeButtons() {
        // Update Player 1 buttons
        document.getElementById('p1-human').classList.toggle('active', this.player1Mode === 'human');
        document.getElementById('p1-ai').classList.toggle('active', this.player1Mode === 'ai');

        // Update Player 2 buttons
        document.getElementById('p2-human').classList.toggle('active', this.player2Mode === 'human');
        document.getElementById('p2-ai').classList.toggle('active', this.player2Mode === 'ai');
    }

    getPlayerAction(player) {
        // Determine action based on keys and player mode
        let mode = player === 1 ? this.player1Mode : this.player2Mode;
        
        if (mode !== "human") {
            return 0; // Non-human players are controlled by server
        }

        let action = 0; // 0 = stay

        if (player === 1) {
            // Player 1 controls: Arrow keys
            if (this.keys['arrowup']) {
                action = 1; // up
            } else if (this.keys['arrowdown']) {
                action = 2; // down
            }
        } else {
            // Player 2 controls: W/S keys
            if (this.keys['w']) {
                action = 1; // up
            } else if (this.keys['s']) {
                action = 2; // down
            }
        }

        return action;
    }

    updateLocalPrediction() {
        // Update local paddle positions immediately based on input
        if (this.player1Mode === 'human' && this.predictionEnabled) {
            const action1 = this.getPlayerAction(1);
            if (action1 === 1) { // Up
                this.localPaddle1Y = Math.max(0, this.localPaddle1Y - this.paddleSpeed);
            } else if (action1 === 2) { // Down
                this.localPaddle1Y = Math.min(this.windowHeight - this.paddleHeight, this.localPaddle1Y + this.paddleSpeed);
            }
            this.player1Paddle.y = this.localPaddle1Y;
        }
        
        if (this.player2Mode === 'human' && this.predictionEnabled) {
            const action2 = this.getPlayerAction(2);
            if (action2 === 1) { // Up
                this.localPaddle2Y = Math.max(0, this.localPaddle2Y - this.paddleSpeed);
            } else if (action2 === 2) { // Down
                this.localPaddle2Y = Math.min(this.windowHeight - this.paddleHeight, this.localPaddle2Y + this.paddleSpeed);
            }
            this.player2Paddle.y = this.localPaddle2Y;
        }
    }
    
    sendActions() {
        // Always send current actions (no filtering for max responsiveness)
        const action1 = this.getPlayerAction(1);
        const action2 = this.getPlayerAction(2);

        // Send even if unchanged - server needs continuous input
        wsClient.sendAction(1, action1);
        wsClient.sendAction(2, action2);
        
        this.lastSentAction1 = action1;
        this.lastSentAction2 = action2;
    }

    fillBackground() {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.windowWidth, this.windowHeight);

        // Draw scores
        this.ctx.font = '70px Arial';
        
        // Player 1 score (right side)
        this.ctx.fillStyle = this.player1Color;
        const player1Text = `Score: ${this.gameState.score1}`;
        this.ctx.fillText(player1Text, (this.windowWidth / 2) + 20, 60);

        // Player 2 score (left side)
        this.ctx.fillStyle = this.player2Color;
        const player2Text = `Score: ${this.gameState.score2}`;
        const player2TextWidth = this.ctx.measureText(player2Text).width;
        this.ctx.fillText(player2Text, (this.windowWidth / 2) - player2TextWidth - 20, 60);
    }

    render() {
        this.fillBackground();
        this.player1Paddle.draw(this.ctx);
        this.player2Paddle.draw(this.ctx);
        this.ball.draw(this.ctx);

        // Show game over if done
        if (this.gameState.done) {
            let gameOverText = '';
            let color = '';

            if (this.gameState.score1 >= 20) {
                gameOverText = 'Player 1 Won!';
                color = this.player1Color;
            } else if (this.gameState.score2 >= 20) {
                gameOverText = 'Player 2 Won!';
                color = this.player2Color;
            }

            if (gameOverText) {
                this.ctx.font = '60px Arial';
                this.ctx.fillStyle = color;
                const textWidth = this.ctx.measureText(gameOverText).width;
                this.ctx.fillText(gameOverText, (this.windowWidth - textWidth) / 2, this.windowHeight / 2);

                // Draw restart message
                this.ctx.font = '24px Arial';
                this.ctx.fillStyle = 'rgb(255, 255, 255)';
                const restartText = 'Press R to Restart';
                const restartWidth = this.ctx.measureText(restartText).width;
                this.ctx.fillText(restartText, (this.windowWidth - restartWidth) / 2, this.windowHeight / 2 + 50);
            }
        }
    }

    startRenderLoop() {
        // Send actions at 60fps for maximum responsiveness
        this.actionSendInterval = setInterval(() => {
            this.sendActions();
        }, 1000 / 60);

        // Render at 60fps with local prediction
        const loop = () => {
            this.updateLocalPrediction(); // Update local paddles FIRST
            this.render(); // Then render
            requestAnimationFrame(loop);
        };
        loop();
    }
}

// Player mode control function - make it globally accessible
window.setPlayerMode = function(player, mode) {
    wsClient.setMode(player, mode);
    
    // Update button states
    if (player === 1) {
        document.getElementById('p1-human').classList.toggle('active', mode === 'human');
        document.getElementById('p1-ai').classList.toggle('active', mode === 'ai');
    } else {
        document.getElementById('p2-human').classList.toggle('active', mode === 'human');
        document.getElementById('p2-ai').classList.toggle('active', mode === 'ai');
    }
    
    console.log(`Player ${player} mode set to: ${mode}`);
};

// Initialize game when page loads
let game = null;
window.addEventListener('DOMContentLoaded', () => {
    game = new PongClient(1280, 960);
});
