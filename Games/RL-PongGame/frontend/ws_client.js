// WebSocket client for Pong game
// Handles connection to Python backend and synchronizes game state

const WS_URL = (location.hostname === "" || location.hostname === "localhost") 
    ? "ws://localhost:8765" 
    : "wss://rl-pong-game-server.onrender.com";

class WSClient {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.onStateUpdate = null;
        this.onModeUpdate = null;
        this.reconnectDelay = 1000;
        this.maxReconnectDelay = 30000;
        this.currentReconnectDelay = this.reconnectDelay;
    }

    connect() {
        console.log(`Connecting to ${WS_URL}...`);
        
        try {
            this.ws = new WebSocket(WS_URL);
            
            this.ws.onopen = () => {
                console.log('Connected to server');
                this.connected = true;
                this.currentReconnectDelay = this.reconnectDelay;
                this.setStatus('connected');
                this.requestState();
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (e) {
                    console.error('Error parsing message:', e);
                }
            };
            
            this.ws.onclose = () => {
                console.log('Disconnected from server');
                this.connected = false;
                this.setStatus('disconnected');
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.setStatus('error');
            };
        } catch (e) {
            console.error('Failed to create WebSocket:', e);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        console.log(`Reconnecting in ${this.currentReconnectDelay}ms...`);
        setTimeout(() => {
            this.connect();
            this.currentReconnectDelay = Math.min(
                this.currentReconnectDelay * 2,
                this.maxReconnectDelay
            );
        }, this.currentReconnectDelay);
    }

    handleMessage(data) {
        if (data.type === 'state') {
            // Game state update
            if (this.onStateUpdate) {
                this.onStateUpdate(data);
            }
        } else if (data.type === 'mode') {
            // Mode change confirmation
            if (this.onModeUpdate) {
                this.onModeUpdate(data);
            }
        }
    }

    sendAction(player, action) {
        if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }
        
        this.ws.send(JSON.stringify({
            type: 'action',
            player: player,
            action: action
        }));
    }

    sendReset() {
        if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }
        
        this.ws.send(JSON.stringify({ type: 'reset' }));
    }

    setMode(player, mode) {
        if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }
        
        this.ws.send(JSON.stringify({
            type: 'mode',
            player: player,
            mode: mode
        }));
    }

    requestState() {
        if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }
        
        this.ws.send(JSON.stringify({ type: 'get_state' }));
    }

    setStatus(status) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            let displayText = 'Status: ';
            let color = '#fff';
            
            switch(status) {
                case 'connected':
                    displayText += 'Connected ✓';
                    color = '#0f0';
                    break;
                case 'disconnected':
                    displayText += 'Disconnected';
                    color = '#f00';
                    break;
                case 'error':
                    displayText += 'Error';
                    color = '#f90';
                    break;
            }
            
            statusElement.textContent = displayText;
            statusElement.style.color = color;
        }
    }

    setOnStateUpdate(callback) {
        this.onStateUpdate = callback;
    }

    setOnModeUpdate(callback) {
        this.onModeUpdate = callback;
    }
}

// Create global instance
const wsClient = new WSClient();
