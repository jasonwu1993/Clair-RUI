// FilePathTree component - working without Tailwind Forms plugin
import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown } from '../ui/MockIcons.js';
import { buildFileTreeFromPaths, getFileIcon, countFilesInNode, getAllFilePathsFromNode } from '../../utils/fileUtils.js';
import { CheckSquare, MinusSquare, FolderNone, FolderSelected, FolderPartial } from '../ui/MockIcons.js';

const FilePathTree = ({ filePaths = [], selectedDocs = [], onToggleDocSelection, onSelectAll, isFileSelected, getFolderSelectionStatus, onToggleFolderSelection }) => {
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
                    className="cursor-pointer hover:bg-slate-100 p-1 rounded-md transition-all duration-200 border border-transparent hover:border-slate-300"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleFolderSelection) {
                            onToggleFolderSelection(folder);
                        }
                    }}
                    title="Click to select/deselect all files in this folder"
                >
                    <FolderNone size={16} className="text-slate-500" />
                </div>
            );
        }
        
        let status;
        try {
            status = getFolderSelectionStatus(folder);
        } catch (error) {
            console.warn('Error getting folder selection status:', error);
            status = 'none';
        }
        
        const handleClick = (e) => {
            e.stopPropagation();
            if (onToggleFolderSelection) {
                onToggleFolderSelection(folder);
            }
        };
        
        switch (status) {
            case 'all':
                return (
                    <div 
                        className="cursor-pointer hover:bg-green-50 p-1 rounded-md transition-all duration-200 border border-transparent hover:border-green-200"
                        onClick={handleClick}
                        title="All files selected - click to deselect all"
                    >
                        <FolderSelected size={16} className="text-green-600" />
                    </div>
                );
            case 'partial':
                return (
                    <div 
                        className="cursor-pointer hover:bg-orange-50 p-1 rounded-md transition-all duration-200 border border-transparent hover:border-orange-200"
                        onClick={handleClick}
                        title="Some files selected - click to select all"
                    >
                        <FolderPartial size={16} className="text-orange-600" />
                    </div>
                );
            case 'none':
            default:
                return (
                    <div 
                        className="cursor-pointer hover:bg-slate-100 p-1 rounded-md transition-all duration-200 border border-transparent hover:border-slate-300"
                        onClick={handleClick}
                        title="No files selected - click to select all"
                    >
                        <FolderNone size={16} className="text-slate-500" />
                    </div>
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
                {/* Folder row */}
                <div 
                    className="flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-50 text-sm group relative"
                    onClick={() => toggleFolder(folder.path)}
                >
                    {/* Vertical lines for structure */}
                    {depth > 0 && (
                        <div className="absolute left-0 top-0 bottom-0 flex">
                            {Array.from({ length: depth }, (_, i) => (
                                <div 
                                    key={i}
                                    className="w-4 border-l border-slate-200"
                                    style={{ marginLeft: `${i * 16}px` }}
                                />
                            ))}
                        </div>
                    )}
                    
                    {/* Indentation */}
                    <div style={{ width: `${depth * 16}px` }} />
                    
                    {/* Expand/collapse arrow */}
                    <div className="flex items-center justify-center w-4 h-4">
                        {isExpanded ? (
                            <ChevronDown size={12} className="text-slate-600" />
                        ) : (
                            <ChevronRight size={12} className="text-slate-600" />
                        )}
                    </div>
                    
                    {/* Selection indicator */}
                    <div className="flex items-center justify-center">
                        {renderFolderSelectionIndicator(folder)}
                    </div>
                    
                    {/* Folder name (no redundant folder icon) */}
                    <span className="flex-1 text-slate-700 font-medium ml-2">{folder.name}</span>
                    
                    {/* File count */}
                    <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full group-hover:bg-slate-200 transition-colors">
                        {fileCount}
                    </span>
                </div>
                
                {/* Children */}
                {isExpanded && (
                    <div className="relative">
                        {Object.values(folder.children).map(child => renderFolder(child, depth + 1))}
                        {folder.files.map(file => (
                            <div 
                                key={file.fullPath}
                                className={`flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer transition-all duration-150 group relative ${
                                    safeIsFileSelected(file.fullPath) 
                                        ? 'bg-blue-50 border border-blue-200' 
                                        : 'hover:bg-slate-50 border border-transparent'
                                }`}
                                onClick={() => onToggleDocSelection(file.fullPath)}
                            >
                                {/* Vertical lines for structure */}
                                {depth >= 0 && (
                                    <div className="absolute left-0 top-0 bottom-0 flex">
                                        {Array.from({ length: depth + 1 }, (_, i) => (
                                            <div 
                                                key={i}
                                                className="w-4 border-l border-slate-200"
                                                style={{ marginLeft: `${i * 16}px` }}
                                            />
                                        ))}
                                        {/* File connector line */}
                                        <div 
                                            className="absolute top-1/2 w-3 border-t border-slate-200"
                                            style={{ left: `${(depth + 1) * 16}px` }}
                                        />
                                    </div>
                                )}
                                
                                {/* Indentation */}
                                <div style={{ width: `${(depth + 1) * 16}px` }} />
                                
                                {/* Spacer for arrow alignment */}
                                <div className="w-4" />
                                
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={safeIsFileSelected(file.fullPath)}
                                    onChange={() => onToggleDocSelection(file.fullPath)}
                                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 focus:ring-2 flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                
                                {/* File icon */}
                                <div className="flex items-center justify-center w-4">
                                    {getFileIcon(file.extension)}
                                </div>
                                
                                {/* File name */}
                                <span className="text-sm text-slate-800 truncate flex-1 ml-2" title={file.name}>
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
                                className={`flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer transition-all duration-150 ${
                                    safeIsFileSelected(file.fullPath) 
                                        ? 'bg-blue-50 border border-blue-200' 
                                        : 'hover:bg-slate-50 border border-transparent'
                                }`}
                                onClick={() => onToggleDocSelection(file.fullPath)}
                            >
                                {/* No indentation for root files */}
                                
                                {/* Spacer for arrow alignment */}
                                <div className="w-4" />
                                
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={safeIsFileSelected(file.fullPath)}
                                    onChange={() => onToggleDocSelection(file.fullPath)}
                                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 focus:ring-2 flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                
                                {/* File icon */}
                                <div className="flex items-center justify-center w-4">
                                    {getFileIcon(file.extension)}
                                </div>
                                
                                {/* File name */}
                                <span className="text-sm text-slate-800 truncate flex-1 ml-2" title={file.name}>
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