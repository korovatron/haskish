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
            <pre><code>myLength [] = 0
myLength (x:xs) = 1 + myLength xs

productList [] = 1
productList (x:xs) = x * productList xs</code></pre>
            
            <h4>Pattern Matching (Values)</h4>
            <pre><code>factorial 0 = 1
factorial n = n * factorial (n-1)</code></pre>
            
            <h4>Guards (Conditions)</h4>
            <pre><code>describe n
  | n > 0     = "positive"
  | n < 0     = "negative"
  | otherwise = "zero"</code></pre>
            
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
    // Module 1: Getting Started (5 exercises)
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
        `
    },
    4: {
        title: "4. Circle Area",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>circleArea</code> that calculates the area of a circle given its radius.</p>
            <p>Use the formula: area = π × r²</p>
            <p>Use 3.14159 for π (we'll call it <code>pi</code>).</p>
            
            <h3>Example</h3>
            <pre><code>> pi = 3.14159
> circleArea 5
78.53975
> circleArea 10
314.159
> circleArea 1
3.14159</code></pre>
            
            <h3>Hint</h3>
            <p>Remember: r² means r × r, and you can write the function as <code>circleArea r = pi * r * r</code></p>
        `
    },
    5: {
        title: "5. Temperature Conversion",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>celsiusToFahrenheit</code> that converts Celsius to Fahrenheit.</p>
            <p>Formula: F = (C × 9 / 5) + 32</p>
            
            <h3>Example</h3>
            <pre><code>> celsiusToFahrenheit 0
32
> celsiusToFahrenheit 100
212
> celsiusToFahrenheit 37
98.6</code></pre>
            
            <h3>Challenge</h3>
            <p>Can you also write <code>fahrenheitToCelsius</code>? The formula is: C = (F - 32) × 5 / 9</p>
        `
    },

    // Module 2: Introduction to Lists (4 exercises)
    6: {
        title: "6. Lists & Ranges",
        content: `
            <h3>Task</h3>
            <p>Experiment with lists and ranges in the REPL. Try these expressions:</p>
            
            <h3>Examples to Try</h3>
            <pre><code>> [1,2,3,4,5]
> [1..10]
> [1..100]
> [2,4..20]
> reverse ["cat","dog","bird"]
> take 2 ["red","green","blue","yellow"]
> drop 3 [1..10]</code></pre>
        `
    },
    7: {
        title: "7. Head and Tail",
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
        `
    },
    8: {
        title: "8. Cons Operator (:)",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>prepend</code> that adds an element to the front of a list using the <code>:</code> operator.</p>
            
            <h3>Example</h3>
            <pre><code>> prepend 1 [2,3,4]
[1,2,3,4]
> prepend "hello" ["world"]
["hello","world"]
> prepend 0 []
[0]</code></pre>
            
            <h3>Remember</h3>
            <p>The <code>:</code> operator takes an <strong>element</strong> on the left and a <strong>list</strong> on the right.</p>
        `
    },
    9: {
        title: "9. Concatenate Operator (++)",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>join</code> that combines two lists using the <code>++</code> operator. Test with both number and string lists.</p>
            
            <h3>Example</h3>
            <pre><code>> join [1,2] [3,4,5]
[1,2,3,4,5]
> join ["cat","dog"] ["bird"]
["cat","dog","bird"]
> join [] [1,2,3]
[1,2,3]</code></pre>
            
            <h3>Remember</h3>
            <p>The <code>++</code> operator takes a <strong>list</strong> on both the left and right sides.</p>
        `
    },

    // Module 3: Advanced Lists (11 exercises)
    10: {
        title: "10. Factorial",
        content: `
            <h3>Task</h3>
            <p>Write a recursive function <code>factorial</code> using pattern matching. Remember: 0! = 1, and n! = n × (n-1)!</p>
            
            <h3>Example</h3>
            <pre><code>> factorial 5
120
> factorial 10
3628800</code></pre>
        `
    },
    11: {
        title: "11. Powers",
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
        `
    },
    12: {
        title: "12. List Sum",
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
        `
    },
    13: {
        title: "13. Safe Head",
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
        `
    },
    14: {
        title: "14. Double List",
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
        `
    },
    15: {
        title: "15. Positive Numbers",
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
        `
    },
    16: {
        title: "16. Count Elements",
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
        `
    },
    17: {
        title: "17. Member Check",
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
        `
    },
    18: {
        title: "18. List Zip",
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
        `
    },
    19: {
        title: "19. Grade Classifier",
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
        `
    },
    20: {
        title: "20. Merge Sort",
        content: `
            <h3>Task</h3>
            <p>Implement the merge sort algorithm! This is a divide-and-conquer sorting algorithm specified by AQA. Follow these steps:</p>
            
            <h4>Step 1: Write the merge function</h4>
            <p>First, create a function <code>merge</code> that combines two <em>already-sorted</em> lists into one sorted list:</p>
            <pre><code>merge [] ys = ys
merge xs [] = xs
merge (x:xs) (y:ys)
  | x <= y = ...  -- add x to result, merge rest
  | otherwise = ... -- add y to result, merge rest</code></pre>
            
            <h4>Step 2: Write split functions</h4>
            <p>Create two functions to split a list into alternating elements:</p>
            <pre><code>splitFirst [] = []
splitFirst [x] = [x]
splitFirst (x:y:xs) = x : splitFirst xs

splitSecond [] = []
splitSecond [x] = []
splitSecond (x:y:xs) = y : splitSecond xs</code></pre>
            
            <h4>Step 3: Write mergeSort</h4>
            <p>Finally, combine everything. The base cases are empty lists and single-element lists. For larger lists, split them, recursively sort each half, then merge:</p>
            <pre><code>mergeSort [] = []
mergeSort [x] = [x]
mergeSort xs = merge (mergeSort (splitFirst xs)) (mergeSort (splitSecond xs))</code></pre>
            
            <h3>Example</h3>
            <pre><code>> mergeSort [3,1,4,1,5,9,2,6]
[1,1,2,3,4,5,6,9]
> mergeSort [5,4,3,2,1]
[1,2,3,4,5]
> merge [1,3,5] [2,4,6]
[1,2,3,4,5,6]</code></pre>
            
            <h3>How it works</h3>
            <p><code>splitFirst [3,1,4,1,5,9,2,6]</code> gives <code>[3,4,5,2]</code> (positions 0,2,4,6)</p>
            <p><code>splitSecond [3,1,4,1,5,9,2,6]</code> gives <code>[1,1,9,6]</code> (positions 1,3,5,7)</p>
            <p>Each half is recursively sorted, then the sorted halves are merged together.</p>
        `
    },

    // Module 4: Higher-Order Functions (6 exercises)
    21: {
        title: "21. Map Basics",
        content: `
            <h3>Task</h3>
            <p>First, write a function <code>square</code> that squares a number. Then use <code>map</code> to square every number in a list.</p>
            
            <h3>Example</h3>
            <pre><code>> map square [1,2,3,4,5]
[1,4,9,16,25]
> map square [10,20]
[100,400]</code></pre>
        `
    },
    22: {
        title: "22. Filter Basics",
        content: `
            <h3>Task</h3>
            <p>Write a function <code>isEven</code> that returns True if a number is even. Then use <code>filter</code> to get all even numbers from a list.</p>
            
            <h3>Example</h3>
            <pre><code>> filter isEven [1,2,3,4,5,6,7,8,9,10]
[2,4,6,8,10]
> filter isEven [1,3,5,7]
[]</code></pre>
        `
    },
    23: {
        title: "23. Fold Basics",
        content: `
            <h3>Task</h3>
            <p>Explore how <code>fold</code> works by trying these expressions in the REPL. Notice how fold combines all elements using an operator and initial value.</p>
            
            <h3>Try These</h3>
            <pre><code>> fold (*) 1 [1,2,3,4,5]
120
> fold (+) 0 [1,2,3,4,5]
15
> fold (*) 1 [2,3,4]
24</code></pre>
            
            <h3>Understanding Fold</h3>
            <p><code>fold (op) initial list</code> applies the operator to combine all elements, starting with the initial value.</p>
        `
    },
    24: {
        title: "24. Shift Cipher",
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
        `
    },
    25: {
        title: "25. Data Analysis",
        content: `
            <h3>Task</h3>
            <p>Find the sum of all even numbers between 1 and 100. Combine <code>filter</code> and <code>fold</code>!</p>
            
            <h3>Expected Result</h3>
            <pre><code>> -- Your solution here
2550</code></pre>
        `
    },
    26: {
        title: "26. Advanced Challenge",
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
13464</code></pre>
        `
    },

    // Module 5: Function Composition (5 exercises)
    27: {
        title: "27. Understanding Composition Order",
        content: `
            <h3>Task</h3>
            <p>Write two functions: <code>double x = x * 2</code> and <code>addTen x = x + 10</code>.</p>
            <p>Then compare these two compositions with the input 5:</p>
            <ul>
                <li><code>(double . addTen) 5</code></li>
                <li><code>(addTen . double) 5</code></li>
            </ul>
            
            <h3>Question</h3>
            <p>Why do they give different results? Which function runs first in each case?</p>
            
            <h3>Expected Results</h3>
            <pre><code>> (double . addTen) 5
30
> (addTen . double) 5
20</code></pre>
            
            <h3>Remember</h3>
            <p>In <code>(f . g) x</code>, the rightmost function <code>g</code> is applied first, then <code>f</code>!</p>
        `
    },
    28: {
        title: "28. Three-Function Pipeline",
        content: `
            <h3>Task</h3>
            <p>Write three functions: <code>double</code> (×2), <code>addFive</code> (+5), and <code>square</code> (x²).</p>
            <p>Create a composition that transforms the number 3 like this:</p>
            <ol>
                <li>First: double it (3 → 6)</li>
                <li>Then: add five (6 → 11)</li>
                <li>Finally: square it (11 → 121)</li>
            </ol>
            
            <h3>Challenge</h3>
            <p>Which composition gives the result 121? Think about the order!</p>
            
            <h3>Expected Result</h3>
            <pre><code>> -- Your composition here with input 3
121</code></pre>
        `
    },
    29: {
        title: "29. Composition vs Direct Calls",
        content: `
            <h3>Task</h3>
            <p>Using your <code>double</code> and <code>square</code> functions from before:</p>
            <p>Show that <code>(square . double) 4</code> gives the same result as <code>square (double 4)</code>.</p>
            
            <h3>Both Should Give</h3>
            <pre><code>> (square . double) 4
64
> square (double 4)
64</code></pre>
            
            <h3>Think About It</h3>
            <p>Composition <code>(f . g)</code> creates a new function. When would you use composition instead of nested calls?</p>
        `
    },
    30: {
        title: "30. Compose with Lists",
        content: `
            <h3>Task</h3>
            <p>Write functions that work with lists, then compose them!</p>
            <p>Create these functions:</p>
            <ul>
                <li><code>sumList</code> - adds all numbers in a list</li>
                <li><code>doubleList</code> - doubles every number in a list</li>
            </ul>
            <p>Then use composition to: double all numbers in a list, then sum them.</p>
            
            <h3>Example</h3>
            <pre><code>> (sumList . doubleList) [1,2,3,4,5]
30
> sumList (doubleList [1,2,3,4,5])
30</code></pre>
            
            <h3>Explanation</h3>
            <p>[1,2,3,4,5] → double → [2,4,6,8,10] → sum → 30</p>
            
            <h3>Think About It</h3>
            <p>Composition creates a pipeline: data flows through doubleList first, then sumList!</p>
        `
    },
    31: {
        title: "31. Complex Pipeline",
        content: `
            <h3>Task</h3>
            <p>Build a complex data processing pipeline using composition!</p>
            <p>Create a composed function that takes a list of numbers and:</p>
            <ol>
                <li>Filters out numbers less than 5</li>
                <li>Doubles the remaining numbers</li>
                <li>Sums them all</li>
            </ol>
            
            <h3>Example</h3>
            <pre><code>> greaterThan5 x = x > 5
> double x = x * 2
> pipeline = sumList . map double . filter greaterThan5
> pipeline [1,3,6,8,10,2,7]
62</code></pre>
            
            <h3>Explanation</h3>
            <p>[1,3,6,8,10,2,7] → filter(>5) → [6,8,10,7] → double → [12,16,20,14] → sum → 62</p>
            
            <h3>Challenge</h3>
            <p>Try different orderings! What if you double before filtering? Does it give the same result?</p>
        `
    },

    // Module 6: Lambda Functions (3 exercises)
    32: {
        title: "32. Lambda with Map",
        content: `
            <h3>Task</h3>
            <p>Use a lambda function with <code>map</code> to triple every number in the list [1,2,3,4,5].</p>
            <p>Lambda syntax: <code>\\x -> expression</code></p>
            
            <h3>Expected Result</h3>
            <pre><code>> -- Your lambda expression here
[3,6,9,12,15]</code></pre>
            
            <h3>Why Use Lambdas?</h3>
            <p>Perfect for simple, one-time operations that don't need a named function!</p>
        `
    },
    33: {
        title: "33. Lambda with Filter",
        content: `
            <h3>Task</h3>
            <p>Use a lambda function with <code>filter</code> to keep only numbers greater than 10 from the list [5,12,8,20,3,15].</p>
            
            <h3>Expected Result</h3>
            <pre><code>> -- Your lambda expression here
[12,20,15]</code></pre>
            
            <h3>Hint</h3>
            <p>The lambda should take a number and return <code>True</code> if it's greater than 10.</p>
        `
    },
    34: {
        title: "34. Lambda Challenge",
        content: `
            <h3>Task</h3>
            <p>Use <code>map</code> with a lambda to add 5 to each number, then <code>filter</code> with a lambda to keep only even results.</p>
            <p>Apply this to the list [1,2,3,4,5,6,7,8,9,10].</p>
            
            <h3>Expected Result</h3>
            <pre><code>> -- Your combined expression here
[6,8,10,12,14]</code></pre>
            
            <h3>Think About It</h3>
            <p>Which operation happens first - map or filter? Does order matter?</p>
        `
    },

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

// Global variables for editor state
let currentExerciseId = null;
let codeEditor = null;
let replEditor = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    const runCodeBtn = document.getElementById('runCode');
    const editorOutput = document.getElementById('editorOutput');
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
                
                // Save state after REPL command
                if (currentExerciseId) {
                    saveExerciseState();
                }
                
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

    // Auto-save on code change (debounced)
    let saveTimeout;
    codeEditor.on('change', () => {
        if (currentExerciseId) {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => saveExerciseState(), 1000);
        }
    });
    
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
        
        // Save state after running code
        if (currentExerciseId) {
            saveExerciseState();
        }
    });

    // Clear REPL history
    clearReplBtn.addEventListener('click', () => {
        replOutput.innerHTML = '';
        replEditor.focus();
        // Save cleared state
        if (currentExerciseId) {
            saveExerciseState();
        }
    });

    // Start with empty editor
    codeEditor.setValue('-- Write your function definitions here\n');
    codeEditor.setCursor({ line: 1, ch: 0 });
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

// Save current exercise state to localStorage
function saveExerciseState() {
    if (!currentExerciseId) return;
    
    const state = {
        code: codeEditor.getValue(),
        replHistory: document.getElementById('replOutput').innerHTML
    };
    
    const allStates = JSON.parse(localStorage.getItem('haskishExerciseStates') || '{}');
    allStates[currentExerciseId] = state;
    localStorage.setItem('haskishExerciseStates', JSON.stringify(allStates));
    
    // Save last exercise ID
    localStorage.setItem('haskishLastExercise', currentExerciseId);
}

// Load exercise state from localStorage
function loadExerciseState(exerciseId) {
    const allStates = JSON.parse(localStorage.getItem('haskishExerciseStates') || '{}');
    return allStates[exerciseId] || null;
}

// Exercises functionality
function initExercises() {
    // Load saved progress from localStorage
    const savedProgress = JSON.parse(localStorage.getItem('haskishProgress') || '{}');
    
    // Apply saved progress to buttons
    Object.keys(savedProgress).forEach(exerciseId => {
        if (savedProgress[exerciseId]) {
            const btn = document.querySelector(`.exercise-btn[data-exercise="${exerciseId}"]`);
            if (btn) {
                btn.classList.add('completed');
            }
        }
    });
    
    // Exercise button click - show exercise content
    const exerciseButtons = document.querySelectorAll('.exercise-btn');
    exerciseButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const exerciseId = btn.getAttribute('data-exercise');
            
            // Save current exercise state before switching
            if (currentExerciseId) {
                saveExerciseState();
            }
            
            // Update current exercise ID
            currentExerciseId = exerciseId;
            
            // Remove active class from all buttons
            exerciseButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Show exercise content
            showExerciseContent(exerciseId);
            
            // Restore exercise state
            restoreExerciseState(exerciseId);
            
            // Get module number from exercise ID
            const exId = parseInt(exerciseId);
            let moduleNum = 1;
            if (exId <= 5) moduleNum = 1;        // Module 1: Exercises 1-5
            else if (exId <= 9) moduleNum = 2;   // Module 2: Exercises 6-9
            else if (exId <= 20) moduleNum = 3;  // Module 3: Exercises 10-20
            else if (exId <= 26) moduleNum = 4;  // Module 4: Exercises 21-26
            else if (exId <= 31) moduleNum = 5;  // Module 5: Exercises 27-31
            else moduleNum = 6;                  // Module 6: Exercises 32-34
            
            // Show appropriate module hints
            showModuleHints(moduleNum);
            
            // Collapse the hints panel
            const hintsPanel = document.querySelector('.hints-panel');
            const toggleHintsBtn = document.getElementById('toggleHints');
            if (hintsPanel && toggleHintsBtn) {
                hintsPanel.classList.add('collapsed');
                toggleHintsBtn.textContent = '▼';
            }
            
            // Update mobile navigation
            updateMobileNavigationLabel();
        });
        
        // Right-click or double-click to toggle completion
        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            toggleExerciseCompletion(btn);
        });
        
        btn.addEventListener('dblclick', () => {
            toggleExerciseCompletion(btn);
        });
    });
    
    // Toggle exercise panel button
    const toggleExerciseBtn = document.getElementById('toggleExercisePanel');
    const exercisePanel = document.getElementById('exercisePanel');
    const exercisePanelHeader = document.getElementById('exercisePanelHeader');
    
    if (toggleExerciseBtn && exercisePanel) {
        exercisePanelHeader.addEventListener('click', () => {
            exercisePanel.classList.toggle('collapsed');
            toggleExerciseBtn.textContent = exercisePanel.classList.contains('collapsed') ? '▼' : '▲';
        });
    }
    
    // Reset progress button
    const resetBtn = document.getElementById('resetProgress');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all progress and clear all saved work? This cannot be undone.')) {
                // Save theme preference before clearing
                const currentTheme = localStorage.getItem('theme');
                
                // Clear all localStorage data
                localStorage.clear();
                
                // Restore theme preference
                if (currentTheme) {
                    localStorage.setItem('theme', currentTheme);
                }
                
                // Reload the page to reset everything
                location.reload();
            }
        });
    }
    
    // Hints toggle functionality
    const hintsHeader = document.getElementById('hintsHeader');
    const toggleHintsBtn = document.getElementById('toggleHints');
    const hintsPanel = document.querySelector('.hints-panel');
    
    if (hintsHeader && toggleHintsBtn) {
        hintsHeader.addEventListener('click', () => {
            hintsPanel.classList.toggle('collapsed');
            toggleHintsBtn.textContent = hintsPanel.classList.contains('collapsed') ? '▼' : '▲';
        });
    }
    
    // Exercise completion checkbox
    const exerciseCompleteCheckbox = document.getElementById('exerciseComplete');
    if (exerciseCompleteCheckbox) {
        exerciseCompleteCheckbox.addEventListener('change', (e) => {
            const exerciseId = e.target.getAttribute('data-exercise');
            const btn = document.querySelector(`.exercise-btn[data-exercise="${exerciseId}"]`);
            if (btn) {
                toggleExerciseCompletion(btn);
            }
        });
    }
    
    // Mobile exercise navigation
    initMobileNavigation();
    
    // Auto-load last exercise or exercise 1 on startup
    const lastExerciseId = localStorage.getItem('haskishLastExercise') || '1';
    const exerciseToLoad = document.querySelector(`.exercise-btn[data-exercise="${lastExerciseId}"]`);
    if (exerciseToLoad) {
        exerciseToLoad.click();
        // Start with exercise panel collapsed
        setTimeout(() => {
            const panel = document.getElementById('exercisePanel');
            const toggleBtn = document.getElementById('toggleExercisePanel');
            if (panel && toggleBtn) {
                panel.classList.add('collapsed');
                toggleBtn.textContent = '▼';
            }
        }, 0);
    }
}

function initMobileNavigation() {
    const prevBtn = document.getElementById('prevExercise');
    const nextBtn = document.getElementById('nextExercise');
    const label = document.getElementById('currentExerciseLabel');
    const totalExercises = 27;
    
    // Make update function globally accessible
    window.updateMobileNavigationLabel = function() {
        if (currentExerciseId) {
            const exId = parseInt(currentExerciseId);
            const exercise = exerciseData[currentExerciseId];
            const titleParts = exercise.title.split('. ');
            const shortTitle = titleParts.length > 1 ? titleParts[1] : exercise.title;
            label.textContent = `Exercise ${exId}: ${shortTitle}`;
            
            // Check if exercise is completed and update label color
            const btn = document.querySelector(`.exercise-btn[data-exercise="${currentExerciseId}"]`);
            if (btn && btn.classList.contains('completed')) {
                label.classList.add('completed');
            } else {
                label.classList.remove('completed');
            }
            
            prevBtn.disabled = exId <= 1;
            nextBtn.disabled = exId >= totalExercises;
        } else {
            label.textContent = 'Select an exercise';
            label.classList.remove('completed');
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
            if (nextId <= totalExercises) {
                navigateToExercise(nextId.toString());
            }
        }
    });
    
    // Initialize mobile nav state
    updateMobileNavigationLabel();
}

function toggleExerciseCompletion(btn) {
    const exerciseId = btn.getAttribute('data-exercise');
    const savedProgress = JSON.parse(localStorage.getItem('haskishProgress') || '{}');
    const checkbox = document.getElementById('exerciseComplete');
    
    if (btn.classList.contains('completed')) {
        btn.classList.remove('completed');
        delete savedProgress[exerciseId];
        // Update checkbox if it's for the same exercise
        if (checkbox && checkbox.getAttribute('data-exercise') === exerciseId) {
            checkbox.checked = false;
        }
    } else {
        btn.classList.add('completed');
        savedProgress[exerciseId] = true;
        // Update checkbox if it's for the same exercise
        if (checkbox && checkbox.getAttribute('data-exercise') === exerciseId) {
            checkbox.checked = true;
        }
    }
    
    localStorage.setItem('haskishProgress', JSON.stringify(savedProgress));
    
    // Update mobile navigation label color if this is the current exercise
    if (currentExerciseId === exerciseId && typeof updateMobileNavigationLabel === 'function') {
        updateMobileNavigationLabel();
    }
}

function restoreExerciseState(exerciseId) {
    const state = loadExerciseState(exerciseId);
    const editorOutput = document.getElementById('editorOutput');
    const replOutput = document.getElementById('replOutput');
    
    if (state) {
        // Restore saved state
        codeEditor.setValue(state.code);
        replOutput.innerHTML = state.replHistory;
        editorOutput.innerHTML = '<div class="info">Restored your previous work. Click "Run Code" to reload functions!</div>';
    } else {
        // Use default state for new exercise
        codeEditor.setValue('-- Write your function definitions here\n');
        codeEditor.setCursor({ line: 1, ch: 0 });
        replOutput.innerHTML = '';
        editorOutput.innerHTML = '<div class="info">Click "Run Code" to load the functions, then test them in the REPL!</div>';
    }
    
    // Scroll REPL to bottom if there's history
    if (replOutput.innerHTML) {
        replOutput.scrollTop = replOutput.scrollHeight;
    }
}

function showExerciseContent(exerciseId) {
    const panel = document.getElementById('exercisePanel');
    const title = document.getElementById('exerciseTitle');
    const content = document.getElementById('exerciseContent');
    const checkbox = document.getElementById('exerciseComplete');
    
    const exercise = exerciseData[exerciseId];
    
    if (exercise) {
        title.textContent = exercise.title;
        content.innerHTML = exercise.content;
        panel.style.display = 'flex';
        
        // Update checkbox state based on completion status
        const btn = document.querySelector(`.exercise-btn[data-exercise="${exerciseId}"]`);
        if (checkbox && btn) {
            checkbox.checked = btn.classList.contains('completed');
            checkbox.setAttribute('data-exercise', exerciseId);
        }
    }
}

function hideExerciseContent() {
    const panel = document.getElementById('exercisePanel');
    panel.style.display = 'none';
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

// Prevent pinch-to-zoom on mobile devices
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
}, { passive: false });
