// Efficient selection system for large file sets
// Optimizes selection state to avoid passing hundreds of file names

export const SELECTION_MODES = {
    ALL: 'all',
    NONE: 'none', 
    PARTIAL: 'partial',
    SPECIFIC: 'specific'
};

// Create initial selection state
export const createSelectionState = () => ({
    mode: SELECTION_MODES.NONE,
    excludedFiles: [],
    includedFiles: [],
    count: 0
});

// Check if a file is selected based on selection state
export const isFileSelected = (filePath, selectionState, allFiles = []) => {
    switch (selectionState.mode) {
        case SELECTION_MODES.ALL:
            return !selectionState.excludedFiles.includes(filePath);
        case SELECTION_MODES.NONE:
            return false;
        case SELECTION_MODES.PARTIAL:
        case SELECTION_MODES.SPECIFIC:
            return selectionState.includedFiles.includes(filePath);
        default:
            return false;
    }
};

// Toggle file selection efficiently
export const toggleFileSelection = (filePath, selectionState, allFiles = []) => {
    const isCurrentlySelected = isFileSelected(filePath, selectionState, allFiles);
    const newState = { ...selectionState };
    
    if (selectionState.mode === SELECTION_MODES.ALL) {
        if (isCurrentlySelected) {
            // Remove from selection by adding to excluded
            newState.excludedFiles = [...selectionState.excludedFiles, filePath];
            newState.count = allFiles.length - newState.excludedFiles.length;
            
            // If too many exclusions, switch to specific mode
            if (newState.excludedFiles.length > allFiles.length / 2) {
                newState.mode = SELECTION_MODES.SPECIFIC;
                newState.includedFiles = allFiles.filter(f => !newState.excludedFiles.includes(f));
                newState.excludedFiles = [];
                newState.count = newState.includedFiles.length;
            }
        }
    } else if (selectionState.mode === SELECTION_MODES.NONE) {
        if (!isCurrentlySelected) {
            // Start selecting files
            newState.mode = SELECTION_MODES.SPECIFIC;
            newState.includedFiles = [filePath];
            newState.count = 1;
        }
    } else {
        // PARTIAL or SPECIFIC mode
        if (isCurrentlySelected) {
            // Remove file
            newState.includedFiles = selectionState.includedFiles.filter(f => f !== filePath);
            newState.count = newState.includedFiles.length;
            
            if (newState.count === 0) {
                newState.mode = SELECTION_MODES.NONE;
            }
        } else {
            // Add file
            newState.includedFiles = [...selectionState.includedFiles, filePath];
            newState.count = newState.includedFiles.length;
            
            // If all files are now selected, switch to ALL mode
            if (newState.count === allFiles.length) {
                newState.mode = SELECTION_MODES.ALL;
                newState.includedFiles = [];
                newState.excludedFiles = [];
            }
        }
    }
    
    return newState;
};

// Select all files efficiently
export const selectAllFiles = (allFiles = []) => ({
    mode: SELECTION_MODES.ALL,
    excludedFiles: [],
    includedFiles: [],
    count: allFiles.length
});

// Clear all selections efficiently  
export const clearAllSelections = () => ({
    mode: SELECTION_MODES.NONE,
    excludedFiles: [],
    includedFiles: [],
    count: 0
});

// Get actual selected files list (for API calls when needed)
export const getSelectedFiles = (selectionState, allFiles = []) => {
    switch (selectionState.mode) {
        case SELECTION_MODES.ALL:
            return allFiles.filter(f => !selectionState.excludedFiles.includes(f));
        case SELECTION_MODES.NONE:
            return [];
        case SELECTION_MODES.PARTIAL:
        case SELECTION_MODES.SPECIFIC:
            return selectionState.includedFiles;
        default:
            return [];
    }
};

// Check if all files are selected
export const areAllFilesSelected = (selectionState, allFiles = []) => {
    return selectionState.mode === SELECTION_MODES.ALL && 
           selectionState.excludedFiles.length === 0 &&
           allFiles.length > 0;
};

// Get selection summary for display
export const getSelectionSummary = (selectionState, allFiles = []) => {
    const total = allFiles.length;
    const selected = selectionState.count;
    
    if (selected === 0) return 'None selected';
    if (selected === total) return 'All selected';
    return `${selected} of ${total} selected`;
};

// Create selection state from file array (for backward compatibility)
export const createSelectionStateFromArray = (selectedFiles = [], allFiles = []) => {
    if (selectedFiles.length === 0) {
        return clearAllSelections();
    } else if (selectedFiles.length === allFiles.length) {
        return selectAllFiles(allFiles);
    } else {
        return {
            mode: SELECTION_MODES.SPECIFIC,
            excludedFiles: [],
            includedFiles: [...selectedFiles],
            count: selectedFiles.length
        };
    }
};

// Calculate folder selection status for visual indicators
export const getFolderSelectionStatus = (folderNode, selectionState) => {
    if (!folderNode || !selectionState) return 'none';
    
    // Collect all files within this folder (recursively)
    const allFilesInFolder = [];
    
    const collectFiles = (node) => {
        // Add direct files
        if (node.files) {
            node.files.forEach(file => allFilesInFolder.push(file.fullPath));
        }
        
        // Recursively add files from subfolders
        if (node.children) {
            Object.values(node.children).forEach(childNode => collectFiles(childNode));
        }
    };
    
    collectFiles(folderNode);
    
    if (allFilesInFolder.length === 0) return 'none';
    
    // Check selection status of all files
    const selectedCount = allFilesInFolder.filter(filePath => 
        isFileSelected(filePath, selectionState, allFilesInFolder)
    ).length;
    
    if (selectedCount === 0) return 'none';
    if (selectedCount === allFilesInFolder.length) return 'all';
    return 'partial';
};

// Get all files in a folder (recursively)
export const getAllFilesInFolder = (folderNode) => {
    const allFiles = [];
    
    const collectFiles = (node) => {
        // Add direct files
        if (node.files) {
            node.files.forEach(file => allFiles.push(file.fullPath));
        }
        
        // Recursively add files from subfolders
        if (node.children) {
            Object.values(node.children).forEach(childNode => collectFiles(childNode));
        }
    };
    
    collectFiles(folderNode);
    return allFiles;
};

// Toggle all files in a folder
export const toggleFolderSelection = (folderNode, selectionState, allFiles = []) => {
    const folderFiles = getAllFilesInFolder(folderNode);
    if (folderFiles.length === 0) return selectionState;
    
    const folderStatus = getFolderSelectionStatus(folderNode, selectionState);
    const shouldSelectAll = folderStatus !== 'all'; // If not all selected, select all; otherwise clear all
    
    let newSelectionState = { ...selectionState };
    
    // Apply the toggle to each file in the folder
    folderFiles.forEach(filePath => {
        const currentlySelected = isFileSelected(filePath, newSelectionState, allFiles);
        if (shouldSelectAll && !currentlySelected) {
            // Select this file
            newSelectionState = toggleFileSelection(filePath, newSelectionState, allFiles);
        } else if (!shouldSelectAll && currentlySelected) {
            // Deselect this file
            newSelectionState = toggleFileSelection(filePath, newSelectionState, allFiles);
        }
    });
    
    return newSelectionState;
};