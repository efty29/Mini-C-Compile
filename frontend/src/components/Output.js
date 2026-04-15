import React from 'react';
import './Output.css';

function Output({ result, activeTab, loading }) {
    if (loading) {
        return (
            <div className="output-container">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Compiling your code...</p>
                </div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="output-container">
                <div className="placeholder">
                    <p>👈 Write some C code and click "Compile"</p>
                    <p className="hint">Try loading the example code!</p>
                </div>
            </div>
        );
    }

    const renderTokens = () => {
        if (!result.tokens || result.tokens.length === 0) {
            return <p>No tokens generated.</p>;
        }
        
        return (
            <table className="output-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Line</th>
                        <th>Column</th>
                    </tr>
                </thead>
                <tbody>
                    {result.tokens.map((token, idx) => (
                        <tr key={idx}>
                            <td><span className={`token-type ${token.type.toLowerCase()}`}>{token.type}</span></td>
                            <td><code>{token.value}</code></td>
                            <td>{token.line}</td>
                            <td>{token.column}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const renderAST = () => {
        if (!result.ast) {
            return <p>No AST generated.</p>;
        }
        
        return (
            <div className="ast-viewer">
                <pre className="ast-tree">{JSON.stringify(result.ast, null, 2)}</pre>
            </div>
        );
    };

    const renderSymbolTable = () => {
        if (!result.symbolTable || result.symbolTable.length === 0) {
            return <p>No symbols in table.</p>;
        }
        
        return (
            <table className="output-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Scope</th>
                        <th>Initialized</th>
                    </tr>
                </thead>
                <tbody>
                    {result.symbolTable.map((symbol, idx) => (
                        <tr key={idx}>
                            <td><strong>{symbol.name}</strong></td>
                            <td>{symbol.type}</td>
                            <td>{symbol.scope}</td>
                            <td>{symbol.initialized ? '✓' : '✗'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const renderGeneratedCode = () => {
        if (!result.generatedCode) {
            return <p>No code generated.</p>;
        }
        
        return (
            <pre className="generated-code">{result.generatedCode}</pre>
        );
    };

    const renderOutput = () => {
        if (!result.success) {
            return (
                <div className="error-message">
                    <h4>❌ Compilation Failed</h4>
                    <p>{result.message || result.error}</p>
                    {result.errors && result.errors.length > 0 && (
                        <div className="error-list">
                            <h5>Errors:</h5>
                            <ul>
                                {result.errors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }
        
        return (
            <div className="success-message">
                <h4>✅ {result.message}</h4>
                <p>Compilation completed successfully!</p>
            </div>
        );
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'tokens': return renderTokens();
            case 'ast': return renderAST();
            case 'symbols': return renderSymbolTable();
            case 'code': return renderGeneratedCode();
            case 'output': return renderOutput();
            default: return renderOutput();
        }
    };

    return (
        <div className="output-container">
            {renderContent()}
        </div>
    );
}

export default Output;