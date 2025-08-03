// Sync operations hook - extracted from original index-original-backup.js
import { useCallback } from 'react';
import apiClient from '../services/apiClient.js';
import { monitorSyncProgressEnhanced } from '../services/syncMonitor.js';

export const useSync = (state, hooks = {}) => {
    const { 
        setApiError, 
        setIsSyncing, 
        clearProgressLogs, 
        addProgressLog,
        GOOGLE_DRIVE_URL 
    } = state;
    
    // Extract loadDocuments function for refreshing Vertex AI structure  
    const { loadDocuments } = hooks;

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
                
                // Monitor sync progress with enhanced logging - using standalone service
                monitorSyncProgressEnhanced(setIsSyncing, addProgressLog, loadDocuments);
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
    }, [setApiError, setIsSyncing, clearProgressLogs, addProgressLog, GOOGLE_DRIVE_URL, loadDocuments]);

    return {
        handleSyncNow
    };
};