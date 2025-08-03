// Main application state hook - extracted from original index-original-backup.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { formatTimestampWithTZ, getTimezone } from '../utils/formatters.js';
import { FRONTEND_VERSION, FRONTEND_BUILD_DATE } from '../utils/constants.js';
import apiClient from '../services/apiClient.js';
import { 
    createSelectionState, 
    selectAllFiles, 
    clearAllSelections, 
    toggleFileSelection,
    areAllFilesSelected,
    getSelectedFiles,
    isFileSelected,
    getFolderSelectionStatus,
    createSelectionStateFromArray,
    toggleFolderSelection
} from '../utils/selectionUtils.js';

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
    const [selectionState, setSelectionState] = useState(createSelectionState());
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

    // Add progress log entry - wrapped in useCallback for stability
    const addProgressLog = useCallback((level, message, details = null) => {
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
    }, []);

    const clearProgressLogs = useCallback(() => {
        setProgressLogs([]);
        addProgressLog('INFO', 'Progress logs cleared');
    }, [addProgressLog]);

    // Handle select all / clear all functionality - EFFICIENT for large file sets
    const handleSelectAll = useCallback(() => {
        const allFiles = availableDocs.filter(p => p && p.includes('.') && !p.endsWith('/'));
        const isAllSelected = areAllFilesSelected(selectionState, allFiles);
        
        const newSelectionState = isAllSelected 
            ? clearAllSelections() 
            : selectAllFiles(allFiles);
            
        console.log('Efficient selection toggle:', {
            allFilesCount: allFiles.length,
            wasAllSelected: isAllSelected,
            newState: newSelectionState
        });
        
        setSelectionState(newSelectionState);
        
        // Mark that user has manually interacted with selections
        sessionStorage.setItem('manualSelectionMade', 'true');
        
        addProgressLog('INFO', 
            newSelectionState.count === 0 
                ? 'Deselected all documents' 
                : `Selected ${newSelectionState.count} documents`, 
            'Document selection updated efficiently'
        );
    }, [availableDocs, selectionState, addProgressLog]);

    // Helper to get individual file selection toggle handler
    const handleToggleDocSelection = useCallback((filePath) => {
        const allFiles = availableDocs.filter(p => p && p.includes('.') && !p.endsWith('/'));
        const newSelectionState = toggleFileSelection(filePath, selectionState, allFiles);
        
        console.log('Toggle file selection:', {
            file: filePath,
            oldState: selectionState,
            newState: newSelectionState
        });
        
        setSelectionState(newSelectionState);
        sessionStorage.setItem('manualSelectionMade', 'true');
    }, [availableDocs, selectionState]);

    // Helper to toggle all files in a folder
    const handleToggleFolderSelection = useCallback((folderNode) => {
        const allFiles = availableDocs.filter(p => p && p.includes('.') && !p.endsWith('/'));
        const newSelectionState = toggleFolderSelection(folderNode, selectionState, allFiles);
        
        console.log('Toggle folder selection:', {
            folder: folderNode.path,
            oldState: selectionState,
            newState: newSelectionState
        });
        
        setSelectionState(newSelectionState);
        sessionStorage.setItem('manualSelectionMade', 'true');
        
        addProgressLog('INFO', 
            `Toggled selection for folder: ${folderNode.name}`,
            'Folder files selection updated'
        );
    }, [availableDocs, selectionState, addProgressLog]);

    // Backward compatibility: get actual selected docs array when needed
    const selectedDocs = getSelectedFiles(selectionState, availableDocs.filter(p => p && p.includes('.') && !p.endsWith('/')));

    // Backward compatibility helper for setSelectedDocs (converts array back to selectionState)
    const setSelectedDocs = useCallback((newSelectedArray) => {
        const allFiles = availableDocs.filter(p => p && p.includes('.') && !p.endsWith('/'));
        if (Array.isArray(newSelectedArray)) {
            const newSelectionState = createSelectionStateFromArray(newSelectedArray, allFiles);
            setSelectionState(newSelectionState);
            console.log('setSelectedDocs called:', {
                inputArray: newSelectedArray,
                allFiles,
                newState: newSelectionState
            });
        }
    }, [availableDocs]);

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
        clearProgressLogs,
        handleSelectAll,
        handleToggleDocSelection,
        handleToggleFolderSelection,
        
        // Selection utilities for advanced use cases
        selectionState,
        isFileSelected: (filePath) => isFileSelected(filePath, selectionState),
        getFolderSelectionStatus: (folderNode) => getFolderSelectionStatus(folderNode, selectionState)
    };
};