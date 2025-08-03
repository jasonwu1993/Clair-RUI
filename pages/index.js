// Enhanced RAG Clair Application - Modular Version
import React from 'react';
import { Loader2 } from '../components/ui/MockIcons.js';

// Import hooks
import { 
    useAppState, 
    useConnection, 
    useSync, 
    useChat, 
    useDataFetching, 
    useAppEffects 
} from '../hooks/index.js';

// Import components
import Sidebar from '../components/layout/Sidebar.js';
import ChatArea from '../components/chat/ChatArea.js';

// Import utilities
import { FRONTEND_VERSION } from '../utils/constants.js';
import apiClient from '../services/apiClient.js';

export default function EnhancedApp() {
    // Initialize main application state
    const state = useAppState();
    
    // Initialize hooks with state dependencies
    const connectionHooks = useConnection(state);
    const dataFetchingHooks = useDataFetching(state);
    const syncHooks = useSync(state, { loadDocuments: dataFetchingHooks.loadDocuments });
    const chatHooks = useChat(state);
    
    // Combine all hooks for useAppEffects
    const allHooks = {
        ...connectionHooks,
        ...syncHooks,
        ...chatHooks,
        ...dataFetchingHooks
    };
    
    // Initialize app effects
    useAppEffects(state, allHooks);

    // Handler functions that integrate hooks with state
    const handleSendMessage = () => {
        if (!state.inputQuery.trim() || state.isSending) return;
        
        const query = state.inputQuery.trim();
        state.setInputQuery('');
        chatHooks.sendMessage(query);
    };

    const handleEmergencyReset = async () => {
        try {
            await dataFetchingHooks.handleEmergencyReset();
            
            // Reset additional state not handled by the hook
            state.setIsSyncing(false);
            state.setApiError('');
            
            // Refresh status after reset
            setTimeout(() => {
                state.addProgressLog('INFO', 'Refreshing system status...', 'Getting updated system information');
                dataFetchingHooks.fetchSyncStatus();
                dataFetchingHooks.fetchDebugInfo();
                connectionHooks.testBackendConnection();
            }, 1000);
            
        } catch (error) {
            state.addProgressLog('ERROR', 'Emergency reset failed', error.message);
            console.error('❌ Emergency reset failed:', error);
        }
    };

    // Show loading state during initialization
    if (!state.isInitialized) {
        return (
            <div className="h-screen w-screen bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-slate-600">Initializing Enhanced RAG System...</p>
                    <p className="text-xs text-slate-500 mt-2">{FRONTEND_VERSION}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-slate-100 flex flex-col lg:flex-row font-sans">
            <Sidebar
                apiClient={apiClient}
                availableDocs={state.availableDocs} 
                selectedDocs={state.selectedDocs}
                onToggleDocSelection={(path) => state.setSelectedDocs(prev => 
                    prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
                )}
                onSelectAll={state.handleSelectAll}
                syncStatus={state.syncStatus}
                onSyncNow={syncHooks.handleSyncNow}
                googleDriveUrl={state.GOOGLE_DRIVE_URL}
                apiError={state.apiError}
                isSyncing={state.isSyncing}
                debugInfo={state.debugInfo}
                onEmergencyReset={handleEmergencyReset}
                backendStatus={state.backendStatus}
                connectionQuality={state.connectionQuality}
                onTestConnection={connectionHooks.testBackendConnection}
                isMonitoring={state.isMonitoring}
                backendVersion={state.backendVersion}
                progressLogs={state.progressLogs}
                onClearProgressLogs={state.clearProgressLogs}
                addProgressLog={state.addProgressLog}
            />
            <ChatArea
                messages={state.messages} 
                isSending={state.isSending} 
                inputQuery={state.inputQuery}
                onInputChange={(e) => state.setInputQuery(e.target.value)}
                onSendMessage={handleSendMessage} 
                chatEndRef={state.chatEndRef}
                selectedDocsCount={state.selectedDocs.length}
                onFeedback={chatHooks.handleFeedback}
            />
        </div>
    );
}