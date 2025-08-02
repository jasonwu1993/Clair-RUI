// App initialization and polling effects hook - extracted from original index-original-backup.js
import { useEffect } from 'react';
import { API_CONFIG, FRONTEND_VERSION, FRONTEND_BUILD_DATE } from '../utils/constants.js';

export const useAppEffects = (state, hooks) => {
    const { 
        isInitialized,
        setIsInitialized,
        isMonitoring,
        setIsMonitoring,
        isSyncing,
        availableDocs,
        selectedDocs,
        setSelectedDocs,
        messages,
        chatEndRef,
        addProgressLog
    } = state;

    const { 
        testBackendConnection,
        fetchSyncStatus,
        fetchDebugInfo,
        loadDocuments,
        handleSyncNow
    } = hooks;

    // Initialization effect
    useEffect(() => {
        if (!isInitialized) {
            addProgressLog('INFO', `🚀 Initializing Enhanced RAG Clair System ${FRONTEND_VERSION}`, `Build date: ${FRONTEND_BUILD_DATE}`);
            console.log('🚀 Initializing Enhanced RAG Clair System...');
            
            // Initial setup with error handling
            const initializeApp = async () => {
                try {
                    // Test backend connection first
                    await testBackendConnection();
                    
                    // Step 1: Load indexed documents first (from Vertex AI)
                    addProgressLog('INFO', '📋 Step 1: Loading indexed documents from Vertex AI', 'Checking what documents are already available for search');
                    const docs = await loadDocuments();
                    
                    // Step 2: Fetch sync status and debug info 
                    await Promise.all([
                        fetchSyncStatus(),
                        fetchDebugInfo()
                    ]);
                    
                    // Step 3: Check if we need to sync with Google Drive
                    if (docs && docs.length > 0) {
                        addProgressLog('SUCCESS', `✅ Found ${docs.length} indexed documents`, 'Documents ready for search');
                        // Still trigger a background sync to check for new files
                        addProgressLog('INFO', '🔄 Step 2: Checking Google Drive for updates', 'Running background sync to detect new documents');
                        setTimeout(() => {
                            handleSyncNow().catch(e => {
                                console.log('Background sync failed:', e.message);
                                addProgressLog('WARN', 'Background sync check failed', 'Documents remain available for search');
                            });
                        }, 2000); // Wait 2 seconds before starting sync
                    } else {
                        addProgressLog('WARN', '⚠️ No indexed documents found', 'Starting initial sync with Google Drive');
                        // No documents found, trigger immediate sync
                        setTimeout(() => {
                            handleSyncNow().catch(e => {
                                console.log('Initial sync failed:', e.message);
                                addProgressLog('ERROR', 'Initial sync failed', 'Please check Google Drive configuration');
                            });
                        }, 1000); // Start sync after 1 second
                    }
                    
                    // Delay monitoring to prevent initial request burst
                    setTimeout(() => {
                        setIsMonitoring(true);
                        addProgressLog('INFO', '📊 Monitoring enabled', 'Background status checks activated');
                    }, 5000); // Wait 5 seconds before starting monitoring
                    
                    setIsInitialized(true);
                    addProgressLog('SUCCESS', '🎯 App initialization completed', 'Ready to answer questions');
                    
                } catch (error) {
                    addProgressLog('ERROR', '❌ App initialization failed', error.message);
                    console.error('❌ App initialization failed:', error);
                    setIsInitialized(true); // Still mark as initialized to prevent retry loops
                }
            };
            
            initializeApp();
        }
    }, [isInitialized, setIsInitialized, setIsMonitoring, addProgressLog, testBackendConnection, loadDocuments, fetchSyncStatus, fetchDebugInfo, handleSyncNow]);

    // Polling effects for monitoring
    useEffect(() => {
        if (!isMonitoring || !isInitialized) return;

        const syncStatusInterval = setInterval(() => {
            fetchSyncStatus().catch(e => console.log('Sync status poll failed:', e));
        }, isSyncing ? 20000 : API_CONFIG.POLLING.SYNC_STATUS);  // 20 seconds during sync (prevent request storm)

        const debugInfoInterval = setInterval(() => {
            fetchDebugInfo().catch(e => console.log('Debug info poll failed:', e));
        }, API_CONFIG.POLLING.DEBUG_INFO);

        const connectionInterval = setInterval(() => {
            testBackendConnection().catch(e => console.log('Connection test failed:', e));
        }, API_CONFIG.POLLING.CONNECTION);

        return () => {
            clearInterval(syncStatusInterval);
            clearInterval(debugInfoInterval);
            clearInterval(connectionInterval);
        };
    }, [isMonitoring, isInitialized, isSyncing, fetchSyncStatus, fetchDebugInfo, testBackendConnection]);

    // Auto-select documents effect
    useEffect(() => {
        if (availableDocs.length > 0 && selectedDocs.length === 0) {
            const allFiles = availableDocs.filter(p => p && p.includes('.') && !p.endsWith('/'));
            setSelectedDocs(allFiles);
            addProgressLog('INFO', `Auto-selected ${allFiles.length} documents`, 'All available documents selected for search');
        }
    }, [availableDocs, selectedDocs.length, setSelectedDocs, addProgressLog]);

    // Auto-scroll chat effect
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, chatEndRef]);
};