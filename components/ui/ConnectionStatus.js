// ConnectionStatus component - extracted from original index-original-backup.js
import React, { useState, useEffect } from 'react';
import { Wifi, Signal, WifiOff, Loader2, AlertTriangle } from './MockIcons.js';

const ConnectionStatus = ({ apiClient, backendStatus, connectionQuality, onTest }) => {
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
        if (apiClient && typeof apiClient.getMetrics === 'function') {
            const updateMetrics = () => {
                try {
                    setMetrics(apiClient.getMetrics());
                } catch (error) {
                    console.warn('Error getting metrics:', error);
                }
            };
            updateMetrics();
            const interval = setInterval(updateMetrics, 5000);
            return () => clearInterval(interval);
        }
    }, [apiClient]);

    const getStatusColor = () => {
        switch (backendStatus) {
            case 'connected': 
                switch (connectionQuality) {
                    case 'excellent': return 'text-green-600';
                    case 'good': return 'text-green-500';
                    case 'fair': return 'text-yellow-600';
                    case 'poor': return 'text-orange-600';
                    default: return 'text-green-600';
                }
            case 'degraded': return 'text-orange-600';
            case 'disconnected': return 'text-red-600';
            case 'testing': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    };
    
    const getStatusIcon = () => {
        switch (backendStatus) {
            case 'connected': return <Wifi className="w-3 h-3" />;
            case 'degraded': return <Signal className="w-3 h-3" />;
            case 'disconnected': return <WifiOff className="w-3 h-3" />;
            case 'testing': return <Loader2 className="w-3 h-3 animate-spin" />;
            default: return <AlertTriangle className="w-3 h-3" />;
        }
    };
    
    const getStatusText = () => {
        if (backendStatus === 'connected') {
            const qualityEmoji = {
                'excellent': '🟢',
                'good': '🟡',
                'fair': '🟠',
                'poor': '🔴'
            };
            return `${qualityEmoji[connectionQuality] || '🟢'} Connected`;
        } else if (backendStatus === 'degraded') {
            return '⚠️ Degraded';
        } else if (backendStatus === 'disconnected') {
            return '❌ Disconnected';
        } else if (backendStatus === 'testing') {
            return '🔄 Testing...';
        } else {
            return '❓ Unknown';
        }
    };

    const handleTest = async () => {
        setIsTestingConnection(true);
        try {
            if (onTest && typeof onTest === 'function') {
                await onTest();
            }
        } catch (error) {
            console.warn('Test connection error:', error);
        } finally {
            setIsTestingConnection(false);
        }
    };

    return (
        <div className="mt-2 space-y-2">
            <div className="flex items-center justify-center gap-2">
                <span className={`text-xs font-medium flex items-center gap-1 ${getStatusColor()}`}>
                    {getStatusIcon()}
                    {getStatusText()}
                </span>
                <button 
                    onClick={handleTest}
                    className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                    disabled={isTestingConnection || backendStatus === 'testing'}
                >
                    {isTestingConnection ? 'Testing...' : 'Test'}
                </button>
            </div>
            
            {/* Connection Metrics */}
            {metrics && (
                <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between">
                        <span>Requests:</span>
                        <span>{metrics.totalRequests || 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <span className={(metrics.successRate || 0) >= 90 ? 'text-green-600' : (metrics.successRate || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                            {metrics.successRate || 0}%
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Avg Response:</span>
                        <span className={(metrics.avgResponseTime || 0) < 2000 ? 'text-green-600' : (metrics.avgResponseTime || 0) < 5000 ? 'text-yellow-600' : 'text-red-600'}>
                            {metrics.avgResponseTime || 0}ms
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConnectionStatus;