// ONNX Agent for browser-based RL inference
// Handles loading and running the ONNX model in the browser

export class ONNXAgent {
    constructor() {
        this.session = null;
        this.isReady = false;
    }

    async loadModel(modelData) {
        try {
            console.log("Initializing ONNX Runtime...");
            
            // Load ONNX Runtime Web
            if (typeof ort === 'undefined') {
                throw new Error("ONNX Runtime not loaded. Make sure to include the script tag.");
            }

            console.log("ONNX Runtime version:", ort.version);
            console.log("Creating inference session from", modelData.byteLength, "bytes...");
            
            // Create session from model data
            if (modelData instanceof ArrayBuffer) {
                this.session = await ort.InferenceSession.create(modelData);
            } else if (typeof modelData === 'string') {
                // URL to model file
                this.session = await ort.InferenceSession.create(modelData);
            } else {
                throw new Error(`Invalid model data format: ${typeof modelData}`);
            }

            console.log("✓ ONNX session created successfully");
            console.log("  Input names:", this.session.inputNames);
            console.log("  Output names:", this.session.outputNames);
            
            // Get input/output info
            const inputInfo = this.session.inputNames.map(name => {
                return { name, type: 'tensor' };
            });
            console.log("  Input info:", inputInfo);

            this.isReady = true;
            return true;
        } catch (error) {
            console.error("Failed to load ONNX model:", error);
            console.error("Error details:", error.message);
            console.error("Stack trace:", error.stack);
            throw error;
        }
    }

    async getAction(frameStack, player = 1) {
        if (!this.isReady || !this.session) {
            throw new Error("Model not loaded");
        }

        try {
            // Prepare input tensor
            // frameStack is array of 3 frames, each 84x84 Float32Array
            // Need to stack them into shape [1, 3, 84, 84]
            
            if (frameStack.length !== 3) {
                throw new Error(`Expected 3 frames, got ${frameStack.length}`);
            }

            // Create input tensor [1, 3, 84, 84]
            const inputData = new Float32Array(1 * 3 * 84 * 84);
            
            for (let frame_idx = 0; frame_idx < 3; frame_idx++) {
                const frame = frameStack[frame_idx];
                const offset = frame_idx * 84 * 84;
                inputData.set(frame, offset);
            }

            // Create tensor
            const inputTensor = new ort.Tensor('float32', inputData, [1, 3, 84, 84]);

            // Run inference
            const feeds = {};
            feeds[this.session.inputNames[0]] = inputTensor;
            
            const results = await this.session.run(feeds);
            
            // Get output
            const outputName = this.session.outputNames[0];
            const outputTensor = results[outputName];
            const logits = outputTensor.data;

            // Get action with highest logit (argmax)
            let action = 0;
            let maxLogit = logits[0];
            for (let i = 1; i < logits.length; i++) {
                if (logits[i] > maxLogit) {
                    maxLogit = logits[i];
                    action = i;
                }
            }

            // If player is 2, we need to flip the action perspective
            // The model was trained from player 1's perspective (right side)
            // For player 2 (left side), we can keep the same actions since
            // the game is symmetric and the observation is from their perspective

            return action;
        } catch (error) {
            console.error("Inference error:", error);
            throw error;
        }
    }
}
