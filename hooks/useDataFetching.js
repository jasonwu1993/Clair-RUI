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
    
    // Prevent concurrent loadDocuments calls that cause flashing
    let isLoadingDocuments = false;

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
        // Prevent concurrent calls that cause flashing
        if (isLoadingDocuments) {
            console.log('⚠️ LoadDocuments already in progress, skipping concurrent call');
            return [];
        }
        
        try {
            isLoadingDocuments = true;
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
                // Extract paths from file objects - use Vertex AI internal paths
                let docPaths = docs.map(doc => {
                    // Handle both object format (with .path property) and string format
                    if (typeof doc === 'object' && doc.path) {
                        return doc.path;  // Use Vertex AI internal path
                    } else if (typeof doc === 'string') {
                        return doc;
                    }
                    return null;
                }).filter(Boolean);
                
                // Remove duplicates (keep only unique paths)
                docPaths = [...new Set(docPaths)];
                console.log(`📋 Processed ${docs.length} → ${docPaths.length} indexed files (removed duplicates)`);
                
                console.log('📍 Using Vertex AI internal paths:', docPaths);
                console.log('🔍 DEBUG: Raw docs from backend:', docs);
                console.log('🔍 DEBUG: Extracted docPaths:', docPaths);
                setAvailableDocs(docPaths);
                
                // Auto-select all files during initialization phase
                const allFiles = docPaths.filter(p => p && p.includes('.') && !p.endsWith('/'));
                const hasAutoSelected = sessionStorage.getItem('hasAutoSelectedOnInit');
                const hasManualSelection = sessionStorage.getItem('manualSelectionMade');
                
                if (!hasAutoSelected) {
                    // First time initialization - always select all files
                    setSelectedDocs(allFiles);
                    sessionStorage.setItem('hasAutoSelectedOnInit', 'true');
                    console.log('🎯 Default "Select All" during initialization:', allFiles.length, 'files selected');
                    addProgressLog('SUCCESS', `Loaded ${docPaths.length} indexed documents in ${loadTime}ms`, 
                        `Default "Select All" applied - ${allFiles.length} files selected for search`);
                } else if (!hasManualSelection) {
                    // App restarted but user hasn't made manual selections - maintain auto-select behavior
                    setSelectedDocs(allFiles);
                    console.log('🎯 Maintaining "Select All" behavior (no manual changes yet):', allFiles.length);
                    addProgressLog('SUCCESS', `Loaded ${docPaths.length} indexed documents in ${loadTime}ms`, 
                        `Maintained "Select All" - ${allFiles.length} files selected for search`);
                } else {
                    // User has made manual selections - respect their preferences
                    console.log('👤 Preserving user selection preferences');
                    addProgressLog('SUCCESS', `Loaded ${docPaths.length} indexed documents in ${loadTime}ms`, 
                        `Preserved existing file selection preferences`);
                }
                console.log(`✅ Loaded ${docPaths.length} documents with Vertex AI internal paths`);
                
                return docPaths;
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
        } finally {
            isLoadingDocuments = false;
        }
    }, [setAvailableDocs, setSelectedDocs, addProgressLog]);

    // Enhanced emergency reset with automatic reinitialization
    const handleEmergencyReset = useCallback(async () => {
        try {
            addProgressLog('WARN', 'Emergency reset initiated', 'Clearing app state and reloading from Vertex AI');
            
            const result = await apiClient.emergencyReset();
            console.log('✅ Emergency reset successful:', result);
            
            // Reset local state
            setSyncStatus(null);
            setDebugInfo(null);
            setAvailableDocs([]);
            setSelectedDocs([]);
            
            // Clear session storage to trigger fresh initialization with "Select All"
            sessionStorage.removeItem('hasAutoSelectedOnInit');
            sessionStorage.removeItem('manualSelectionMade');
            
            addProgressLog('SUCCESS', 'Emergency reset completed', 'App state cleared - reloading from Vertex AI');
            
            // Trigger standard app initialization (reload documents and auto-select)
            setTimeout(async () => {
                try {
                    addProgressLog('INFO', 'Reloading file structure', 'Fetching documents from Vertex AI index');
                    const docs = await loadDocuments(); // This will trigger auto-selection due to cleared sessionStorage
                    if (docs && docs.length > 0) {
                        addProgressLog('SUCCESS', 'App reinitialization complete', `Reloaded ${docs.length} documents with auto-selection`);
                    }
                } catch (reloadError) {
                    addProgressLog('ERROR', 'Failed to reload documents after reset', reloadError.message);
                }
            }, 1000); // Small delay to allow UI to update
            
            return result;
        } catch (error) {
            addProgressLog('ERROR', 'Emergency reset failed', error.message);
            console.error('❌ Emergency reset failed:', error);
            throw error;
        }
    }, [setSyncStatus, setDebugInfo, setAvailableDocs, setSelectedDocs, addProgressLog, loadDocuments]);

    return {
        fetchSyncStatus,
        fetchDebugInfo,
        loadDocuments,
        handleEmergencyReset
    };
};