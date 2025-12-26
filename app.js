// Haskish App - UI Controller

const interpreter = new HaskishInterpreter();

// Exercise content data
const exerciseData = {
    1: {
        title: "1. Double Function",
        content: `
            <h3>Task</h3>
            <p>Write a function called <code>double</code> that takes a number and returns its double.</p>
            
            <h3>Example</h3>
            <pre><code>double 5
-- Output: 10

double 12
-- Output: 24</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Use the multiplication operator (*) to multiply the input by 2.
            </div>
        `
    },
    2: {
        title: "2. Square Function",
        content: `
            <h3>Task</h3>
            <p>Write a function called <code>square</code> that takes a number and returns its square.</p>
            
            <h3>Example</h3>
            <pre><code>square 4
-- Output: 16

square 7
-- Output: 49</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Multiply the number by itself: <code>x * x</code>
            </div>
        `
    },
    3: {
        title: "3. IsEven Predicate",
        content: `
            <h3>Task</h3>
            <p>Write a predicate function called <code>isEven</code> that returns <code>True</code> if a number is even, <code>False</code> otherwise.</p>
            
            <h3>Example</h3>
            <pre><code>isEven 4
-- Output: True

isEven 7
-- Output: False</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Use pattern matching with modulo: a number is even if <code>n % 2 == 0</code>
            </div>
        `
    },
    4: {
        title: "4. Absolute Value",
        content: `
            <h3>Task</h3>
            <p>Write a function called <code>abs</code> that returns the absolute value of a number.</p>
            
            <h3>Example</h3>
            <pre><code>abs (-5)
-- Output: 5

abs 3
-- Output: 3</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> If the number is less than 0, negate it. Otherwise, return it as-is.
            </div>
        `
    },
    5: {
        title: "5. Sum of List",
        content: `
            <h3>Task</h3>
            <p>Write a recursive function called <code>sum</code> that calculates the sum of all numbers in a list.</p>
            
            <h3>Example</h3>
            <pre><code>sum [1, 2, 3, 4]
-- Output: 10

sum []
-- Output: 0</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Base case: empty list returns 0. Recursive case: add the head to the sum of the tail.
            </div>
        `
    },
    6: {
        title: "6. Length of List",
        content: `
            <h3>Task</h3>
            <p>Write a recursive function called <code>len</code> that returns the length of a list.</p>
            
            <h3>Example</h3>
            <pre><code>len [1, 2, 3, 4]
-- Output: 4

len []
-- Output: 0</code></pre>
        `
    },
    7: {
        title: "7. Reverse List",
        content: `
            <h3>Task</h3>
            <p>Write a recursive function called <code>reverse</code> that reverses a list.</p>
            
            <h3>Example</h3>
            <pre><code>reverse [1, 2, 3, 4]
-- Output: [4,3,2,1]</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Use the <code>++</code> operator to append elements. Pattern: <code>reverse xs ++ [x]</code>
            </div>
        `
    },
    8: {
        title: "8. Maximum Element",
        content: `
            <h3>Task</h3>
            <p>Write a function called <code>maximum</code> that finds the largest number in a non-empty list.</p>
            
            <h3>Example</h3>
            <pre><code>maximum [3, 1, 4, 1, 5]
-- Output: 5</code></pre>
        `
    },
    9: {
        title: "9. Concatenate Lists",
        content: `
            <h3>Task</h3>
            <p>Write a function called <code>concat</code> that concatenates two lists.</p>
            
            <h3>Example</h3>
            <pre><code>concat [1, 2] [3, 4]
-- Output: [1,2,3,4]</code></pre>
        `
    },
    10: {
        title: "10. Map Double",
        content: `
            <h3>Task</h3>
            <p>Use the built-in <code>map</code> function to double every number in a list.</p>
            
            <h3>Example</h3>
            <pre><code>double x = x * 2
map double [1, 2, 3]
-- Output: [2,4,6]</code></pre>
        `
    },
    11: {
        title: "11. Filter Positives",
        content: `
            <h3>Task</h3>
            <p>Use <code>filter</code> to keep only positive numbers from a list.</p>
            
            <h3>Example</h3>
            <pre><code>isPositive x = x > 0
filter isPositive [-2, 3, -1, 5]
-- Output: [3,5]</code></pre>
        `
    },
    12: {
        title: "12. Fold Sum",
        content: `
            <h3>Task</h3>
            <p>Use <code>fold</code> to sum all numbers in a list.</p>
            
            <h3>Example</h3>
            <pre><code>fold (+) 0 [1, 2, 3, 4]
-- Output: 10</code></pre>
        `
    },
    13: {
        title: "13. Fold Product",
        content: `
            <h3>Task</h3>
            <p>Use <code>fold</code> to calculate the product of all numbers in a list.</p>
            
            <h3>Example</h3>
            <pre><code>fold (*) 1 [2, 3, 4]
-- Output: 24</code></pre>
        `
    },
    14: {
        title: "14. First Element",
        content: `
            <h3>Task</h3>
            <p>Write a function called <code>first</code> that returns the first element of a list using pattern matching.</p>
            
            <h3>Example</h3>
            <pre><code>first [1, 2, 3]
-- Output: 1</code></pre>
        `
    },
    15: {
        title: "15. Second Element",
        content: `
            <h3>Task</h3>
            <p>Write a function called <code>second</code> that returns the second element of a list.</p>
            
            <h3>Example</h3>
            <pre><code>second [1, 2, 3]
-- Output: 2</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Use pattern matching: <code>second (x:y:xs) = y</code>
            </div>
        `
    },
    16: {
        title: "16. Drop Elements",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>drop</code> that removes the first n elements from a list.</p>
            
            <h3>Example</h3>
            <pre><code>drop 2 [1, 2, 3, 4, 5]
-- Output: [3,4,5]</code></pre>
        `
    },
    17: {
        title: "17. Take Elements",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>take</code> that returns the first n elements from a list.</p>
            
            <h3>Example</h3>
            <pre><code>take 3 [1, 2, 3, 4, 5]
-- Output: [1,2,3]</code></pre>
        `
    },
    18: {
        title: "18. Fibonacci Sequence",
        content: `
            <h3>Task</h3>
            <p>Write a recursive function <code>fib</code> that calculates the nth Fibonacci number.</p>
            
            <h3>Example</h3>
            <pre><code>fib 0 = 0
fib 1 = 1
fib n = fib (n-1) + fib (n-2)

fib 6
-- Output: 8</code></pre>
        `
    }
};

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
    
    const runCodeBtn = document.getElementById('runCode');
    const editorOutput = document.getElementById('editorOutput');
    const replOutput = document.getElementById('replOutput');
    const clearReplBtn = document.getElementById('clearRepl');
    const exampleBtns = document.querySelectorAll('.example-btn');
    
    // Initialize CodeMirror
    const codeEditorTextarea = document.getElementById('codeEditor');
    const codeEditor = CodeMirror.fromTextArea(codeEditorTextarea, {
        mode: 'haskell',
        theme: 'monokai',
        lineNumbers: true,
        indentUnit: 2,
        tabSize: 2,
        lineWrapping: true,
        extraKeys: {
            'Ctrl-Enter': () => runCodeBtn.click(),
            'Cmd-Enter': () => runCodeBtn.click()
        }
    });
    
    // Initialize REPL CodeMirror
    const replInputTextarea = document.getElementById('replInput');
    const replEditor = CodeMirror.fromTextArea(replInputTextarea, {
        mode: 'haskell',
        theme: 'monokai',
        lineNumbers: false,
        indentUnit: 2,
        tabSize: 2,
        lineWrapping: true,
        viewportMargin: Infinity,
        extraKeys: {
            'Enter': function(cm) {
                const expr = cm.getValue().trim();
                if (!expr) return;
                
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const themeClass = currentTheme === 'light' ? 'cm-s-eclipse' : 'cm-s-monokai';

                // Add input to history with syntax highlighting
                const inputDiv = document.createElement('div');
                inputDiv.className = 'repl-entry';
                
                const promptSpan = document.createElement('span');
                promptSpan.className = 'repl-prompt';
                promptSpan.textContent = '> ';
                
                const inputCode = document.createElement('code');
                inputCode.className = `repl-input-code ${themeClass}`;
                inputDiv.appendChild(promptSpan);
                inputDiv.appendChild(inputCode);
                
                replOutput.appendChild(inputDiv);
                
                // Apply syntax highlighting to input
                CodeMirror.runMode(expr, 'haskell', inputCode);

                // Evaluate expression
                const result = interpreter.evaluateRepl(expr);
                const outputDiv = document.createElement('div');
                
                if (result.success) {
                    outputDiv.className = 'repl-result';
                    const outputCode = document.createElement('code');
                    outputCode.className = `repl-output-code ${themeClass}`;
                    outputDiv.appendChild(outputCode);
                    // Apply syntax highlighting to output
                    CodeMirror.runMode(result.result, 'haskell', outputCode);
                } else {
                    outputDiv.className = 'repl-error';
                    outputDiv.textContent = `Error: ${result.error}`;
                }
                
                replOutput.appendChild(outputDiv);
                
                // Scroll to bottom
                replOutput.scrollTop = replOutput.scrollHeight;
                
                // Clear input
                cm.setValue('');
                cm.focus();
            },
            'Shift-Enter': function(cm) {
                cm.replaceSelection('\n');
            }
        }
    });
    
    const themeToggle = document.getElementById('themeToggle');
    const originalThemeToggle = themeToggle.onclick;
    themeToggle.addEventListener('click', () => {
        setTimeout(() => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'eclipse' : 'monokai';
            codeEditor.setOption('theme', newTheme);
            replEditor.setOption('theme', newTheme);
            
            // Update all existing REPL output syntax highlighting
            const themeClass = currentTheme === 'light' ? 'cm-s-eclipse' : 'cm-s-monokai';
            const oldThemeClass = currentTheme === 'light' ? 'cm-s-monokai' : 'cm-s-eclipse';
            
            document.querySelectorAll('.repl-input-code, .repl-output-code').forEach(el => {
                el.classList.remove(oldThemeClass);
                el.classList.add(themeClass);
            });
        }, 0);
    });
    
    // Set initial theme
    const initialTheme = document.documentElement.getAttribute('data-theme');
    const initialEditorTheme = initialTheme === 'light' ? 'eclipse' : 'monokai';
    codeEditor.setOption('theme', initialEditorTheme);
    replEditor.setOption('theme', initialEditorTheme);

    // Run code from editor
    runCodeBtn.addEventListener('click', () => {
        const code = codeEditor.getValue();
        const result = interpreter.run(code);
        
        if (result.success) {
            editorOutput.innerHTML = `<div class="success">✓ ${result.message}</div>`;
            editorOutput.innerHTML += '<div class="info">Now try calling your functions in the REPL below!</div>';
        } else {
            editorOutput.innerHTML = `<div class="error">✗ Error: ${result.error}</div>`;
        }
    });

    // Clear REPL history
    clearReplBtn.addEventListener('click', () => {
        replOutput.innerHTML = '';
        replEditor.focus();
    });

    // Load example code
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const exampleName = btn.dataset.example;
            if (examples[exampleName]) {
                codeEditor.setValue(examples[exampleName]);
                editorOutput.innerHTML = '<div class="info">Example loaded! Click "Run Code" to load the functions.</div>';
            }
        });
    });

    // Load initial example
    codeEditor.setValue(examples.total);
    editorOutput.innerHTML = '<div class="info">Click "Run Code" to load the functions, then test them in the REPL!</div>';

    // Initialize exercises functionality
    initExercises();
});

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Exercises functionality
function initExercises() {
    // Load saved progress from localStorage
    const savedProgress = JSON.parse(localStorage.getItem('haskishProgress') || '{}');
    
    // Apply saved progress
    Object.keys(savedProgress).forEach(exerciseId => {
        if (savedProgress[exerciseId]) {
            const exercise = document.querySelector(`.exercise[data-exercise="${exerciseId}"]`);
            if (exercise) {
                exercise.classList.add('completed');
            }
        }
    });
    
    // Update all module progress counters
    updateAllModuleProgress();
    
    // Module accordion functionality - only one open at a time
    const moduleHeaders = document.querySelectorAll('.module-header');
    moduleHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const module = header.parentElement;
            const isCurrentlyCollapsed = module.classList.contains('collapsed');
            
            // Close all modules first
            document.querySelectorAll('.module').forEach(m => {
                m.classList.add('collapsed');
            });
            
            // If this module was collapsed, open it (toggle behavior)
            if (isCurrentlyCollapsed) {
                module.classList.remove('collapsed');
            }
        });
    });
    
    // Exercise completion toggle
    const exercises = document.querySelectorAll('.exercise');
    exercises.forEach(exercise => {
        const status = exercise.querySelector('.exercise-status');
        
        // Click on exercise to select it
        exercise.addEventListener('click', (e) => {
            // If clicking the status icon, don't select
            if (e.target === status) {
                return;
            }
            
            // Deselect all exercises
            exercises.forEach(ex => ex.classList.remove('selected'));
            
            // Select this exercise
            exercise.classList.add('selected');
            
            // Show exercise content
            showExerciseContent(exercise.dataset.exercise);
        });
        
        // Click on status to toggle completion
        status.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent exercise selection
            exercise.classList.toggle('completed');
            
            // Save progress
            const exerciseId = exercise.dataset.exercise;
            const progress = JSON.parse(localStorage.getItem('haskishProgress') || '{}');
            progress[exerciseId] = exercise.classList.contains('completed');
            localStorage.setItem('haskishProgress', JSON.stringify(progress));
            
            // Update module progress
            updateModuleProgress(exercise.closest('.module'));
        });
    });
    
    // Close exercise panel button
    const closeExerciseBtn = document.getElementById('closeExercise');
    if (closeExerciseBtn) {
        closeExerciseBtn.addEventListener('click', () => {
            hideExerciseContent();
            // Deselect all exercises
            document.querySelectorAll('.exercise').forEach(ex => ex.classList.remove('selected'));
        });
    }
}

function showExerciseContent(exerciseId) {
    const panel = document.getElementById('exercisePanel');
    const title = document.getElementById('exerciseTitle');
    const content = document.getElementById('exerciseContent');
    
    const exercise = exerciseData[exerciseId];
    
    if (exercise) {
        title.textContent = exercise.title;
        content.innerHTML = exercise.content;
        panel.style.display = 'flex';
    }
}

function hideExerciseContent() {
    const panel = document.getElementById('exercisePanel');
    panel.style.display = 'none';
}

function updateModuleProgress(module) {
    const exercises = module.querySelectorAll('.exercise');
    const completed = module.querySelectorAll('.exercise.completed');
    const progressSpan = module.querySelector('.module-progress');
    
    if (progressSpan) {
        progressSpan.textContent = `${completed.length}/${exercises.length}`;
    }
}

function updateAllModuleProgress() {
    const modules = document.querySelectorAll('.module');
    modules.forEach(module => updateModuleProgress(module));}