#include <napi.h>
#include "compiler.h"

class CompilerAddon : public Napi::ObjectWrap<CompilerAddon> {
private:
    Compiler compiler;
    
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "CompilerAddon", {
            InstanceMethod("compile", &CompilerAddon::Compile),
        });
        
        Napi::FunctionReference* constructor = new Napi::FunctionReference();
        *constructor = Napi::Persistent(func);
        env.SetInstanceData(constructor);
        
        exports.Set("CompilerAddon", func);
        return exports;
    }
    
    CompilerAddon(const Napi::CallbackInfo& info) : Napi::ObjectWrap<CompilerAddon>(info) {
        Napi::Env env = info.Env();
    }
    
    Napi::Value Compile(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Length() < 1 || !info[0].IsString()) {
            Napi::TypeError::New(env, "Expected source code string").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        string sourceCode = info[0].As<Napi::String>().Utf8Value();
        
        // Run compilation
        CompilationResult result = compiler.compile(sourceCode);
        
        // Parse JSON result
        string jsonResult = result.toJSON();
        return Napi::String::New(env, jsonResult);
    }
};

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return CompilerAddon::Init(env, exports);
}

NODE_API_MODULE(compiler_addon, InitAll)