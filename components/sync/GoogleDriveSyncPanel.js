// GoogleDriveSyncPanel component - minimal version
import React from 'react';
import { RefreshCw, ExternalLink, CloudDownload, CheckCircle2 } from '../ui/MockIcons.js';

const GoogleDriveSyncPanel = ({ 
    syncStatus, 
    onSyncNow, 
    googleDriveUrl, 
    isSyncing, 
    isMonitoring, 
    debugInfo 
}) => {
    const getLastSyncTime = () => {
        if (syncStatus && syncStatus.last_sync) {
            return new Date(syncStatus.last_sync).toLocaleString();
        }
        return 'Never';
    };

    const getNextAutoSyncTime = () => {
        if (syncStatus && syncStatus.next_auto_sync) {
            const nextSync = new Date(syncStatus.next_auto_sync);
            const now = new Date();
            const diffMs = nextSync - now;
            
            // If overdue, schedule next sync for 2 hours from now
            if (diffMs <= 0) {
                const nextScheduled = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from now
                return nextScheduled.toLocaleTimeString();
            }
            
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
            
            if (diffHours > 0) {
                return `${diffHours}h ${diffMins}m`;
            } else if (diffMins > 0) {
                return `${diffMins}m`;
            } else {
                return `${diffSecs}s`;
            }
        }
        
        // Default: Schedule 2 hours from now
        const defaultNext = new Date(Date.now() + (2 * 60 * 60 * 1000));
        return defaultNext.toLocaleTimeString();
    };

    const getFileCount = () => {
        if (debugInfo && debugInfo.sync_progress) {
            return debugInfo.sync_progress.files_found || 0;
        }
        return 0;
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <CloudDownload size={16} />
                    KB File Sync
                </h3>
                {isMonitoring && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
            </div>

            <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                    <span className="text-slate-600">Status:</span>
                    <span className={`font-medium ${isSyncing ? 'text-blue-600' : 'text-green-600'}`}>
                        {isSyncing ? '🔄 Syncing...' : '✅ Ready'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-600" title="Number of files discovered during Google Drive sync scan">Files Found:</span>
                    <span className="font-mono" title={getFileCount() === 0 ? "No files found - try running 'Sync Now' to scan Google Drive folder" : `${getFileCount()} files discovered in Google Drive folder`}>
                        {getFileCount()}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-600">Last Sync:</span>
                    <span className="font-mono">{getLastSyncTime()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-600">Next Auto-Sync:</span>
                    <span className="font-mono text-blue-600">{getNextAutoSyncTime()}</span>
                </div>
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={onSyncNow}
                    disabled={isSyncing}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                >
                    <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
                
                <a 
                    href={googleDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                    <ExternalLink size={12} />
                    Drive
                </a>
            </div>
        </div>
    );
};

export default GoogleDriveSyncPanel;