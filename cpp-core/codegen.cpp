#include "compiler.h"

string Compiler::generateCode(unique_ptr<ASTNode>& node) {
    if (!node) return "";
    
    stringstream code;
    
    switch(node->type) {
        case NODE_PROGRAM:
            code << "#include <stdio.h>\n";
            code << "#include <stdlib.h>\n\n";
            for (auto& child : node->children) {
                code << generateCode(child);
            }
            break;
            
        case NODE_FUNCTION: {
            string returnType = node->value;
            string funcName = node->children[0]->value;
            code << returnType << " " << funcName << "(";
            
            // Parameters
            bool first = true;
            for (size_t i = 1; i < node->children.size() - 1; i++) {
                if (node->children[i]->type == NODE_VARIABLE_DECL) {
                    if (!first) code << ", ";
                    code << node->children[i]->value << " " << node->children[i]->children[0]->value;
                    first = false;
                }
            }
            code << ") {\n";
            
            // Function body
            if (!node->children.empty()) {
                string bodyCode = generateCode(node->children[node->children.size() - 1]);
                code << bodyCode;
            }
            code << "}\n\n";
            break;
        }
        
        case NODE_VARIABLE_DECL: {
            string varType = node->value;
            string varName = node->children[0]->value;
            code << varType << " " << varName;
            
            if (node->children.size() > 1 && node->children[1]) {
                code << " = " << generateCode(node->children[1]);
            }
            code << ";\n";
            break;
        }
        
        case NODE_BINARY_OP: {
            string left = generateCode(node->children[0]);
            string right = generateCode(node->children[1]);
            code << "(" << left << " " << node->value << " " << right << ")";
            break;
        }
        
        case NODE_NUMBER:
            code << node->value;
            break;
            
        case NODE_STRING_LITERAL:
            code << "\"" << node->value << "\"";
            break;
            
        case NODE_IDENTIFIER:
            code << node->value;
            break;
            
        case NODE_FUNCTION_CALL: {
            string funcName = node->value;
            code << funcName << "(";
            for (size_t i = 0; i < node->children.size(); i++) {
                if (i > 0) code << ", ";
                code << generateCode(node->children[i]);
            }
            code << ")";
            break;
        }
        
        case NODE_IF_STMT: {
            string condition = generateCode(node->children[0]);
            code << "if (" << condition << ") {\n";
            code << generateCode(node->children[1]);
            code << "}";
            
            if (node->children.size() > 2 && node->children[2]) {
                code << " else {\n";
                code << generateCode(node->children[2]);
                code << "}";
            }
            code << "\n";
            break;
        }
        
        case NODE_WHILE_STMT: {
            string condition = generateCode(node->children[0]);
            code << "while (" << condition << ") {\n";
            code << generateCode(node->children[1]);
            code << "}\n";
            break;
        }
        
        case NODE_RETURN_STMT:
            code << "return";
            if (node->children.size() > 0 && node->children[0]) {
                code << " " << generateCode(node->children[0]);
            }
            code << ";\n";
            break;
            
        case NODE_BLOCK:
            for (auto& child : node->children) {
                string stmt = generateCode(child);
                if (!stmt.empty()) {
                    code << "    " << stmt;
                }
            }
            break;
            
        default:
            for (auto& child : node->children) {
                code << generateCode(child);
            }
            break;
    }
    
    return code.str();
}