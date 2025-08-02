// DebugErrorBoundary component - extracted from original index-original-backup.js
import React from 'react';

class DebugErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
                    <h3 className="font-semibold mb-1">Debug Panel Error</h3>
                    <p className="text-xs">Component failed to render. Check console for details.</p>
                    <button 
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-2 text-xs underline"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default DebugErrorBoundary;