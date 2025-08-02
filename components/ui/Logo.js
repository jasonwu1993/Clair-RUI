// Logo component - extracted from original index-original-backup.js
import React from 'react';

const Logo = () => (
    <div className="w-8 h-8 flex items-center justify-center">
        <svg 
            width="32" 
            height="32" 
            viewBox="0 0 1024 1024" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
        >
            <defs>
                <radialGradient id="outerGrad" cx="30%" cy="30%">
                    <stop offset="0%" stopColor="#FDE047"/>
                    <stop offset="100%" stopColor="#F97316"/>
                </radialGradient>
                <radialGradient id="innerGrad" cx="30%" cy="30%">
                    <stop offset="0%" stopColor="#FEF3C7"/>
                    <stop offset="100%" stopColor="#FB923C"/>
                </radialGradient>
                <filter id="logoShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25"/>
                </filter>
            </defs>
            <circle cx="512" cy="512" r="512" fill="url(#outerGrad)" filter="url(#logoShadow)"/>
            <circle cx="512" cy="512" r="384" fill="url(#innerGrad)"/>
            <circle cx="512" cy="512" r="192" fill="white"/>
        </svg>
    </div>
);

export default Logo;