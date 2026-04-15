#include "compiler.h"

bool Compiler::semanticAnalysis(unique_ptr<ASTNode>& node, string scope) {
    if (!node) return true;
    
    switch(node->type) {
        case NODE_VARIABLE_DECL: {
            string varName = node->children[0]->value;
            string varType = node->value;
            string fullScope = scope + "::" + varName;
            
            if (symbolTable.find(fullScope) != symbolTable.end()) {
                errors.push_back("Variable '" + varName + "' already declared in scope " + scope);
                return false;
            }
            
            symbolTable[fullScope] = Symbol(varName, varType, scope);
            
            // Check initialization
            if (node->children.size() > 1) {
                if (!semanticAnalysis(node->children[1], scope)) return false;
                symbolTable[fullScope].isInitialized = true;
            }
            break;
        }
        
        case NODE_IDENTIFIER: {
            string varName = node->value;
            string fullScope = scope + "::" + varName;
            
            // Check in current scope and global scope
            if (symbolTable.find(fullScope) == symbolTable.end() && 
                symbolTable.find("global::" + varName) == symbolTable.end()) {
                errors.push_back("Undefined variable '" + varName + "' in scope " + scope);
                return false;
            }
            break;
        }
        
        case NODE_FUNCTION: {
            string funcName = node->children[0]->value;
            string fullScope = "global::" + funcName;
            
            if (symbolTable.find(fullScope) != symbolTable.end()) {
                errors.push_back("Function '" + funcName + "' already declared");
                return false;
            }
            
            symbolTable[fullScope] = Symbol(funcName, node->value, "global");
            symbolTable[fullScope].isFunction = true;
            
            // Analyze function body with new scope
            string funcScope = funcName;
            for (size_t i = 2; i < node->children.size(); i++) {
                if (!semanticAnalysis(node->children[i], funcScope)) return false;
            }
            break;
        }
        
        case NODE_BINARY_OP: {
            if (!semanticAnalysis(node->children[0], scope)) return false;
            if (!semanticAnalysis(node->children[1], scope)) return false;
            
            // Type checking
            string leftType = getExpressionType(node->children[0]);
            string rightType = getExpressionType(node->children[1]);
            
            if (!leftType.empty() && !rightType.empty() && leftType != rightType) {
                errors.push_back("Type mismatch in binary operation: " + leftType + " vs " + rightType);
                return false;
            }
            break;
        }
        
        default:
            for (auto& child : node->children) {
                if (!semanticAnalysis(child, scope)) return false;
            }
            break;
    }
    
    return true;
}

string Compiler::getExpressionType(unique_ptr<ASTNode>& node) {
    if (!node) return "";
    
    switch(node->type) {
        case NODE_NUMBER:
            return node->value.find('.') != string::npos ? "float" : "int";
        case NODE_STRING_LITERAL:
            return "string";
        case NODE_IDENTIFIER: {
            string varName = node->value;
            if (symbolTable.find("global::" + varName) != symbolTable.end()) {
                return symbolTable["global::" + varName].type;
            }
            return "";
        }
        case NODE_BINARY_OP: {
            string leftType = getExpressionType(node->children[0]);
            string rightType = getExpressionType(node->children[1]);
            return leftType == rightType ? leftType : "";
        }
        default:
            return "";
    }
}

string CompilationResult::toJSON() const {
    stringstream ss;
    ss << "{\n";
    ss << "  \"success\": " << (success ? "true" : "false") << ",\n";
    ss << "  \"message\": \"" << message << "\",\n";
    
    // Tokens
    ss << "  \"tokens\": [\n";
    for (size_t i = 0; i < tokens.size(); i++) {
        ss << "    " << tokens[i].toString();
        if (i < tokens.size() - 1) ss << ",";
        ss << "\n";
    }
    ss << "  ],\n";
    
    // AST
    if (ast) {
        ss << "  \"ast\": " << ast->toJSON() << ",\n";
    } else {
        ss << "  \"ast\": null,\n";
    }
    
    // Symbol Table
    ss << "  \"symbolTable\": [\n";
    bool first = true;
    for (const auto& entry : symbolTable) {
        if (!first) ss << ",\n";
        ss << "    " << entry.second.toJSON();
        first = false;
    }
    ss << "\n  ],\n";
    
    // Generated Code - Escape special characters
    string escapedCode = generatedCode;
    size_t pos = 0;
    while ((pos = escapedCode.find("\"", pos)) != string::npos) {
        escapedCode.replace(pos, 1, "\\\"");
        pos += 2;
    }
    while ((pos = escapedCode.find("\n", pos)) != string::npos) {
        escapedCode.replace(pos, 1, "\\n");
        pos += 2;
    }
    ss << "  \"generatedCode\": \"" << escapedCode << "\",\n";
    
    // Errors
    ss << "  \"errors\": [\n";
    for (size_t i = 0; i < errors.size(); i++) {
        ss << "    \"" << errors[i] << "\"";
        if (i < errors.size() - 1) ss << ",";
        ss << "\n";
    }
    ss << "  ]\n";
    ss << "}";
    
    return ss.str();
}

CompilationResult Compiler::compile(const string& sourceCode) {
    CompilationResult result;
    errors.clear();
    symbolTable.clear();
    
    // Step 1: Lexical Analysis
    tokens = lexicalAnalysis(sourceCode);
    if (!errors.empty()) {
        result.success = false;
        result.message = "Lexical Analysis Failed";
        result.errors = errors;
        result.tokens = tokens;
        return result;
    }
    
    // Step 2: Syntax Analysis
    currentToken = 0;
    try {
        ast = parseProgram();
    } catch (const exception& e) {
        result.success = false;
        result.message = "Syntax Analysis Failed";
        result.errors = errors;
        result.tokens = tokens;
        return result;
    }
    
    // Step 3: Semantic Analysis
    if (!semanticAnalysis(ast)) {
        result.success = false;
        result.message = "Semantic Analysis Failed";
        result.errors = errors;
        result.tokens = tokens;
        result.ast = move(ast);
        return result;
    }
    
    // Step 4: Code Generation
    generatedCode = generateCode(ast);
    
    result.success = true;
    result.message = "Compilation Successful!";
    result.tokens = tokens;
    result.ast = move(ast);
    result.symbolTable = symbolTable;
    result.generatedCode = generatedCode;
    result.errors = errors;
    
    return result;
}