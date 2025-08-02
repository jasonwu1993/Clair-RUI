// Time formatting utilities - extracted from original index-original-backup.js

export const formatTimestampWithTZ = (date = new Date()) => {
    try {
        return date.toLocaleString('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
    } catch (error) {
        return new Date().toISOString();
    }
};

export const getTimezone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
        return 'UTC';
    }
};

export const formatDuration = (seconds) => {
    if (!seconds || seconds < 0) return '0s';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins > 0) {
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${secs}s`;
    }
};

export const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, unitIndex)).toFixed(1);
    
    return `${size} ${units[unitIndex]}`;
};