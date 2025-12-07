// Backend configuration
// Update this file with your Render backend URL after deployment

const CONFIG = {
    // Local development
    local: {
        wsUrl: "ws://localhost:8765/ws"
    },
    
    // Production backend (Render)
    production: {
        wsUrl: "wss://rl-pong-game-server.onrender.com/ws"
    }
};

// Auto-detect environment
const isLocal = location.hostname === "" || 
                location.hostname === "localhost" || 
                location.hostname === "127.0.0.1";

// Export the appropriate WebSocket URL
export const WS_URL = isLocal ? CONFIG.local.wsUrl : CONFIG.production.wsUrl;

console.log(`Environment: ${isLocal ? 'LOCAL' : 'PRODUCTION'}`);
console.log(`WebSocket URL: ${WS_URL}`);
