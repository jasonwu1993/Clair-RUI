// Mock icons for testing - temporary replacement for lucide-react
import React from 'react';

const MockIcon = ({ className = "", size = 16, children, ...props }) => (
    <span 
        className={`inline-block ${className}`} 
        style={{ width: size, height: size, fontSize: size - 2 }}
        {...props}
    >
        {children}
    </span>
);

export const Bot = (props) => <MockIcon {...props}>🤖</MockIcon>;
export const User = (props) => <MockIcon {...props}>👤</MockIcon>;
export const Loader2 = (props) => <MockIcon {...props}>⏳</MockIcon>;
export const Send = (props) => <MockIcon {...props}>📤</MockIcon>;
export const AlertCircle = (props) => <MockIcon {...props}>⚠️</MockIcon>;
export const Activity = (props) => <MockIcon {...props}>📊</MockIcon>;
export const RefreshCw = (props) => <MockIcon {...props}>🔄</MockIcon>;
export const ExternalLink = (props) => <MockIcon {...props}>🔗</MockIcon>;
export const CloudDownload = (props) => <MockIcon {...props}>☁️</MockIcon>;
export const CheckCircle2 = (props) => <MockIcon {...props}>✅</MockIcon>;
export const Folder = (props) => <MockIcon {...props}>📁</MockIcon>;
export const FolderOpen = (props) => <MockIcon {...props}>📂</MockIcon>;
export const ChevronRight = (props) => <MockIcon {...props}>▶️</MockIcon>;
export const ChevronDown = (props) => <MockIcon {...props}>🔽</MockIcon>;
export const Wifi = (props) => <MockIcon {...props}>📶</MockIcon>;
export const Signal = (props) => <MockIcon {...props}>📡</MockIcon>;
export const WifiOff = (props) => <MockIcon {...props}>📵</MockIcon>;
export const AlertTriangle = (props) => <MockIcon {...props}>⚠️</MockIcon>;
export const Trash2 = (props) => <MockIcon {...props}>🗑️</MockIcon>;
export const File = (props) => <MockIcon {...props}>📄</MockIcon>;
export const FileText = (props) => <MockIcon {...props}>📝</MockIcon>;
export const Image = (props) => <MockIcon {...props}>🖼️</MockIcon>;
export const FileCode = (props) => <MockIcon {...props}>💻</MockIcon>;
export const Archive = (props) => <MockIcon {...props}>📦</MockIcon>;
export const Check = (props) => <MockIcon {...props}>✓</MockIcon>;
export const Minus = (props) => <MockIcon {...props}>−</MockIcon>;
export const Square = (props) => <MockIcon {...props}>☐</MockIcon>;
export const CheckSquare = (props) => <MockIcon {...props}>☑</MockIcon>;
export const MinusSquare = (props) => <MockIcon {...props}>⊟</MockIcon>;

// Enhanced folder selection icons
export const FolderNone = (props) => <MockIcon {...props}>📁</MockIcon>;
export const FolderSelected = (props) => <MockIcon {...props}>✅</MockIcon>;
export const FolderPartial = (props) => <MockIcon {...props}>➖</MockIcon>;