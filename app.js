// Haskish App - UI Controller

const interpreter = new HaskishInterpreter();

// Detect if running in standalone mode (PWA) vs browser
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    document.body.classList.add('standalone-mode');
}

// Detect iPad (modern iPads report as Mac but have touch)
function isIPad() {
    return (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform)) ||
           /iPad/.test(navigator.userAgent);
}

if (isIPad()) {
    document.body.classList.add('ipad-device');
}

// Hamburger menu toggle
const menuToggle = document.getElementById('menuToggle');
const menuPanel = document.getElementById('menuPanel');
const menuOverlay = document.getElementById('menuOverlay');
const closeMenu = document.getElementById('closeMenu');

// Prevent scrolling content behind menu in iOS PWA
const mainContent = document.querySelector('.main-content');

function preventContentScroll(e) {
    e.preventDefault();
    e.stopPropagation();
}

function openMenu() {
    menuPanel.classList.add('open');
    menuOverlay.classList.add('visible');
    document.documentElement.classList.add('menu-open');
    document.body.classList.add('menu-open');
    
    // Block touch events on main content
    if (mainContent) {
        mainContent.addEventListener('touchmove', preventContentScroll, { passive: false });
    }
}

function closeMenuFunc() {
    menuPanel.classList.remove('open');
    menuOverlay.classList.remove('visible');
    document.documentElement.classList.remove('menu-open');
    document.body.classList.remove('menu-open');

    // Restore touch events on main content
    if (mainContent) {
        mainContent.removeEventListener('touchmove', preventContentScroll);
    }
    
    // Collapse the examples submenu when closing the menu
    const examplesToggle = document.getElementById('examplesToggle');
    const examplesSubmenu = document.getElementById('examplesSubmenu');
    if (examplesToggle && examplesSubmenu) {
        examplesToggle.classList.remove('expanded');
        examplesSubmenu.classList.remove('expanded');
    }
}

menuToggle.addEventListener('click', openMenu);
closeMenu.addEventListener('click', closeMenuFunc);
menuOverlay.addEventListener('click', closeMenuFunc);

// Toggle exercises column
document.getElementById('toggleExercises').addEventListener('click', function() {
    const exercisesColumn = document.getElementById('exercisesColumn');
    const mainContent = document.getElementById('mainContent');
    const isVisible = exercisesColumn.style.display !== 'none';
    
    if (isVisible) {
        exercisesColumn.style.display = 'none';
        mainContent.classList.remove('exercises-visible');
        document.body.classList.remove('exercises-visible');
    } else {
        exercisesColumn.style.display = 'flex';
        mainContent.classList.add('exercises-visible');
        document.body.classList.add('exercises-visible');
    }
    
    // Close menu after toggling
    closeMenuFunc();
});

// Built-in Functions overlay
const builtinsButton = document.getElementById('builtinsButton');
const builtinsOverlay = document.getElementById('builtinsOverlay');
const closeBuiltins = document.getElementById('closeBuiltins');

builtinsButton.addEventListener('click', function() {
    builtinsOverlay.classList.add('visible');
    closeMenuFunc();
});

closeBuiltins.addEventListener('click', function() {
    builtinsOverlay.classList.remove('visible');
});

builtinsOverlay.addEventListener('click', function(e) {
    if (e.target === builtinsOverlay) {
        builtinsOverlay.classList.remove('visible');
    }
});

// About overlay
const aboutButton = document.getElementById('aboutButton');
const aboutOverlay = document.getElementById('aboutOverlay');
const closeAbout = document.getElementById('closeAbout');

aboutButton.addEventListener('click', function() {
    aboutOverlay.classList.add('visible');
    closeMenuFunc();
});

closeAbout.addEventListener('click', function() {
    aboutOverlay.classList.remove('visible');
});

aboutOverlay.addEventListener('click', function(e) {
    if (e.target === aboutOverlay) {
        aboutOverlay.classList.remove('visible');
    }
});

// Exercise content data - loaded from exercises.txt
let exerciseData = [];
let exerciseTitles = [];

// Global variables for editor state
let currentExerciseId = null;
let codeEditor = null;
let replEditor = null;

// Helper function to add system messages to REPL
function addSystemMessage(message, type = 'info') {
    const replOutput = document.getElementById('replOutput');
    const outputDiv = document.createElement('div');
    outputDiv.className = `repl-${type}`;
    outputDiv.innerHTML = message;
    replOutput.appendChild(outputDiv);
    replOutput.scrollTop = replOutput.scrollHeight;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const runCodeBtn = document.getElementById('runCode');
    const replOutput = document.getElementById('replOutput');
    const clearReplBtn = document.getElementById('clearRepl');
    
    // Initialize CodeMirror
    const codeEditorTextarea = document.getElementById('codeEditor');
    codeEditor = CodeMirror.fromTextArea(codeEditorTextarea, {
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
    let replHistory = [];
    let replHistoryIndex = -1;
    let replCurrentInput = '';
    
    replEditor = CodeMirror.fromTextArea(replInputTextarea, {
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
                
                // Add to history
                replHistory.push(expr);
                replHistoryIndex = replHistory.length;
                replCurrentInput = '';
                
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
            },
            'Up': function(cm) {
                if (replHistory.length === 0) return;
                
                // Save current input if at the end of history
                if (replHistoryIndex === replHistory.length) {
                    replCurrentInput = cm.getValue();
                }
                
                // Move up in history
                if (replHistoryIndex > 0) {
                    replHistoryIndex--;
                    cm.setValue(replHistory[replHistoryIndex]);
                    // Move cursor to end
                    cm.setCursor(cm.lineCount(), 0);
                }
            },
            'Down': function(cm) {
                if (replHistory.length === 0) return;
                
                // Move down in history
                if (replHistoryIndex < replHistory.length - 1) {
                    replHistoryIndex++;
                    cm.setValue(replHistory[replHistoryIndex]);
                    // Move cursor to end
                    cm.setCursor(cm.lineCount(), 0);
                } else if (replHistoryIndex === replHistory.length - 1) {
                    // At the last history item, go back to current input
                    replHistoryIndex = replHistory.length;
                    cm.setValue(replCurrentInput);
                    // Move cursor to end
                    cm.setCursor(cm.lineCount(), 0);
                }
            }
        }
    });
    
    // Set CodeMirror editors to dark theme (monokai)
    codeEditor.setOption('theme', 'monokai');
    replEditor.setOption('theme', 'monokai');

    // Auto-save on code editor changes (debounced)
    let saveTimeout;
    codeEditor.on('change', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveUniversalState();
        }, 1000); // Save 1 second after user stops typing
    });

    // iOS fix: Handle Enter key more reliably on virtual keyboard
    replEditor.getInputField().addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const enterHandler = replEditor.getOption('extraKeys')['Enter'];
            if (enterHandler) {
                enterHandler(replEditor);
            }
        }
    });

    // Run code from editor
    runCodeBtn.addEventListener('click', () => {
        const code = codeEditor.getValue();
        const result = interpreter.run(code);
        
        if (result.success) {
            addSystemMessage(`✓ ${result.message}`, 'result');
            addSystemMessage('Now try calling your functions by typing their name below!', 'info');
        } else {
            addSystemMessage(`✗ Error: ${result.error}`, 'error');
        }
    });

    // Examples menu functionality
    const examplesToggle = document.getElementById('examplesToggle');
    const examplesSubmenu = document.getElementById('examplesSubmenu');
    
    let exampleSections = {};
    
    // Load and parse examples file
    async function loadExamplesFile() {
        try {
            const response = await fetch('examples.txt');
            if (!response.ok) {
                throw new Error('Failed to load examples');
            }
            const text = await response.text();
            
            // Parse sections separated by === markers (handle both \n and \r\n)
            const sectionRegex = /===\s*(.+?)\s*===[\r\n]+/g;
            const sections = [];
            let match;
            let lastIndex = 0;
            
            while ((match = sectionRegex.exec(text)) !== null) {
                const sectionName = match[1].trim();
                const startIndex = match.index + match[0].length;
                
                // Find the next section or end of file
                const nextMatch = sectionRegex.exec(text);
                const endIndex = nextMatch ? nextMatch.index : text.length;
                
                // Reset regex for next iteration
                sectionRegex.lastIndex = endIndex;
                
                const sectionContent = text.substring(startIndex, endIndex).trim();
                exampleSections[sectionName] = sectionContent;
            }
            
            // Populate submenu with section names
            Object.keys(exampleSections).forEach(sectionName => {
                const button = document.createElement('button');
                button.className = 'submenu-item';
                button.textContent = sectionName;
                button.addEventListener('click', () => loadExampleSection(sectionName));
                examplesSubmenu.appendChild(button);
            });
        } catch (error) {
            console.error('Error loading examples:', error);
            addSystemMessage(`✗ Error loading examples: ${error.message}`, 'error');
        }
    }
    
    // Load examples on page load
    loadExamplesFile();
    
    // Load exercises on page load
    loadExercisesFile();
    
    // Toggle examples submenu
    examplesToggle.addEventListener('click', () => {
        examplesToggle.classList.toggle('expanded');
        examplesSubmenu.classList.toggle('expanded');
    });
    
    // Load a specific example section
    function loadExampleSection(sectionName) {
        const content = exampleSections[sectionName];
        if (content) {
            codeEditor.setValue(content);
            codeEditor.setCursor({ line: 0, ch: 0 });
            addSystemMessage(`✓ Loaded example: ${sectionName}! Click "Run Code" to define the functions.`, 'result');
            closeMenuFunc(); // Close menu after loading
        }
    }

    // Load and parse exercises file
    async function loadExercisesFile() {
        try {
            const response = await fetch('exercises.txt');
            if (!response.ok) {
                throw new Error('Failed to load exercises');
            }
            const text = await response.text();
            
            // Parse sections separated by === markers
            const sectionRegex = /===\s*(.+?)\s*===[\r\n]+/g;
            let match;
            let lastIndex = 0;
            
            while ((match = sectionRegex.exec(text)) !== null) {
                const title = match[1].trim();
                const startIndex = match.index + match[0].length;
                
                // Find the next section or end of file
                const nextMatch = sectionRegex.exec(text);
                const endIndex = nextMatch ? nextMatch.index : text.length;
                
                // Reset regex for next iteration
                sectionRegex.lastIndex = endIndex;
                
                const content = text.substring(startIndex, endIndex).trim();
                exerciseTitles.push(title);
                exerciseData.push(convertMarkdownToHtml(content));
            }
            
            // Generate exercise buttons
            generateExerciseButtons();
            
            // Initialize exercises functionality
            initExercises();
        } catch (error) {
            console.error('Error loading exercises:', error);
            addSystemMessage(`✗ Error loading exercises: ${error.message}`, 'error');
        }
    }
    
    // Convert markdown-style formatting to HTML
    function convertMarkdownToHtml(content) {
        // Convert code blocks ```...``` to <pre><code>...</code></pre>
        content = content.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Convert inline code `...` to <code>...</code>
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Convert double newlines to paragraphs
        const paragraphs = content.split('\n\n').map(para => {
            para = para.trim();
            if (para.startsWith('<pre>') || para.startsWith('<code>')) {
                return para;
            }
            return para ? `<p>${para.replace(/\n/g, ' ')}</p>` : '';
        }).filter(p => p).join('\n');
        
        return paragraphs;
    }
    
    // Generate exercise buttons dynamically
    function generateExerciseButtons() {
        const container = document.querySelector('.exercise-buttons-container');
        if (!container) return;
        
        container.innerHTML = ''; // Clear existing buttons
        
        exerciseTitles.forEach((title, index) => {
            const btn = document.createElement('button');
            btn.className = 'exercise-btn';
            btn.setAttribute('data-exercise', index + 1);
            btn.setAttribute('title', title);
            btn.textContent = index + 1;
            container.appendChild(btn);
        });
    }

    // Clear editor button
    const clearEditorBtn = document.getElementById('clearEditor');
    clearEditorBtn.addEventListener('click', () => {
        codeEditor.setValue('-- Write your function definitions here\n');
        codeEditor.setCursor({ line: 1, ch: 0 });
        addSystemMessage('Editor cleared. Write your functions and click "Run Code".', 'info');
        saveUniversalState(); // Save cleared state
    });

    // Clear REPL history
    clearReplBtn.addEventListener('click', () => {
        replOutput.innerHTML = '';
        replEditor.focus();
        saveUniversalState(); // Save cleared state
    });

    // Initialize exercises functionality (this will set up initial editor state)
    initExercises();
});

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Save universal editor/REPL state to localStorage
function saveUniversalState() {
    const state = {
        code: codeEditor.getValue(),
        replHistory: document.getElementById('replOutput').innerHTML
    };
    localStorage.setItem('haskishState', JSON.stringify(state));
}

// Load universal state from localStorage
function loadUniversalState() {
    const state = JSON.parse(localStorage.getItem('haskishState') || 'null');
    return state;
}

// Auto-save universal state periodically
setInterval(() => {
    if (codeEditor) {
        saveUniversalState();
    }
}, 5000); // Save every 5 seconds

// Exercises functionality
function initExercises() {
    // Load universal state on startup
    const savedState = loadUniversalState();
    const replOutput = document.getElementById('replOutput');
    
    if (savedState) {
        codeEditor.setValue(savedState.code || '-- Write your function definitions here\n');
        replOutput.innerHTML = savedState.replHistory || '';
        // Scroll REPL to bottom if there's history
        if (savedState.replHistory) {
            replOutput.scrollTop = replOutput.scrollHeight;
            addSystemMessage('Previous session restored!', 'info');
        } else {
            addSystemMessage('Click "Run Code" to load functions, then try expressions in the REPL! (Examples available in the menu ☰)', 'info');
        }
    } else {
        codeEditor.setValue('-- Write your function definitions here\n');
        addSystemMessage('Click "Run Code" to load functions, then try expressions in the REPL! (Examples available in the menu ☰)', 'info');
    }
    
    // Exercise button click - show exercise content
    const exerciseButtons = document.querySelectorAll('.exercise-btn');
    exerciseButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const exerciseId = btn.getAttribute('data-exercise');
            
            // Update current exercise ID
            currentExerciseId = exerciseId;
            
            // Remove active class from all buttons
            exerciseButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Show exercise content
            showExerciseContent(exerciseId);
            
            // Update mobile navigation
            updateMobileNavigationLabel();
        });
    });
    
    // Mobile exercise navigation
    initMobileNavigation();
    
    // Auto-load first exercise on startup
    const exerciseToLoad = document.querySelector('.exercise-btn[data-exercise="1"]');
    if (exerciseToLoad) {
        exerciseToLoad.click();
    }
}

function initMobileNavigation() {
    const prevBtn = document.getElementById('prevExercise');
    const nextBtn = document.getElementById('nextExercise');
    const label = document.getElementById('currentExerciseLabel');
    
    // Make update function globally accessible
    window.updateMobileNavigationLabel = function() {
        if (currentExerciseId) {
            const exId = parseInt(currentExerciseId);
            const title = exerciseTitles[exId - 1] || `Exercise ${exId}`;
            label.textContent = `${exId}. ${title}`;
            
            prevBtn.disabled = exId <= 1;
            nextBtn.disabled = exId >= exerciseTitles.length;
        } else {
            label.textContent = 'Select an exercise';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    };
    
    function navigateToExercise(exerciseId) {
        const btn = document.querySelector(`.exercise-btn[data-exercise="${exerciseId}"]`);
        if (btn) {
            btn.click();
        }
    }
    
    prevBtn.addEventListener('click', () => {
        if (currentExerciseId) {
            const prevId = parseInt(currentExerciseId) - 1;
            if (prevId >= 1) {
                navigateToExercise(prevId.toString());
            }
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentExerciseId) {
            const nextId = parseInt(currentExerciseId) + 1;
            if (nextId <= exerciseTitles.length) {
                navigateToExercise(nextId.toString());
            }
        }
    });
    
    // Initialize mobile nav state
    updateMobileNavigationLabel();
}

function showExerciseContent(exerciseId) {
    const panel = document.getElementById('exercisePanel');
    const title = document.getElementById('exerciseTitle');
    const content = document.getElementById('exerciseContent');
    
    const index = parseInt(exerciseId) - 1;
    
    if (index >= 0 && index < exerciseData.length) {
        title.textContent = `${exerciseId}. ${exerciseTitles[index]}`;
        content.innerHTML = exerciseData[index];
        panel.style.display = 'flex';
    }
}

function hideExerciseContent() {
    const panel = document.getElementById('exercisePanel');
    panel.style.display = 'none';
}

// Prevent pinch-to-zoom on mobile devices
document.addEventListener('touchmove', (e) => {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
}, { passive: false });
