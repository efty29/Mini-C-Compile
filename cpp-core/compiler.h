
#ifndef COMPILER_H
#define COMPILER_H

#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <memory>
#include <sstream>
#include <iomanip>
#include <functional>
#include <cctype>
#include <algorithm>

using namespace std;

// Token Types
enum TokenType {
    TOKEN_KEYWORD = 0,
    TOKEN_IDENTIFIER,
    TOKEN_NUMBER,
    TOKEN_STRING,
    TOKEN_OPERATOR,
    TOKEN_PUNCTUATION,
    TOKEN_EOF,
    TOKEN_ERROR
};

// Token Structure
struct Token {
    int type;
    string value;
    int line;
    int column;
    
    Token(int t, string v, int l, int c) 
        : type(t), value(v), line(l), column(c) {}
    
    string toString() const {
        string typeStr;
        switch(type) {
            case TOKEN_KEYWORD: typeStr = "KEYWORD"; break;
            case TOKEN_IDENTIFIER: typeStr = "IDENTIFIER"; break;
            case TOKEN_NUMBER: typeStr = "NUMBER"; break;
            case TOKEN_STRING: typeStr = "STRING"; break;
            case TOKEN_OPERATOR: typeStr = "OPERATOR"; break;
            case TOKEN_PUNCTUATION: typeStr = "PUNCTUATION"; break;
            default: typeStr = "UNKNOWN";
        }
        return "{\"type\":\"" + typeStr + "\",\"value\":\"" + value + "\",\"line\":" + to_string(line) + ",\"column\":" + to_string(column) + "}";
    }
};

// AST Node Types
enum ASTNodeType {
    NODE_PROGRAM,
    NODE_FUNCTION,
    NODE_VARIABLE_DECL,
    NODE_BINARY_OP,
    NODE_NUMBER,
    NODE_IDENTIFIER,
    NODE_IF_STMT,
    NODE_WHILE_STMT,
    NODE_RETURN_STMT,
    NODE_BLOCK,
    NODE_FUNCTION_CALL,
    NODE_STRING_LITERAL
};

// AST Node
struct ASTNode {
    int type;
    string value;
    vector<unique_ptr<ASTNode>> children;
    
    ASTNode(int t, string v = "") : type(t), value(v) {}
    
    void addChild(unique_ptr<ASTNode> child) {
        children.push_back(move(child));
    }
    
    string toJSON(int depth = 0) const {
        string indent(depth * 2, ' ');
        stringstream ss;
        ss << indent << "{\n";
        ss << indent << "  \"type\": \"" << getNodeTypeString() << "\",\n";
        if (!value.empty()) {
            ss << indent << "  \"value\": \"" << value << "\",\n";
        }
        ss << indent << "  \"children\": [\n";
        for (size_t i = 0; i < children.size(); i++) {
            ss << children[i]->toJSON(depth + 2);
            if (i < children.size() - 1) ss << ",";
            ss << "\n";
        }
        ss << indent << "  ]\n";
        ss << indent << "}";
        return ss.str();
    }
    
    string getNodeTypeString() const {
        switch(type) {
            case NODE_PROGRAM: return "Program";
            case NODE_FUNCTION: return "Function";
            case NODE_VARIABLE_DECL: return "VariableDeclaration";
            case NODE_BINARY_OP: return "BinaryOperation";
            case NODE_NUMBER: return "Number";
            case NODE_IDENTIFIER: return "Identifier";
            case NODE_IF_STMT: return "IfStatement";
            case NODE_WHILE_STMT: return "WhileStatement";
            case NODE_RETURN_STMT: return "ReturnStatement";
            case NODE_BLOCK: return "Block";
            case NODE_FUNCTION_CALL: return "FunctionCall";
            case NODE_STRING_LITERAL: return "StringLiteral";
            default: return "Unknown";
        }
    }
};

// Symbol Table Entry
struct Symbol {
    string name;
    string type;
    string scope;
    bool isInitialized;
    bool isFunction;
    
    Symbol(string n, string t, string s) 
        : name(n), type(t), scope(s), isInitialized(false), isFunction(false) {}
    
    string toJSON() const {
        return "{\"name\":\"" + name + "\",\"type\":\"" + type + "\",\"scope\":\"" + scope + "\",\"initialized\":" + (isInitialized ? "true" : "false") + ",\"isFunction\":" + (isFunction ? "true" : "false") + "}";
    }
};

// Compilation Result
struct CompilationResult {
    bool success;
    string message;
    vector<Token> tokens;
    unique_ptr<ASTNode> ast;
    map<string, Symbol> symbolTable;
    string generatedCode;
    vector<string> errors;
    
    string toJSON() const;
};

// Main Compiler Class
class Compiler {
private:
    vector<Token> tokens;
    unique_ptr<ASTNode> ast;
    map<string, Symbol> symbolTable;
    int currentToken;
    vector<string> errors;
    string generatedCode;
    
    // Lexical Analysis
    vector<Token> lexicalAnalysis(const string& code);
    bool isLetter(char c);
    bool isDigit(char c);
    bool isKeyword(const string& str);
    
    // Syntax Analysis
    unique_ptr<ASTNode> parseProgram();
    unique_ptr<ASTNode> parseFunction();
    unique_ptr<ASTNode> parseBlock();
    unique_ptr<ASTNode> parseStatement();
    unique_ptr<ASTNode> parseExpression();
    unique_ptr<ASTNode> parseTerm();
    unique_ptr<ASTNode> parseFactor();
    Token& currentTokenRef();
    void advance();
    bool match(int type, string value = "");
    void expect(int type, string value = "");
    
    // Semantic Analysis
    bool semanticAnalysis(unique_ptr<ASTNode>& node, string scope = "global");
    string getExpressionType(unique_ptr<ASTNode>& node);
    
    // Code Generation
    string generateCode(unique_ptr<ASTNode>& node);
    
public:
    Compiler();
    CompilationResult compile(const string& sourceCode);
};

#endif