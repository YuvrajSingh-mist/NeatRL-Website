// Pong Game - Local Browser Version with ONNX AI
// Runs completely in the browser without any backend

import { ONNXAgent } from './onnx_agent.js';
import { ModelCache } from './model_cache.js';

// Game Constants (matching Python backend exactly)
const WINDOW_WIDTH = 1280;
const WINDOW_HEIGHT = 960;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 120;
const PADDLE_SPEED = 14;
const BALL_SIZE = 20;
const MAX_BALL_SPEED = 15;
const TOP_SCORE = 20;
const FPS = 60;
const STEP_REPEAT = 4; // Process physics 4 times per frame like backend

// Paddle class
class Paddle {
    constructor(x, y, playerColor) {
        this.x = x;
        this.y = y;
        this.width = PADDLE_WIDTH;
        this.height = PADDLE_HEIGHT;
        this.speed = PADDLE_SPEED;
        this.color = playerColor;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    move(direction) {
        // direction: 0 = stay, 1 = up, 2 = down
        if (direction === 0) return;
        
        let newY = this.y;
        if (direction === 1) {
            newY = this.y - this.speed;
        } else if (direction === 2) {
            newY = this.y + this.speed;
        }

        // Keep paddle within bounds
        if (newY >= 0 && newY <= WINDOW_HEIGHT - this.height) {
            this.y = newY;
        }
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    collidesWith(ball) {
        return (
            ball.x < this.x + this.width &&
            ball.x + ball.width > this.x &&
            ball.y < this.y + this.height &&
            ball.y + ball.height > this.y
        );
    }
}

// Ball class
class Ball {
    constructor(paddle1, paddle2) {
        this.width = BALL_SIZE;
        this.height = BALL_SIZE;
        this.color = 'rgb(255, 255, 255)';
        this.paddle1 = paddle1;
        this.paddle2 = paddle2;
        this.lastServeLeft = Math.random() < 0.5;
        this.spawn();
    }

    spawn() {
        this.x = WINDOW_WIDTH / 2;
        this.y = WINDOW_HEIGHT / 2;

        // Random initial speed
        const speeds = [4, 5, 6];
        const speed = speeds[Math.floor(Math.random() * speeds.length)];

        // Alternate serve direction
        this.lastServeLeft = !this.lastServeLeft;
        this.vx = this.lastServeLeft ? -speed : speed;

        // Random Y velocity
        const yVels = [-3, -2, -1, 1, 2, 3];
        this.vy = yVels[Math.floor(Math.random() * yVels.length)];
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    move() {
        const xStep = this.vx > 0 ? 1 : -1;
        const yStep = this.vy > 0 ? 1 : -1;
        let newX = this.x;
        let newY = this.y;

        const earlyCollision = this.paddle1.collidesWith(this) || this.paddle2.collidesWith(this);

        // Move Y
        for (let i = 0; i < Math.abs(this.vy); i++) {
            newY += yStep;

            if (!earlyCollision) {
                // Bounce off top/bottom walls
                if (newY < 0 || newY > WINDOW_HEIGHT - this.height) {
                    const randomChange = Math.random() < 0.5 ? -1 : 1;
                    this.vy = this.clamp((this.vy * -1) + randomChange, -MAX_BALL_SPEED, MAX_BALL_SPEED);
                    break;
                }
            }

            // Check paddle collision
            const testBall = { x: newX, y: newY, width: this.width, height: this.height };
            if (this.paddle1.collidesWith(testBall) || this.paddle2.collidesWith(testBall)) {
                const randomChange = Math.random() < 0.5 ? -1 : 1;
                this.vy = this.clamp(this.vy + randomChange, -MAX_BALL_SPEED, MAX_BALL_SPEED);
                break;
            }
        }

        // Move X
        for (let i = 0; i < Math.abs(this.vx); i++) {
            newX += xStep;

            if (!earlyCollision) {
                const testBall = { x: newX, y: newY, width: this.width, height: this.height };
                
                // Check paddle collision
                if (this.paddle1.collidesWith(testBall) || this.paddle2.collidesWith(testBall)) {
                    // Reverse and speed up
                    const randomChange = Math.random() < 0.5 ? -1 : 1;
                    this.vx = this.clamp((this.vx + xStep) * -1, -MAX_BALL_SPEED, MAX_BALL_SPEED);
                    this.vy = this.clamp(this.vy + randomChange, -MAX_BALL_SPEED, MAX_BALL_SPEED);
                    break;
                }
            }
        }

        this.x = newX;
        this.y = newY;
    }
}

// Main Pong Game
class PongLocal {
    constructor() {
        this.windowWidth = WINDOW_WIDTH;
        this.windowHeight = WINDOW_HEIGHT;

        this.player1Color = 'rgb(50, 205, 50)';   // Green
        this.player2Color = 'rgb(138, 43, 226)';  // Purple
        this.backgroundColor = 'rgb(0, 0, 0)';

        // Setup canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.windowWidth;
        this.canvas.height = this.windowHeight;

        // Offscreen canvas for AI observation
        this.obsCanvas = document.createElement('canvas');
        this.obsCanvas.width = this.windowWidth;
        this.obsCanvas.height = this.windowHeight;
        this.obsCtx = this.obsCanvas.getContext('2d');

        // Game state
        this.score1 = 0;
        this.score2 = 0;
        this.done = false;

        // Player modes
        this.player1Mode = "human";
        this.player2Mode = "ai";

        // Key states
        this.keys = {};

        // AI agent
        this.aiAgent = null;
        this.frameStack = [];
        this.isAIReady = false;

        // Frame stacking for AI (3 frames)
        this.frameHistory = [];

        console.log("Creating local Pong game");
        this.initializeGame();
        this.setupEventListeners();
        this.loadAIAgent();
    }

    initializeGame() {
        // Create paddles
        this.paddle1 = new Paddle(
            this.windowWidth - 2 * (this.windowWidth / 64),
            (this.windowHeight / 2) - (PADDLE_HEIGHT / 2),
            this.player1Color
        );

        this.paddle2 = new Paddle(
            this.windowWidth / 64,
            (this.windowHeight / 2) - (PADDLE_HEIGHT / 2),
            this.player2Color
        );

        // Create ball
        this.ball = new Ball(this.paddle1, this.paddle2);

        // Reset scores
        this.score1 = 0;
        this.score2 = 0;
        this.done = false;
    }

    async loadAIAgent() {
        try {
            console.log("Loading AI agent...");
            document.getElementById('ai-status').textContent = 'Loading AI model...';
            
            // Check if ONNX Runtime is loaded
            if (typeof ort === 'undefined') {
                throw new Error("ONNX Runtime not loaded. Check if CDN script is accessible.");
            }
            console.log("✓ ONNX Runtime loaded:", ort.version);
            
            const modelCache = new ModelCache();
            console.log("✓ Model cache initialized");
            
            document.getElementById('ai-status').textContent = 'Downloading model...';
            const modelData = await modelCache.getModel('pong_agent.onnx');
            console.log("✓ Model data loaded:", modelData.byteLength, "bytes");
            
            document.getElementById('ai-status').textContent = 'Initializing AI...';
            this.aiAgent = new ONNXAgent();
            await this.aiAgent.loadModel(modelData);
            console.log("✓ AI agent loaded successfully");
            
            this.isAIReady = true;
            document.getElementById('ai-status').textContent = 'AI Ready ✓';
            document.getElementById('ai-status').style.color = '#4CAF50';
            
            // Start game now that AI is ready
            this.start();
        } catch (error) {
            console.error("Failed to load AI agent:", error);
            console.error("Error stack:", error.stack);
            document.getElementById('ai-status').textContent = `⚠️ AI Failed to Load - Game Paused`;
            document.getElementById('ai-status').style.color = '#FF5252';
            
            // Show error message with instructions
            const errorMsg = `AI Loading Failed: ${error.message}\n\n` +
                           `The game cannot start because the AI model failed to load.\n\n` +
                           `Possible solutions:\n` +
                           `• Check your internet connection\n` +
                           `• Try clearing the cache (click "Clear AI Cache & Reload" button)\n` +
                           `• Check browser console for details\n\n` +
                           `The page will remain paused until you resolve the issue.`;
            alert(errorMsg);
            
            // Don't start the game - let user fix the issue and reload
            console.error("Game not started due to AI loading failure. Please reload the page after fixing the issue.");
        }
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            
            if (['arrowup', 'arrowdown', 'w', 's', 'r', ' '].includes(key)) {
                e.preventDefault();
            }
            
            this.keys[key] = true;
            
            if (key === 'r') {
                this.reset();
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            
            if (['arrowup', 'arrowdown', 'w', 's', ' '].includes(key)) {
                e.preventDefault();
            }
            
            this.keys[key] = false;
        });
    }

    reset() {
        this.initializeGame();
        this.frameHistory = [];
        console.log("Game reset");
    }

    getPlayerAction(player) {
        const mode = player === 1 ? this.player1Mode : this.player2Mode;
        
        if (mode === "human") {
            return this.getHumanAction(player);
        } else if (mode === "ai") {
            return 0; // Will be overridden by getAIAction
        }
        
        return 0;
    }

    getHumanAction(player) {
        if (player === 1) {
            // Player 1: Arrow keys
            if (this.keys['arrowup']) return 1;
            if (this.keys['arrowdown']) return 2;
        } else {
            // Player 2: W/S keys
            if (this.keys['w']) return 1;
            if (this.keys['s']) return 2;
        }
        return 0;
    }

    getObservation() {
        // Draw current game state to offscreen canvas
        this.obsCtx.fillStyle = this.backgroundColor;
        this.obsCtx.fillRect(0, 0, this.windowWidth, this.windowHeight);
        
        this.obsCtx.fillStyle = this.paddle1.color;
        this.obsCtx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
        
        this.obsCtx.fillStyle = this.paddle2.color;
        this.obsCtx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);
        
        this.obsCtx.fillStyle = this.ball.color;
        this.obsCtx.fillRect(this.ball.x, this.ball.y, this.ball.width, this.ball.height);
        
        // Get image data and process
        const imageData = this.obsCtx.getImageData(0, 0, this.windowWidth, this.windowHeight);
        
        // Downscale to 84x84 and convert to grayscale
        const frame = this.processFrame(imageData);
        
        return frame;
    }

    processFrame(imageData) {
        // Create downscaled canvas (84x84)
        const downscaleCanvas = document.createElement('canvas');
        downscaleCanvas.width = 84;
        downscaleCanvas.height = 84;
        const downscaleCtx = downscaleCanvas.getContext('2d');
        
        // Draw downscaled image
        downscaleCtx.drawImage(this.obsCanvas, 0, 0, 84, 84);
        
        // Get downscaled image data
        const downscaledData = downscaleCtx.getImageData(0, 0, 84, 84);
        
        // Convert to grayscale and binarize (0 or 255)
        const grayscale = new Float32Array(84 * 84);
        for (let i = 0; i < 84 * 84; i++) {
            const idx = i * 4;
            const r = downscaledData.data[idx];
            const g = downscaledData.data[idx + 1];
            const b = downscaledData.data[idx + 2];
            
            // Convert to grayscale
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Binarize: non-zero becomes 255
            grayscale[i] = gray > 0 ? 255 : 0;
        }
        
        return grayscale;
    }

    async getAIAction(player) {
        if (!this.isAIReady || !this.aiAgent) {
            return 0; // Default action if AI not ready
        }

        try {
            // Get current observation
            const frame = this.getObservation();
            
            // Add to frame history
            this.frameHistory.push(frame);
            
            // Keep only last 3 frames
            if (this.frameHistory.length > 3) {
                this.frameHistory.shift();
            }
            
            // Need 3 frames for inference
            if (this.frameHistory.length < 3) {
                return 0; // Wait for enough frames
            }

            // Get action from AI
            const action = await this.aiAgent.getAction(this.frameHistory, player);
            return action;
        } catch (error) {
            console.error("AI inference error:", error);
            return 0;
        }
    }

    async step(action1, action2) {
        // Process STEP_REPEAT times (4x) like backend
        for (let i = 0; i < STEP_REPEAT; i++) {
            this.paddle1.move(action1);
            this.paddle2.move(action2);
            this.ball.move();
        }

        // Check scoring
        const ballCenter = this.ball.x + (this.ball.width / 2);
        
        if (ballCenter < 0) {
            // Player 1 scores
            this.score1++;
            this.ball.spawn();
        } else if (ballCenter > this.windowWidth) {
            // Player 2 scores
            this.score2++;
            this.ball.spawn();
        }

        // Check game over
        if (this.score1 >= TOP_SCORE || this.score2 >= TOP_SCORE) {
            this.done = true;
        }
    }

    fillBackground() {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.windowWidth, this.windowHeight);

        // Draw scores
        this.ctx.font = '70px Arial';
        
        // Player 1 score (right side)
        this.ctx.fillStyle = this.player1Color;
        const player1Text = `Score: ${this.score1}`;
        this.ctx.fillText(player1Text, (this.windowWidth / 2) + 20, 60);

        // Player 2 score (left side)
        this.ctx.fillStyle = this.player2Color;
        const player2Text = `Score: ${this.score2}`;
        const player2TextWidth = this.ctx.measureText(player2Text).width;
        this.ctx.fillText(player2Text, (this.windowWidth / 2) - player2TextWidth - 20, 60);
    }

    render() {
        this.fillBackground();
        this.paddle1.draw(this.ctx);
        this.paddle2.draw(this.ctx);
        this.ball.draw(this.ctx);

        // Show game over
        if (this.done) {
            let gameOverText = '';
            let color = '';

            if (this.score1 >= TOP_SCORE) {
                gameOverText = 'Player 1 Won!';
                color = this.player1Color;
            } else if (this.score2 >= TOP_SCORE) {
                gameOverText = 'Player 2 Won!';
                color = this.player2Color;
            }

            if (gameOverText) {
                this.ctx.font = '60px Arial';
                this.ctx.fillStyle = color;
                const textWidth = this.ctx.measureText(gameOverText).width;
                this.ctx.fillText(gameOverText, (this.windowWidth - textWidth) / 2, this.windowHeight / 2);

                this.ctx.font = '24px Arial';
                this.ctx.fillStyle = 'rgb(255, 255, 255)';
                const restartText = 'Press R to Restart';
                const restartWidth = this.ctx.measureText(restartText).width;
                this.ctx.fillText(restartText, (this.windowWidth - restartWidth) / 2, this.windowHeight / 2 + 50);
            }
        }
    }

    updateModeButtons() {
        document.getElementById('p1-human').classList.toggle('active', this.player1Mode === 'human');
        document.getElementById('p1-ai').classList.toggle('active', this.player1Mode === 'ai');
        document.getElementById('p2-human').classList.toggle('active', this.player2Mode === 'human');
        document.getElementById('p2-ai').classList.toggle('active', this.player2Mode === 'ai');
    }

    async gameLoop() {
        if (!this.done) {
            // Get actions
            let action1 = this.getPlayerAction(1);
            let action2 = this.getPlayerAction(2);

            // Override with AI if needed
            if (this.player1Mode === "ai") {
                action1 = await this.getAIAction(1);
            }
            if (this.player2Mode === "ai") {
                action2 = await this.getAIAction(2);
            }

            // Update game state
            await this.step(action1, action2);
        }

        // Render
        this.render();

        // Continue loop
        setTimeout(() => requestAnimationFrame(() => this.gameLoop()), 1000 / FPS);
    }

    start() {
        console.log("Starting game loop");
        this.gameLoop();
    }
}

// Global function for mode buttons
window.setPlayerMode = function(player, mode) {
    if (window.game) {
        if (player === 1) {
            window.game.player1Mode = mode;
        } else {
            window.game.player2Mode = mode;
        }
        window.game.updateModeButtons();
        console.log(`Player ${player} mode set to: ${mode}`);
    }
};

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new PongLocal();
    // Don't start immediately - wait for AI to load
    // Game will start automatically after loadAIAgent() completes
});
