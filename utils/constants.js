// Enhanced Configuration - extracted from original index-original-backup.js
export const API_CONFIG = {
    BASE_URL: "https://rag-gcs-718538538469.us-central1.run.app",  // Google Cloud Run modular backend
    TIMEOUTS: {
        HEALTH_CHECK: 15000,    // 15 seconds
        SYNC: 300000,           // 5 minutes (matches backend)
        QUERY: 40000,           // 40 seconds
        LIST_FILES: 20000,      // 20 seconds
        DEBUG: 10000            // 10 seconds
    },
    RETRY: {
        MAX_ATTEMPTS: 3,
        DELAY_MS: 2000,
        BACKOFF_MULTIPLIER: 2
    },
    POLLING: {
        SYNC_STATUS: 3000,      // 3 seconds
        DEBUG_INFO: 5000,       // 5 seconds
        CONNECTION: 30000       // 30 seconds
    }
};

// Frontend Version Info
export const FRONTEND_VERSION = "v2.2.0-Enhanced-Reliability";
export const FRONTEND_BUILD_DATE = "2025-07-31T00:00:00Z";

// Google Drive Configuration
export const GOOGLE_DRIVE_CONFIG = {
    FOLDER_ID: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
};