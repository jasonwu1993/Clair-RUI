// FilePathTree component - minimal version
import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown } from '../ui/MockIcons.js';
import { buildFileTreeFromPaths, getFileIcon, countFilesInNode } from '../../utils/fileUtils.js';

const FilePathTree = ({ filePaths = [], selectedDocs = [], onToggleDocSelection, onSelectAll }) => {
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    
    const fileTree = buildFileTreeFromPaths(filePaths);

    useEffect(() => {
        if (Object.keys(fileTree.children).length > 0) {
            const rootFolders = Object.keys(fileTree.children);
            setExpandedFolders(new Set(rootFolders));
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
                                className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-slate-100 text-sm"
                                style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}
                                onClick={() => onToggleDocSelection(file.fullPath)}
                            >
                                <input 
                                    type="checkbox"
                                    checked={selectedDocs.includes(file.fullPath)}
                                    onChange={() => onToggleDocSelection(file.fullPath)}
                                    className="rounded"
                                />
                                {getFileIcon(file.extension)}
                                <span className="flex-1 text-slate-700 text-xs">{file.name}</span>
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
                <h3 className="text-sm font-semibold text-white">Knowledge Base</h3>
                <button 
                    onClick={onSelectAll}
                    className="text-xs text-slate-300 hover:text-white"
                >
                    Select All
                </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto p-2">
                {Object.keys(fileTree.children).length > 0 || fileTree.files.length > 0 ? (
                    <div className="space-y-1">
                        {Object.values(fileTree.children).map(folder => renderFolder(folder))}
                        {fileTree.files.map(file => (
                            <div 
                                key={file.fullPath}
                                className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-slate-100 text-sm"
                                onClick={() => onToggleDocSelection(file.fullPath)}
                            >
                                <input 
                                    type="checkbox"
                                    checked={selectedDocs.includes(file.fullPath)}
                                    onChange={() => onToggleDocSelection(file.fullPath)}
                                    className="rounded"
                                />
                                {getFileIcon(file.extension)}
                                <span className="flex-1 text-slate-700 text-xs">{file.name}</span>
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