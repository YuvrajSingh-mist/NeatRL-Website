// Paddle class
class Paddle {
    constructor(x, y, playerColor, windowHeight, width = 20, height = 120) {
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.speed = 14;
        this.paddleColor = playerColor;
        this.windowHeight = windowHeight;
    }

    draw(ctx) {
        ctx.fillStyle = this.paddleColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    move(direction) {
        // Direction 0 is no action
        if (direction === 0) {
            return;
        } else if (direction === 1) {
            var newY = this.y - this.speed;
        } else if (direction === 2) {
            var newY = this.y + this.speed;
        }

        if (newY >= 0 && newY <= (this.windowHeight - this.height)) {
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
}

// Ball class
class Ball {
    constructor(windowHeight, windowWidth, player1Paddle, player2Paddle, width = 10, height = 10) {
        this.height = height;
        this.width = width;
        this.windowHeight = windowHeight;
        this.windowWidth = windowWidth;
        this.player1Paddle = player1Paddle;
        this.player2Paddle = player2Paddle;
        this.ballColor = 'rgb(255, 255, 255)';
        this.maxSpeed = 15;
        this.lastServeLeft = Math.random() < 0.5;
        this.spawn();
    }

    spawn() {
        this.x = this.windowWidth / 2;
        this.y = this.windowHeight / 2;

        const speeds = [4, 5, 6];
        const speed = speeds[Math.floor(Math.random() * speeds.length)];

        // Flip X velocity every spawn
        this.lastServeLeft = !this.lastServeLeft;
        this.vx = this.lastServeLeft ? -speed : speed;

        const vyOptions = [-3, -2, -1, 1, 2, 3];
        this.vy = vyOptions[Math.floor(Math.random() * vyOptions.length)];
    }

    getStepIncrement(vel) {
        return vel > 0 ? 1 : -1;
    }

    draw(ctx) {
        ctx.fillStyle = this.ballColor;
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

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    clip(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    move() {
        let newX = this.x;
        let newY = this.y;
        const xStep = this.getStepIncrement(this.vx);
        const yStep = this.getStepIncrement(this.vy);
        let newRect = null;

        const ballRect = this.getRect();
        const player1Rect = this.player1Paddle.getRect();
        const player2Rect = this.player2Paddle.getRect();

        const earlyCollisionDetected = this.checkCollision(ballRect, player1Rect) || 
                                       this.checkCollision(ballRect, player2Rect);

        // Divide velocity by 4 to account for step_repeat in Python version
        const effectiveVy = this.vy / 4;
        const effectiveVx = this.vx / 4;

        // Move Y
        for (let i = 0; i < Math.abs(Math.floor(effectiveVy)); i++) {
            newY = newY + yStep;

            if (!earlyCollisionDetected) {
                if (!(newY >= 0 && newY <= (this.windowHeight - this.height))) {
                    const randomChange = Math.random() < 0.5 ? -1 : 1;
                    this.vy = this.clip((this.vy * -1) + randomChange, -this.maxSpeed, this.maxSpeed);
                    break;
                }
            }

            newRect = {
                x: newX,
                y: newY,
                width: this.width,
                height: this.height
            };

            if (this.checkCollision(newRect, player1Rect) || 
                this.checkCollision(newRect, player2Rect)) {
                const randomChange = Math.random() < 0.5 ? -1 : 1;
                this.vy = this.clip(this.vy + randomChange, -this.maxSpeed, this.maxSpeed);
                break;
            }
        }

        // Move X
        for (let i = 0; i < Math.abs(Math.floor(effectiveVx)); i++) {
            newX = newX + xStep;

            if (!earlyCollisionDetected) {
                newRect = {
                    x: newX,
                    y: newY,
                    width: this.width,
                    height: this.height
                };

                if (this.checkCollision(newRect, player1Rect) || 
                    this.checkCollision(newRect, player2Rect)) {
                    // Invert the ball direction and speed up the ball slightly
                    this.vx = this.clip((this.vx + xStep) * -1, -this.maxSpeed, this.maxSpeed);
                    const randomChange = Math.random() < 0.5 ? -1 : 1;
                    this.vy = this.clip(this.vy + randomChange, -this.maxSpeed, this.maxSpeed);
                    break;
                }
            }
        }

        this.x = newX;
        this.y = newY;
    }
}

// Pong Game class
class Pong {
    constructor(windowWidth = 800, windowHeight = 600, fps = 60, player1 = "human", player2 = "bot", 
                stepRepeat = 4, botDifficulty = "hard") {
        
        // Validate players
        const validPlayers = ["ai", "bot", "human"];
        if (!validPlayers.includes(player1) || !validPlayers.includes(player2)) {
            throw new Error("All players must be ai, bots, or humans");
        }

        this.windowWidth = windowWidth;
        this.windowHeight = windowHeight;
        this.stepRepeat = stepRepeat;
        this.fps = fps;

        this.player1Color = 'rgb(50, 205, 50)';  // Green
        this.player2Color = 'rgb(138, 43, 226)'; // Purple

        this.backgroundColor = 'rgb(0, 0, 0)';

        this.paddleHeight = 120;
        this.paddleWidth = 20;

        this.botDifficulty = botDifficulty;

        this.player1Type = player1;
        this.player2Type = player2;

        // Setup canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.windowWidth;
        this.canvas.height = this.windowHeight;

        // Key states
        this.keys = {};

        console.log("Creating new Pong game");
        console.log("Players:");
        console.log("Player 1: ", player1);
        console.log("Player 2: ", player2);
        console.log("Bot difficulty: ", this.botDifficulty);

        this.reset();
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key.toLowerCase() === 'r') {
                this.reset();
                if (this.done) {
                    this.done = false;
                    this.gameLoop();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    reset() {
        this.player1Score = 0;
        this.player2Score = 0;
        this.topScore = 20;
        this.done = false;
        this.keys = {};

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
            this.player1Paddle,
            this.player2Paddle,
            20,
            20
        );
    }

    fillBackground() {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.windowWidth, this.windowHeight);

        // Draw scores
        this.ctx.font = '70px Arial';
        
        // Player 1 score (right side)
        this.ctx.fillStyle = this.player1Color;
        const player1Text = `Score: ${this.player1Score}`;
        this.ctx.fillText(player1Text, (this.windowWidth / 2) + 20, 60);

        // Player 2 score (left side)
        this.ctx.fillStyle = this.player2Color;
        const player2Text = `Score: ${this.player2Score}`;
        const player2TextWidth = this.ctx.measureText(player2Text).width;
        this.ctx.fillText(player2Text, (this.windowWidth / 2) - player2TextWidth - 20, 60);
    }

    gameOver() {
        let gameOverText = '';
        let color = '';

        if (this.player1Score >= this.topScore) {
            gameOverText = 'Player 1 Won';
            color = this.player1Color;
        } else if (this.player2Score >= this.topScore) {
            gameOverText = 'Player 2 Won';
            color = this.player2Color;
        }

        this.ctx.font = '150px Arial';
        this.ctx.fillStyle = color;
        const textWidth = this.ctx.measureText(gameOverText).width;
        this.ctx.fillText(gameOverText, (this.windowWidth - textWidth) / 2, this.windowHeight / 2);

        // Draw restart message
        this.ctx.font = '50px Arial';
        this.ctx.fillStyle = 'rgb(255, 255, 255)';
        const restartText = 'Press R to Restart';
        const restartWidth = this.ctx.measureText(restartText).width;
        this.ctx.fillText(restartText, (this.windowWidth - restartWidth) / 2, this.windowHeight / 2 + 100);

        this.done = true;
    }

    getBotMove(player) {
        const randomTarget = 0.1;
        let nextMove = 0;

        const playerY = player === 1 ? this.player1Paddle.y : this.player2Paddle.y;

        if (this.botDifficulty === "easy") {
            if (Math.random() <= randomTarget) {
                nextMove = Math.floor(Math.random() * 3);
            } else {
                if (this.ball.vy > 0) {
                    nextMove = 2;
                } else {
                    nextMove = 1;
                }
            }
        } else if (this.botDifficulty === "hard") {
            if (Math.random() <= randomTarget) {
                nextMove = Math.floor(Math.random() * 3);
            } else {
                if (this.ball.y > (playerY + 60)) {
                    nextMove = 2;
                } else if (this.ball.y < (playerY + 60)) {
                    nextMove = 1;
                }
            }
        }

        return nextMove;
    }

    step(player1Action = null, player2Action = null) {
        let player1Reward = 0;
        let player2Reward = 0;
        let done = false;
        let truncated = false;

        if (player1Action === null) {
            player1Action = this.getBotMove(1);
        }
        if (player2Action === null) {
            player2Action = this.getBotMove(2);
        }

        for (let i = 0; i < this.stepRepeat; i++) {
            this._step(player1Action, player2Action);
        }

        const ballCenter = this.ball.x + (this.ball.width / 2);

        if (ballCenter < 0) {
            this.player1Score += 1;
            player1Reward += 1;
            player2Reward -= 1;
            this.ball.spawn();
            console.log("Player 1 reward:", player1Reward);
            console.log("Player 2 reward:", player2Reward);
        } else if (ballCenter > this.windowWidth) {
            this.player2Score += 1;
            player1Reward -= 1;
            player2Reward += 1;
            this.ball.spawn();
            console.log("Player 1 reward:", player1Reward);
            console.log("Player 2 reward:", player2Reward);
        }

        if (this.player1Score >= this.topScore || this.player2Score >= this.topScore) {
            this.gameOver();
            done = true;
            truncated = true;
            console.log("Done: ", done);
        }

        return { player1Reward, player2Reward, done, truncated };
    }

    _step(player1Action = 0, player2Action = 0) {
        this.player1Paddle.move(player1Action);
        this.player2Paddle.move(player2Action);

        this.fillBackground();

        this.player1Paddle.draw(this.ctx);
        this.player2Paddle.draw(this.ctx);
        this.ball.move();
        this.ball.draw(this.ctx);
    }

    gameLoop() {
        if (this.done) {
            return;
        }

        let player1Action = 0;
        let player2Action = 0;

        // Handle human input for Player 1 (Green - Right side)
        if (this.player1Type === "human") {
            if (this.keys['arrowup']) {
                player1Action = 1;
            } else if (this.keys['arrowdown']) {
                player1Action = 2;
            }
        }

        // Handle human input for Player 2 (Purple - Left side)
        if (this.player2Type === "human") {
            if (this.keys['w']) {
                player2Action = 1;
            } else if (this.keys['s']) {
                player2Action = 2;
            }
        }

        // Handle bot for Player 1
        if (this.player1Type === "bot") {
            player1Action = this.getBotMove(1);
        }

        // Handle bot for Player 2
        if (this.player2Type === "bot") {
            player2Action = this.getBotMove(2);
        }

        this.step(player1Action, player2Action);

        // Continue game loop
        setTimeout(() => {
            requestAnimationFrame(() => this.gameLoop());
        }, 1000 / this.fps);
    }
}

// Initialize and start the game
const game = new Pong(
    windowWidth = 800,
    windowHeight = 600,
    fps = 60,
    player1 = "human",
    player2 = "human",
    stepRepeat = 4,
    botDifficulty = "hard"
);

// Function to set player mode (called from HTML buttons)
function setPlayerMode(player, mode) {
    if (player === 1) {
        game.player1Type = mode;
        // Update button states
        document.getElementById('p1-human').classList.toggle('active', mode === 'human');
        document.getElementById('p1-bot').classList.toggle('active', mode === 'bot');
    } else if (player === 2) {
        game.player2Type = mode;
        // Update button states
        document.getElementById('p2-human').classList.toggle('active', mode === 'human');
        document.getElementById('p2-bot').classList.toggle('active', mode === 'bot');
    }
}

// Start the game loop
game.gameLoop();
