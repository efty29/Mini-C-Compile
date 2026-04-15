#include "compiler.h"

Compiler::Compiler() : currentToken(0) {}

Token& Compiler::currentTokenRef() {
    return tokens[currentToken];
}

void Compiler::advance() {
    if (currentToken < tokens.size() - 1) {
        currentToken++;
    }
}

bool Compiler::match(int type, string value) {
    if (currentToken < tokens.size() && tokens[currentToken].type == type) {
        if (value.empty() || tokens[currentToken].value == value) {
            return true;
        }
    }
    return false;
}

void Compiler::expect(int type, string value) {
    if (!match(type, value)) {
        string error = "Expected token type " + to_string(type) + 
                      " but got '" + tokens[currentToken].value + 
                      "' at line " + to_string(tokens[currentToken].line);
        errors.push_back(error);
        throw runtime_error(error);
    }
    advance();
}

unique_ptr<ASTNode> Compiler::parseProgram() {
    auto program = make_unique<ASTNode>(NODE_PROGRAM);
    
    while (!match(TOKEN_EOF)) {
        if (match(TOKEN_KEYWORD)) {
            program->addChild(parseFunction());
        } else {
            program->addChild(parseStatement());
        }
    }
    
    return program;
}

unique_ptr<ASTNode> Compiler::parseFunction() {
    string returnType = tokens[currentToken].value;
    advance(); // consume return type
    
    string funcName = tokens[currentToken].value;
    expect(TOKEN_IDENTIFIER);
    
    auto func = make_unique<ASTNode>(NODE_FUNCTION, returnType);
    func->addChild(make_unique<ASTNode>(NODE_IDENTIFIER, funcName));
    
    expect(TOKEN_PUNCTUATION, "(");
    
    // Parse parameters if any
    if (!match(TOKEN_PUNCTUATION, ")")) {
        do {
            string paramType = tokens[currentToken].value;
            expect(TOKEN_KEYWORD);
            string paramName = tokens[currentToken].value;
            expect(TOKEN_IDENTIFIER);
            
            auto param = make_unique<ASTNode>(NODE_VARIABLE_DECL, paramType);
            param->addChild(make_unique<ASTNode>(NODE_IDENTIFIER, paramName));
            func->addChild(move(param));
        } while (match(TOKEN_PUNCTUATION, ","));
    }
    
    expect(TOKEN_PUNCTUATION, ")");
    func->addChild(parseBlock());
    
    return func;
}

unique_ptr<ASTNode> Compiler::parseBlock() {
    auto block = make_unique<ASTNode>(NODE_BLOCK);
    expect(TOKEN_PUNCTUATION, "{");
    
    while (!match(TOKEN_PUNCTUATION, "}")) {
        block->addChild(parseStatement());
    }
    
    expect(TOKEN_PUNCTUATION, "}");
    return block;
}

unique_ptr<ASTNode> Compiler::parseStatement() {
    if (match(TOKEN_KEYWORD)) {
        string keyword = tokens[currentToken].value;
        
        if (keyword == "int" || keyword == "float" || keyword == "double" || keyword == "char") {
            string varType = keyword;
            advance();
            string varName = tokens[currentToken].value;
            expect(TOKEN_IDENTIFIER);
            
            auto varDecl = make_unique<ASTNode>(NODE_VARIABLE_DECL, varType);
            varDecl->addChild(make_unique<ASTNode>(NODE_IDENTIFIER, varName));
            
            if (match(TOKEN_OPERATOR, "=")) {
                advance();
                varDecl->addChild(parseExpression());
            }
            
            expect(TOKEN_PUNCTUATION, ";");
            return varDecl;
        }
        else if (keyword == "if") {
            auto ifStmt = make_unique<ASTNode>(NODE_IF_STMT);
            advance();
            expect(TOKEN_PUNCTUATION, "(");
            ifStmt->addChild(parseExpression());
            expect(TOKEN_PUNCTUATION, ")");
            ifStmt->addChild(parseBlock());
            
            if (match(TOKEN_KEYWORD, "else")) {
                advance();
                auto elseNode = make_unique<ASTNode>(NODE_BLOCK);
                if (match(TOKEN_KEYWORD, "if")) {
                    elseNode->addChild(parseStatement());
                } else {
                    elseNode = parseBlock();
                }
                ifStmt->addChild(move(elseNode));
            }
            return ifStmt;
        }
        else if (keyword == "while") {
            auto whileStmt = make_unique<ASTNode>(NODE_WHILE_STMT);
            advance();
            expect(TOKEN_PUNCTUATION, "(");
            whileStmt->addChild(parseExpression());
            expect(TOKEN_PUNCTUATION, ")");
            whileStmt->addChild(parseBlock());
            return whileStmt;
        }
        else if (keyword == "for") {
            advance();
            expect(TOKEN_PUNCTUATION, "(");
            
            auto forStmt = make_unique<ASTNode>(NODE_BLOCK);
            
            // Initialization
            if (!match(TOKEN_PUNCTUATION, ";")) {
                forStmt->addChild(parseExpression());
            }
            expect(TOKEN_PUNCTUATION, ";");
            
            // Condition
            if (!match(TOKEN_PUNCTUATION, ";")) {
                forStmt->addChild(parseExpression());
            }
            expect(TOKEN_PUNCTUATION, ";");
            
            // Increment
            if (!match(TOKEN_PUNCTUATION, ")")) {
                forStmt->addChild(parseExpression());
            }
            expect(TOKEN_PUNCTUATION, ")");
            
            forStmt->addChild(parseBlock());
            return forStmt;
        }
        else if (keyword == "return") {
            auto returnStmt = make_unique<ASTNode>(NODE_RETURN_STMT);
            advance();
            if (!match(TOKEN_PUNCTUATION, ";")) {
                returnStmt->addChild(parseExpression());
            }
            expect(TOKEN_PUNCTUATION, ";");
            return returnStmt;
        }
    }
    
    // Expression statement
    auto expr = parseExpression();
    expect(TOKEN_PUNCTUATION, ";");
    return expr;
}

unique_ptr<ASTNode> Compiler::parseExpression() {
    auto left = parseTerm();
    
    while (match(TOKEN_OPERATOR, "+") || match(TOKEN_OPERATOR, "-")) {
        string op = tokens[currentToken].value;
        advance();
        auto right = parseTerm();
        
        auto binaryOp = make_unique<ASTNode>(NODE_BINARY_OP, op);
        binaryOp->addChild(move(left));
        binaryOp->addChild(move(right));
        left = move(binaryOp);
    }
    
    return left;
}

unique_ptr<ASTNode> Compiler::parseTerm() {
    auto left = parseFactor();
    
    while (match(TOKEN_OPERATOR, "*") || match(TOKEN_OPERATOR, "/") || match(TOKEN_OPERATOR, "%")) {
        string op = tokens[currentToken].value;
        advance();
        auto right = parseFactor();
        
        auto binaryOp = make_unique<ASTNode>(NODE_BINARY_OP, op);
        binaryOp->addChild(move(left));
        binaryOp->addChild(move(right));
        left = move(binaryOp);
    }
    
    return left;
}

unique_ptr<ASTNode> Compiler::parseFactor() {
    if (match(TOKEN_NUMBER)) {
        string value = tokens[currentToken].value;
        advance();
        return make_unique<ASTNode>(NODE_NUMBER, value);
    }
    else if (match(TOKEN_STRING)) {
        string value = tokens[currentToken].value;
        advance();
        return make_unique<ASTNode>(NODE_STRING_LITERAL, value);
    }
    else if (match(TOKEN_IDENTIFIER)) {
        string value = tokens[currentToken].value;
        advance();
        
        // Check if it's a function call
        if (match(TOKEN_PUNCTUATION, "(")) {
            auto funcCall = make_unique<ASTNode>(NODE_FUNCTION_CALL, value);
            advance(); // consume '('
            
            while (!match(TOKEN_PUNCTUATION, ")")) {
                funcCall->addChild(parseExpression());
                if (!match(TOKEN_PUNCTUATION, ",")) break;
                advance();
            }
            
            expect(TOKEN_PUNCTUATION, ")");
            return funcCall;
        }
        
        return make_unique<ASTNode>(NODE_IDENTIFIER, value);
    }
    else if (match(TOKEN_PUNCTUATION, "(")) {
        advance();
        auto expr = parseExpression();
        expect(TOKEN_PUNCTUATION, ")");
        return expr;
    }
    
    errors.push_back("Unexpected token in factor: " + tokens[currentToken].value);
    return nullptr;
}