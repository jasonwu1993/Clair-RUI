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
        this.minRequestInterval = 1000; // Minimum 1 second between requests
        this.isProcessingQueue = false;
    }

    // Rate-limited request method to prevent backend overload
    async makeRequest(endpoint, options = {}, timeout = 30000, retries = 3) {
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
        return this.makeRequest('/sync_drive', { method: 'POST' }, API_CONFIG.TIMEOUTS.SYNC, 2);  // Increased retries
    }

    async listFiles() {
        return this.makeRequest('/list_files', {}, API_CONFIG.TIMEOUTS.LIST_FILES, 3);  // Increased retries
    }

    async listIndexedFiles() {
        return this.makeRequest('/list_indexed_files', {}, API_CONFIG.TIMEOUTS.LIST_FILES, 3);  // Get Vertex AI indexed files
    }

    async askQuestion(query, filters = []) {
        return this.makeRequest('/ask', {
            method: 'POST',
            body: JSON.stringify({ query, filters })
        }, API_CONFIG.TIMEOUTS.QUERY, 2);
    }

    async getSyncStatus() {
        return this.makeRequest('/sync_status', {}, API_CONFIG.TIMEOUTS.DEBUG, 1);
    }

    async getDebugInfo() {
        return this.makeRequest('/debug_live', {}, API_CONFIG.TIMEOUTS.DEBUG, 1);
    }

    async submitFeedback(feedbackData) {
        return this.makeRequest('/feedback', {
            method: 'POST',
            body: JSON.stringify(feedbackData)
        }, 10000, 1);
    }

    async emergencyReset() {
        return this.makeRequest('/emergency_reset', { method: 'POST' }, 15000, 1);
    }

    async testGoogleDriveAccess() {
        return this.makeRequest('/debug', {}, 10000, 1);
    }
}

// Create and export singleton instance
const apiClient = new EnhancedAPIClient(API_CONFIG.BASE_URL);

export default apiClient;
export { EnhancedAPIClient };