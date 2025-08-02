// Sync operations hook - extracted from original index-original-backup.js
import { useCallback } from 'react';
import apiClient from '../services/apiClient.js';

export const useSync = (state) => {
    const { 
        setApiError, 
        setIsSyncing, 
        clearProgressLogs, 
        addProgressLog,
        GOOGLE_DRIVE_URL 
    } = state;

    // Enhanced sync monitoring with stuck sync detection
    const monitorSyncProgressEnhanced = useCallback(() => {
        let attempts = 0;
        let stuckCount = 0;
        const maxAttempts = 20; // Monitor for up to 5 minutes (20 × 15s = 5min) - reduced from 30min!
        const maxStuckCount = 3; // If no progress for 45 seconds, consider stuck (3 × 15s)
        let lastFilesFound = 0;
        let lastApiCalls = 0;
        let lastOperation = '';
        let syncStartTime = Date.now();
        let lastActivity = Date.now();
        let lastFile = null;
        
        addProgressLog('INFO', 'Starting enhanced sync monitoring...', 'Monitoring every 3 seconds with stuck detection');
        
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
                        
                        // Refresh document list to show new Vertex AI structure
                        setTimeout(() => {
                            addProgressLog('INFO', '🔄 Refreshing document list', 'Loading updated Vertex AI file structure');
                            window.location.reload();
                        }, 2000);
                        
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
                    return; // CRITICAL: Force stop to prevent endless requests
                }
                
                // Continue monitoring if not at max attempts
                if (attempts < maxAttempts) {
                    setTimeout(checkSync, 15000);  // 15 seconds instead of 3 to prevent request storm
                } else {
                    addProgressLog('WARN', '🔄 Sync monitoring timeout reached', 'Stopped monitoring after 10 minutes');
                    setIsSyncing(false);
                }
                
            } catch (error) {
                addProgressLog('WARN', `Monitor check #${attempts} failed`, error.message);
                console.log(`Monitor check #${attempts} failed:`, error.message);
                
                if (attempts < maxAttempts) {
                    setTimeout(checkSync, 30000); // 30 seconds on error to prevent request storm
                } else {
                    setIsSyncing(false);
                }
            }
        };
        
        // Start monitoring
        setTimeout(checkSync, 15000);  // Start monitoring after 15 seconds
    }, [setIsSyncing, addProgressLog]);

    // Enhanced sync handling with monitoring
    const handleSyncNow = useCallback(async () => {
        try {
            setApiError('');
            setIsSyncing(true);
            
            clearProgressLogs(); // Clear old logs first
            addProgressLog('INFO', '🚀 Starting enhanced sync...', 'Preparing to sync Google Drive folder');
            console.log('🚀 Starting enhanced sync...');
            
            // Test connection first
            addProgressLog('DEBUG', 'Testing backend health before sync...');
            const healthData = await apiClient.healthCheck();
            if (!healthData || healthData.status !== 'healthy') {
                throw new Error(`Backend health check failed: ${healthData ? healthData.status : 'no response'}`);
            }
            
            addProgressLog('SUCCESS', 'Backend health check passed', `Status: ${healthData.status}`);
            
            // Test Google Drive access specifically
            addProgressLog('INFO', 'Testing Google Drive folder access...', `Folder ID: ${GOOGLE_DRIVE_URL.split('/').pop()}`);
            
            // Start sync
            addProgressLog('INFO', 'Initiating sync request...', 'Sending POST to /sync_drive');
            const syncStartTime = Date.now();
            
            const syncData = await apiClient.syncDrive();
            const syncRequestTime = Date.now() - syncStartTime;
            
            addProgressLog('SUCCESS', `Sync request completed in ${syncRequestTime}ms`, `Response: ${JSON.stringify(syncData)}`);
            console.log('📡 Enhanced sync response:', syncData);
            
            if (syncData && syncData.status === 'error') {
                throw new Error(syncData.message || 'Sync failed to start');
            }
            
            if (syncData && (syncData.status === 'started' || syncData.status === 'in_progress')) {
                addProgressLog('SUCCESS', 'Sync request accepted', `Status: ${syncData.status}`);
                
                // Monitor sync progress with enhanced logging
                monitorSyncProgressEnhanced();
            } else {
                addProgressLog('WARN', 'Unexpected sync response', `Status: ${syncData ? syncData.status : 'no response'}, Message: ${syncData ? syncData.message : 'none'}`);
                setIsSyncing(false);
            }
            
        } catch (error) {
            console.error('❌ Enhanced sync error:', error);
            setIsSyncing(false);
            
            let errorMessage = 'Sync failed';
            
            if (error.message.includes('timed out')) {
                errorMessage = 'Sync request timed out. The server may be processing large files. Monitoring will continue automatically.';
                addProgressLog('ERROR', 'Sync request timed out', 'Server may be processing large files or Google Drive access issues');
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = `Failed to connect to backend. Please check server status.`;
                addProgressLog('ERROR', 'Failed to connect to backend', 'Network connection issue or server down');
            } else if (error.message.includes('HTTP 503')) {
                errorMessage = 'Backend service temporarily unavailable. Please try again in a moment.';
                addProgressLog('ERROR', 'Backend service unavailable', 'HTTP 503 - Service temporarily unavailable');
            } else if (error.message.includes('HTTP 401')) {
                errorMessage = 'Google Drive access denied. Please check authentication.';
                addProgressLog('ERROR', 'Google Drive access denied', 'HTTP 401 - Authentication issue');
            } else if (error.message.includes('HTTP 403')) {
                errorMessage = 'Google Drive folder access forbidden. Please check permissions.';
                addProgressLog('ERROR', 'Google Drive folder access forbidden', 'HTTP 403 - Permission denied');
            } else {
                errorMessage = `Sync failed: ${error.message}`;
                addProgressLog('ERROR', 'Sync failed to start', error.message);
            }
            
            setApiError(errorMessage);
        }
    }, [setApiError, setIsSyncing, clearProgressLogs, addProgressLog, GOOGLE_DRIVE_URL, monitorSyncProgressEnhanced]);

    return {
        handleSyncNow,
        monitorSyncProgressEnhanced
    };
};