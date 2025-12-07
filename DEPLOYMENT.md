# 🚀 Simple Deployment Guide

## 📋 Overview

**2 Simple Deployments:**
1. **Vercel** → Website + Game Frontend (static files)
2. **Render** → Python WebSocket Backend (game server)

```
Website (Vercel)  ←→  Backend (Render)
   HTML/CSS/JS        WebSocket Server
   Game Frontend      AI Model + Logic
```

---

## Part 1: Deploy Website + Game Frontend (Vercel)

### ✅ Step 1: Push to GitHub (if not already done)

```bash
cd /Users/yuvrajsingh9886/Desktop/youtube-dueling-ai-pong
git add .
git commit -m "Add AI Games Showcase website"
git push
```

### ✅ Step 2: Deploy on Vercel (Choose one method)

#### **Method A: Vercel Dashboard** (Easiest - 2 minutes)

1. Go to **https://vercel.com** → Sign in with GitHub
2. Click **"Add New..." → "Project"**
3. **Import your GitHub repository** (NeatRL-Website)
4. **Don't change anything** → Click **"Deploy"**
5. ✅ Done! You'll get: `https://your-project.vercel.app`

#### **Method B: Vercel CLI** (For terminal lovers)

```bash
npm install -g vercel
vercel login
vercel --prod
```

### 🎉 Your Website is Live!

Website URL: `https://your-project.vercel.app`

**⚠️ Important:** The game needs a backend server to work. Continue to Part 2.

---

## Part 2: Deploy Backend Server (Render)

**Why separate?** Vercel doesn't support Python WebSocket servers. We need Render for the game backend.

### ✅ Step 1: Sign up on Render

Go to **https://render.com** → Sign up (free account)

### ✅ Step 2: Deploy Backend

1. Click **"New +" → "Web Service"**
2. **Connect your GitHub repository** (NeatRL-Website)
3. **Configure settings:**
   ```
   Name:           pong-ai-server
   Root Directory: Games/RL-PongGame
   Environment:    Python 3
   Build Command:  pip install -r requirements.txt
   Start Command:  python backend/server.py
   ```
4. Click **"Create Web Service"**
5. ⏳ Wait 5-10 minutes for deployment
6. ✅ You'll get: `https://pong-ai-server.onrender.com`

### ✅ Step 3: Connect Frontend to Backend

Update the WebSocket URL in your game to point to Render:

**Open:** `Games/RL-PongGame/frontend/ws_client.js`

**Find this line:**
```javascript
const ws = new WebSocket('ws://localhost:8765');
```

**Replace with your Render URL:**
```javascript
const ws = new WebSocket('wss://pong-ai-server.onrender.com');
```

**⚠️ Use `wss://` (secure WebSocket) not `ws://`**

### ✅ Step 4: Push Changes & Redeploy

```bash
git add .
git commit -m "Connect to production backend"
git push
```

Vercel will auto-redeploy in ~1 minute!

---

## 🎉 You're Done!

**Your website:** `https://your-project.vercel.app`  
**Your backend:** `https://pong-ai-server.onrender.com`

### Test It:
1. Open your Vercel URL
2. Click "Play Now" on Pong AI
3. Game should load and connect to backend
4. Play against the AI! 🎮

---

## 📝 Quick Checklist

- [ ] Website deployed on Vercel
- [ ] Backend deployed on Render
- [ ] Updated `ws_client.js` with Render URL
- [ ] Pushed changes to GitHub
- [ ] Game connects and works

---

## 🚨 Common Issues

**Game won't connect?**
- Check browser console (F12) for errors
- Verify backend URL in `ws_client.js`
- Make sure you used `wss://` not `ws://`
- Check Render logs for backend errors

**Backend sleeping?** (Free tier)
- Render free tier sleeps after 15 min
- First connection takes ~30 seconds to wake up
- Upgrade to paid ($7/mo) for always-on

---

## 💰 Cost

**Total: FREE** ✨
- Vercel: Free forever
- Render: Free (750 hrs/month)

---

## 🔮 Adding More Games

1. Add game folder to `Games/`
2. Deploy backend (if needed) on Render
3. Add game card to `Website/index.html`
4. Update `vercel.json` routing
5. Push to GitHub → Auto-deploys!

---

## 📚 Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
