# Deployment Fixes - December 8, 2025

## Issues Fixed

### 1. ❌ HEAD Request Errors
**Problem**: Render health checks sending HEAD requests caused WebSocket handshake failures
```
ValueError: unsupported HTTP method; expected GET; got HEAD
websockets.exceptions.InvalidMessage: did not receive a valid HTTP request
```

**Solution**: 
- Replaced websockets library with aiohttp for unified HTTP/WebSocket server
- Added dedicated HTTP endpoints: `/health`, `/status`, `/ws`
- Health checks now return proper HTTP responses instead of trying WebSocket handshake

### 2. ❌ No Port Detected
**Problem**: Render couldn't detect the application was listening on a port

**Solution**:
- Added HTTP server on PORT environment variable (Render requirement)
- Created `/health` endpoint for Render health checks
- Server now binds to `0.0.0.0` with proper port exposure

### 3. ❌ ALSA Audio Errors
**Problem**: Pygame trying to initialize audio on headless server
```
ALSA lib confmisc.c:855:(parse_card) cannot find card '0'
```

**Solution**:
- Set environment variables BEFORE importing pygame:
  ```python
  os.environ["SDL_VIDEODRIVER"] = "dummy"
  os.environ["SDL_AUDIODRIVER"] = "dummy"
  ```
- Configured render.yaml with proper environment variables

## Files Changed

### `backend/server.py`
- ✅ Switched from `websockets` to `aiohttp` for HTTP+WebSocket
- ✅ Added HTTP health endpoints (`/`, `/health`, `/status`)
- ✅ WebSocket now at `/ws` endpoint
- ✅ Set headless environment variables at top of file
- ✅ Unified server on single PORT (Render requirement)
- ✅ Fixed client set handling for aiohttp WebSockets

### `requirements.txt`
- ✅ Added `aiohttp` dependency

### `frontend/ws_client.js`
- ✅ Updated WebSocket URL to use `/ws` endpoint
- ✅ Auto-detects production environment
- ✅ Uses same host/port as HTTP server

### `render.yaml` (NEW)
- ✅ Automatic Render deployment configuration
- ✅ Proper build and start commands
- ✅ Health check path configured
- ✅ Environment variables set

### `test_server.py` (NEW)
- ✅ Automated testing script
- ✅ Tests HTTP health/status endpoints
- ✅ Tests WebSocket connection and game state
- ✅ Verifies server is production-ready

### `README.md`
- ✅ Updated deployment instructions
- ✅ Added troubleshooting section
- ✅ Documented server architecture

## Server Architecture

```
┌─────────────────────────────────────┐
│     Render (PORT env variable)       │
│              ↓                       │
│    aiohttp HTTP Server :8765         │
│         ↓           ↓                │
│    HTTP Endpoints  WebSocket         │
│    /health         /ws               │
│    /status                           │
└─────────────────────────────────────┘
```

## Testing

### Local Test
```bash
cd Games/RL-PongGame
pip install -r requirements.txt
python backend/server.py
python test_server.py
```

### Expected Output
```
Testing server at localhost:8765
--------------------------------------------------

1. Testing HTTP health endpoint...
   ✅ Health check: 200 - OK

2. Testing HTTP status endpoint...
   ✅ Status: {
     "status": "running",
     "clients": 0,
     "ai_loaded": true,
     "game_score": "0-0"
   }

3. Testing WebSocket connection...
   ✅ WebSocket connected
   ✅ Received initial state
   
==================================================
✅ ALL TESTS PASSED!
==================================================
```

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Fix Render deployment issues"
   git push origin master
   ```

2. **Deploy to Render**
   - Go to https://render.com
   - New + → Blueprint
   - Select repository
   - Render auto-detects `render.yaml`
   - Click "Apply"

3. **Verify Deployment**
   - Check logs for "Server running on http://0.0.0.0:8765"
   - Visit `/health` endpoint
   - Visit `/status` endpoint
   - Connect frontend to `/ws` endpoint

## What Render Sees Now

✅ **Health Check**: `GET /health` → `200 OK`
✅ **Port Binding**: Listening on `PORT` env variable
✅ **Process Running**: Python process stays alive
✅ **No Errors**: ALSA/audio warnings suppressed
✅ **WebSocket Ready**: Available at `/ws` endpoint

## Next Steps

After deployment:
1. Note your Render URL (e.g., `https://your-app.onrender.com`)
2. Test health check: `curl https://your-app.onrender.com/health`
3. Test status: `curl https://your-app.onrender.com/status`
4. Update frontend if needed to point to production WebSocket URL
5. Open game and verify AI loads and plays correctly
