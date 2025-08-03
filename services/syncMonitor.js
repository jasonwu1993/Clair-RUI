// Standalone sync monitoring service - extracted from original index-original.js.bak
// This prevents React lifecycle issues that cause racing requests

import apiClient from './apiClient.js';

// Global monitoring state to prevent racing
let isMonitoringActive = false;
let activeMonitorId = null;
let monitoringPromise = null;

// Enhanced sync monitoring with stuck sync detection - standalone function
export const monitorSyncProgressEnhanced = (setIsSyncing, addProgressLog, loadDocuments) => {
    const monitorId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Return existing monitoring promise if one is active
    if (monitoringPromise) {
        console.log(`⚠️ Sync monitoring already running (${activeMonitorId}), returning existing promise for (${monitorId})`);
        addProgressLog('WARN', 'Sync monitoring already active', `Active: ${activeMonitorId}, Reusing for: ${monitorId}`);
        return monitoringPromise;
    }
    
    // Double-check with synchronous flag
    if (isMonitoringActive) {
        console.log(`⚠️ Sync monitoring flag active (${activeMonitorId}), skipping duplicate call (${monitorId})`);
        addProgressLog('WARN', 'Sync monitoring flag active', `Active: ${activeMonitorId}, Blocked: ${monitorId}`);
        return Promise.resolve();
    }
    
    isMonitoringActive = true;
    activeMonitorId = monitorId;
    console.log(`🚀 Starting sync monitoring: ${monitorId}`);
    
    let attempts = 0;
    let stuckCount = 0;
    const maxAttempts = 20; // Monitor for up to 5 minutes (20 × 15s = 5min)
    const maxStuckCount = 3; // If no progress for 45 seconds, consider stuck (3 × 15s)
    let lastFilesFound = 0;
    let lastApiCalls = 0;
    let lastOperation = '';
    let syncStartTime = Date.now();
    let lastActivity = Date.now();
    let lastFile = null;
    
    addProgressLog('INFO', 'Starting enhanced sync monitoring...', 'Monitoring every 15 seconds with stuck detection');
    
    // Create and store the monitoring promise
    monitoringPromise = new Promise((resolve, reject) => {
        // Helper to clean up monitoring state
        const stopMonitoring = (reason = 'completed') => {
            console.log(`🛑 Sync monitoring stopped: ${monitorId} (${reason})`);
            isMonitoringActive = false;
            activeMonitorId = null;
            monitoringPromise = null;
            resolve(reason);
        };
    
    const checkSync = async () => {
        try {
            attempts++;
            const checkStartTime = Date.now();
            
            addProgressLog('DEBUG', `Monitor check #${attempts}`, `Checking sync status and debug info...`);
            
            const [status, debug] = await Promise.all([
                apiClient.getSyncStatus(),
                apiClient.getDebugInfo()
            ]);
            
            const checkDuration = Date.now() - checkStartTime;
            const totalSyncTime = Math.floor((Date.now() - syncStartTime) / 1000);
            
            // Process status response
            if (status) {
                if (status.is_syncing === false) {
                    setIsSyncing(false);
                    addProgressLog('SUCCESS', `✅ Sync completed successfully after ${totalSyncTime}s`, 
                        `STOPPED monitoring loop to prevent request storm. Total attempts: ${attempts}`);
                    console.log(`✅ Sync completed successfully after ${attempts} attempts - STOPPING request loop`);
                    
                    // Refresh Vertex AI file structure to show changes (real-time update)
                    setTimeout(async () => {
                        addProgressLog('INFO', '🔄 Refreshing Vertex AI structure', 'Checking for updated indexed documents');
                        try {
                            if (loadDocuments && typeof loadDocuments === 'function') {
                                const updatedDocs = await loadDocuments();
                                if (updatedDocs && updatedDocs.length > 0) {
                                    addProgressLog('SUCCESS', '✅ File structure updated', 
                                        `Vertex AI index refreshed: ${updatedDocs.length} documents now available`);
                                    console.log('🔄 Vertex AI structure refreshed after sync completion');
                                } else {
                                    addProgressLog('INFO', 'ℹ️ No structure changes detected', 'Vertex AI index unchanged after sync');
                                }
                            } else {
                                addProgressLog('WARN', 'Cannot refresh file structure', 'LoadDocuments function not available');
                            }
                        } catch (error) {
                            addProgressLog('WARN', 'Failed to refresh file structure', 'Manual page refresh may be needed');
                            console.log('Failed to refresh Vertex AI structure:', error.message);
                        }
                    }, 3000); // Wait 3s for indexing to complete
                    
                    stopMonitoring();
                    return; // CRITICAL: Stop monitoring immediately to prevent request storm
                }
                
                if (status.current_operation !== lastOperation) {
                    lastOperation = status.current_operation;
                    lastActivity = Date.now();
                    stuckCount = 0; // Reset stuck counter on operation change
                    addProgressLog('INFO', `Sync operation: ${status.current_operation}`, 
                        `Progress: ${status.files_processed || 0}/${status.total_files || '?'} files`);
                }
            }
            
            // Process debug response for progress metrics
            if (debug && debug.sync_progress) {
                const progress = debug.sync_progress;
                
                // Check for progress changes
                const currentFilesFound = progress.files_found || 0;
                const currentApiCalls = progress.api_calls || 0;
                
                if (currentFilesFound !== lastFilesFound || currentApiCalls !== lastApiCalls) {
                    lastFilesFound = currentFilesFound;
                    lastApiCalls = currentApiCalls;
                    lastActivity = Date.now();
                    stuckCount = 0; // Reset stuck counter on progress change
                    
                    addProgressLog('INFO', `📊 Progress update`, 
                        `Files: ${currentFilesFound}, API calls: ${currentApiCalls}, Operation: ${progress.current_operation || 'unknown'}`);
                } else {
                    stuckCount++;
                }
            }
            
            // Check if sync appears stuck (no progress for 45 seconds) - FORCE STOP to prevent request storm
            const timeSinceLastActivity = Date.now() - lastActivity;
            if (timeSinceLastActivity > 45000) {
                addProgressLog('ERROR', `⚠️ SYNC STUCK: No progress for ${Math.floor(timeSinceLastActivity/1000)}s`, 
                    `FORCE STOPPING sync monitoring to prevent request storm after ${attempts} attempts`);
                setIsSyncing(false);
                stopMonitoring();
                return; // CRITICAL: Force stop to prevent endless requests
            }
            
            // Continue monitoring if not at max attempts
            if (attempts < maxAttempts) {
                setTimeout(checkSync, 15000);  // 15 seconds instead of 3 to prevent request storm
            } else {
                addProgressLog('WARN', '🔄 Sync monitoring timeout reached', 'Stopped monitoring after 5 minutes');
                setIsSyncing(false);
                stopMonitoring();
            }
            
        } catch (error) {
            addProgressLog('WARN', `Monitor check #${attempts} failed`, error.message);
            console.log(`Monitor check #${attempts} failed:`, error.message);
            
            if (attempts < maxAttempts) {
                setTimeout(checkSync, 30000); // 30 seconds on error to prevent request storm
            } else {
                setIsSyncing(false);
                stopMonitoring();
            }
        }
    };
    
        // Start monitoring
        setTimeout(checkSync, 15000);  // Start monitoring after 15 seconds
    });
    
    return monitoringPromise;
};

// Helper to check if monitoring is currently active
export const isMonitoringSync = () => isMonitoringActive;

// Helper to force stop monitoring (emergency use)
export const forceStopMonitoring = () => {
    isMonitoringActive = false;
    console.log('🚨 Sync monitoring force stopped');
};