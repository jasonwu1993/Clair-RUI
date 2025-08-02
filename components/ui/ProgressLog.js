// ProgressLog component - extracted from original index-original-backup.js
import React, { useRef, useEffect } from 'react';
import { Activity } from './MockIcons.js';

const ProgressLog = ({ progressLogs = [], isSyncing, onClear }) => {
    const logEndRef = useRef(null);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [progressLogs]);

    const getLogColor = (level) => {
        switch (level) {
            case 'SUCCESS': return 'text-green-700 bg-green-50 border-green-200';
            case 'ERROR': return 'text-red-700 bg-red-50 border-red-200';
            case 'WARN': return 'text-orange-700 bg-orange-50 border-orange-200';
            case 'INFO': return 'text-blue-700 bg-blue-50 border-blue-200';
            case 'DEBUG': return 'text-purple-700 bg-purple-50 border-purple-200';
            default: return 'text-slate-700 bg-slate-50 border-slate-200';
        }
    };

    const getLogIcon = (level) => {
        switch (level) {
            case 'SUCCESS': return '✅';
            case 'ERROR': return '❌';
            case 'WARN': return '⚠️';
            case 'INFO': return 'ℹ️';
            case 'DEBUG': return '🔧';
            default: return '📝';
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-900 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Activity size={14} />
                    Progress Log
                    {isSyncing && (
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300">
                        {progressLogs.length} entries
                    </span>
                    {progressLogs.length > 0 && (
                        <button
                            onClick={onClear}
                            className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
                {progressLogs.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">
                        No progress logs yet. Start a sync to see detailed progress.
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {progressLogs.map((log, index) => (
                            <div key={index} className={`text-xs p-2 rounded border ${getLogColor(log.level)}`}>
                                <div className="flex items-start gap-2">
                                    <span className="flex-shrink-0">{getLogIcon(log.level)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-mono text-xs opacity-75 mb-1">
                                            {log.timestamp}
                                        </div>
                                        <div className="break-words">
                                            {log.message}
                                        </div>
                                        {log.details && (
                                            <div className="mt-1 text-xs opacity-75 font-mono">
                                                {log.details}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressLog;