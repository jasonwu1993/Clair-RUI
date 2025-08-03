// Enhanced API Client service - extracted from original index-original-backup.js
import { API_CONFIG } from '../utils/constants.js';

// --- Enhanced API Client with Comprehensive Error Handling ---
class EnhancedAPIClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.requestCount = 0;
        this.errorCount = 0;
        this.successCount = 0;
        this.avgResponseTime = 0;
        
        // Request rate limiting to prevent backend overload
        this.requestQueue = [];
        this.lastRequestTime = 0;
        this.minRequestInterval = 2000; // Minimum 2 seconds between requests (increased from 1s)
        this.isProcessingQueue = false;
        
        // Request deduplication to prevent duplicate concurrent requests
        this.pendingRequests = new Map(); // Track in-flight requests by endpoint
    }

    // Rate-limited request method to prevent backend overload
    async makeRequest(endpoint, options = {}, timeout = 30000, retries = 3) {
        // Check for duplicate in-flight requests
        const requestKey = `${options.method || 'GET'}_${endpoint}`;
        if (this.pendingRequests.has(requestKey)) {
            console.log(`⚡ Deduplicating request to ${endpoint} - returning existing promise`);
            return this.pendingRequests.get(requestKey);
        }
        
        // Create the request promise
        const requestPromise = this._executeRequest(endpoint, options, timeout, retries);
        
        // Store in pending requests
        this.pendingRequests.set(requestKey, requestPromise);
        
        // Clean up after completion
        requestPromise.finally(() => {
            this.pendingRequests.delete(requestKey);
        });
        
        return requestPromise;
    }
    
    async _executeRequest(endpoint, options = {}, timeout = 30000, retries = 3) {
        // Throttle requests to prevent overwhelming the backend
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            console.log(`⏳ Throttling request to ${endpoint} - waiting ${waitTime}ms`);
            await this.delay(waitTime);
        }
        
        this.lastRequestTime = Date.now();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const requestId = ++this.requestCount;

        const requestOptions = {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId.toString(),
                ...options.headers
            }
        };

        for (let attempt = 1; attempt <= retries; attempt++) {
            const attemptStart = Date.now();
            
            try {
                console.log(`🔄 API Request #${requestId} (attempt ${attempt}/${retries}): ${endpoint}`);
                
                const response = await fetch(`${this.baseUrl}${endpoint}`, requestOptions);
                clearTimeout(timeoutId);

                const responseTime = Date.now() - attemptStart;
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}`;
                    
                    if (response.status >= 500 && attempt < retries) {
                        console.log(`🔄 Server error ${response.status}, retrying...`);
                        await this.delay(this.getRetryDelay(attempt));
                        continue;
                    }
                    
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                
                // Update metrics
                this.successCount++;
                this.updateResponseTime(responseTime);
                
                console.log(`✅ API Success #${requestId} (attempt ${attempt}): ${endpoint} (${responseTime}ms)`);
                return data;

            } catch (error) {
                clearTimeout(timeoutId);

                if (error.name === 'AbortError') {
                    console.log(`⏰ API Timeout #${requestId} (attempt ${attempt}): ${endpoint}`);
                    if (attempt === retries) {
                        this.errorCount++;
                        throw new Error(`Request timed out after ${timeout/1000} seconds`);
                    }
                } else if (error.message.includes('message channel closed')) {
                    console.warn('Async response channel closed (likely extension interference):', error);
                    if (attempt === retries) {
                        this.errorCount++;
                        throw new Error('Network channel closed unexpectedly');
                    }
                } else {
                    console.log(`❌ API Error #${requestId} (attempt ${attempt}): ${endpoint} - ${error.message}`);
                    if (attempt === retries) {
                        this.errorCount++;
                        throw error;
                    }
                }

                // Wait before retry with exponential backoff
                if (attempt < retries) {
                    await this.delay(this.getRetryDelay(attempt));
                }
            }
        }
    }

    getRetryDelay(attempt) {
        return API_CONFIG.RETRY.DELAY_MS * Math.pow(API_CONFIG.RETRY.BACKOFF_MULTIPLIER, attempt - 1);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateResponseTime(responseTime) {
        this.avgResponseTime = (this.avgResponseTime * (this.successCount - 1) + responseTime) / this.successCount;
    }

    getMetrics() {
        return {
            totalRequests: this.requestCount,
            successCount: this.successCount,
            errorCount: this.errorCount,
            successRate: this.requestCount > 0 ? (this.successCount / this.requestCount * 100).toFixed(1) : 0,
            avgResponseTime: Math.round(this.avgResponseTime)
        };
    }

    // API Methods
    async healthCheck() {
        return this.makeRequest('/health', {}, API_CONFIG.TIMEOUTS.HEALTH_CHECK, 2);
    }

    async syncDrive() {
        return this.makeRequest('/documents/sync_drive', { method: 'POST' }, API_CONFIG.TIMEOUTS.SYNC, 2);  // Updated for modular backend
    }

    async listFiles() {
        return this.makeRequest('/documents/list_files', {}, API_CONFIG.TIMEOUTS.LIST_FILES, 3);  // Updated for modular backend
    }

    async listIndexedFiles() {
        return this.makeRequest('/documents/list_indexed_files', {}, API_CONFIG.TIMEOUTS.LIST_FILES, 3);  // Updated for modular backend
    }

    async askQuestion(query, filters = []) {
        return this.makeRequest('/chat/ask', {
            method: 'POST',
            body: JSON.stringify({ query, filters })
        }, API_CONFIG.TIMEOUTS.QUERY, 2);
    }

    async getGreeting() {
        return this.makeRequest('/chat/greeting', {}, 5000, 1);
    }

    async getSyncStatus() {
        return this.makeRequest('/documents/sync_status', {}, API_CONFIG.TIMEOUTS.DEBUG, 1);
    }

    async getDebugInfo() {
        return this.makeRequest('/admin/debug_live', {}, API_CONFIG.TIMEOUTS.DEBUG, 1);
    }

    async submitFeedback(feedbackData) {
        return this.makeRequest('/chat/feedback', {
            method: 'POST',
            body: JSON.stringify(feedbackData)
        }, 10000, 1);
    }

    async emergencyReset() {
        return this.makeRequest('/admin/emergency_reset', { method: 'POST' }, 15000, 1);
    }

    async cleanupVertexAI() {
        return this.makeRequest('/admin/cleanup_vertex_ai', { method: 'POST' }, 30000, 1);
    }

    async testGoogleDriveAccess() {
        return this.makeRequest('/admin/debug', {}, 10000, 1);
    }
}

// Create and export singleton instance
const apiClient = new EnhancedAPIClient(API_CONFIG.BASE_URL);

export default apiClient;
export { EnhancedAPIClient };