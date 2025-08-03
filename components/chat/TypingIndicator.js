// TypingIndicator component - animated waving dots for when Clair is thinking
import React from 'react';

const TypingIndicator = ({ text = "Clair is thinking..." }) => (
    <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="text-slate-600 text-sm">{text}</span>
    </div>
);

export default TypingIndicator;