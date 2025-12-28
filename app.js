// Haskish App - UI Controller

const interpreter = new HaskishInterpreter();

// Module hints data
const moduleHints = {
    1: {
        title: "Module 1: Getting Started",
        content: `
            <h3>Welcome to Haskish!</h3>
            <p>Learn the basics of functional programming by creating simple functions.</p>
            
            <h4>Function Syntax</h4>
            <pre><code>functionName parameter = expression

-- Examples:
triple x = 3 * x
doubleAdd x y = 2*x + 2*y
circleArea r = 3.14159 * r * r</code></pre>
            
            <h4>Basic Operators</h4>
            <ul>
                <li>Arithmetic: <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>mod</code>, <code>div</code></li>
                <li>Comparison: <code>==</code>, <code>/=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code></li>
                <li>Boolean: <code>&&</code>, <code>||</code>, <code>not</code></li>
            </ul>
            
            <h4>Using the Editor and REPL</h4>
            <ul>
                <li>Write function definitions in the Code Panel</li>
                <li>Click "Run Code" to load your functions</li>
                <li>Test functions in the REPL below</li>
            </ul>
        `
    },
    2: {
        title: "Module 2: Introduction to Lists",
        content: `
            <h3>Working with Lists</h3>
            <p>Lists are fundamental data structures in functional programming.</p>
            
            <h4>List Syntax</h4>
            <pre><code>[1,2,3,4,5]           -- Explicit list
[1..10]               -- Range from 1 to 10
[2,4..20]             -- Even numbers 2 to 20
[]                    -- Empty list</code></pre>
            
            <h4>Basic List Functions</h4>
            <ul>
                <li><code>head [1,2,3]</code> → 1 (first element)</li>
                <li><code>tail [1,2,3]</code> → [2,3] (all but first)</li>
                <li><code>length [1,2,3]</code> → 3</li>
                <li><code>reverse [1,2,3]</code> → [3,2,1]</li>
                <li><code>take 3 [1..10]</code> → [1,2,3]</li>
                <li><code>drop 3 [1..10]</code> → [4,5,6,7,8,9,10]</li>
            </ul>
            
            <h4>List Operators</h4>
            <pre><code>1:[2,3,4]             -- [1,2,3,4]  (cons)
[1,2] ++ [3,4]        -- [1,2,3,4]  (concatenate)</code></pre>
        `
    },
    3: {
        title: "Module 3: Advanced Lists",
        content: `
            <h3>Recursion and Pattern Matching</h3>
            <p>Process lists recursively by breaking them into head and tail.</p>
            
            <h4>Pattern Matching with Lists</h4>
            <pre><code>sumList [] = 0
sumList (x:xs) = x + sumList xs

myLength [] = 0
myLength (x:xs) = 1 + myLength xs</code></pre>
            
            <h4>Pattern Matching (Values)</h4>
            <pre><code>factorial 0 = 1
factorial n = n * factorial (n-1)</code></pre>
            
            <h4>Guards (Conditions)</h4>
            <pre><code>grade mark
  | mark >= 70 = "A"
  | mark >= 60 = "B"
  | mark >= 50 = "C"
  | otherwise  = "F"</code></pre>
            
            <h4>Combining Patterns and Guards</h4>
            <pre><code>positive [] = []
positive (x:xs)
  | x > 0     = x : positive xs
  | otherwise = positive xs</code></pre>
        `
    },
    4: {
        title: "Module 4: Higher-Order Functions",
        content: `
            <h3>Functions as Values</h3>
            <p>Pass functions as arguments to other functions!</p>
            
            <h4>map - Transform every element</h4>
            <pre><code>map square [1,2,3]          -- [1,4,9]
map isEven [1,2,3,4]        -- [False,True,False,True]</code></pre>
            
            <h4>filter - Keep matching elements</h4>
            <pre><code>filter isEven [1..10]       -- [2,4,6,8,10]
filter (\\x -> x > 5) [1..10]  -- [6,7,8,9,10]</code></pre>
            
            <h4>fold - Combine into single value</h4>
            <pre><code>fold (+) 0 [1,2,3,4]        -- 10
fold (*) 1 [1,2,3,4]        -- 24</code></pre>
            
            <h4>Combining Higher-Order Functions</h4>
            <pre><code>-- Sum of all even numbers 1-100
fold (+) 0 (filter isEven [1..100])

-- Sum of squares of odd numbers
fold (+) 0 (map square (filter isOdd [1..20]))</code></pre>
        `
    },
    5: {
        title: "Module 5: Function Composition",
        content: `
            <h3>Building Complex Functions</h3>
            <p>Combine simple functions to create powerful transformations.</p>
            
            <h4>The . (Composition) Operator</h4>
            <pre><code>double x = x * 2
square x = x * x

(square . double) 3       -- 36
(double . square) 3       -- 18</code></pre>
            
            <h4>Reading Composition</h4>
            <p><code>(f . g) x</code> means: apply g first, then f</p>
            <p>Functions are applied RIGHT to LEFT!</p>
            
            <h4>Practical Examples</h4>
            <pre><code>-- Add 10 then double
(double . addTen) 5       -- 30

-- Square then negate
(negate . square) 4       -- -16</code></pre>
            
            <h4>With Lists</h4>
            <pre><code>sumSquares = fold (+) 0 . map square
sumSquares [1,2,3,4]      -- 30</code></pre>
        `
    },
    6: {
        title: "Module 6: Lambda Functions",
        content: `
            <h3>Anonymous Functions</h3>
            <p>Create functions on-the-fly without naming them.</p>
            
            <h4>Lambda Syntax</h4>
            <pre><code>\\parameter -> expression

-- Examples:
\\x -> x * 2
\\x -> x * x
\\x y -> x + y</code></pre>
            
            <h4>Using with map</h4>
            <pre><code>map (\\x -> x * 2) [1,2,3]        -- [2,4,6]
map (\\x -> x * x) [1,2,3,4]      -- [1,4,9,16]</code></pre>
            
            <h4>Using with filter</h4>
            <pre><code>filter (\\x -> x > 5) [1..10]     -- [6,7,8,9,10]
filter (\\x -> mod x 2 == 0) [1..10]  -- [2,4,6,8,10]</code></pre>
            
            <h4>Using with fold</h4>
            <pre><code>fold (\\x y -> x + y) 0 [1..5]    -- 15
fold (\\x y -> x * y) 1 [1..5]    -- 120</code></pre>
            
            <h4>When to Use Lambdas</h4>
            <p>Perfect for simple, one-time operations that don't need a name!</p>
        `
    }
};

// Exercise content data
const exerciseData = {
    // Module 1: Getting Started (3 exercises for now)
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
        title: "2. Simple Function",
        content: `
            <h3>Task</h3>
            <p>Write a function called <code>tripleMe</code> that takes a number and returns triple its value.</p>
            
            <h3>Example</h3>
            <pre><code>> tripleMe 10
30
> tripleMe 7
21</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> In the Code Panel above, write your function definition.<br>
                Use <code>x</code> as the parameter name and multiply it by 3.<br>
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
                <strong>💡 Hint:</strong> Functions can take multiple parameters separated by spaces.<br>
                Double each parameter and add the results together.
            </div>
        `
    },

    // Module 2: Introduction to Lists (2 exercises for now)
    4: {
        title: "4. Lists & Ranges",
        content: `
            <h3>Task</h3>
            <p>Experiment with lists and ranges in the REPL. Try these expressions:</p>
            
            <h3>Examples to Try</h3>
            <pre><code>> [1,2,3,4,5]
> [1..10]
> [1..100]
> [2,4..20]
> reverse [1,2,3,4,5]
> take 3 [1..10]
> drop 3 [1..10]</code></pre>
            
            <div class="hint">
                <strong>💡 Remember:</strong> <code>[1..10]</code> creates a range from 1 to 10.<br>
                <code>[2,4..20]</code> creates evens from 2 to 20.
            </div>
        `
    },
    5: {
        title: "5. Head and Tail",
        content: `
            <h3>Task</h3>
            <p>Try using the built-in <code>head</code> and <code>tail</code> functions to break apart lists in the REPL.</p>
            
            <h3>Examples to Try</h3>
            <pre><code>> head [10,20,30,40]
10
> tail [10,20,30,40]
[20,30,40]
> head (tail [10,20,30,40])
20
> 1:[2,3,4]
[1,2,3,4]
> [1,2] ++ [3,4]
[1,2,3,4]</code></pre>
            
            <div class="hint">
                <strong>💡 Remember:</strong> <code>head</code> gets the first element.<br>
                <code>tail</code> gets everything except the first.<br>
                <code>:</code> adds to front, <code>++</code> joins lists.
            </div>
        `
    },

    // Module 3: Advanced Lists (11 exercises)
    6: {
        title: "6. Factorial",
        content: `
            <h3>Task</h3>
            <p>Write a recursive function <code>factorial</code> using pattern matching. Remember: 0! = 1, and n! = n × (n-1)!</p>
            
            <h3>Example</h3>
            <pre><code>> factorial 5
120
> factorial 10
3628800</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Define the function twice - once for the base case (0), once for the recursive case (n).<br>
                For recursion, multiply n by the factorial of (n-1).
            </div>
        `
    },
    7: {
        title: "7. Powers ⭐",
        content: `
            <h3>Task</h3>
            <p>Write a recursive function <code>power</code> that calculates x raised to the power n (x^n). Remember: anything to power 0 is 1!</p>
            
            <h3>Example</h3>
            <pre><code>> power 2 3
8
> power 5 2
25
> power 10 0
1</code></pre>
            
            <div class="hint">
                <strong>💡 Challenge:</strong> You need TWO parameters (x and n) and pattern matching.<br>
                Base case: x^0 = 1. Recursive case: x^n = x × x^(n-1)
            </div>
        `
    },
    8: {
        title: "8. List Sum",
        content: `
            <h3>Task</h3>
            <p>Write a recursive function <code>sumList</code> that adds all the numbers in a list. Use (x:xs) pattern matching!</p>
            
            <h3>Example</h3>
            <pre><code>> sumList [2,5,1,9]
17
> sumList []
0
> sumList [10,20,30]
60</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Empty list [] sums to 0 (base case).<br>
                For (x:xs), add x to the sum of xs (recursive case).
            </div>
        `
    },
    9: {
        title: "9. Safe Head",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>safeHead</code> that returns the first element of a list, or "empty" for an empty list. Use pattern matching!</p>
            
            <h3>Example</h3>
            <pre><code>> safeHead [5,6,7]
5
> safeHead []
"empty"
> safeHead ["cat","dog"]
"cat"</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Write two definitions - one for [], one for (x:xs).<br>
                For empty list, return "empty". For (x:xs), return x.
            </div>
        `
    },
    10: {
        title: "10. Double List",
        content: `
            <h3>Task</h3>
            <p>Write a recursive function <code>doubleList</code> that doubles every number in a list.</p>
            
            <h3>Example</h3>
            <pre><code>> doubleList [1,2,3]
[2,4,6]
> doubleList [10,20,30]
[20,40,60]
> doubleList []
[]</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Empty list stays empty.<br>
                For (x:xs), cons (x*2) to the doubled rest of the list.
            </div>
        `
    },
    11: {
        title: "11. Positive Numbers ⭐",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>onlyPositive</code> that filters out all non-positive numbers from a list (keep only numbers > 0).</p>
            
            <h3>Example</h3>
            <pre><code>> onlyPositive [-2,3,-1,5,0,8]
[3,5,8]
> onlyPositive [-5,-10]
[]
> onlyPositive [1,2,3]
[1,2,3]</code></pre>
            
            <div class="hint">
                <strong>💡 Challenge:</strong> Use pattern matching AND guards!<br>
                If x > 0, cons it to the result. Otherwise, skip it.
            </div>
        `
    },
    12: {
        title: "12. Count Elements",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>countElem</code> that counts how many times an element appears in a list.</p>
            
            <h3>Example</h3>
            <pre><code>> countElem 3 [1,3,2,3,4,3]
3
> countElem 5 [1,2,3,4]
0
> countElem "cat" ["dog","cat","bird","cat"]
2</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Empty list has count 0.<br>
                For (x:xs), if x matches the element, add 1. Otherwise add 0.
            </div>
        `
    },
    13: {
        title: "13. Member Check",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>member</code> that checks if an element exists in a list (returns True or False).</p>
            
            <h3>Example</h3>
            <pre><code>> member 3 [1,2,3,4,5]
True
> member 10 [1,2,3,4,5]
False
> member "cat" ["dog","cat","bird"]
True</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Empty list → False (not found).<br>
                If x matches, return True. Otherwise, check the rest of the list.
            </div>
        `
    },
    14: {
        title: "14. List Zip ⭐⭐",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>zipLists</code> that combines two lists into pairs. Stop when either list runs out!</p>
            
            <h3>Example</h3>
            <pre><code>> zipLists [1,2,3] ["a","b","c"]
[[1,"a"],[2,"b"],[3,"c"]]
> zipLists [1,2] ["a","b","c","d"]
[[1,"a"],[2,"b"]]
> zipLists [] [1,2,3]
[]</code></pre>
            
            <div class="hint">
                <strong>💡 Challenge:</strong> You need pattern matching for BOTH lists!<br>
                Use (x:xs) and (y:ys) together. Build pairs with [x,y].
            </div>
        `
    },
    15: {
        title: "15. Quicksort ⭐⭐",
        content: `
            <h3>Task</h3>
            <p>Write the classic Quicksort algorithm! Pick the first element as pivot, partition the rest into smaller and larger elements, then recursively sort.</p>
            
            <h3>Example</h3>
            <pre><code>> qsort [3,1,4,1,5,9,2,6]
[1,1,2,3,4,5,6,9]
> qsort [5,4,3,2,1]
[1,2,3,4,5]</code></pre>
            
            <div class="hint">
                <strong>💡 Challenge:</strong> Base case: empty list is sorted.<br>
                For (x:xs): Create two lists - elements < x and elements >= x.<br>
                Then: qsort smaller ++ [x] ++ qsort larger
            </div>
        `
    },
    16: {
        title: "16. Grade Classifier ⭐",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>grade</code> that takes a mark (0-100) and returns a grade string using guards:</p>
            <ul>
                <li>70+ → "A"</li>
                <li>60-69 → "B"</li>
                <li>50-59 → "C"</li>
                <li>40-49 → "D"</li>
                <li>Below 40 → "F"</li>
            </ul>
            
            <h3>Example</h3>
            <pre><code>> grade 75
"A"
> grade 55
"C"
> grade 35
"F"</code></pre>
            
            <div class="hint">
                <strong>💡 Challenge:</strong> Use multiple guards with <code>>=</code> comparisons.<br>
                Order matters - check from highest grade to lowest!
            </div>
        `
    },

    // Module 4: Higher-Order Functions (6 exercises)
    17: {
        title: "17. Map Basics",
        content: `
            <h3>Task</h3>
            <p>First, write a function <code>square</code> that squares a number. Then use <code>map</code> to square every number in a list.</p>
            
            <h3>Example</h3>
            <pre><code>> map square [1,2,3,4,5]
[1,4,9,16,25]
> map square [10,20]
[100,400]</code></pre>
            
            <div class="hint">
                <strong>💡 Remember:</strong> <code>map</code> applies a function to every element in a list.<br>
                Syntax: <code>map functionName listName</code>
            </div>
        `
    },
    18: {
        title: "18. Filter Basics",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>isEven</code> that returns True if a number is even. Then use <code>filter</code> to get all even numbers from a list.</p>
            
            <h3>Example</h3>
            <pre><code>> filter isEven [1,2,3,4,5,6,7,8,9,10]
[2,4,6,8,10]
> filter isEven [1,3,5,7]
[]</code></pre>
            
            <div class="hint">
                <strong>💡 Remember:</strong> <code>filter</code> keeps elements where the function returns True.<br>
                Hint for isEven: use <code>mod x 2 == 0</code>
            </div>
        `
    },
    19: {
        title: "19. Fold Basics",
        content: `
            <h3>Task</h3>
            <p>Use <code>fold</code> to multiply all numbers in a list together. Remember to use the right initial value!</p>
            
            <h3>Example</h3>
            <pre><code>> fold (*) 1 [1,2,3,4,5]
120
> fold (*) 1 [2,3,4]
24</code></pre>
            
            <div class="hint">
                <strong>💡 Remember:</strong> <code>fold</code> combines elements using an operator.<br>
                Syntax: <code>fold operator initialValue list</code><br>
                For multiplication, initial value should be 1 (not 0!).
            </div>
        `
    },
    20: {
        title: "20. Shift Cipher ⭐",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>shift</code> that adds 1 to a number, then use <code>map</code> to shift all values in a list.</p>
            
            <h3>Example</h3>
            <pre><code>> shift 5
6
> map shift [1,2,3,4,5]
[2,3,4,5,6]
> map shift [10,20,30]
[11,21,31]</code></pre>
            
            <div class="hint">
                <strong>💡 Hint:</strong> Define <code>shift x = x + 1</code><br>
                Then use <code>map shift listName</code> to shift all values.
            </div>
        `
    },
    21: {
        title: "21. Data Analysis ⭐⭐",
        content: `
            <h3>Task</h3>
            <p>Find the sum of all even numbers between 1 and 100. Combine <code>filter</code> and <code>fold</code>!</p>
            
            <h3>Example</h3>
            <pre><code>> fold (+) 0 (filter isEven [1..100])
2550</code></pre>
            
            <div class="hint">
                <strong>💡 Challenge:</strong> You'll need:<br>
                1. An <code>isEven</code> function (use <code>mod</code>)<br>
                2. <code>filter</code> to keep only evens<br>
                3. <code>fold</code> to sum them up
            </div>
        `
    },
    22: {
        title: "22. Advanced Challenge ⭐⭐⭐",
        content: `
            <h3>Task</h3>
            <p>Find the sum of squares of all numbers divisible by 3 in the range [1..50]. Combine filter, map, and fold!</p>
            
            <h3>Hint Structure</h3>
            <ul>
                <li>Write <code>isDivBy3</code> function</li>
                <li>Use <code>filter</code> for divisibility by 3</li>
                <li>Use <code>map square</code> to square each</li>
                <li>Use <code>fold</code> to sum the results</li>
            </ul>
            
            <h3>Expected Result</h3>
            <pre><code>> -- Your solution here
4275</code></pre>
            
            <div class="hint">
                <strong>💡 Extension:</strong> Nest the functions together!<br>
                <code>fold (+) 0 (map square (filter isDivBy3 [1..50]))</code>
            </div>
        `
    },

    // Module 5: Function Composition (2 exercises for now)
    23: {
        title: "23. Compose Basics",
        content: `
            <h3>Task</h3>
            <p>Write two functions: <code>double</code> (multiply by 2) and <code>addTen</code> (add 10). Then try composing them!</p>
            
            <h3>Example</h3>
            <pre><code>> double 5
10
> addTen 5
15
> (addTen . double) 5
20
> (double . addTen) 5
30</code></pre>
            
            <div class="hint">
                <strong>💡 Remember:</strong> The <code>.</code> operator composes functions.<br>
                <code>(f . g) x</code> means "apply g first, then apply f to the result".
            </div>
        `
    },
    24: {
        title: "24. Pipeline Transformation ⭐",
        content: `
            <h3>Task</h3>
            <p>Create a data processing pipeline! Write three functions and combine them to transform data in multiple steps.</p>
            
            <h3>Functions to Write</h3>
            <ul>
                <li><code>double x = x * 2</code></li>
                <li><code>addFive x = x + 5</code></li>
                <li><code>square x = x * x</code></li>
            </ul>
            
            <h3>Example</h3>
            <pre><code>> (square . addFive . double) 3
121</code></pre>
            
            <div class="hint">
                <strong>💡 Challenge:</strong> Chain three functions together!<br>
                Remember: rightmost function is applied first.<br>
                So: double 3 = 6, then addFive 6 = 11, then square 11 = 121
            </div>
        `
    },

    // Module 6: Lambda Functions (1 exercise for now)
    25: {
        title: "25. Lambda with Map ⭐",
        content: `
            <h3>Task (Extension)</h3>
            <p>Try using lambda functions (anonymous functions) with map! Use <code>\\x -> expression</code> syntax.</p>
            
            <h3>Examples to Try</h3>
            <pre><code>> map (\\x -> x * 2) [1,2,3,4,5]
[2,4,6,8,10]
> map (\\x -> x * x) [1,2,3,4]
[1,4,9,16]
> filter (\\x -> x > 5) [1,3,7,2,9,4]
[7,9]
> fold (\\x y -> x + y) 0 [1,2,3,4,5]
15</code></pre>
            
            <div class="hint">
                <strong>💡 Extension:</strong> Lambdas let you create functions inline!<br>
                Syntax: <code>\\parameter -> expression</code><br>
                Perfect for simple operations you only need once!
            </div>
        `
    }
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

    // Start with empty editor
    codeEditor.setValue('-- Write your function definitions here');
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
