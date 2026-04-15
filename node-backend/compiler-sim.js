// Complete C Compiler - Fixed Version
class JavaScriptCompiler {
    constructor() {
        this.tokens = [];
        this.symbolTable = [];
        this.errors = [];
        this.warnings = [];
        this.currentFunction = null;
        this.functions = new Map();
        this.variables = new Map();
    }

    compile(sourceCode) {
        // Reset state
        this.errors = [];
        this.warnings = [];
        this.tokens = [];
        this.symbolTable = [];
        this.currentFunction = null;
        this.functions.clear();
        this.variables.clear();
        
        try {
            // Step 1: Preprocess (handle includes)
            let processedCode = this.preprocess(sourceCode);
            
            // Step 2: Lexical Analysis
            this.tokens = this.lexicalAnalysis(processedCode);
            
            if (this.errors.length > 0) {
                return this.getResult(false, "Lexical Analysis Failed");
            }
            
            // Step 3: Syntax Analysis
            const ast = this.syntaxAnalysis(this.tokens);
            
            if (this.errors.length > 0) {
                return this.getResult(false, "Syntax Analysis Failed");
            }
            
            // Step 4: Semantic Analysis
            this.semanticAnalysis(ast);
            
            // Step 5: Code Generation
            const generatedCode = this.generateCode(ast);
            
            return this.getResult(true, "Compilation Successful!", ast, generatedCode);
            
        } catch (error) {
            this.errors.push(error.message);
            return this.getResult(false, "Compilation Failed");
        }
    }

    preprocess(code) {
        // Remove comments
        let processed = code.replace(/\/\*[\s\S]*?\*\//g, '');
        processed = processed.replace(/\/\/.*/g, '');
        return processed;
    }

    lexicalAnalysis(code) {
        const tokens = [];
        let i = 0;
        let line = 1;
        let column = 1;
        
        const keywords = new Set([
            'int', 'float', 'char', 'double', 'void', 'if', 'else', 'while', 
            'for', 'return', 'main', 'printf', 'scanf', 'include'
        ]);
        
        while (i < code.length) {
            const ch = code[i];
            
            if (ch === ' ' || ch === '\t' || ch === '\r') {
                i++;
                column++;
                continue;
            }
            
            if (ch === '\n') {
                line++;
                column = 1;
                i++;
                continue;
            }
            
            // Handle #include
            if (ch === '#') {
                let value = '#';
                let startCol = column;
                i++;
                column++;
                while (i < code.length && /[a-zA-Z]/.test(code[i])) {
                    value += code[i];
                    i++;
                    column++;
                }
                tokens.push({ type: 'PREPROCESSOR', value: 'include', line, column: startCol });
                
                // Skip spaces
                while (i < code.length && (code[i] === ' ' || code[i] === '\t')) {
                    i++;
                    column++;
                }
                
                // Handle <filename>
                if (code[i] === '<') {
                    tokens.push({ type: 'PUNCTUATION', value: '<', line, column });
                    i++;
                    column++;
                    
                    let header = '';
                    while (i < code.length && code[i] !== '>') {
                        header += code[i];
                        i++;
                        column++;
                    }
                    tokens.push({ type: 'STRING', value: header, line, column });
                    
                    if (code[i] === '>') {
                        tokens.push({ type: 'PUNCTUATION', value: '>', line, column });
                        i++;
                        column++;
                    }
                }
                continue;
            }
            
            // Identifiers and keywords
            if (/[a-zA-Z_]/.test(ch)) {
                let value = '';
                let startCol = column;
                while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
                    value += code[i];
                    i++;
                    column++;
                }
                const type = keywords.has(value) ? 'KEYWORD' : 'IDENTIFIER';
                tokens.push({ type, value, line, column: startCol });
                continue;
            }
            
            // Numbers
            if (/[0-9]/.test(ch)) {
                let value = '';
                let startCol = column;
                while (i < code.length && /[0-9.]/.test(code[i])) {
                    value += code[i];
                    i++;
                    column++;
                }
                tokens.push({ type: 'NUMBER', value, line, column: startCol });
                continue;
            }
            
            // Strings
            if (ch === '"') {
                let value = '';
                let startCol = column;
                i++;
                column++;
                while (i < code.length && code[i] !== '"') {
                    value += code[i];
                    i++;
                    column++;
                }
                i++;
                column++;
                tokens.push({ type: 'STRING', value, line, column: startCol });
                continue;
            }
            
            // Operators
            const operators = ['==', '!=', '<=', '>=', '&&', '||', '++', '--'];
            let matched = false;
            for (const op of operators) {
                if (code.substr(i, op.length) === op) {
                    tokens.push({ type: 'OPERATOR', value: op, line, column });
                    i += op.length;
                    column += op.length;
                    matched = true;
                    break;
                }
            }
            if (matched) continue;
            
            if ('+-*/%=<>!&|'.includes(ch)) {
                tokens.push({ type: 'OPERATOR', value: ch, line, column });
                i++;
                column++;
                continue;
            }
            
            // Punctuation
            if (';,(){}[]'.includes(ch)) {
                tokens.push({ type: 'PUNCTUATION', value: ch, line, column });
                i++;
                column++;
                continue;
            }
            
            i++;
            column++;
        }
        
        tokens.push({ type: 'EOF', value: 'EOF', line, column });
        return tokens;
    }

    syntaxAnalysis(tokens) {
        let pos = 0;
        
        const current = () => tokens[pos];
        const peek = (offset = 1) => tokens[pos + offset];
        const consume = (expectedType, expectedValue = null) => {
            if (pos >= tokens.length) {
                throw new Error(`Unexpected end of input`);
            }
            const token = current();
            if (token.type !== expectedType && (expectedValue === null || token.value !== expectedValue)) {
                throw new Error(`Expected ${expectedType}, got ${token.type} at line ${token.line}`);
            }
            pos++;
            return token;
        };
        const match = (type, value = null) => {
            if (pos < tokens.length && tokens[pos].type === type) {
                if (value === null || tokens[pos].value === value) {
                    return true;
                }
            }
            return false;
        };
        
        // Skip preprocessor directives
        while (pos < tokens.length && current().type === 'PREPROCESSOR') {
            pos++;
        }
        
        const parseProgram = () => {
            const program = { type: 'Program', children: [] };
            
            while (pos < tokens.length && current().type !== 'EOF') {
                if (match('KEYWORD')) {
                    const keyword = current().value;
                    if (['int', 'float', 'char', 'double', 'void'].includes(keyword)) {
                        // Check if it's a function
                        if (peek() && peek().type === 'IDENTIFIER') {
                            if (peek(1) && peek(1).value === '(') {
                                program.children.push(parseFunction());
                                continue;
                            }
                        }
                        program.children.push(parseDeclaration());
                    } else {
                        pos++;
                    }
                } else {
                    pos++;
                }
            }
            
            return program;
        };
        
        const parseFunction = () => {
            const returnType = current().value;
            pos++;
            const funcName = current().value;
            pos++;
            
            consume('PUNCTUATION', '(');
            const params = [];
            while (!match('PUNCTUATION', ')')) {
                if (match('KEYWORD')) {
                    const paramType = current().value;
                    pos++;
                    const paramName = current().value;
                    pos++;
                    params.push({ name: paramName, type: paramType });
                    if (match('PUNCTUATION', ',')) {
                        pos++;
                    }
                }
            }
            consume('PUNCTUATION', ')');
            
            const body = parseBlock();
            
            return {
                type: 'Function',
                name: funcName,
                returnType: returnType,
                params: params,
                body: body
            };
        };
        
        const parseBlock = () => {
            consume('PUNCTUATION', '{');
            const statements = [];
            
            while (!match('PUNCTUATION', '}')) {
                const stmt = parseStatement();
                if (stmt) statements.push(stmt);
            }
            consume('PUNCTUATION', '}');
            
            return { type: 'Block', statements };
        };
        
        const parseStatement = () => {
            if (!current()) return null;
            
            // Variable declaration
            if (match('KEYWORD') && ['int', 'float', 'char', 'double'].includes(current().value)) {
                return parseDeclaration();
            }
            
            // If statement
            if (match('KEYWORD', 'if')) {
                return parseIfStatement();
            }
            
            // While loop
            if (match('KEYWORD', 'while')) {
                return parseWhileStatement();
            }
            
            // For loop
            if (match('KEYWORD', 'for')) {
                return parseForStatement();
            }
            
            // Return statement
            if (match('KEYWORD', 'return')) {
                return parseReturnStatement();
            }
            
            // Expression statement
            return parseExpressionStatement();
        };
        
        const parseDeclaration = () => {
            const varType = current().value;
            pos++;
            const varName = current().value;
            pos++;
            
            let value = null;
            if (match('OPERATOR', '=')) {
                pos++;
                value = parseExpression();
            }
            
            if (match('PUNCTUATION', ';')) {
                pos++;
            }
            
            return {
                type: 'VariableDeclaration',
                varType: varType,
                name: varName,
                value: value
            };
        };
        
        const parseIfStatement = () => {
            pos++;
            consume('PUNCTUATION', '(');
            const condition = parseExpression();
            consume('PUNCTUATION', ')');
            const thenBranch = parseBlock();
            
            let elseBranch = null;
            if (match('KEYWORD', 'else')) {
                pos++;
                elseBranch = parseBlock();
            }
            
            return {
                type: 'IfStatement',
                condition: condition,
                then: thenBranch,
                else: elseBranch
            };
        };
        
        const parseWhileStatement = () => {
            pos++;
            consume('PUNCTUATION', '(');
            const condition = parseExpression();
            consume('PUNCTUATION', ')');
            const body = parseBlock();
            
            return {
                type: 'WhileStatement',
                condition: condition,
                body: body
            };
        };
        
        const parseForStatement = () => {
            pos++;
            consume('PUNCTUATION', '(');
            
            let init = null;
            if (!match('PUNCTUATION', ';')) {
                init = parseExpression();
            }
            consume('PUNCTUATION', ';');
            
            let condition = null;
            if (!match('PUNCTUATION', ';')) {
                condition = parseExpression();
            }
            consume('PUNCTUATION', ';');
            
            let increment = null;
            if (!match('PUNCTUATION', ')')) {
                increment = parseExpression();
            }
            consume('PUNCTUATION', ')');
            
            const body = parseBlock();
            
            return {
                type: 'ForStatement',
                init: init,
                condition: condition,
                increment: increment,
                body: body
            };
        };
        
        const parseReturnStatement = () => {
            pos++;
            let value = null;
            if (!match('PUNCTUATION', ';')) {
                value = parseExpression();
            }
            if (match('PUNCTUATION', ';')) {
                pos++;
            }
            
            return {
                type: 'ReturnStatement',
                value: value
            };
        };
        
        const parseExpressionStatement = () => {
            const expr = parseExpression();
            if (match('PUNCTUATION', ';')) {
                pos++;
            }
            return {
                type: 'ExpressionStatement',
                expression: expr
            };
        };
        
        const parseExpression = () => {
            let left = parseTerm();
            
            while (match('OPERATOR') && (current().value === '+' || current().value === '-')) {
                const op = current().value;
                pos++;
                const right = parseTerm();
                left = {
                    type: 'BinaryExpression',
                    operator: op,
                    left: left,
                    right: right
                };
            }
            
            return left;
        };
        
        const parseTerm = () => {
            let left = parseFactor();
            
            while (match('OPERATOR') && (current().value === '*' || current().value === '/')) {
                const op = current().value;
                pos++;
                const right = parseFactor();
                left = {
                    type: 'BinaryExpression',
                    operator: op,
                    left: left,
                    right: right
                };
            }
            
            return left;
        };
        
        const parseFactor = () => {
            const token = current();
            
            if (token.type === 'NUMBER') {
                pos++;
                return { type: 'Number', value: token.value };
            }
            
            if (token.type === 'STRING') {
                pos++;
                return { type: 'String', value: token.value };
            }
            
            if (token.type === 'IDENTIFIER') {
                pos++;
                if (match('PUNCTUATION', '(')) {
                    pos++;
                    const args = [];
                    while (!match('PUNCTUATION', ')')) {
                        args.push(parseExpression());
                        if (match('PUNCTUATION', ',')) {
                            pos++;
                        }
                    }
                    pos++;
                    return {
                        type: 'FunctionCall',
                        name: token.value,
                        arguments: args
                    };
                }
                return { type: 'Identifier', name: token.value };
            }
            
            if (match('PUNCTUATION', '(')) {
                pos++;
                const expr = parseExpression();
                consume('PUNCTUATION', ')');
                return expr;
            }
            
            pos++;
            return { type: 'Unknown', value: token.value };
        };
        
        try {
            return parseProgram();
        } catch (error) {
            this.errors.push(error.message);
            return { type: 'Program', children: [] };
        }
    }

    semanticAnalysis(ast) {
        const analyzeNode = (node, scope = 'global') => {
            if (!node) return;
            
            switch(node.type) {
                case 'VariableDeclaration':
                    // Check if variable already exists in this scope
                    const existingVar = this.symbolTable.find(s => s.name === node.name && s.scope === scope);
                    if (!existingVar) {
                        this.symbolTable.push({
                            name: node.name,
                            type: node.varType,
                            scope: scope,
                            category: 'variable',
                            initialized: node.value !== null,
                            line: 'declared'
                        });
                    }
                    break;
                    
                case 'Function':
                    this.symbolTable.push({
                        name: node.name,
                        type: 'function',
                        returnType: node.returnType,
                        scope: 'global',
                        category: 'function',
                        params: node.params.map(p => `${p.type} ${p.name}`).join(', ')
                    });
                    this.currentFunction = node.name;
                    if (node.body && node.body.statements) {
                        node.body.statements.forEach(stmt => analyzeNode(stmt, node.name));
                    }
                    break;
                    
                case 'Identifier':
                    // Check if variable exists (warning only)
                    const varExists = this.symbolTable.some(s => s.name === node.name && s.category === 'variable');
                    if (!varExists && node.name !== 'printf' && node.name !== 'scanf') {
                        this.warnings.push(`Variable '${node.name}' used but not declared in scope ${scope}`);
                    }
                    break;
                    
                case 'Block':
                    if (node.statements) {
                        node.statements.forEach(stmt => analyzeNode(stmt, scope));
                    }
                    break;
                    
                default:
                    if (node.left) analyzeNode(node.left, scope);
                    if (node.right) analyzeNode(node.right, scope);
                    if (node.condition) analyzeNode(node.condition, scope);
                    if (node.body) analyzeNode(node.body, scope);
                    if (node.then) analyzeNode(node.then, scope);
                    if (node.else) analyzeNode(node.else, scope);
                    if (node.init) analyzeNode(node.init, scope);
                    if (node.increment) analyzeNode(node.increment, scope);
                    if (node.expression) analyzeNode(node.expression, scope);
                    if (node.operand) analyzeNode(node.operand, scope);
                    break;
            }
        };
        
        analyzeNode(ast);
    }

    generateCode(node, indent = 0) {
        const getIndent = () => '    '.repeat(indent);
        
        switch(node.type) {
            case 'Program':
                let code = '#include <stdio.h>\n#include <stdlib.h>\n\n';
                for (const child of node.children) {
                    code += this.generateCode(child, indent);
                }
                // Add default main if not exists
                if (!code.includes('main()') && !code.includes('main (')) {
                    code += 'int main() {\n    printf("Hello World!\\n");\n    return 0;\n}\n';
                }
                return code;
                
            case 'Function':
                let funcCode = `${getIndent()}${node.returnType} ${node.name}(`;
                funcCode += node.params.map(p => `${p.type} ${p.name}`).join(', ');
                funcCode += ') {\n';
                funcCode += this.generateCode(node.body, indent + 1);
                funcCode += `${getIndent()}}\n\n`;
                return funcCode;
                
            case 'Block':
                let blockCode = '';
                for (const stmt of node.statements) {
                    blockCode += this.generateCode(stmt, indent);
                }
                return blockCode;
                
            case 'VariableDeclaration':
                let varCode = `${getIndent()}${node.varType} ${node.name}`;
                if (node.value) {
                    varCode += ` = ${this.generateCode(node.value, indent)}`;
                }
                varCode += ';\n';
                return varCode;
                
            case 'IfStatement':
                let ifCode = `${getIndent()}if (${this.generateCode(node.condition, indent)}) {\n`;
                ifCode += this.generateCode(node.then, indent + 1);
                ifCode += `${getIndent()}}`;
                if (node.else && node.else.statements && node.else.statements.length > 0) {
                    ifCode += ` else {\n`;
                    ifCode += this.generateCode(node.else, indent + 1);
                    ifCode += `${getIndent()}}`;
                }
                ifCode += '\n';
                return ifCode;
                
            case 'WhileStatement':
                let whileCode = `${getIndent()}while (${this.generateCode(node.condition, indent)}) {\n`;
                whileCode += this.generateCode(node.body, indent + 1);
                whileCode += `${getIndent()}}\n`;
                return whileCode;
                
            case 'ForStatement':
                let forCode = `${getIndent()}for (`;
                forCode += node.init ? this.generateCode(node.init, 0) : '';
                forCode += '; ';
                forCode += node.condition ? this.generateCode(node.condition, 0) : '1';
                forCode += '; ';
                forCode += node.increment ? this.generateCode(node.increment, 0) : '';
                forCode += ') {\n';
                forCode += this.generateCode(node.body, indent + 1);
                forCode += `${getIndent()}}\n`;
                return forCode;
                
            case 'ReturnStatement':
                if (node.value) {
                    return `${getIndent()}return ${this.generateCode(node.value, indent)};\n`;
                }
                return `${getIndent()}return;\n`;
                
            case 'ExpressionStatement':
                return `${getIndent()}${this.generateCode(node.expression, indent)};\n`;
                
            case 'BinaryExpression':
                return `(${this.generateCode(node.left, indent)} ${node.operator} ${this.generateCode(node.right, indent)})`;
                
            case 'FunctionCall':
                let callCode = `${node.name}(`;
                callCode += node.arguments.map(arg => this.generateCode(arg, indent)).join(', ');
                callCode += `)`;
                return callCode;
                
            case 'Identifier':
                return node.name;
                
            case 'Number':
                return node.value;
                
            case 'String':
                return `"${node.value}"`;
                
            default:
                return '';
        }
    }

    getResult(success, message, ast = null, generatedCode = '') {
        return {
            success: success,
            message: message,
            tokens: this.tokens,
            ast: ast || { type: 'Program', children: [] },
            symbolTable: this.symbolTable,
            generatedCode: generatedCode || '// Code will appear here after compilation\n',
            errors: this.errors,
            warnings: this.warnings
        };
    }
}

module.exports = JavaScriptCompiler;