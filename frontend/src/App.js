import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import Editor from './components/Editor';
import Output from './components/Output';
import CompilerControls from './components/CompilerControls';

function App() {
    const [code, setCode] = useState(`#include <stdio.h>

int main() {
    int a = 10;
    int b = 20;
    int c = a + b;
    
    printf("Hello, World!\\n");
    printf("Sum: %d\\n", c);
    
    return 0;
}`);
    const [compilationResult, setCompilationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('tokens');

    const handleCompile = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:3000/api/compile', { code });
            setCompilationResult(response.data);
        } catch (error) {
            setCompilationResult({
                success: false,
                error: error.response?.data?.error || error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setCompilationResult(null);
    };

    const handleLoadExample = () => {
        setCode(`// Factorial Calculator
#include <stdio.h>

int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    int num = 5;
    int result = factorial(num);
    
    printf("Factorial of %d is %d\\n", num, result);
    
    return 0;
}`);
        setCompilationResult(null);
    };

    return (
        <div className="app">
            <header className="app-header">
                <div className="logo">
                    <span className="logo-icon">⚡</span>
                    <div>
                        <h1>Mini C Compiler</h1>
                        <p>C++ Core with Node-API | Lexical → Syntax → Semantic → Code Gen</p>
                    </div>
                </div>
            </header>

            <div className="main-container">
                <div className="editor-section">
                    <div className="section-header">
                        <h3>📝 Source Code Editor</h3>
                        <span className="char-count">{code.length} characters</span>
                    </div>
                    <Editor code={code} onChange={setCode} />
                </div>

                <CompilerControls 
                    onCompile={handleCompile}
                    onClear={handleClear}
                    onLoadExample={handleLoadExample}
                    loading={loading}
                />

                <div className="output-section">
                    <div className="section-header">
                        <h3>📊 Compilation Output</h3>
                        <div className="tabs">
                            <button 
                                className={`tab ${activeTab === 'tokens' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tokens')}
                            >
                                Tokens
                            </button>
                            <button 
                                className={`tab ${activeTab === 'ast' ? 'active' : ''}`}
                                onClick={() => setActiveTab('ast')}
                            >
                                AST
                            </button>
                            <button 
                                className={`tab ${activeTab === 'symbols' ? 'active' : ''}`}
                                onClick={() => setActiveTab('symbols')}
                            >
                                Symbol Table
                            </button>
                            <button 
                                className={`tab ${activeTab === 'code' ? 'active' : ''}`}
                                onClick={() => setActiveTab('code')}
                            >
                                Generated Code
                            </button>
                            <button 
                                className={`tab ${activeTab === 'output' ? 'active' : ''}`}
                                onClick={() => setActiveTab('output')}
                            >
                                Output
                            </button>
                        </div>
                    </div>
                    <Output 
                        result={compilationResult} 
                        activeTab={activeTab}
                        loading={loading}
                    />
                </div>
            </div>
        </div>
    );
}

export default App;