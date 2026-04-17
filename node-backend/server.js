const express = require('express');
const cors = require('cors');
const path = require('path');
const JavaScriptCompiler = require('./compiler-sim');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));

// Compile endpoint
app.post('/api/compile', (req, res) => {
    const { code } = req.body;
    
    if (!code) {
        return res.status(400).json({
            success: false,
            error: 'No code provided'
        });
    }
    
    try {
        const compiler = new JavaScriptCompiler();
        const result = compiler.compile(code);
        res.json(result);
    } catch (error) {
        console.error('Compilation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get compiler info
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Mini C Compiler - Full Version',
        version: '2.0.0',
        stages: ['Preprocessing', 'Lexical Analysis', 'Syntax Analysis', 'Semantic Analysis', 'Code Generation'],
        features: ['Functions', 'If-Else', 'Loops (for, while, do-while)', 'Variables', 'Arrays', 'Pointers', 'Structs'],
        core: 'JavaScript - Full C Compiler'
    });
});

// Serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`✅ Full C Compiler Ready!`);
    console.log(`📝 Supports: Functions, Loops, If-Else, Variables, Arrays, Pointers`);
});
