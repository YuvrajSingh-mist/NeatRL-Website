// Model cache using IndexedDB for storing ONNX models locally
// This allows the model to be downloaded once and cached for offline use

export class ModelCache {
    constructor(dbName = 'PongModelCache', storeName = 'models') {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => {
                console.error("Failed to open IndexedDB");
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log("IndexedDB opened successfully");
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                    console.log("Created object store:", this.storeName);
                }
            };
        });
    }

    async saveModel(modelName, modelData) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const request = store.put(modelData, modelName);

            request.onsuccess = () => {
                console.log(`Model ${modelName} saved to cache`);
                resolve();
            };

            request.onerror = () => {
                console.error(`Failed to save model ${modelName}`);
                reject(request.error);
            };
        });
    }

    async loadModel(modelName) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            const request = store.get(modelName);

            request.onsuccess = () => {
                if (request.result) {
                    console.log(`Model ${modelName} loaded from cache`);
                    resolve(request.result);
                } else {
                    console.log(`Model ${modelName} not found in cache`);
                    resolve(null);
                }
            };

            request.onerror = () => {
                console.error(`Failed to load model ${modelName}`);
                reject(request.error);
            };
        });
    }

    async getModel(modelPath) {
        const modelName = modelPath.split('/').pop(); // Get filename
        
        // Add version/timestamp to force re-download if needed
        const MODEL_VERSION = '2'; // Increment this to force reload
        const cacheKey = `${modelName}_v${MODEL_VERSION}`;

        try {
            console.log(`Getting model: ${modelPath} (cache key: ${cacheKey})`);
            
            // Try to load from cache first
            let modelData = await this.loadModel(cacheKey);

            if (modelData) {
                console.log(`✓ Using cached model: ${cacheKey} (${(modelData.byteLength / 1024).toFixed(1)} KB)`);
                return modelData;
            }

            // Not in cache, fetch from server
            // Add timestamp to bypass browser cache
            const timestamp = Date.now();
            const fetchUrl = `${modelPath}?v=${timestamp}`;
            console.log(`Downloading model from: ${fetchUrl}`);
            const response = await fetch(fetchUrl, {
                cache: 'no-store' // Don't use browser cache
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log(`Response status: ${response.status} ${response.statusText}`);
            console.log(`Content-Type: ${response.headers.get('content-type')}`);
            console.log(`Content-Length: ${response.headers.get('content-length')} bytes`);
            
            modelData = await response.arrayBuffer();
            console.log(`✓ Downloaded model: ${(modelData.byteLength / 1024).toFixed(1)} KB`);

            // Save to cache for next time with new cache key
            try {
                await this.saveModel(cacheKey, modelData);
                console.log("✓ Model cached successfully");
                
                // Clean up old cache entries
                await this.cleanupOldVersions(modelName, MODEL_VERSION);
            } catch (cacheError) {
                console.warn("⚠ Failed to cache model (continuing anyway):", cacheError.message);
            }

            return modelData;
        } catch (error) {
            console.error("❌ Failed to get model:", error);
            console.error("  Model path:", modelPath);
            console.error("  Error message:", error.message);
            throw new Error(`Model loading failed: ${error.message}`);
        }
    }

    async cleanupOldVersions(baseName, currentVersion) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAllKeys();

            request.onsuccess = () => {
                const keys = request.result;
                const deletePromises = [];
                
                for (const key of keys) {
                    // Delete old versions of this model
                    if (key.startsWith(baseName) && key !== `${baseName}_v${currentVersion}`) {
                        console.log(`Cleaning up old cache: ${key}`);
                        const deleteReq = store.delete(key);
                        deletePromises.push(new Promise((res) => {
                            deleteReq.onsuccess = res;
                            deleteReq.onerror = res;
                        }));
                    }
                }
                
                Promise.all(deletePromises).then(resolve);
            };

            request.onerror = () => {
                console.warn("Failed to cleanup old versions");
                resolve(); // Don't fail on cleanup errors
            };
        });
    }

    async clearCache() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const request = store.clear();

            request.onsuccess = () => {
                console.log("Cache cleared");
                resolve();
            };

            request.onerror = () => {
                console.error("Failed to clear cache");
                reject(request.error);
            };
        });
    }

    async getCacheSize() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            const request = store.getAll();

            request.onsuccess = () => {
                let totalSize = 0;
                const models = request.result;
                
                for (const model of models) {
                    if (model instanceof ArrayBuffer) {
                        totalSize += model.byteLength;
                    }
                }

                console.log(`Total cache size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
                resolve(totalSize);
            };

            request.onerror = () => {
                console.error("Failed to get cache size");
                reject(request.error);
            };
        });
    }
}

// Utility function to preload model
export async function preloadModel(modelPath) {
    const cache = new ModelCache();
    try {
        await cache.getModel(modelPath);
        console.log("Model preloaded successfully");
        return true;
    } catch (error) {
        console.error("Failed to preload model:", error);
        return false;
    }
}
