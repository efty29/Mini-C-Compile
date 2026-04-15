import React from 'react';
import './CompilerControls.css';

function CompilerControls({ onCompile, onClear, onLoadExample, loading }) {
    return (
        <div className="controls-container">
            <button 
                className="btn btn-primary" 
                onClick={onCompile}
                disabled={loading}
            >
                {loading ? '⏳ Compiling...' : '🚀 Compile'}
            </button>
            <button className="btn btn-secondary" onClick={onClear}>
                🗑️ Clear Output
            </button>
            <button className="btn btn-secondary" onClick={onLoadExample}>
                📋 Load Example
            </button>
        </div>
    );
}

export default CompilerControls;