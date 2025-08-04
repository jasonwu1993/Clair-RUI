// TypingIndicator component - enhanced animated waving dots for when Clair is thinking
import React, { useState, useEffect } from 'react';

const TypingIndicator = ({ text = "Clair is thinking..." }) => {
    const [messageIndex, setMessageIndex] = useState(0);
    
    // Variety of thinking messages for Clair
    const thinkingMessages = [
        "Clair is analyzing your question...",
        "Clair is consulting her financial expertise...",
        "Clair is reviewing life insurance knowledge...",
        "Clair is preparing your personalized advice...",
        "Clair is gathering insights for you..."
    ];
    
    // Rotate through messages every 3 seconds
    useEffect(() => {
        if (text === "Clair is analyzing your question...") {
            const interval = setInterval(() => {
                setMessageIndex((prev) => (prev + 1) % thinkingMessages.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [text]);
    
    const displayText = text === "Clair is analyzing your question..." ? thinkingMessages[messageIndex] : text;
    
    return (
        <div className="flex items-center gap-3">
            {/* Enhanced waving dots animation */}
            <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce shadow-sm" 
                     style={{ animationDelay: '0ms', animationDuration: '1.4s' }}></div>
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce shadow-sm" 
                     style={{ animationDelay: '200ms', animationDuration: '1.4s' }}></div>
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce shadow-sm" 
                     style={{ animationDelay: '400ms', animationDuration: '1.4s' }}></div>
            </div>
            
            {/* Animated text with fade transition */}
            <span className="text-slate-600 text-sm font-medium transition-opacity duration-500 animate-pulse">
                {displayText}
            </span>
            
            {/* Additional visual indicator */}
            <div className="flex items-center">
                <div className="w-1 h-1 bg-slate-300 rounded-full animate-ping" 
                     style={{ animationDelay: '600ms' }}></div>
            </div>
        </div>
    );
};

export default TypingIndicator;