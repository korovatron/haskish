// Haskish App - UI Controller

const interpreter = new HaskishInterpreter();

// Module hints data
const moduleHints = {
    1: {
        title: "Module 1: Getting Started",
        content: `
            <h3>Welcome to Haskish!</h3>
            <p>This functional programming playground has two main areas:</p>
            <ul>
                <li><strong>Code Panel</strong> (left) - Write function definitions here</li>
                <li><strong>Interactive REPL</strong> (below) - Test expressions and call functions</li>
            </ul>
            
            <h4>Function Syntax</h4>
            <pre><code>functionName parameter = expression

-- Examples:
triple x = x * 3
doubleAdd x y = 2*x + 2*y</code></pre>
            
            <h4>Basic Operators</h4>
            <ul>
                <li>Arithmetic: <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>mod</code>, <code>div</code></li>
                <li>Comparison: <code>==</code>, <code>/=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code></li>
                <li>Boolean: <code>&&</code>, <code>||</code>, <code>not</code></li>
            </ul>
            
            <h4>Testing in REPL</h4>
            <pre><code>> triple 5
15
> doubleAdd 3 4
14</code></pre>
        `
    },
    2: {
        title: "Module 2: Functions & Recursion",
        content: `
            <h3>Recursive Functions</h3>
            <p>Functions that call themselves to solve problems. Always need a base case!</p>
            
            <h4>Pattern Matching (Multiple Definitions)</h4>
            <p>Define the same function multiple times for different inputs:</p>
            <pre><code>factorial 0 = 1
factorial n = n * factorial (n - 1)

fib 0 = 0
fib 1 = 1
fib n = fib (n-1) + fib (n-2)</code></pre>
            
            <h4>Guards (Alternative Approach) 🌟</h4>
            <p>Use guards when you need to test conditions rather than match values:</p>
            <pre><code>factorial n
  | n == 0    = 1
  | otherwise = n * factorial (n - 1)

sign n
  | n < 0     = -1
  | n == 0    = 0
  | otherwise = 1</code></pre>
            
            <h4>When to Use Each</h4>
            <ul>
                <li><strong>Pattern matching</strong>: Matching specific values (0, [], etc.)</li>
                <li><strong>Guards</strong>: Comparing values (&lt;, &gt;, ==) or complex conditions</li>
            </ul>
            
            <h4>Key Points</h4>
            <ul>
                <li>Patterns/guards are checked top-to-bottom</li>
                <li><code>otherwise</code> catches all remaining cases</li>
                <li>Guards can be indented with any number of spaces (or none)</li>
            </ul>
        `
    },
    3: {
        title: "Module 3: Lists & Pattern Matching",
        content: `
            <h3>Pattern Matching with (x:xs)</h3>
            <p>Decompose lists into head and tail for recursive processing.</p>
            
            <h4>Understanding the Pattern</h4>
            <ul>
                <li><code>[]</code> - Empty list (base case)</li>
                <li><code>(x:xs)</code> - x is head (single element), xs is tail (rest)</li>
                <li><code>x</code> is NOT a list, <code>xs</code> IS a list</li>
            </ul>
            
            <h4>Basic Examples</h4>
            <pre><code>calcLength [] = 0
calcLength (x:xs) = 1 + calcLength xs

sumList [] = 0
sumList (x:xs) = x + sumList xs</code></pre>
            
            <h4>With Guards</h4>
            <pre><code>countElem e [] = 0
countElem e (x:xs)
  | x == e    = 1 + countElem e xs
  | otherwise = countElem e xs</code></pre>
            
            <h4>List Functions</h4>
            <ul>
                <li><code>head</code>, <code>tail</code>, <code>length</code>, <code>reverse</code></li>
                <li><code>take n xs</code>, <code>drop n xs</code></li>
                <li><code>:</code> (cons), <code>++</code> (concatenate)</li>
            </ul>
        `
    },
    4: {
        title: "Module 4: Higher-Order Functions",
        content: `
            <h3>Map, Filter, and Fold</h3>
            <p>Higher-order functions that take functions as arguments.</p>
            
            <h4>map - Transform each element</h4>
            <pre><code>double x = x * 2
map double [1,2,3]        -- [2,4,6]
map even [1,2,3,4]        -- [False,True,False,True]</code></pre>
            
            <h4>filter - Select elements</h4>
            <pre><code>isPositive x = x > 0
filter isPositive [-2,3,-1,4]  -- [3,4]
filter even [1..10]            -- [2,4,6,8,10]</code></pre>
            
            <h4>fold - Reduce to single value</h4>
            <pre><code>add x y = x + y
fold add 0 [1,2,3,4]      -- 10
fold (*) 1 [1,2,3,4]      -- 24</code></pre>
            
            <h4>Lambda Functions 🌟 (Extension)</h4>
            <p>Anonymous functions for one-time use (not required for A Level):</p>
            <pre><code>map (\\x -> x * 2) [1,2,3]  -- [2,4,6]
filter (\\x -> x > 5) [1..10]
filter (\\x -> mod x 3 == 0) [1..10]</code></pre>
            <p>Format: <code>\\parameter -> expression</code></p>
            
            <h4>Problem Solving</h4>
            <p>Combine these to solve complex problems elegantly!</p>
        `
    },
    5: {
        title: "Module 5: Function Composition",
        content: `
            <h3>Composing Functions</h3>
            <p>Combine functions to create more complex operations.</p>
            
            <h4>The . Operator</h4>
            <pre><code>double x = x * 2
square x = x * x

(square . double) 3   -- 36  (square of 6)
(double . square) 3   -- 18  (double of 9)</code></pre>
            
            <h4>The $ Operator</h4>
            <p>Apply a function (avoids parentheses):</p>
            <pre><code>square . double $ 3    -- Same as (square . double) 3
sum . filter even $ [1..10]</code></pre>
            
            <h4>Solving Problems</h4>
            <pre><code>-- Sum of multiples of 3 or 5 below 100:
sum (filter (\\n -> mod n 3 == 0 || mod n 5 == 0) [1..99])

-- Sum of even numbers 100-300:
sum (filter even [100..300])</code></pre>
            
            <h4>Key Concept</h4>
            <p>Output of one function becomes input to the next!</p>
            <pre><code>f . g $ x    means    f(g(x))</code></pre>
        `
    }
};

// Exercise content data
const exerciseData = {
    // Module 1: Getting Started
    1: {
        title: "1. Using the REPL",
        content: `
            <h3>Task</h3>
            <p>Get familiar with the Interactive REPL (Read-Eval-Print Loop) below. Try these expressions:</p>
            
            <h3>Examples to Try</h3>
            <pre><code>> 15 + 12
> 3 * 56
> True && False
> not (False && True)
> 5 == 5
> 5 /= 5
> "hello" == "hello"</code></pre>
            
            <div class="hint">
                <strong>💡 Remember:</strong>
                <ul>
                    <li><code>&&</code> means AND, <code>||</code> means OR</li>
                    <li><code>/=</code> means not equal</li>
                    <li>Type expressions in the REPL and press Enter</li>
                </ul>
            </div>
        `
    },
    2: {
        title: "2. First Function",
        content: `
            <h3>Task</h3>
            <p>Write a function called <code>tripleMe</code> that takes a number and returns triple its value.</p>
            
            <h3>Example</h3>
            <pre><code>> tripleMe 10
30
> tripleMe 7
21</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> In the Code Panel above, write:<br>
                <code>tripleMe x = x * 3</code><br>
                Click "Run Code", then test in the REPL!
            </div>
        `
    },
    3: {
        title: "3. Multiple Parameters",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>doubleAdd</code> that takes two values, doubles each of them, and adds them together.</p>
            
            <h3>Example</h3>
            <pre><code>> doubleAdd 3 4
14
> doubleAdd 10 5
30</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> <code>doubleAdd x y = 2*x + 2*y</code>
            </div>
        `
    },
    4: {
        title: "4. Comparison Function",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>isPositive</code> that returns <code>True</code> if a number is greater than 0, <code>False</code> otherwise.</p>
            
            <h3>Example</h3>
            <pre><code>> isPositive 5
True
> isPositive (-3)
False
> isPositive 0
False</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Use the <code>></code> operator to compare with 0
            </div>
        `
    },

    // Module 2: Functions & Recursion
    5: {
        title: "5. Factorial",
        content: `
            <h3>Task</h3>
            <p>Write a recursive function <code>factorial</code> using pattern matching. Remember: 0! = 1, and n! = n × (n-1)!</p>
            
            <h3>Example</h3>
            <pre><code>factorial 0 = 1
factorial n = n * factorial (n - 1)

> factorial 5
120
> factorial 10
3628800</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Define the function twice - once for 0 (base case), once for n (recursive case)
            </div>
        `
    },
    6: {
        title: "6. Fibonacci",
        content: `
            <h3>Task</h3>
            <p>Write a recursive function <code>fib</code> that calculates the nth Fibonacci number using pattern matching.</p>
            
            <h3>Example</h3>
            <pre><code>fib 0 = 0
fib 1 = 1
fib n = fib (n-1) + fib (n-2)

> fib 6
8
> fib 10
55</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> You need THREE definitions - for 0, for 1, and for n
            </div>
        `
    },
    7: {
        title: "7. Sum To N",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>sumTo</code> that adds all numbers from 0 to n. Try using guards this time!</p>
            
            <h3>Example</h3>
            <pre><code>sumTo n
  | n == 0    = 0
  | otherwise = n + sumTo (n-1)

> sumTo 5
15
> sumTo 100
5050</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Guards start with <code>|</code> and can test conditions
            </div>
        `
    },
    8: {
        title: "8. Sign Function",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>sign</code> using guards that returns -1 for negative numbers, 0 for zero, and 1 for positive numbers.</p>
            
            <h3>Example</h3>
            <pre><code>> sign (-5)
-1
> sign 0
0
> sign 10
1</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Use three guards: <code>| n < 0</code>, <code>| n == 0</code>, <code>| otherwise</code>
            </div>
        `
    },
    9: {
        title: "9. Power Function",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>power</code> that calculates x raised to the power n (x^n) using recursion.</p>
            
            <h3>Example</h3>
            <pre><code>> power 2 3
8
> power 5 2
25
> power 10 0
1</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Base case: anything to power 0 is 1. Recursive: x^n = x × x^(n-1)
            </div>
        `
    },

    // Module 3: Lists & Pattern Matching
    10: {
        title: "10. Calculate Length",
        content: `
            <h3>Task</h3>
            <p>Write a recursive function <code>calcLength</code> using (x:xs) pattern matching to find the length of a list.</p>
            
            <h3>Example</h3>
            <pre><code>calcLength [] = 0
calcLength (x:xs) = 1 + calcLength xs

> calcLength [1,2,3,4]
4
> calcLength []
0</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Empty list has length 0. For (x:xs), length is 1 + length of xs
            </div>
        `
    },
    11: {
        title: "11. Sum List",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>sumList</code> that sums all elements in a list using (x:xs) pattern matching.</p>
            
            <h3>Example</h3>
            <pre><code>> sumList [2,5,1,9]
17
> sumList []
0</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Base case: sum of [] is 0. Recursive: sum of (x:xs) is x + sum of xs
            </div>
        `
    },
    12: {
        title: "12. Multiply List",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>multList</code> that multiplies all elements in a list together.</p>
            
            <h3>Example</h3>
            <pre><code>> multList [2,3,4]
24
> multList [1,2,3,4,5]
120</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Base case: product of [] is 1 (not 0!). Recursive: x * multList xs
            </div>
        `
    },
    13: {
        title: "13. Switch Binary ⭐",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>switchBinary</code> that takes a list of 0s and 1s and flips them (0→1, 1→0). Use guards!</p>
            
            <h3>Example</h3>
            <pre><code>switchBinary [] = []
switchBinary (x:xs)
  | x == 0    = 1 : switchBinary xs
  | x == 1    = 0 : switchBinary xs
  | otherwise = error "not binary"

> switchBinary [1,0,1,0]
[0,1,0,1]</code></pre>
            
            <div class="hint">
                <strong>💡 Challenge:</strong> Combine pattern matching AND guards!
            </div>
        `
    },
    14: {
        title: "14. Count Element",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>countElem</code> that counts how many times an element appears in a list.</p>
            
            <h3>Example</h3>
            <pre><code>> countElem 3 [1,3,2,3,4,3]
3
> countElem 5 [1,2,3,4]
0</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> If x == e, add 1 to the count. Otherwise, add 0
            </div>
        `
    },
    15: {
        title: "15. Remove All",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>removeAllElem</code> that removes ALL occurrences of an element from a list.</p>
            
            <h3>Example</h3>
            <pre><code>> removeAllElem 2 [0,2,1,2,3]
[0,1,3]
> removeAllElem 5 [1,2,3]
[1,2,3]</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> If x == e, skip it (don't cons it). Otherwise, cons x
            </div>
        `
    },
    16: {
        title: "16. Replace Elements ⭐",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>replace</code> that replaces all instances of one element with another in a list.</p>
            
            <h3>Example</h3>
            <pre><code>> replace 2 9 [1,2,3,2,4]
[1,9,3,9,4]
> replace "cat" "dog" ["cat","hat","cat"]
["dog","hat","dog"]</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> If x == oldElem, cons newElem. Otherwise, cons x
            </div>
        `
    },

    // Module 4: Higher-Order Functions
    17: {
        title: "17. Using Map",
        content: `
            <h3>Task</h3>
            <p>First, write a function <code>square</code>. Then use <code>map</code> to square every number in a list.</p>
            
            <h3>Example</h3>
            <pre><code>square x = x * x

> map square [1,2,3,4,5]
[1,4,9,16,25]</code></pre>
            
            <div class="hint">
                <strong>💡 Remember:</strong> map applies a function to every element
            </div>
        `
    },
    18: {
        title: "18. Using Filter",
        content: `
            <h3>Task</h3>
            <p>Use <code>filter</code> to get all even numbers from a list. You can use the built-in <code>even</code> function.</p>
            
            <h3>Example</h3>
            <pre><code>> filter even [1,2,3,4,5,6,7,8,9,10]
[2,4,6,8,10]</code></pre>
            
            <div class="hint">
                <strong>💡 Remember:</strong> filter selects elements where a condition is True
            </div>
        `
    },
    19: {
        title: "19. Using Fold",
        content: `
            <h3>Task</h3>
            <p>Use <code>fold</code> to multiply all numbers in a list together.</p>
            
            <h3>Example</h3>
            <pre><code>> fold (*) 1 [1,2,3,4,5]
120
> fold (*) 1 [2,3,4]
24</code></pre>
            
            <div class="hint">
                <strong>💡 Remember:</strong> fold combines elements with an operation. Initial value for multiplication is 1!
            </div>
        `
    },
    20: {
        title: "20. Map and Filter ⭐",
        content: `
            <h3>Task</h3>
            <p>Find the sum of squares of all even numbers in a list. Combine <code>filter</code>, <code>map</code>, and a sum function!</p>
            
            <h3>Example</h3>
            <pre><code>square x = x * x
mySum xs = fold (+) 0 xs

-- Combine them!
> mySum (map square (filter even [1,2,3,4,5]))
20</code></pre>
            
            <div class="hint">
                <strong>💡 Challenge:</strong> Think about the order - filter first, then map, then sum
            </div>
        `
    },
    21: {
        title: "21. Project Euler Style ⭐⭐",
        content: `
            <h3>Task</h3>
            <p>Find the sum of all multiples of 3 or 5 below 100. Write a predicate function, then use filter and fold!</p>
            
            <h3>Example</h3>
            <pre><code>multiple3or5 n = mod n 3 == 0 || mod n 5 == 0

> fold (+) 0 (filter multiple3or5 [1..99])
2318</code></pre>
            
            <div class="hint">
                <strong>💡 Challenge:</strong> This is a classic Project Euler problem!
            </div>
        `
    },

    // Module 5: Function Composition
    22: {
        title: "22. Basic Composition",
        content: `
            <h3>Task</h3>
            <p>Write two functions: <code>double x = x * 2</code> and <code>square x = x * x</code>. Then compose them with the <code>.</code> operator.</p>
            
            <h3>Example</h3>
            <pre><code>> (square . double) 3
36
> (double . square) 3
18</code></pre>
            
            <div class="hint">
                <strong>💡 Remember:</strong> <code>f . g</code> means "do g first, then f"
            </div>
        `
    },
    23: {
        title: "23. Understanding Order",
        content: `
            <h3>Task</h3>
            <p>Explain why <code>(square . double) 3</code> gives 36 but <code>(double . square) 3</code> gives 18.</p>
            
            <h3>Analysis</h3>
            <pre><code>(square . double) 3
= square (double 3)
= square 6
= 36

(double . square) 3
= double (square 3)
= double 9
= 18</code></pre>
            
            <div class="hint">
                <strong>💡 Key:</strong> Order matters! Right function is applied first
            </div>
        `
    },
    24: {
        title: "24. Sum of Evens ⭐",
        content: `
            <h3>Task</h3>
            <p>Find the sum of all even numbers between 100 and 300 using function composition.</p>
            
            <h3>Example</h3>
            <pre><code>mySum xs = fold (+) 0 xs

> mySum (filter even [100..300])
20100</code></pre>
            
            <div class="hint">
                <strong>💡 Challenge:</strong> Can you do it without parentheses using <code>$</code>?
            </div>
        `
    },
    25: {
        title: "25. Lambda Extension ⭐⭐",
        content: `
            <h3>Task (Extension)</h3>
            <p>Try using lambda functions (anonymous functions) with map and filter!</p>
            
            <h3>Example</h3>
            <pre><code>> map (\\x -> x * 2) [1,2,3,4,5]
[2,4,6,8,10]

> filter (\\x -> mod x 3 == 0) [1..20]
[3,6,9,12,15,18]</code></pre>
            
            <div class="hint">
                <strong>💡 Extension:</strong> Lambdas are written as <code>\\parameter -> expression</code>
            </div>
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
    moduleHeaders.forEach((header, index) => {
        header.addEventListener('click', () => {
            const module = header.parentElement;
            const isCurrentlyCollapsed = module.classList.contains('collapsed');
            const moduleNumber = index + 1; // Modules are numbered 1-4
            
            // Close all modules first and remove active state
            document.querySelectorAll('.module').forEach(m => {
                m.classList.add('collapsed');
                m.classList.remove('active');
            });
            
            // If this module was collapsed, open it and make it active (toggle behavior)
            if (isCurrentlyCollapsed) {
                module.classList.remove('collapsed');
                module.classList.add('active');
                showModuleHints(moduleNumber);
            } else {
                // If closing, show hints for Module 1
                showModuleHints(1);
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
    
    // Reset progress button
    const resetBtn = document.getElementById('resetProgress');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all exercise progress? This cannot be undone.')) {
                // Clear localStorage
                localStorage.removeItem('haskishProgress');
                
                // Remove completed class from all exercises
                document.querySelectorAll('.exercise').forEach(ex => {
                    ex.classList.remove('completed');
                });
                
                // Update all module progress
                updateAllModuleProgress();
            }
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
    modules.forEach(module => updateModuleProgress(module));
}

function showModuleHints(moduleNumber) {
    const hintsContent = document.getElementById('hintsContent');
    if (!hintsContent) return;
    
    const hints = moduleHints[moduleNumber];
    if (hints) {
        hintsContent.innerHTML = hints.content;
    }
}

// Show Module 1 hints by default when page loads
document.addEventListener('DOMContentLoaded', () => {
    showModuleHints(1);
});
