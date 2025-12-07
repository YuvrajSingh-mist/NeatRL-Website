# 🎮 AI Games Showcase

A beautiful, interactive website showcasing AI-powered games with reinforcement learning agents.

![AI Games](https://img.shields.io/badge/AI-Games-blue)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)
![Python](https://img.shields.io/badge/Python-3.10-green)

## 🌟 Live Demo

- **Website**: [Deploy on Vercel](#deployment)
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
│       ├── backend/           # WebSocket server
│       ├── training/          # RL training code
│       └── models/            # Trained models
│
├── vercel.json                # Vercel configuration
├── .vercelignore              # Files to ignore
└── DEPLOYMENT.md              # Deployment guide
```

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

2. **Start the website**
```bash
cd Website
python -m http.server 8000
# Open http://localhost:8000
```

3. **Start the game backend**
```bash
cd Games/RL-PongGame
pip install -r requirements.txt
python backend/server.py
```

4. **Play the game**
- Open the website in your browser
- Click "Play Now" on the Pong AI card

## 📦 Deployment

### Deploy Website + Game Frontend (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YuvrajSingh-mist/NeatRL-Website)

1. Go to **https://vercel.com** → Sign in
2. Click **"Add New..." → "Project"**
3. Import your repo → Click **"Deploy"**
4. Done! ✅

### Deploy Backend (Render)

1. Go to **https://render.com** → Sign up
2. Click **"New +" → "Web Service"**
3. Connect repo → Configure:
   - **Root Directory**: `Games/RL-PongGame`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python backend/server.py`
4. Deploy & get your backend URL
5. Update `Games/RL-PongGame/frontend/ws_client.js` with backend URL

📖 **Full guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)

## 🎮 Features

- ✨ **Beautiful UI** - Inspired by papercode.vercel.app
- 🤖 **AI-Powered** - Deep Q-Learning trained agents
- ⚡ **Real-time** - WebSocket multiplayer
- 📱 **Responsive** - Works on all devices
- 🎨 **Smooth Animations** - Parallax effects and transitions

## 🛠️ Tech Stack

### Frontend
- HTML5 Canvas
- CSS3 (Grid, Flexbox, Animations)
- Vanilla JavaScript
- WebSocket API

### Backend
- Python 3.10
- WebSocket server
- PyTorch (Deep Learning)
- Gymnasium (RL environment)

### Deployment
- Vercel (Frontend hosting)
- Render/Railway (Backend hosting)

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Complete deployment instructions
- [Game README](Games/RL-PongGame/README.md) - Pong AI documentation

## 🎯 Adding New Games

1. Create game folder in `Games/`
2. Add game card to `Website/index.html`
3. Update routing in `vercel.json`
4. Deploy backend (if needed)
5. Push to GitHub (auto-deploys to Vercel)

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
