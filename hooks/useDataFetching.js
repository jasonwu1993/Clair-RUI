// Data fetching operations hook - extracted from original index-original-backup.js
import { useCallback } from 'react';
import apiClient from '../services/apiClient.js';

export const useDataFetching = (state) => {
    const { 
        setSyncStatus,
        setDebugInfo,
        setAvailableDocs,
        setSelectedDocs,
        addProgressLog
    } = state;

    // Fetch sync status
    const fetchSyncStatus = useCallback(async () => {
        try {
            const status = await apiClient.getSyncStatus();
            setSyncStatus(status);
            return status;
        } catch (error) {
            console.log('Failed to fetch sync status:', error.message);
            return null;
        }
    }, [setSyncStatus]);

    // Fetch debug info
    const fetchDebugInfo = useCallback(async () => {
        try {
            const debug = await apiClient.getDebugInfo();
            setDebugInfo(debug);
            return debug;
        } catch (error) {
            console.log('Failed to fetch debug info:', error.message);
            return null;
        }
    }, [setDebugInfo]);

    // Enhanced document listing with progress tracking - uses Vertex AI indexed documents
    const loadDocuments = useCallback(async () => {
        try {
            addProgressLog('INFO', 'Loading indexed documents...', 'Fetching Vertex AI indexed files from backend');
            
            const startTime = Date.now();
            const response = await apiClient.listIndexedFiles();
            const loadTime = Date.now() - startTime;
            
            // Handle both old format (array) and new format (object with files array)
            let docs = [];
            if (Array.isArray(response)) {
                docs = response;
            } else if (response && Array.isArray(response.files)) {
                docs = response.files;
                console.log(`📊 Vertex AI Index Status: ${response.total_indexed} documents indexed, source: ${response.source}`);
            }
            
            if (docs && docs.length > 0) {
                setAvailableDocs(docs);
                
                // Auto-select all files
                const allFiles = docs.filter(p => p && p.includes('.') && !p.endsWith('/'));
                setSelectedDocs(allFiles);
                
                addProgressLog('SUCCESS', `Loaded ${docs.length} indexed documents in ${loadTime}ms`, 
                    `Auto-selected ${allFiles.length} files for search from Vertex AI`);
                console.log(`✅ Loaded ${docs.length} indexed documents from Vertex AI`);
                
                return docs;
            } else {
                addProgressLog('WARN', 'No indexed documents found', 'No documents are currently indexed in Vertex AI');
                setAvailableDocs([]);
                setSelectedDocs([]);
                return [];
            }
        } catch (error) {
            let errorMessage = 'Failed to load documents';
            
            if (error.message.includes('timed out')) {
                errorMessage = 'Document loading timed out';
                addProgressLog('ERROR', 'Document loading timed out', 'Request took too long to complete');
            } else if (error.message.includes('HTTP 503')) {
                errorMessage = 'Service temporarily unavailable';
                addProgressLog('ERROR', 'Service temporarily unavailable', 'HTTP 503 error');
            } else {
                addProgressLog('ERROR', 'Failed to load documents', error.message);
            }
            
            console.error('❌ Failed to load documents:', error.message);
            setAvailableDocs([]);
            setSelectedDocs([]);
            return [];
        }
    }, [setAvailableDocs, setSelectedDocs, addProgressLog]);

    // Enhanced emergency reset
    const handleEmergencyReset = useCallback(async () => {
        try {
            addProgressLog('WARN', 'Emergency reset initiated', 'Clearing all data and resetting system');
            
            const result = await apiClient.emergencyReset();
            console.log('✅ Emergency reset successful:', result);
            
            // Reset local state
            setSyncStatus(null);
            setDebugInfo(null);
            setAvailableDocs([]);
            setSelectedDocs([]);
            
            addProgressLog('SUCCESS', 'Emergency reset completed', 'All systems reset successfully');
            
            return result;
        } catch (error) {
            addProgressLog('ERROR', 'Emergency reset failed', error.message);
            console.error('❌ Emergency reset failed:', error);
            throw error;
        }
    }, [setSyncStatus, setDebugInfo, setAvailableDocs, setSelectedDocs, addProgressLog]);

    return {
        fetchSyncStatus,
        fetchDebugInfo,
        loadDocuments,
        handleEmergencyReset
    };
};