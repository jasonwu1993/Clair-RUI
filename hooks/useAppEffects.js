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
                    // Test backend connection first and detect cold start
                    addProgressLog('INFO', '🔌 Testing backend connection...', 'Checking if Cloud Run backend is warmed up');
                    const connectionStart = Date.now();
                    await testBackendConnection();
                    const connectionTime = Date.now() - connectionStart;
                    
                    // Detect cold start (>5 second response = cold backend)
                    const isColdStart = connectionTime > 5000;
                    if (isColdStart) {
                        addProgressLog('INFO', `❄️ Cold start detected (${Math.round(connectionTime/1000)}s)`, 'Waiting for backend to warm up before proceeding');
                        // Wait additional time for Cloud Run to fully warm up
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    }
                    
                    // Step 1: FAST - Load Vertex AI file structure immediately (users want to see files ASAP)
                    addProgressLog('INFO', '⚡ Step 1: Loading Vertex AI file structure', 'Fetching indexed documents (fast) before checking sync status');
                    const docs = await loadDocuments();
                    
                    // Show file structure immediately - don't wait for sync checks
                    if (docs && docs.length > 0) {
                        addProgressLog('SUCCESS', `✅ Loaded ${docs.length} indexed documents`, 'File structure ready - now checking for updates...');
                    }
                    
                    // Step 2: SLOW - Check sync status and optionally sync (background operation)
                    addProgressLog('INFO', '🔄 Step 2: Checking for Google Drive updates...', 'Background sync status check');
                    await fetchSyncStatus();
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1s gap between requests
                    await fetchDebugInfo();
                    
                    // Step 3: Decide if sync is needed (but file structure is already shown)
                    if (docs && docs.length > 0) {
                        addProgressLog('SUCCESS', `✅ Found ${docs.length} indexed documents`, 'Documents ready for search');
                        // Delay background sync more if cold start to prevent request storm
                        const syncDelay = isColdStart ? 10000 : 5000; // 10s for cold start, 5s for warm start
                        addProgressLog('INFO', '🔄 Step 3: Scheduling Google Drive sync check', `Will check for updates in ${syncDelay/1000} seconds`);
                        setTimeout(() => {
                            handleSyncNow().catch(e => {
                                console.log('Background sync failed:', e.message);
                                addProgressLog('WARN', 'Background sync check failed', 'Documents remain available for search');
                            });
                        }, syncDelay);
                    } else {
                        addProgressLog('WARN', '⚠️ No documents in Vertex AI index', 'Will sync with Google Drive to populate index');
                        // No documents found, but still wait longer if cold start
                        const initialSyncDelay = isColdStart ? 8000 : 3000; // 8s for cold start, 3s for warm start  
                        addProgressLog('INFO', '🔄 Scheduling Google Drive sync', `Will sync and index documents in ${initialSyncDelay/1000} seconds`);
                        setTimeout(() => {
                            handleSyncNow().catch(e => {
                                console.log('Initial sync failed:', e.message);
                                addProgressLog('ERROR', 'Initial sync failed', 'Please check Google Drive configuration');
                            });
                        }, initialSyncDelay);
                    }
                    
                    // Delay monitoring based on cold start detection to prevent initial request burst
                    const monitoringDelay = isColdStart ? 15000 : 8000; // 15s for cold start, 8s for warm start
                    addProgressLog('INFO', '⏳ Delaying monitoring startup', `Background checks will start in ${monitoringDelay/1000} seconds`);
                    setTimeout(() => {
                        setIsMonitoring(true);
                        addProgressLog('INFO', '📊 Monitoring enabled', 'Background status checks activated');
                    }, monitoringDelay);
                    
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
        
        // Periodic Vertex AI structure refresh (every 5 minutes) to catch external changes
        const vertexRefreshInterval = setInterval(() => {
            loadDocuments().catch(e => console.log('Vertex AI refresh failed:', e));
        }, 300000); // 5 minutes

        return () => {
            clearInterval(syncStatusInterval);
            clearInterval(debugInfoInterval);
            clearInterval(connectionInterval);
            clearInterval(vertexRefreshInterval);
        };
    }, [isMonitoring, isInitialized, isSyncing, fetchSyncStatus, fetchDebugInfo, testBackendConnection, loadDocuments]);

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