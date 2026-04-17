class JavaScriptCompiler {
    compile(sourceCode) {
        const tokens = [];
        const symbolTable = [];
        
        // ============ 1. TOKEN GENERATION ============
        // ============ TOKEN GENERATION ============
let i = 0;
let line = 1;
let col = 1;

const keywords = ['int', 'float', 'char', 'double', 'void', 'if', 'else', 'while', 'for', 'return', 'main', 'printf', 'scanf'];

while (i < sourceCode.length) {
    const ch = sourceCode[i];
    
    if (ch === ' ' || ch === '\t') { i++; col++; continue; }
    if (ch === '\n') { line++; col = 1; i++; continue; }
    if (ch === '\r') { i++; continue; }
    
    // Handle #include (single token)
    if (ch === '#') {
        let startCol = col;
        i++; // skip #
        col++;
        
        let word = '';
        while (i < sourceCode.length && /[a-zA-Z]/.test(sourceCode[i])) {
            word += sourceCode[i];
            i++;
            col++;
        }
        
        tokens.push({ type: 'PREPROCESSOR', value: '#' + word, line: line, column: startCol });
        
        // Skip whitespace
        while (i < sourceCode.length && (sourceCode[i] === ' ' || sourceCode[i] === '\t')) {
            i++;
            col++;
        }
        
        // Handle <filename>
        if (i < sourceCode.length && sourceCode[i] === '<') {
            tokens.push({ type: 'OPERATOR', value: '<', line: line, column: col });
            i++;
            col++;
            
            let header = '';
            while (i < sourceCode.length && sourceCode[i] !== '>') {
                header += sourceCode[i];
                i++;
                col++;
            }
            tokens.push({ type: 'IDENTIFIER', value: header, line: line, column: col - header.length });
            
            if (i < sourceCode.length && sourceCode[i] === '>') {
                tokens.push({ type: 'OPERATOR', value: '>', line: line, column: col });
                i++;
                col++;
            }
        }
        continue;
    }
    
    // Comments
    if (ch === '/' && sourceCode[i+1] === '/') {
        while (i < sourceCode.length && sourceCode[i] !== '\n') i++;
        continue;
    }
    
    // Identifiers & Keywords
    if (/[a-zA-Z_]/.test(ch)) {
        let value = '';
        let startCol = col;
        while (i < sourceCode.length && /[a-zA-Z0-9_]/.test(sourceCode[i])) {
            value += sourceCode[i];
            i++;
            col++;
        }
        const type = keywords.includes(value) ? 'KEYWORD' : 'IDENTIFIER';
        tokens.push({ type: type, value: value, line: line, column: startCol });
        continue;
    }
    
    // Numbers
    if (/[0-9]/.test(ch)) {
        let value = '';
        let startCol = col;
        while (i < sourceCode.length && /[0-9]/.test(sourceCode[i])) {
            value += sourceCode[i];
            i++;
            col++;
        }
        tokens.push({ type: 'NUMBER', value: value, line: line, column: startCol });
        continue;
    }
    
    // Strings
    if (ch === '"') {
        let value = '';
        let startCol = col;
        i++;
        col++;
        while (i < sourceCode.length && sourceCode[i] !== '"') {
            value += sourceCode[i];
            i++;
            col++;
        }
        i++;
        col++;
        tokens.push({ type: 'STRING', value: value, line: line, column: startCol });
        continue;
    }
    
    // Operators
    if ('+-*/%=<>!&|'.includes(ch)) {
        tokens.push({ type: 'OPERATOR', value: ch, line: line, column: col });
        i++;
        col++;
        continue;
    }
    
    // Punctuation
    if (';,(){}[]'.includes(ch)) {
        tokens.push({ type: 'PUNCTUATION', value: ch, line: line, column: col });
        i++;
        col++;
        continue;
    }
    
    i++;
    col++;
}
        
        // ============ 2. SYMBOL TABLE GENERATION (COMPLETE) ============
        
        // Add main function
        if (sourceCode.includes('main()')) {
            symbolTable.push({
                name: 'main',
                type: 'Function',
                scope: 'Global',
                initialized: true
            });
        }
        
        // Add printf if present
        if (sourceCode.includes('printf')) {
            symbolTable.push({
                name: 'printf',
                type: 'Function',
                scope: 'Library (stdio.h)',
                initialized: true
            });
        }
        
        // Find ALL functions and their parameters
        const funcPattern = /(int|float|char|void)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*\{/g;
        let funcMatch;
        while ((funcMatch = funcPattern.exec(sourceCode)) !== null) {
            const funcName = funcMatch[2];
            const returnType = funcMatch[1];
            const params = funcMatch[3].trim();
            
            // Add function to symbol table if not main
            if (funcName !== 'main') {
                symbolTable.push({
                    name: funcName,
                    type: 'Function',
                    returnType: returnType,
                    scope: 'Global',
                    initialized: true
                });
            }
            
            // Add parameters
            if (params) {
                const paramList = params.split(',');
                for (const param of paramList) {
                    const paramMatch = param.trim().match(/(int|float|char)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                    if (paramMatch) {
                        symbolTable.push({
                            name: paramMatch[2],
                            type: paramMatch[1],
                            scope: `Parameter (${funcName})`,
                            initialized: true
                        });
                    }
                }
            }
        }
        
        // Find variables in main function with initialization
        const mainBody = sourceCode.match(/main\s*\(\s*\)\s*\{([\s\S]*?)\}/);
        if (mainBody) {
            const body = mainBody[1];
            
            // Variables with initialization: int num = 5;
            const varWithValuePattern = /(int|float|char)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;]+);/g;
            let match;
            while ((match = varWithValuePattern.exec(body)) !== null) {
                let value = match[3].trim();
                if (value.includes('+')) {
                    const parts = value.split('+');
                    let sum = 0;
                    for (const part of parts) {
                        const num = parseInt(part.trim());
                        if (!isNaN(num)) sum += num;
                    }
                    if (sum > 0) value = sum.toString();
                }
                symbolTable.push({
                    name: match[2],
                    type: match[1],
                    scope: 'Local (main)',
                    value: value,
                    initialized: true
                });
            }
            
            // Variables without initialization: int a;
            const varWithoutValuePattern = /(int|float|char)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;/g;
            while ((match = varWithoutValuePattern.exec(body)) !== null) {
                const alreadyExists = symbolTable.some(s => s.name === match[2]);
                if (!alreadyExists) {
                    symbolTable.push({
                        name: match[2],
                        type: match[1],
                        scope: 'Local (main)',
                        initialized: false
                    });
                }
            }
        }
        
        // ============ 3. AST GENERATION ============
        const ast = {
            type: "Program",
            functions: [],
            variables: []
        };
        
        // Add all functions
        const allFunctions = sourceCode.match(/(int|float|char|void)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{/g);
        if (allFunctions) {
            for (const func of allFunctions) {
                const match = func.match(/(int|float|char|void)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                if (match) {
                    ast.functions.push({
                        type: "Function",
                        name: match[2],
                        returnType: match[1]
                    });
                }
            }
        }
        
        // Add variables
        symbolTable.forEach(s => {
            if (s.type !== 'Function' && s.type !== 'function' && s.scope === 'Local (main)') {
                ast.variables.push({
                    type: "Variable",
                    name: s.name,
                    dataType: s.type
                });
            }
        });
        
        // ============ 4. RETURN RESULT ============
        return {
            success: true,
            message: "Compilation Successful!",
            tokens: tokens,
            ast: ast,
            symbolTable: symbolTable,
            generatedCode: sourceCode,
            errors: []
        };
    }
}

module.exports = JavaScriptCompiler;
