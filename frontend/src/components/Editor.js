import React from 'react';
import './Editor.css';

function Editor({ code, onChange }) {
    return (
        <div className="editor-container">
            <textarea
                className="code-editor"
                value={code}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
                placeholder="Write your C code here..."
            />
        </div>
    );
}

export default Editor;