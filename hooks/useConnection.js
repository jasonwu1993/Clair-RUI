// Connection testing hook - extracted from original index-original-backup.js
import { useCallback } from 'react';
import apiClient from '../services/apiClient.js';

export const useConnection = (state) => {
    const { 
        setBackendStatus, 
        setConnectionQuality, 
        setBackendVersion, 
        addProgressLog 
    } = state;

    // Enhanced connection testing
    const testBackendConnection = useCallback(async () => {
        try {
            setBackendStatus('testing');
            const startTime = Date.now();
            
            addProgressLog('INFO', 'Testing backend connection...');
            
            const healthData = await apiClient.healthCheck();
            const responseTime = Date.now() - startTime;
            
            // Extract backend version
            if (healthData && healthData.version) {
                setBackendVersion(healthData.version);
            }
            
            if (healthData && healthData.status === 'healthy') {
                setBackendStatus('connected');
                
                // Assess connection quality based on response time
                let quality = 'excellent';
                if (responseTime >= 1000) quality = 'good';
                if (responseTime >= 3000) quality = 'fair';
                if (responseTime >= 5000) quality = 'poor';
                setConnectionQuality(quality);
                
                addProgressLog('SUCCESS', `Backend connection successful (${responseTime}ms)`, `Quality: ${quality}, Version: ${healthData.version || 'unknown'}`);
                console.log(`✅ Backend connection successful (${responseTime}ms)`);
            } else {
                setBackendStatus('degraded');
                setConnectionQuality('poor');
                addProgressLog('WARN', 'Backend returned degraded status', JSON.stringify(healthData));
                console.log('⚠️ Backend returned degraded status');
            }
        } catch (error) {
            setBackendStatus('disconnected');
            setConnectionQuality('failed');
            addProgressLog('ERROR', 'Backend connection failed', error.message);
            console.log('❌ Backend connection failed:', error.message);
        }
    }, [setBackendStatus, setConnectionQuality, setBackendVersion, addProgressLog]);

    return {
        testBackendConnection
    };
};