# 🏓 Pong AI - Deep Q-Learning Agent

A complete implementation of Pong with a trained Deep Q-Network (DQN) agent that you can play against in real-time through a web interface. The project features WebSocket-based multiplayer, allowing humans to compete against the AI or watch AI vs AI battles.

![Python](https://img.shields.io/badge/python-3.10-blue.svg)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-red.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- **🤖 Trained DQN Agent**: Deep Q-Learning agent trained on 84x84 grayscale frames
- **🎮 Real-time Multiplayer**: WebSocket-based gameplay with authoritative server
- **👥 Multiple Game Modes**: Human vs AI, AI vs AI, or Human vs Human
- **📊 Training Infrastructure**: Complete RL training pipeline with WandB integration
- **🎯 Pixel-Perfect Physics**: Deterministic game engine with consistent behavior
- **⚡ Apple Silicon Support**: Optimized for MPS (Metal Performance Shaders)

## 🎯 Demo

Play against the trained AI agent through your browser! The AI has been trained using Deep Q-Learning to master Pong gameplay.

## 📁 Project Structure

```
youtube-dueling-ai-pong/
├── frontend/                    # Web interface
│   ├── index_websocket.html    # Main game UI
│   ├── game_websocket.js       # Client-side game renderer
│   └── ws_client.js            # WebSocket communication
│
├── backend/                     # Server & game logic
│   ├── server.py               # WebSocket server
│   └── core/
│       ├── game.py             # Pong environment (Gymnasium)
│       └── assets.py           # Paddle & Ball physics
│
├── training/                    # RL training components
│   ├── train.py               # Training script
│   ├── agent.py               # DQN agent implementation
│   ├── model.py               # Neural network architecture
│   ├── buffer.py              # Experience replay buffer
│   └── checkpoint.py          # Model checkpointing
│
├── models/                      # Trained models
│   └── latest.pt              # Latest DQN checkpoint
│
├── runs/                        # TensorBoard logs
├── wandb/                       # Weights & Biases logs
└── requirements.txt            # Python dependencies
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- conda (recommended) or virtualenv
- Modern web browser

### 1. Environment Setup

```bash
# Clone the repository
cd youtube-dueling-ai-pong

# Create conda environment
conda create -n game_rl python=3.10
conda activate game_rl

# Install dependencies
pip install -r requirements.txt
```

### 2. Start the Game Server

```bash
# Activate environment
conda activate game_rl

# Start WebSocket server
python backend/server.py
```

The server will:
- Load the trained AI model from `models/latest.pt`
- Start WebSocket server on `ws://localhost:8765`
- Wait for browser connections

### 3. Launch the Frontend

In a separate terminal:

```bash
# Start HTTP server
python -m http.server 8000
```

Then open in your browser:
```
http://localhost:8000/frontend/index_websocket.html
```

## 🎮 How to Play

### Controls

**Player 1 (Green - Right Paddle)**
- **↑** Arrow Up: Move up
- **↓** Arrow Down: Move down

**Player 2 (Purple - Left Paddle)**
- **W**: Move up
- **S**: Move down

**General**
- **R**: Reset game

### Game Modes

Click the buttons in the UI to switch player modes:

- **👤 Human**: Manual control with keyboard
- **🧠 AI (DQN)**: Trained Deep Q-Network agent

**Try These Combinations:**
- **Human vs AI**: Challenge the trained agent
- **AI vs AI**: Watch two agents compete
- **Human vs Human**: Local multiplayer

### Rules

- First player to score **20 points** wins
- Ball speeds up slightly with each paddle hit
- Game physics run at 30 FPS for balanced gameplay

## 🧠 Training Your Own Agent

### Train from Scratch

```bash
conda activate game_rl
python training/train.py
```

### Training Configuration

Key hyperparameters (in `train.py`):

```python
episodes = 10000              # Total training episodes
learning_rate = 0.0001        # Adam optimizer LR
gamma = 0.99                  # Discount factor
epsilon = 1.0                 # Initial exploration
epsilon_decay = 0.995         # Exploration decay
batch_size = 32               # Replay buffer batch
frame_stack = 3               # Stacked frames
hidden_dim = 756              # Network hidden size
```

### Model Architecture

```
Input: 3 × 84 × 84 (3 stacked grayscale frames)
  ↓
Conv2D(32, kernel=8, stride=4) + ReLU
  ↓
Conv2D(64, kernel=4, stride=2) + ReLU
  ↓
Conv2D(64, kernel=3, stride=1) + ReLU
  ↓
Flatten → FC(756) + ReLU
  ↓
Output: FC(3) → [Up, Down, Stay]
```

### Monitoring Training

Training metrics are logged to:
- **WandB**: Real-time training dashboard
- **TensorBoard**: Local metric visualization

```bash
# View TensorBoard logs
tensorboard --logdir runs/
```

## 🔧 Server Configuration

### Command Line Options

```bash
python backend/server.py --help

Options:
  --host HOST          Host to bind to (default: 0.0.0.0)
  --port PORT          Port to bind to (default: 8765)
  --model PATH         Path to trained model (default: models/latest.pt)
```

### Custom Model

```bash
python backend/server.py --model path/to/your/model.pt
```

## 📊 Game Environment

### Observation Space
- **Type**: Image (84×84 grayscale)
- **Channels**: 3 (frame stacking)
- **Preprocessing**: Downscale → Grayscale → Binary (0 or 255)

### Action Space
- **Type**: Discrete(3)
- **Actions**:
  - `0`: Stay
  - `1`: Move up
  - `2`: Move down

### Reward Structure
- **+1**: Score a point
- **-1**: Opponent scores
- **0**: Otherwise

### Episode Termination
- Game ends when either player reaches 20 points
- Maximum episode steps: 1000

## 🌐 WebSocket Protocol

### Client → Server

```json
// Reset game
{ "type": "reset" }

// Send action
{ "type": "action", "player": 1, "action": 0 }

// Change mode
{ "type": "mode", "player": 1, "mode": "ai" }

// Request state
{ "type": "get_state" }
```

### Server → Client

```json
// Game state update
{
  "type": "state",
  "ball": { "x": 640, "y": 480, "vx": 5, "vy": 3 },
  "paddle1": { "y": 420 },
  "paddle2": { "y": 380 },
  "score1": 5,
  "score2": 3,
  "done": false
}
```

## 🛠️ Technical Details

### Technologies Used

**Backend:**
- PyTorch (Deep Learning)
- Gymnasium (RL Environment)
- Pygame (Game Engine)
- WebSockets (Real-time Communication)
- WandB (Experiment Tracking)

**Frontend:**
- HTML5 Canvas (Rendering)
- Vanilla JavaScript (Game Logic)
- WebSocket API (Server Communication)

## 📝 License

MIT License - feel free to use for learning and projects!
