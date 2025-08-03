// Sidebar component - extracted from original index-original-backup.js
import React from 'react';
import { AlertCircle } from '../ui/MockIcons.js';
import Logo from '../ui/Logo.js';
import ConnectionStatus from '../ui/ConnectionStatus.js';
import ProgressLog from '../ui/ProgressLog.js';
import DebugPanel from '../sync/DebugPanel.js';
import GoogleDriveSyncPanel from '../sync/GoogleDriveSyncPanel.js';
import FilePathTree from '../sync/FilePathTree.js';
import DebugErrorBoundary from '../ui/DebugErrorBoundary.js';

const Sidebar = ({
    apiClient,
    availableDocs, 
    selectedDocs, 
    onToggleDocSelection,
    isFileSelected,
    getFolderSelectionStatus,
    onToggleFolderSelection,
    onSelectAll,
    syncStatus,
    onSyncNow,
    googleDriveUrl,
    apiError,
    isSyncing,
    debugInfo,
    onEmergencyReset,
    backendStatus,
    connectionQuality,
    onTestConnection,
    isMonitoring,
    backendVersion,
    progressLogs,
    onClearProgressLogs,
    addProgressLog
}) => {
    return (
        <aside className="w-full lg:w-1/3 xl:w-1/4 bg-slate-50 border-r border-slate-200 p-4 flex flex-col space-y-4 overflow-hidden">
            <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Logo />
                    <h1 className="text-2xl font-bold text-slate-800">Clair Enhanced</h1>
                </div>
                <p className="text-sm text-slate-600 mb-1 font-bold">随时守护您财富的智能专家</p>
                <p className="text-xs text-slate-500 font-medium">明智财富 - Production Edition</p>
                
                <ConnectionStatus 
                    apiClient={apiClient}
                    backendStatus={backendStatus}
                    connectionQuality={connectionQuality}
                    onTest={onTestConnection}
                />
            </div>
            
            {/* Debug Panel */}
            <div className="flex-shrink-0">
                <DebugErrorBoundary>
                    <DebugPanel
                        debugInfo={debugInfo}
                        syncStatus={syncStatus}
                        onEmergencyReset={onEmergencyReset}
                        isSyncing={isSyncing}
                        backendVersion={backendVersion}
                    />
                </DebugErrorBoundary>
            </div>

            {/* Progress Log */}
            <div className="flex-shrink-0">
                <ProgressLog
                    progressLogs={progressLogs}
                    isSyncing={isSyncing}
                    onClear={onClearProgressLogs}
                />
            </div>

            {/* Document Management */}
            <div className="flex-shrink-0">
                <h2 className="text-lg font-semibold text-slate-700 mb-3">Document Management</h2>
                
                <GoogleDriveSyncPanel
                    syncStatus={syncStatus}
                    onSyncNow={onSyncNow}
                    googleDriveUrl={googleDriveUrl}
                    isSyncing={isSyncing}
                    isMonitoring={isMonitoring}
                    debugInfo={debugInfo}
                    addProgressLog={addProgressLog}
                    apiClient={apiClient}
                />

                {apiError && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="break-words">{apiError}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Knowledge Base */}
            <div className="flex-1 flex flex-col min-h-0">
                <FilePathTree
                    filePaths={availableDocs}
                    selectedDocs={selectedDocs}
                    onToggleDocSelection={onToggleDocSelection}
                    isFileSelected={isFileSelected}
                    getFolderSelectionStatus={getFolderSelectionStatus}
                    onToggleFolderSelection={onToggleFolderSelection}
                    onSelectAll={onSelectAll}
                />
            </div>
        </aside>
    );
};

export default Sidebar;