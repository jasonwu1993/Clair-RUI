// File utilities - extracted from original index-original-backup.js
import React from 'react';
import { File, FileText, Image, Archive, FileCode } from '../components/ui/MockIcons.js';

export const buildFileTreeFromPaths = (filePaths = []) => {
    console.log('Building file tree from paths:', filePaths);
    const tree = { name: 'root', children: {}, files: [], isFolder: true, path: '', fullPath: '' };
    
    if (!Array.isArray(filePaths)) {
        console.error('filePaths is not an array:', filePaths);
        return tree;
    }
    
    filePaths.forEach(filePath => {
        if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
            console.warn('Invalid file path skipped:', filePath);
            return;
        }
        
        const parts = filePath.split('/').filter(part => part.trim() !== '');
        let currentNode = tree;
        let currentPath = '';
        
        parts.forEach((part, index) => {
            const isLastPart = index === parts.length - 1;
            const isFile = isLastPart && part.includes('.');
            
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            
            if (isFile) {
                currentNode.files.push({
                    name: part,
                    path: currentPath,
                    fullPath: filePath,
                    isFile: true,
                    extension: part.split('.').pop()?.toLowerCase() || ''
                });
            } else {
                if (!currentNode.children[part]) {
                    currentNode.children[part] = {
                        name: part,
                        children: {},
                        files: [],
                        isFolder: true,
                        path: currentPath,
                        fullPath: currentPath
                    };
                }
                currentNode = currentNode.children[part];
            }
        });
    });
    
    console.log('Built file tree:', tree);
    return tree;
};

export const getFileIcon = (extension) => {
    if (!extension) return <File className="h-4 w-4 text-slate-500" />;
    
    switch (extension) {
        case 'pdf':
            return <FileText className="h-4 w-4 text-red-500" />;
        case 'doc':
        case 'docx':
            return <FileText className="h-4 w-4 text-blue-500" />;
        case 'txt':
            return <FileText className="h-4 w-4 text-gray-500" />;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp':
            return <Image className="h-4 w-4 text-green-500" />;
        case 'zip':
        case 'rar':
        case '7z':
            return <Archive className="h-4 w-4 text-purple-500" />;
        case 'js':
        case 'py':
        case 'html':
        case 'css':
        case 'json':
            return <FileCode className="h-4 w-4 text-orange-500" />;
        case 'xlsx':
        case 'xls':
        case 'csv':
            return <FileText className="h-4 w-4 text-green-600" />;
        default:
            return <File className="h-4 w-4 text-slate-500" />;
    }
};

export const countFilesInNode = (node) => {
    if (!node || !node.files) return 0;
    let count = node.files.length;
    if (node.children) {
        Object.values(node.children).forEach(child => {
            count += countFilesInNode(child);
        });
    }
    return count;
};

export const getAllFilePathsFromNode = (node) => {
    if (!node || !node.files) return [];
    let paths = node.files.map(file => file.fullPath || '').filter(Boolean);
    if (node.children) {
        Object.values(node.children).forEach(child => {
            paths = paths.concat(getAllFilePathsFromNode(child));
        });
    }
    return paths;
};

export const renderTextWithLinks = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <a 
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};