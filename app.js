// Haskish App - UI Controller

// Version number
const HASKISH_VERSION = '1.0.11';

const interpreter = new HaskishInterpreter();

// REPL command history (for up/down arrow navigation)
let replHistory = [];
let replHistoryIndex = -1;
let replCurrentInput = '';

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

let scrollPosition = 0;

function openMenu() {
    // Save current scroll position and lock body
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
    
    menuPanel.classList.add('open');
    menuOverlay.classList.add('visible');
    document.documentElement.classList.add('menu-open');
    document.body.classList.add('menu-open');
    
    // Force reflow to ensure menu scroll container is established (iOS fix)
    void menuPanel.offsetHeight;
    
    // Block touch events on main content and all scrollable children
    if (mainContent) {
        mainContent.addEventListener('touchmove', preventContentScroll, { passive: false, capture: true });
        
        // Also block on all output areas that can scroll
        const scrollables = mainContent.querySelectorAll('.output, .repl-history, .column');
        scrollables.forEach(el => {
            el.addEventListener('touchmove', preventContentScroll, { passive: false, capture: true });
        });
    }
}

function closeMenuFunc() {
    menuPanel.classList.remove('open');
    menuOverlay.classList.remove('visible');
    document.documentElement.classList.remove('menu-open');
    document.body.classList.remove('menu-open');
    
    // Restore body scroll position
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollPosition);

    // Restore touch events on main content
    if (mainContent) {
        mainContent.removeEventListener('touchmove', preventContentScroll, { capture: true });
        
        // Remove from all output areas
        const scrollables = mainContent.querySelectorAll('.output, .repl-history, .column');
        scrollables.forEach(el => {
            el.removeEventListener('touchmove', preventContentScroll, { capture: true });
        });
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
const toggleExercisesBtn = document.getElementById('toggleExercises');

function toggleExercisesPanel() {
    const exercisesColumn = document.getElementById('exercisesColumn');
    const mainContent = document.getElementById('mainContent');
    const isVisible = exercisesColumn.style.display !== 'none';
    
    if (isVisible) {
        exercisesColumn.style.display = 'none';
        mainContent.classList.remove('exercises-visible');
        document.body.classList.remove('exercises-visible');
        toggleExercisesBtn.classList.remove('active');
    } else {
        exercisesColumn.style.display = 'flex';
        mainContent.classList.add('exercises-visible');
        document.body.classList.add('exercises-visible');
        toggleExercisesBtn.classList.add('active');
    }
}

toggleExercisesBtn.addEventListener('click', function() {
    toggleExercisesPanel();
    // Close menu after toggling
    closeMenuFunc();
});

// Close lessons button in the panel itself
const closeLessonsBtn = document.getElementById('closeLessons');
closeLessonsBtn.addEventListener('click', function() {
    toggleExercisesPanel();
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

// Welcome modal
const welcomeModal = document.getElementById('welcomeModal');
const startCodingBtn = document.getElementById('startCoding');
const showWelcomeCheckbox = document.getElementById('showWelcome');
const welcomeVersion = document.getElementById('welcomeVersion');

// Set version in welcome modal
welcomeVersion.textContent = HASKISH_VERSION;

// Check if we should show the welcome modal
function shouldShowWelcome() {
    const showWelcome = localStorage.getItem('haskish_showWelcome');
    // Default to true if not set
    return showWelcome === null || showWelcome === 'true';
}

// Initialize checkbox state
showWelcomeCheckbox.checked = shouldShowWelcome();

// Show welcome modal on first load
if (shouldShowWelcome()) {
    setTimeout(() => {
        welcomeModal.classList.add('visible');
    }, 300);
}

// Handle Start Coding button
startCodingBtn.addEventListener('click', function() {
    welcomeModal.classList.remove('visible');
});

// Handle checkbox change
showWelcomeCheckbox.addEventListener('change', function() {
    localStorage.setItem('haskish_showWelcome', this.checked.toString());
});

// Close modal when clicking overlay
welcomeModal.addEventListener('click', function(e) {
    if (e.target === welcomeModal) {
        welcomeModal.classList.remove('visible');
    }
});

// About overlay
const aboutButton = document.getElementById('aboutButton');
const aboutOverlay = document.getElementById('aboutOverlay');
const closeAbout = document.getElementById('closeAbout');

aboutButton.addEventListener('click', function() {
    aboutOverlay.classList.add('visible');
    // Display version number
    const versionDisplay = document.getElementById('versionDisplay');
    if (versionDisplay) {
        versionDisplay.textContent = `Version ${HASKISH_VERSION}`;
    }
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
        mode: 'haskish',
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
    
    replEditor = CodeMirror.fromTextArea(replInputTextarea, {
        mode: 'haskish',
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
                
                // Add to history (limit to last 100 commands, avoid consecutive duplicates)
                if (replHistory.length === 0 || replHistory[replHistory.length - 1] !== expr) {
                    replHistory.push(expr);
                    // Keep only last 100 commands
                    if (replHistory.length > 100) {
                        replHistory.shift();
                    }
                }
                replHistoryIndex = replHistory.length;
                replCurrentInput = '';
                
                // Add input to history with syntax highlighting
                const inputDiv = document.createElement('div');
                inputDiv.className = 'repl-entry';
                
                const promptSpan = document.createElement('span');
                promptSpan.className = 'repl-prompt';
                promptSpan.textContent = '> ';
                
                const inputCode = document.createElement('code');
                inputCode.className = 'repl-input-code cm-s-monokai';
                inputDiv.appendChild(promptSpan);
                inputDiv.appendChild(inputCode);
                
                replOutput.appendChild(inputDiv);
                
                // Apply syntax highlighting to input
                CodeMirror.runMode(expr, 'haskish', inputCode);

                // Evaluate expression
                const result = interpreter.evaluateRepl(expr);
                const outputDiv = document.createElement('div');
                
                if (result.success) {
                    // Use warning style if this is a redefinition
                    outputDiv.className = result.isWarning ? 'repl-warning' : 'repl-result';
                    // Check if output should be plain text (for REPL commands)
                    if (result.plainText) {
                        outputDiv.textContent = result.result;
                        outputDiv.style.whiteSpace = 'pre-wrap';
                        outputDiv.style.fontFamily = 'monospace';
                    } else if (result.highlighted) {
                        // Apply syntax highlighting while preserving formatting
                        const outputCode = document.createElement('code');
                        outputCode.className = 'repl-output-code cm-s-monokai';
                        outputDiv.appendChild(outputCode);
                        CodeMirror.runMode(result.result, 'haskish', outputCode);
                    } else {
                        const outputCode = document.createElement('code');
                        outputCode.className = 'repl-output-code cm-s-monokai';
                        outputDiv.appendChild(outputCode);
                        // Apply syntax highlighting to output
                        CodeMirror.runMode(result.result, 'haskish', outputCode);
                    }
                } else {
                    outputDiv.className = 'repl-error';
                    outputDiv.textContent = `Error: ${result.error}`;
                }
                
                replOutput.appendChild(outputDiv);
                
                // Limit REPL output history to last 50 interactions
                // Each interaction creates 2 divs (input + output), so keep last 100 divs
                const maxDivs = 100;
                while (replOutput.children.length > maxDivs) {
                    // Remove oldest entries (but keep system messages at top)
                    const firstChild = replOutput.firstElementChild;
                    if (firstChild && !firstChild.classList.contains('repl-info') && 
                        !firstChild.classList.contains('repl-error') && 
                        !firstChild.classList.contains('repl-result')) {
                        replOutput.removeChild(firstChild);
                    } else if (firstChild && firstChild.classList.contains('repl-entry')) {
                        replOutput.removeChild(firstChild);
                        // Also remove the following result/error div if it exists
                        if (replOutput.firstElementChild) {
                            replOutput.removeChild(replOutput.firstElementChild);
                        }
                    } else {
                        break; // Stop if we hit system messages
                    }
                }
                
                // Scroll to bottom
                replOutput.scrollTop = replOutput.scrollHeight;
                
                // Save state (including command history)
                saveUniversalState();
                
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

    // Focus REPL input when clicking anywhere in the REPL panel (but not if selecting text)
    document.getElementById('replOutput').addEventListener('click', () => {
        // Don't focus if user has selected text (they're probably trying to copy)
        const selection = window.getSelection();
        if (!selection || selection.toString().length === 0) {
            replEditor.focus();
        }
    });

    // Run code from editor
    runCodeBtn.addEventListener('click', () => {
        const code = codeEditor.getValue();
        const result = interpreter.run(code);
        
        if (result.success) {
            addSystemMessage(`✓ ${result.message}`, 'result');
            
            // Display any warnings
            if (result.warnings && result.warnings.length > 0) {
                result.warnings.forEach(warning => {
                    addSystemMessage(`⚠ ${warning}`, 'warning');
                });
            }
            
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
            const response = await fetch('data/examples.txt');
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
            const response = await fetch('data/lessons.txt');
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
            
            // Highlight code blocks with Prism.js
            if (typeof Prism !== 'undefined') {
                Prism.highlightAll();
            }
        } catch (error) {
            console.error('Error loading exercises:', error);
            addSystemMessage(`✗ Error loading exercises: ${error.message}`, 'error');
        }
    }
    
    // Convert markdown-style formatting to HTML
    function convertMarkdownToHtml(content) {
        // Normalize line endings first (Windows uses \r\n, we want just \n)
        content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Convert code blocks ```...``` to <pre><code>...</code></pre> BEFORE normalizing newlines
        content = content.replace(/```([\s\S]*?)```/g, (match, code) => {
            
            // Split into lines
            let lines = code.split('\n');
            
            // Remove leading empty lines
            while (lines.length > 0 && lines[0].trim() === '') {
                lines.shift();
            }
            
            // Remove trailing empty lines
            while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
                lines.pop();
            }
            
            // Find minimum indentation
            const minIndent = lines
                .filter(line => line.trim().length > 0)
                .reduce((min, line) => {
                    const indent = line.match(/^\s*/)[0].length;
                    return Math.min(min, indent);
                }, Infinity);
            
            // Remove minimum indentation from all lines
            if (minIndent > 0 && minIndent < Infinity) {
                lines = lines.map(line => line.slice(minIndent));
            }
            
            code = lines.join('\n');
            return `<pre><code class="language-haskell">${code}</code></pre>`;
        });
        
        // NOW normalize 3+ newlines to exactly 2 (1 blank line) - but this won't affect code blocks
        content = content.replace(/\n{3,}/g, '\n\n');
        
        // Convert inline code `...` to <code>...</code>
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Convert challenge headings **~...~** to <span class="challenge-heading">...</span> (must be before regular bold)
        content = content.replace(/\*\*~([^~]+)~\*\*/g, '<span class="challenge-heading">$1</span>');
        
        // Convert key terms **_..._** to <span class="key-term">...</span> (must be before regular bold)
        content = content.replace(/\*\*_([^_]+)_\*\*/g, '<span class="key-term">$1</span>');
        
        // Convert bold **...** to <strong>...</strong>
        content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Protect newlines inside code blocks from being used as paragraph separators
        // Replace \n\n inside <pre><code>...</code></pre> with a placeholder
        const codeBlockPlaceholder = '\u0000CODEBLOCK_NEWLINE\u0000';
        content = content.replace(/(<pre><code[^>]*>)([\s\S]*?)(<\/code><\/pre>)/g, (match, openTag, code, closeTag) => {
            // Replace double newlines inside code blocks with placeholder
            const protectedCode = code.replace(/\n\n/g, codeBlockPlaceholder);
            return openTag + protectedCode + closeTag;
        });
        
        // Convert double newlines to paragraphs, but handle lists and code blocks specially
        let paragraphs = content.split('\n\n').map(para => {
            para = para.trim();
            
            // If it's ONLY a code block, return as-is
            if (para.startsWith('<pre>') && para.endsWith('</pre>')) {
                return para;
            }
            
            // Check if this paragraph contains bullet list items
            const lines = para.split('\n');
            const hasListItems = lines.some(line => line.trim().startsWith('-'));
            
            if (hasListItems) {
                // Process as a list, where each list item can be multi-line (including code blocks)
                const items = [];
                let currentItem = null;
                
                for (const line of lines) {
                    if (line.trim().startsWith('-')) {
                        // Start a new list item
                        if (currentItem !== null) {
                            items.push(currentItem);
                        }
                        currentItem = line.trim().substring(1).trim();
                    } else if (currentItem !== null) {
                        // Continue the current list item (could be a code block or continuation)
                        currentItem += '\n' + line;
                    }
                }
                
                // Add the last item
                if (currentItem !== null) {
                    items.push(currentItem);
                }
                
                // Convert items to HTML
                const htmlItems = items.map(item => `<li>${item}</li>`).join('\n');
                return `<ul>\n${htmlItems}\n</ul>`;
            }
            
            // For paragraphs that may contain code blocks, preserve newlines inside <pre> tags
            if (para.includes('<pre>')) {
                // Split on <pre> and </pre> to isolate code blocks
                const parts = para.split(/(<pre>[\s\S]*?<\/pre>)/);
                const processed = parts.map(part => {
                    if (part.startsWith('<pre>')) {
                        return part; // Keep code blocks as-is
                    } else {
                        return part.replace(/\n/g, ' '); // Replace newlines with spaces in text
                    }
                }).join('');
                return processed ? `<p>${processed}</p>` : '';
            }
            
            // For regular paragraphs, join lines with spaces
            return para ? `<p>${para.replace(/\n/g, ' ')}</p>` : '';
        }).filter(p => p).join('\n\n');
        
        // Restore the protected newlines inside code blocks
        paragraphs = paragraphs.replace(/\u0000CODEBLOCK_NEWLINE\u0000/g, '\n\n');
        
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

    // File save/load functionality
    let fileHandle = null; // Store file handle for File System Access API

    // Check if File System Access API is available
    const hasFileSystemAPI = 'showOpenFilePicker' in window;

    // Save file
    document.getElementById('saveFile').addEventListener('click', async () => {
        const code = codeEditor.getValue();
        const filename = 'functions.haskish';
        
        try {
            if (hasFileSystemAPI) {
                // Use File System Access API (modern browsers)
                const options = {
                    suggestedName: filename,
                    types: [{
                        description: 'Haskish Files',
                        accept: { 'text/plain': ['.haskish', '.hs', '.txt'] }
                    }]
                };
                
                fileHandle = await window.showSaveFilePicker(options);
                const writable = await fileHandle.createWritable();
                await writable.write(code);
                await writable.close();
                
                addSystemMessage('✓ Functions saved successfully!', 'result');
            } else {
                // Fallback: download file (iOS-compatible)
                const blob = new Blob([code], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                
                // iOS Safari requires the link to be in the DOM
                document.body.appendChild(a);
                a.click();
                
                // Clean up after a delay to ensure download starts
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                
                addSystemMessage('✓ Functions downloaded to your Downloads folder!', 'result');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Save error:', error);
                addSystemMessage('Error saving file: ' + error.message, 'error');
            }
        }
    });

    // Load file
    document.getElementById('loadFile').addEventListener('click', async () => {
        try {
            if (hasFileSystemAPI) {
                // Use File System Access API (modern browsers)
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Haskish Files',
                        accept: { 'text/plain': ['.haskish', '.hs', '.txt'] }
                    }],
                    multiple: false
                });
                
                fileHandle = handle;
                const file = await handle.getFile();
                const code = await file.text();
                
                codeEditor.setValue(code);
                addSystemMessage(`✓ Loaded ${file.name}! Click "Run Code" to use the functions.`, 'result');
                saveUniversalState();
            } else {
                // Fallback: use file input
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.haskish,.hs,.txt';
                
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const code = await file.text();
                        codeEditor.setValue(code);
                        addSystemMessage(`✓ Loaded ${file.name}! Click "Run Code" to use the functions.`, 'result');
                        saveUniversalState();
                    }
                };
                
                input.click();
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Load error:', error);
                addSystemMessage('Error loading file: ' + error.message, 'error');
            }
        }
    });

    // Clear editor button
    const clearEditorBtn = document.getElementById('clearEditor');
    clearEditorBtn.addEventListener('click', () => {
        codeEditor.setValue('-- Write your function definitions here\n');
        codeEditor.setCursor({ line: 1, ch: 0 });
        replOutput.innerHTML = '';  // Also clear REPL output
        replHistory = [];  // Clear command history
        replHistoryIndex = -1;
        interpreter.functions = {};
        interpreter.variables = {};
        addSystemMessage('Click "Run Code" to load functions, then try expressions in the REPL! Type :help for commands. (Examples in menu ☰)', 'info');
        saveUniversalState(); // Save cleared state
    });

    // Clear REPL history
    clearReplBtn.addEventListener('click', () => {
        replOutput.innerHTML = '';
        replHistory = [];  // Clear command history
        replHistoryIndex = -1;
        interpreter.functions = {};
        interpreter.variables = {};
        addSystemMessage('Click "Run Code" to load functions, then try expressions in the REPL! Type :help for commands. (Examples in menu ☰)', 'info');
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
        replHistory: document.getElementById('replOutput').innerHTML,
        replCommandHistory: replHistory  // Save command history for up/down arrows
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
        
        // Restore command history for up/down arrows
        if (savedState.replCommandHistory && Array.isArray(savedState.replCommandHistory)) {
            replHistory = savedState.replCommandHistory;
            replHistoryIndex = replHistory.length;
        }
        
        // Scroll REPL to bottom if there's history
        if (savedState.replHistory) {
            replOutput.scrollTop = replOutput.scrollHeight;
            addSystemMessage('Previous session restored!', 'info');
        } else {
            addSystemMessage('Click "Run Code" to load functions, then try expressions in the REPL! Type :help for commands. (Examples in menu ☰)', 'info');
        }
    } else {
        codeEditor.setValue('-- Write your function definitions here\n');
        addSystemMessage('Click "Run Code" to load functions, then try expressions in the REPL! Type :help for commands. (Examples in menu ☰)', 'info');
    }
    
    // Focus REPL input on startup
    setTimeout(() => {
        replEditor.focus();
    }, 100);
    
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
            const title = exerciseTitles[exId - 1] || `Lesson ${exId}`;
            label.textContent = `${exId}. ${title}`;
            
            prevBtn.disabled = exId <= 1;
            nextBtn.disabled = exId >= exerciseTitles.length;
        } else {
            label.textContent = 'Select a lesson';
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
        
        // Scroll the panel to top (panel is the scrollable container)
        panel.scrollTop = 0;
        
        // Highlight code blocks with Prism.js
        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(content);
        }
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
