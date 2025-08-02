// Enhanced Configuration - extracted from original index-original-backup.js
export const API_CONFIG = {
    BASE_URL: "https://rag-gcs-718538538469.us-central1.run.app",  // Google Cloud Run modular backend
    TIMEOUTS: {
        HEALTH_CHECK: 30000,    // 30 seconds (for Cloud Run cold starts)
        SYNC: 600000,           // 10 minutes (for large Drive syncs)
        QUERY: 60000,           // 60 seconds (for complex AI queries)
        LIST_FILES: 45000,      // 45 seconds (for Vertex AI indexing)
        DEBUG: 30000            // 30 seconds (for system status)
    },
    RETRY: {
        MAX_ATTEMPTS: 2,        // Reduce retries to avoid long waits
        DELAY_MS: 3000,         // Longer delay for Cloud Run
        BACKOFF_MULTIPLIER: 1.5 // Gentler backoff
    },
    POLLING: {
        SYNC_STATUS: 30000,     // 30 seconds (drastically reduced to stop request storm)
        DEBUG_INFO: 60000,      // 60 seconds (1 minute - minimal debug polling)
        CONNECTION: 120000      // 120 seconds (2 minutes - connection is stable)
    }
};

// Frontend Version Info
export const FRONTEND_VERSION = "v2.2.0-Enhanced-Reliability";
export const FRONTEND_BUILD_DATE = "2025-07-31T00:00:00Z";

// Google Drive Configuration
export const GOOGLE_DRIVE_CONFIG = {
    FOLDER_ID: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
};