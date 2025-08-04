// DebugPanel component - minimal version for now
import React, { useState, useEffect } from 'react';
import { Activity, Loader2, Trash2 } from '../ui/MockIcons.js';
import { formatTimestampWithTZ, formatDuration } from '../../utils/formatters.js';

const DebugPanel = ({ debugInfo, syncStatus, onEmergencyReset, onCleanupVertexAI, isSyncing, backendVersion }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [syncStartTime, setSyncStartTime] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    useEffect(() => {
        if (isSyncing && !syncStartTime) {
            setSyncStartTime(Date.now());
        } else if (!isSyncing && syncStartTime) {
            setSyncStartTime(null);
        }
    }, [isSyncing, syncStartTime]);

    useEffect(() => {
        if (debugInfo) {
            setLastUpdate(Date.now());
        }
    }, [debugInfo]);

    const getSyncDuration = () => {
        if (!syncStartTime) return 0;
        return Math.floor((Date.now() - syncStartTime) / 1000);
    };

    const getUpdateStatus = () => {
        if (!lastUpdate) return '❓ No data';
        const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000);
        if (secondsAgo < 3) return '🟢 Live';
        if (secondsAgo < 10) return '🟡 Recent'; 
        if (secondsAgo < 30) return '🟠 Stale';
        return '🔴 Old (>30s)';
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-900 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Activity size={14} />
                    System Monitor
                    {isSyncing && (
                        <div className="flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin text-blue-400" />
                            <span className="text-xs text-blue-400">{formatDuration(getSyncDuration())}</span>
                        </div>
                    )}
                </h3>
                <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-slate-300 hover:text-white"
                >
                    {showDetails ? 'Hide' : 'Show'}
                </button>
            </div>
            
            <div className="p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Status:</span>
                    <span className="font-mono">{getUpdateStatus()}</span>
                </div>
                
                {backendVersion && (
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Backend:</span>
                        <span className="font-mono">{backendVersion}</span>
                    </div>
                )}

                {/* Admin Actions - always visible */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="text-xs text-slate-600 font-medium mb-2">Admin Actions</div>
                    <button 
                        onClick={onCleanupVertexAI}
                        className="w-full text-xs bg-orange-600 text-white px-3 py-2 rounded hover:bg-orange-700 transition-colors flex items-center justify-center gap-1"
                        title="SMART CLEANUP: Dynamically detects and removes any ghost/orphaned documents from Vertex AI index by comparing with current Google Drive files. Only removes confirmed ghosts, preserves all legitimate documents."
                    >
                        <Activity size={12} />
                        Remove Ghost Files Only
                    </button>
                    <button 
                        onClick={onEmergencyReset}
                        className="w-full text-xs bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                        title="Emergency Reset: Clears only app state and session data, then reloads file structure from Vertex AI with auto-selection. Does NOT delete any knowledge base content."
                    >
                        <Trash2 size={12} />
                        Emergency Reset
                    </button>
                </div>

                {showDetails && debugInfo && (
                    <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">AI Model:</span>
                            <span className="font-mono text-blue-600">GPT-4o</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600" title="Files discovered during sync operation">Files Found:</span>
                            <span className="font-mono" title={(debugInfo.sync_progress?.files_found || 0) === 0 ? "No files found during sync - check Google Drive folder permissions" : `${debugInfo.sync_progress?.files_found || 0} files discovered during sync operation`}>
                                {debugInfo.sync_progress?.files_found || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">API Calls:</span>
                            <span className="font-mono">{debugInfo.sync_progress?.api_calls || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">Operation:</span>
                            <span className="font-mono text-blue-600">
                                {debugInfo.sync_progress?.current_operation || 'monitoring'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DebugPanel;