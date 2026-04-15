const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Simple test compiler
function simpleCompile(code) {
    const lines = code.split('\n');
    const tokens = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const words = line.split(/\s+/);
        
        for (const word of words) {
            if (word === 'int' || word === 'return' || word === 'main') {
                tokens.push({ type: 'KEYWORD', value: word, line: i + 1, column: 1 });
            } else if (/^[a-zA-Z_]+$/.test(word)) {
                tokens.push({ type: 'IDENTIFIER', value: word, line: i + 1, column: 1 });
            } else if (/^[0-9]+$/.test(word)) {
                tokens.push({ type: 'NUMBER', value: word, line: i + 1, column: 1 });
            }
        }
    }
    
    return {
        success: true,
        message: 'Compilation Successful!',
        tokens: tokens,
        ast: { type: 'Program', children: [] },
        symbolTable: [],
        generatedCode: code,
        errors: []
    };
}

app.post('/api/compile', (req, res) => {
    const { code } = req.body;
    console.log('Received request'); // লগ চেক করুন
    
    if (!code) {
        return res.status(400).json({ success: false, error: 'No code provided' });
    }
    
    const result = simpleCompile(code);
    res.json(result);
});

// Serve frontend
app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Open: http://localhost:${PORT}`);
});