// FilePathTree component - working without Tailwind Forms plugin
import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown } from '../ui/MockIcons.js';
import { buildFileTreeFromPaths, getFileIcon, countFilesInNode, getAllFilePathsFromNode } from '../../utils/fileUtils.js';
import { Check, Minus } from '../ui/MockIcons.js';

const FilePathTree = ({ filePaths = [], selectedDocs = [], onToggleDocSelection, onSelectAll, isFileSelected, getFolderSelectionStatus }) => {
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [isInitialized, setIsInitialized] = useState(true); // Start as initialized to debug
    
    const fileTree = buildFileTreeFromPaths(filePaths);
    
    // Calculate total counts
    const totalFiles = countFilesInNode(fileTree);
    const totalFolders = Object.keys(fileTree.children).length;
    
    // Calculate if all files are selected for proper Select All / Clear All display
    const allFilePaths = filePaths.filter(path => path && path.includes('.') && !path.endsWith('/'));
    
    // Helper function to safely check if file is selected
    const safeIsFileSelected = (path) => {
        if (isFileSelected && typeof isFileSelected === 'function') {
            try {
                return isFileSelected(path);
            } catch (error) {
                console.warn('Error checking file selection:', error);
                return selectedDocs.includes(path);
            }
        }
        return selectedDocs.includes(path);
    };
    
    const allSelected = allFilePaths.length > 0 && allFilePaths.every(safeIsFileSelected);
    
    // Calculate selection summary
    const selectedCount = allFilePaths.filter(safeIsFileSelected).length;
    
    // Render folder selection indicator
    const renderFolderSelectionIndicator = (folder) => {
        if (!getFolderSelectionStatus || typeof getFolderSelectionStatus !== 'function') {
            return (
                <div 
                    style={{
                        width: '12px',
                        height: '12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        backgroundColor: 'transparent'
                    }}
                />
            );
        }
        
        let status;
        try {
            status = getFolderSelectionStatus(folder);
        } catch (error) {
            console.warn('Error getting folder selection status:', error);
            status = 'none';
        }
        const size = 12;
        
        switch (status) {
            case 'all':
                return (
                    <div 
                        className="flex items-center justify-center rounded" 
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            backgroundColor: '#2563eb',
                            color: 'white'
                        }}
                    >
                        <Check size={size - 2} />
                    </div>
                );
            case 'partial':
                return (
                    <div 
                        className="flex items-center justify-center rounded" 
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            backgroundColor: '#6b7280',
                            color: 'white'
                        }}
                    >
                        <Minus size={size - 2} />
                    </div>
                );
            case 'none':
            default:
                return (
                    <div 
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            border: '1px solid #cbd5e1',
                            borderRadius: '2px',
                            backgroundColor: 'transparent'
                        }}
                    />
                );
        }
    };

    useEffect(() => {
        if (Object.keys(fileTree.children).length > 0) {
            const rootFolders = Object.keys(fileTree.children);
            setExpandedFolders(new Set(rootFolders));
            // Stabilize the component after initial load
            setTimeout(() => setIsInitialized(true), 100);
        }
    }, [filePaths]);

    const toggleFolder = (folderPath) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(folderPath)) {
                newSet.delete(folderPath);
            } else {
                newSet.add(folderPath);
            }
            return newSet;
        });
    };

    const renderFolder = (folder, depth = 0) => {
        const isExpanded = expandedFolders.has(folder.path);
        const fileCount = countFilesInNode(folder);
        
        return (
            <div key={folder.path}>
                <div 
                    className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-slate-100 text-sm"
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    onClick={() => toggleFolder(folder.path)}
                >
                    {isExpanded ? (
                        <ChevronDown size={14} className="text-slate-500" />
                    ) : (
                        <ChevronRight size={14} className="text-slate-500" />
                    )}
                    {renderFolderSelectionIndicator(folder)}
                    {isExpanded ? (
                        <FolderOpen size={16} className="text-yellow-600" />
                    ) : (
                        <Folder size={16} className="text-yellow-600" />
                    )}
                    <span className="flex-1 text-slate-700">{folder.name}</span>
                    <span className="text-xs text-slate-500">({fileCount})</span>
                </div>
                
                {isExpanded && (
                    <div>
                        {Object.values(folder.children).map(child => renderFolder(child, depth + 1))}
                        {folder.files.map(file => (
                            <div 
                                key={file.fullPath}
                                className="flex items-center gap-2 py-1.5 px-2 rounded group cursor-pointer transition-all duration-150"
                                style={{
                                    backgroundColor: safeIsFileSelected(file.fullPath) ? '#eff6ff' : 'transparent',
                                    border: safeIsFileSelected(file.fullPath) ? '1px solid #bfdbfe' : '1px solid transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    paddingLeft: `${(depth + 1) * 16 + 24}px`
                                }}
                                onMouseEnter={(e) => {
                                    if (!safeIsFileSelected(file.fullPath)) {
                                        e.target.style.backgroundColor = '#f8fafc';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!safeIsFileSelected(file.fullPath)) {
                                        e.target.style.backgroundColor = 'transparent';
                                    }
                                }}
                                onClick={() => onToggleDocSelection(file.fullPath)}
                            >
                                <input
                                    type="checkbox"
                                    checked={safeIsFileSelected(file.fullPath)}
                                    onChange={() => onToggleDocSelection(file.fullPath)}
                                    style={{
                                        width: '14px',
                                        height: '14px',
                                        accentColor: '#2563eb',
                                        cursor: 'pointer',
                                        borderRadius: '3px',
                                        border: '1px solid #cbd5e1',
                                        flexShrink: 0
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {getFileIcon(file.extension)}
                                <span className="text-sm text-slate-800 truncate flex-1" title={file.name}>
                                    {file.name}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-900 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-white">
                        Knowledge Base ({totalFiles} files, {totalFolders} folders)
                    </h3>
                    <p className="text-xs text-slate-300">
                        {selectedCount} of {totalFiles} files selected
                    </p>
                </div>
                <button 
                    onClick={() => {
                        console.log('Clear All clicked, allSelected:', allSelected, 'allFilePaths:', allFilePaths, 'selectedDocs:', selectedDocs);
                        onSelectAll();
                    }}
                    className="text-xs text-slate-300 hover:text-white hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                >
                    {allSelected ? 'Clear All' : 'Select All'}
                </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto p-2">
                {Object.keys(fileTree.children).length > 0 || fileTree.files.length > 0 ? (
                    <div className="space-y-1">
                        {Object.values(fileTree.children).map(folder => renderFolder(folder))}
                        {fileTree.files.map(file => (
                            <div 
                                key={file.fullPath}
                                className="flex items-center gap-2 py-1.5 px-2 rounded group cursor-pointer transition-all duration-150"
                                style={{
                                    backgroundColor: safeIsFileSelected(file.fullPath) ? '#eff6ff' : 'transparent',
                                    border: safeIsFileSelected(file.fullPath) ? '1px solid #bfdbfe' : '1px solid transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => {
                                    if (!safeIsFileSelected(file.fullPath)) {
                                        e.target.style.backgroundColor = '#f8fafc';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!safeIsFileSelected(file.fullPath)) {
                                        e.target.style.backgroundColor = 'transparent';
                                    }
                                }}
                                onClick={() => onToggleDocSelection(file.fullPath)}
                            >
                                <input
                                    type="checkbox"
                                    checked={safeIsFileSelected(file.fullPath)}
                                    onChange={() => onToggleDocSelection(file.fullPath)}
                                    style={{
                                        width: '14px',
                                        height: '14px',
                                        accentColor: '#2563eb',
                                        cursor: 'pointer',
                                        borderRadius: '3px',
                                        border: '1px solid #cbd5e1',
                                        flexShrink: 0
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {getFileIcon(file.extension)}
                                <span className="text-sm text-slate-800 truncate flex-1" title={file.name}>
                                    {file.name}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 text-center text-slate-500 text-sm">
                        No documents available. Click "Sync Now" to load documents from Google Drive.
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilePathTree;