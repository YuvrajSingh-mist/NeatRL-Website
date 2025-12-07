# 🎮 AI Games Showcase

A beautiful, interactive website showcasing AI-powered games with reinforcement learning agents.

![AI Games](https://img.shields.io/badge/AI-Games-blue)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)
![Python](https://img.shields.io/badge/Python-3.10-green)

## 🌟 Live Demo

- **Website**: Deploy on Vercel
- **Game Server**: Deploy on Render
- **Game**: Pong AI with Deep Q-Learning

## 🏗️ Project Structure

```
youtube-dueling-ai-pong/
├── Website/                    # Main showcase website
│   ├── index.html             # Landing page
│   ├── style.css              # Styling
│   └── script.js              # Interactions
│
├── Games/                      # Game collection
│   └── RL-PongGame/           # Pong AI game
│       ├── frontend/          # Game UI
│       ├── backend/           # WebSocket server (aiohttp)
│       ├── training/          # RL training code
│       └── models/            # Trained models
│
├── vercel.json                # Vercel config (website)
├── render.yaml                # Render config (game server)
└── README.md                  # This file
```

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/YuvrajSingh-mist/NeatRL-Website.git
cd NeatRL-Website
```

2. **Start the game server**
```bash
cd Games/RL-PongGame
pip install -r requirements.txt
python backend/server.py
# Server runs on http://localhost:8765
# WebSocket at ws://localhost:8765/ws
```

3. **Open the game**
```bash
# Open frontend/index_websocket.html in your browser
```

## 📦 Deployment

### Deploy Website (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YuvrajSingh-mist/NeatRL-Website)

The website deploys automatically on every push to master.

### Deploy Game Server (Render)

The game server is configured via `render.yaml` for automatic deployment:

1. Go to **https://render.com** → Sign in with GitHub
2. Click **"New +" → "Blueprint"**
3. Select your repository
4. Render will detect `render.yaml` and configure automatically
5. Click **"Apply"** to deploy

**What gets deployed:**
- HTTP server on port 8765 (set by Render's PORT env variable)
- Health check endpoint at `/health`
- Status endpoint at `/status`
- WebSocket endpoint at `/ws`
- AI model loaded from `models/latest.pt`

**Environment (automatically configured):**
- Python 3.13
- Headless mode (no display/audio required)
- All dependencies from `requirements.txt`

The server will:
- ✅ Pass Render's health checks
- ✅ Handle WebSocket connections
- ✅ Run the AI game loop
- ✅ Serve multiple concurrent clients

## 🎮 Features

- ✨ **Beautiful UI** - Modern, responsive design
- 🤖 **AI-Powered** - Deep Q-Learning trained agents
- ⚡ **Real-time** - WebSocket communication
- 📱 **Responsive** - Works on all devices
- 🎨 **Smooth Animations** - Parallax effects and transitions
- 🏥 **Production Ready** - Health checks, error handling, headless mode

## 🛠️ Tech Stack

### Frontend
- HTML5 Canvas
- CSS3 (Grid, Flexbox, Animations)
- Vanilla JavaScript
- WebSocket API

### Backend
- Python 3.13
- aiohttp (HTTP + WebSocket server)
- PyTorch (Deep Learning)
- Gymnasium (RL environment)
- Pygame (headless game engine)

### Deployment
- Vercel (Static website)
- Render (Python game server)

## 🐛 Troubleshooting

### Server Issues

If deployment fails:

1. **Check logs** in Render dashboard
2. **Verify model file** exists at `Games/RL-PongGame/models/latest.pt`
3. **Test locally** first:
   ```bash
   cd Games/RL-PongGame
   PORT=8765 python backend/server.py
   # Should see: "Server running on http://0.0.0.0:8765"
   ```

### WebSocket Connection Issues

If the game doesn't connect:

1. **Check server status**: Visit `https://your-app.onrender.com/status`
2. **Verify WebSocket URL** in browser console
3. **Check CORS** if hosting frontend elsewhere

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add new AI games
- Improve UI/UX
- Optimize performance
- Fix bugs

## 📄 License

MIT License - feel free to use this project for learning and building!

## 🌟 Show Your Support

Give a ⭐️ if you like this project!

---

Built with ❤️ using Reinforcement Learning
