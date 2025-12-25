// Haskish App - UI Controller

const interpreter = new HaskishInterpreter();

// Example code snippets from exam questions
const examples = {
    total: `-- Sum all numbers in a list
temps = [50, 68, 95, 86]

total [] = 0
total (x:xs) = x + total xs

-- Try: total temps
-- Try: total [1, 2, 3, 4]`,

    map: `-- Double every number in a list
double x = x * 2

-- Map applies a function to each element
-- Try: map double [1, 2, 3, 4]`,

    filter: `-- Filter example with operator section
square x = x * x

-- Try: filter (<10) [1, 5, 10, 15]
-- Try: map square [1, 3, 5]`,

    fold: `-- Fold reduces a list to a single value
-- Try: fold (*) 1 [2, 3, 2]
-- Try: fold (+) 0 [1, 2, 3, 4]`,

    nested: `-- Working with nested lists
fw [a, b] = a * b

sales = [[10, 2], [2, 25], [4, 8]]

-- Calculate revenue from each sale
-- Try: map fw sales
-- Try: sales`,

    exam1: `-- Exam Question: FunctionZ
functionZ [] = 0
functionZ (x:xs) = x + 2 * functionZ xs

-- Try: functionZ [4, 2, 5, 3]
-- Trace through the recursive calls!`
};

// Theme toggle functionality
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    const codeEditor = document.getElementById('codeEditor');
    const runCodeBtn = document.getElementById('runCode');
    const editorOutput = document.getElementById('editorOutput');
    
    const replInput = document.getElementById('replInput');
    const replOutput = document.getElementById('replOutput');
    const clearReplBtn = document.getElementById('clearRepl');
    
    const exampleBtns = document.querySelectorAll('.example-btn');

    // Run code from editor
    runCodeBtn.addEventListener('click', () => {
        const code = codeEditor.value;
        const result = interpreter.run(code);
        
        if (result.success) {
            editorOutput.innerHTML = `<div class="success">✓ ${result.message}</div>`;
            editorOutput.innerHTML += '<div class="info">Now try calling your functions in the REPL below!</div>';
        } else {
            editorOutput.innerHTML = `<div class="error">✗ Error: ${result.error}</div>`;
        }
    });

    // Handle REPL input
    replInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const expr = replInput.value.trim();
            if (!expr) return;

            // Add input to history
            const inputDiv = document.createElement('div');
            inputDiv.className = 'repl-entry';
            inputDiv.innerHTML = `<span class="repl-prompt">&gt;</span> <span class="repl-input">${escapeHtml(expr)}</span>`;
            replOutput.appendChild(inputDiv);

            // Evaluate expression
            const result = interpreter.evaluateRepl(expr);
            const outputDiv = document.createElement('div');
            
            if (result.success) {
                outputDiv.className = 'repl-result';
                outputDiv.textContent = result.result;
            } else {
                outputDiv.className = 'repl-error';
                outputDiv.textContent = `Error: ${result.error}`;
            }
            
            replOutput.appendChild(outputDiv);
            
            // Scroll to bottom
            replOutput.scrollTop = replOutput.scrollHeight;
            
            // Clear input
            replInput.value = '';
        }
    });

    // Clear REPL history
    clearReplBtn.addEventListener('click', () => {
        replOutput.innerHTML = '';
    });

    // Load example code
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const exampleName = btn.dataset.example;
            if (examples[exampleName]) {
                codeEditor.value = examples[exampleName];
                editorOutput.innerHTML = '<div class="info">Example loaded! Click "Run Code" to load the functions.</div>';
            }
        });
    });

    // Load initial example
    codeEditor.value = examples.total;
    editorOutput.innerHTML = '<div class="info">Click "Run Code" to load the functions, then test them in the REPL!</div>';
});

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
