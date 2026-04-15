#include "compiler.h"
#include <set>

static const set<string> keywords = {
    "int", "float", "double", "char", "void", "if", "else", "while", 
    "for", "return", "include", "main", "printf", "scanf", "break", "continue"
};

static const set<char> operators = {'+', '-', '*', '/', '=', '<', '>', '!', '%'};
static const set<char> punctuation = {';', ',', '(', ')', '{', '}', '[', ']'};

bool Compiler::isLetter(char c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
}

bool Compiler::isDigit(char c) {
    return c >= '0' && c <= '9';
}

bool Compiler::isKeyword(const string& str) {
    return keywords.find(str) != keywords.end();
}

vector<Token> Compiler::lexicalAnalysis(const string& code) {
    vector<Token> tokens;
    int line = 1;
    int column = 1;
    size_t i = 0;
    
    while (i < code.length()) {
        char c = code[i];
        
        // Skip whitespace
        if (isspace(c)) {
            if (c == '\n') {
                line++;
                column = 1;
            } else {
                column++;
            }
            i++;
            continue;
        }
        
        // Skip single-line comments
        if (c == '/' && i + 1 < code.length() && code[i + 1] == '/') {
            while (i < code.length() && code[i] != '\n') {
                i++;
                column++;
            }
            continue;
        }
        
        // Skip multi-line comments
        if (c == '/' && i + 1 < code.length() && code[i + 1] == '*') {
            i += 2;
            column += 2;
            while (i < code.length() - 1 && !(code[i] == '*' && code[i + 1] == '/')) {
                if (code[i] == '\n') {
                    line++;
                    column = 1;
                } else {
                    column++;
                }
                i++;
            }
            i += 2;
            continue;
        }
        
        // Identifiers and keywords
        if (isLetter(c)) {
            string identifier;
            int startCol = column;
            while (i < code.length() && (isLetter(code[i]) || isDigit(code[i]))) {
                identifier += code[i];
                i++;
                column++;
            }
            
            int type = isKeyword(identifier) ? TOKEN_KEYWORD : TOKEN_IDENTIFIER;
            tokens.push_back(Token(type, identifier, line, startCol));
            continue;
        }
        
        // Numbers
        if (isDigit(c)) {
            string number;
            int startCol = column;
            bool isFloat = false;
            
            while (i < code.length() && (isDigit(code[i]) || code[i] == '.')) {
                if (code[i] == '.') {
                    if (isFloat) break;
                    isFloat = true;
                }
                number += code[i];
                i++;
                column++;
            }
            
            tokens.push_back(Token(TOKEN_NUMBER, number, line, startCol));
            continue;
        }
        
        // String literals
        if (c == '"') {
            string str;
            int startCol = column;
            i++; // Skip opening quote
            column++;
            
            while (i < code.length() && code[i] != '"') {
                if (code[i] == '\\' && i + 1 < code.length()) {
                    str += code[i];
                    i++;
                    column++;
                    str += code[i];
                    i++;
                    column++;
                } else {
                    str += code[i];
                    i++;
                    column++;
                }
            }
            
            if (i < code.length() && code[i] == '"') {
                tokens.push_back(Token(TOKEN_STRING, str, line, startCol));
                i++;
                column++;
            } else {
                errors.push_back("Unterminated string at line " + to_string(line));
            }
            continue;
        }
        
        // Operators
        if (operators.find(c) != operators.end()) {
            string op(1, c);
            int startCol = column;
            
            // Multi-character operators
            if (c == '=' && i + 1 < code.length() && code[i + 1] == '=') {
                op = "==";
                i++;
                column++;
            } else if (c == '<' && i + 1 < code.length() && code[i + 1] == '=') {
                op = "<=";
                i++;
                column++;
            } else if (c == '>' && i + 1 < code.length() && code[i + 1] == '=') {
                op = ">=";
                i++;
                column++;
            } else if (c == '!' && i + 1 < code.length() && code[i + 1] == '=') {
                op = "!=";
                i++;
                column++;
            } else if (c == '&' && i + 1 < code.length() && code[i + 1] == '&') {
                op = "&&";
                i++;
                column++;
            } else if (c == '|' && i + 1 < code.length() && code[i + 1] == '|') {
                op = "||";
                i++;
                column++;
            }
            
            tokens.push_back(Token(TOKEN_OPERATOR, op, line, startCol));
            i++;
            column++;
            continue;
        }
        
        // Punctuation
        if (punctuation.find(c) != punctuation.end()) {
            tokens.push_back(Token(TOKEN_PUNCTUATION, string(1, c), line, column));
            i++;
            column++;
            continue;
        }
        
        // Unknown character
        errors.push_back("Unknown character '" + string(1, c) + "' at line " + to_string(line));
        i++;
        column++;
    }
    
    tokens.push_back(Token(TOKEN_EOF, "EOF", line, column));
    return tokens;
}