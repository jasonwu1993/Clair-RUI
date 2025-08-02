// Main application state hook - extracted from original index-original-backup.js
import { useState, useEffect, useRef } from 'react';
import { formatTimestampWithTZ, getTimezone } from '../utils/formatters.js';
import { FRONTEND_VERSION, FRONTEND_BUILD_DATE } from '../utils/constants.js';
import apiClient from '../services/apiClient.js';

export const useAppState = () => {
    // Core state management with safe defaults
    const [messages, setMessages] = useState([
        { 
            role: 'ai', 
            content: `Hello! I'm Clair Enhanced ${FRONTEND_VERSION}, your AI financial advisor powered by GPT-4o with comprehensive debugging and real-time monitoring. Current time: ${formatTimestampWithTZ()} (${getTimezone()}). I can help you understand your insurance policies, financial documents, and provide personalized financial guidance. Please sync your Google Drive folder to get started, then ask me any questions about your documents.` 
        }
    ]);
    
    const [inputQuery, setInputQuery] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [availableDocs, setAvailableDocs] = useState([]);
    const [selectedDocs, setSelectedDocs] = useState([]);
    const [apiError, setApiError] = useState('');
    const [syncStatus, setSyncStatus] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [debugInfo, setDebugInfo] = useState(null);
    const [backendStatus, setBackendStatus] = useState('unknown');
    const [connectionQuality, setConnectionQuality] = useState('unknown');
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [backendVersion, setBackendVersion] = useState(null);
    const [progressLogs, setProgressLogs] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    const chatEndRef = useRef(null);
    
    // Google Drive URL - update this with your actual folder
    const GOOGLE_DRIVE_URL = "https://drive.google.com/drive/folders/1pMiyyfk8hEoVVSsxMmRmobe6dmdm5sjI";

    // Add progress log entry
    const addProgressLog = (level, message, details = null) => {
        const logEntry = {
            timestamp: formatTimestampWithTZ(),
            level,
            message,
            details
        };
        
        setProgressLogs(prev => {
            const newLogs = [...prev, logEntry];
            // Keep only last 50 logs
            return newLogs.slice(-50);
        });
        
        console.log(`[${level}] ${formatTimestampWithTZ()}: ${message}${details ? ` - ${details}` : ''}`);
    };

    const clearProgressLogs = () => {
        setProgressLogs([]);
        addProgressLog('INFO', 'Progress logs cleared');
    };

    return {
        // State
        messages,
        setMessages,
        inputQuery,
        setInputQuery,
        isSending,
        setIsSending,
        availableDocs,
        setAvailableDocs,
        selectedDocs,
        setSelectedDocs,
        apiError,
        setApiError,
        syncStatus,
        setSyncStatus,
        isSyncing,
        setIsSyncing,
        debugInfo,
        setDebugInfo,
        backendStatus,
        setBackendStatus,
        connectionQuality,
        setConnectionQuality,
        isMonitoring,
        setIsMonitoring,
        backendVersion,
        setBackendVersion,
        progressLogs,
        setProgressLogs,
        isInitialized,
        setIsInitialized,
        
        // Refs
        chatEndRef,
        
        // Constants
        GOOGLE_DRIVE_URL,
        
        // Methods
        addProgressLog,
        clearProgressLogs
    };
};