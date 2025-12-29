# Haskish Complete Feature Demonstrations

A comprehensive set of function definitions demonstrating ALL features available in Haskish.
Copy these into the Code Panel and click "Run Code" to test them in the REPL.

---

## Basic Function Definitions

```haskell
-- Simple function
double x = x * 2

-- Multiple parameters
add x y = x + y

-- Implicit multiplication (3x becomes 3*x)
triple x = 3x
```

**Tests:**
- `double 5` → `10`
- `add 3 4` → `7`
- `triple 6` → `18`

---

## Pattern Matching on Values

```haskell
-- Pattern match on specific values
factorial 0 = 1
factorial 1 = 1
factorial n = n * factorial (n - 1)

-- Pattern match with multiple cases
describe 0 = "zero"
describe 1 = "one"
describe n = "many"
```

**Tests:**
- `factorial 5` → `120`
- `describe 0` → `"zero"`
- `describe 42` → `"many"`

---

## Guards (Conditional Logic)

```haskell
-- Guards with otherwise
absolute n
  | n < 0     = -n
  | otherwise = n

-- Multiple guard conditions
classify n
  | n < 0     = "negative"
  | n == 0    = "zero"
  | n > 0     = "positive"

-- Guards with pattern matching
sign 0 = 0
sign n
  | n > 0     = 1
  | otherwise = -1
```

**Tests:**
- `absolute (-5)` → `5`
- `classify (-3)` → `"negative"`
- `sign 42` → `1`

---

## List Pattern Matching

```haskell
-- Empty list and cons pattern
myLength [] = 0
myLength (x:xs) = 1 + myLength xs

-- Multiple elements
firstTwo (x:y:xs) = (x, y)

-- Specific patterns
sumTwo [x, y] = x + y
```

**Tests:**
- `myLength [1,2,3,4]` → `4`
- `firstTwo [10,20,30]` → `(10,20)`
- `sumTwo [3,7]` → `10`

---

## Recursion with Lists

```haskell
-- Process all elements
doubleAll [] = []
doubleAll (x:xs) = (2*x) : doubleAll xs

-- Filter with recursion
positives [] = []
positives (x:xs)
  | x > 0     = x : positives xs
  | otherwise = positives xs

-- Accumulator pattern
sumList [] = 0
sumList (x:xs) = x + sumList xs
```

**Tests:**
- `doubleAll [1,2,3]` → `[2,4,6]`
- `positives [-1,2,-3,4]` → `[2,4]`
- `sumList [1,2,3,4]` → `10`

---

## Tuples (NEW!)

```haskell
-- Tuple creation
point = (3, 5)
triple = (1, "hello", True)

-- Tuple pattern matching
fst (x, y) = x
snd (x, y) = y

-- Tuples with guards
distance (x1, y1) (x2, y2) = ((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1))

-- Compare tuples
comparePoints (x1, y1) (x2, y2)
  | x1 > x2 && y1 > y2 = "first dominates"
  | x1 < x2 && y1 < y2 = "second dominates"
  | x1 == x2 && y1 == y2 = "equal"
  | otherwise = "incomparable"

-- Nested tuples
nested = ((1, 2), (3, 4))

-- Lists of tuples
points = [(0,0), (1,1), (2,4)]

-- Tuples of lists
segments = ([1,2,3], [4,5,6])
```

**Tests:**
- `point` → `(3,5)`
- `fst (10,20)` → `10`
- `comparePoints (5,3) (2,1)` → `"first dominates"`
- `points` → `[(0,0),(1,1),(2,4)]`

---

## Unary Negation (NEW!)

```haskell
-- Simple negation
negate1 x = (-x)

-- Negation in expressions
negDouble x = (-x * 2)

-- Negation with addition
negAdd x y = (-x + y)

-- Multiple negations
complex x = ((-x) * 2 + (-x))

-- Double negation
opposite x = (-(-x))
```

**Tests:**
- `negate1 5` → `-5`
- `negDouble 7` → `-14`
- `negAdd 10 3` → `-7`
- `complex 5` → `-15`
- `opposite 8` → `8`

---

## Lambda Functions

```haskell
-- Lambda with map
squareAll xs = map (\x -> x * x) xs

-- Lambda with filter
evensOnly xs = filter (\x -> mod x 2 == 0) xs

-- Lambda with fold
sumAll xs = fold (\acc x -> acc + x) 0 xs

-- Multiple lambdas
applyTwice f x = f (f x)
```

**Tests:**
- `squareAll [1,2,3,4]` → `[1,4,9,16]`
- `evensOnly [1,2,3,4,5,6]` → `[2,4,6]`
- `sumAll [1,2,3,4]` → `10`
- `applyTwice (\x -> x * 2) 5` → `20`

---

## Higher-Order Functions

```haskell
-- map examples
doubleMap xs = map (\x -> x * 2) xs
squareMap xs = map (\x -> x * x) xs

-- filter examples
bigNumbers xs = filter (\x -> x > 10) xs
shortWords xs = filter (\s -> length s < 5) xs

-- fold examples
product xs = fold (\acc x -> acc * x) 1 xs
sumPositive xs = fold (\acc x -> if x > 0 then acc + x else acc) 0 xs

-- Combining higher-order functions
sumOfSquares xs = fold (\acc x -> acc + x) 0 (map (\x -> x * x) xs)
```

**Tests:**
- `doubleMap [1,2,3]` → `[2,4,6]`
- `bigNumbers [5,15,3,20,8]` → `[15,20]`
- `product [1,2,3,4]` → `24`
- `sumOfSquares [1,2,3]` → `14`

---

## Function Composition

```haskell
-- Basic composition
addOne x = x + 1
timesTwo x = x * 2
addThenDouble = timesTwo . addOne

-- Composition with lists
doubleAndReverse xs = reverse (map (\x -> x * 2) xs)

-- Multiple compositions
tripleCompose = (\x -> x + 1) . (\x -> x * 2) . (\x -> x - 3)
```

**Tests:**
- `addThenDouble 5` → `12`
- `doubleAndReverse [1,2,3]` → `[6,4,2]`
- `tripleCompose 10` → `15`

---

## Partial Application (Currying)

```haskell
-- Curried functions
multiply x y = x * y
timesTen = multiply 10

-- Partial application with built-ins
addFive = add 5
lessThanTen = (\x -> x < 10)

-- Operator sections
plusOne = (+1)
halfOf = (/2)
greaterThan5 = (>5)
```

**Tests:**
- `timesTen 7` → `70`
- `addFive 3` → `8`
- `plusOne 9` → `10`
- `halfOf 20` → `10`

---

## Operator Sections

```haskell
-- Arithmetic sections
increment = (+1)
decrement = (+(-1))
doubleIt = (*2)
halve = (/2)

-- Comparison sections
isPositive = (>0)
isSmall = (<10)

-- Using sections with map
incrementAll xs = map (+1) xs
halvAll xs = map (/2) xs
```

**Tests:**
- `increment 5` → `6`
- `isPositive (-3)` → `False`
- `incrementAll [1,2,3]` → `[2,3,4]`

---

## List Operations

```haskell
-- Cons operator
prependOne xs = 1:xs

-- Concatenation
joinLists xs ys = xs ++ ys

-- List indexing
thirdElement xs = xs !! 2

-- Range generation
oneToTen = [1..10]
evens = [2,4..20]
countdown = [10,9..1]
```

**Tests:**
- `prependOne [2,3,4]` → `[1,2,3,4]`
- `joinLists [1,2] [3,4]` → `[1,2,3,4]`
- `thirdElement [10,20,30,40]` → `30`
- `oneToTen` → `[1,2,3,4,5,6,7,8,9,10]`

---

## Built-in List Functions

```haskell
-- head and tail
getFirst xs = head xs
getRest xs = tail xs

-- length and null
isEmpty xs = null xs
count xs = length xs

-- reverse
backwards xs = reverse xs

-- take and drop
firstThree xs = take 3 xs
skipTwo xs = drop 2 xs
```

**Tests:**
- `getFirst [1,2,3]` → `1`
- `getRest [1,2,3]` → `[2,3]`
- `isEmpty []` → `True`
- `backwards [1,2,3]` → `[3,2,1]`
- `firstThree [1,2,3,4,5]` → `[1,2,3]`

---

## Arithmetic Operators

```haskell
-- Basic arithmetic
calculate x y = (x + y) * (x - y)

-- Division and modulo
quotient x y = div x y
remainder x y = mod x y

-- Mixed operations
formula x = (x * x + 2*x + 1) / (x + 1)
```

**Tests:**
- `calculate 5 3` → `16`
- `quotient 17 5` → `3`
- `remainder 17 5` → `2`
- `formula 3` → `4`

---

## Boolean Operators

```haskell
-- Logical AND
bothTrue x y = x && y

-- Logical OR
eitherTrue x y = x || y

-- Logical NOT
opposite x = not x

-- Complex boolean expressions
inRange x low high = x >= low && x <= high
```

**Tests:**
- `bothTrue True False` → `False`
- `eitherTrue True False` → `True`
- `opposite True` → `False`
- `inRange 5 1 10` → `True`

---

## Comparison Operators

```haskell
-- Equality
same x y = x == y
different x y = x /= y

-- Ordering
bigger x y = x > y
smaller x y = x < y
atLeast x y = x >= y
atMost x y = x <= y

-- Compare with guards
compare x y
  | x > y     = "greater"
  | x < y     = "less"
  | otherwise = "equal"
```

**Tests:**
- `same 5 5` → `True`
- `different 3 7` → `True`
- `compare 10 5` → `"greater"`

---

## String Operations

```haskell
-- String literals
greeting = "Hello, World!"

-- Strings in lists
words = ["hello", "world"]

-- Pattern matching with strings
greet "Alice" = "Hi Alice!"
greet name = "Hello " ++ name
```

**Tests:**
- `greeting` → `"Hello, World!"`
- `greet "Alice"` → `"Hi Alice!"`
- `greet "Bob"` → `Error: (++) requires two lists`

---

## Boolean Literals

```haskell
-- Using True/False
isTrue = True
isFalse = False

-- Boolean in guards
checkBool x
  | x == True = "yes"
  | otherwise = "no"

-- Boolean patterns
opposite True = False
opposite False = True
```

**Tests:**
- `isTrue` → `True`
- `checkBool True` → `"yes"`
- `opposite False` → `True`

---

## Variables and Constants

```haskell
-- Numeric constants
pi = 3.14159
e = 2.71828

-- List constants
primes = [2,3,5,7,11,13]

-- Using constants in functions
circleArea r = pi * r * r
```

**Tests:**
- `pi` → `3.14159`
- `circleArea 5` → `78.53975`

---

## Complex Examples

```haskell
-- Fibonacci sequence
fib 0 = 0
fib 1 = 1
fib n = fib (n-1) + fib (n-2)

-- QuickSort
qsort [] = []
qsort (x:xs) = qsort smaller ++ [x] ++ qsort larger
  where
    smaller = filter (\y -> y <= x) xs
    larger = filter (\y -> y > x) xs

-- Map with multiple functions
pipeline xs = map (*2) (filter (>0) (map (+(-5)) xs))

-- Tuple processing
sumPairs [] = []
sumPairs ((x,y):rest) = (x+y) : sumPairs rest

-- Distance between points
dist (x1,y1) (x2,y2) = ((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1))
```

**Tests:**
- `fib 10` → `55`
- `qsort [3,1,4,1,5,9,2,6]` → `[1,1,2,3,4,5,6,9]`
- `pipeline [1,2,3,4,5,6,7,8]` → `[2,4,6]`
- `sumPairs [(1,2),(3,4),(5,6)]` → `[3,7,11]`
- `dist (0,0) (3,4)` → `25`

---

## Error Handling

```haskell
-- Using error function
safeDiv x 0 = error "Division by zero!"
safeDiv x y = x / y

-- Safe list operations with guards
safeHead [] = error "Empty list!"
safeHead (x:xs) = x
```

**Tests:**
- `safeDiv 10 2` → `5`
- `safeDiv 10 0` → `Error: Division by zero!`
- `safeHead [1,2,3]` → `1`

---

## Summary of All Features

### Data Types
- ✅ Numbers (integers and floats)
- ✅ Booleans (True/False)
- ✅ Strings ("text")
- ✅ Lists ([1,2,3])
- ✅ Tuples ((1,2,3)) **NEW**
- ✅ Functions (first-class values)

### Language Features
- ✅ Pattern matching (values, lists, tuples)
- ✅ Guards (conditional logic)
- ✅ Recursion
- ✅ Lambda functions
- ✅ Function composition
- ✅ Partial application/currying
- ✅ Operator sections
- ✅ Unary negation (-x) **NEW**
- ✅ Implicit multiplication (3x)
- ✅ Syntax validation **NEW**

### Operators
- ✅ Arithmetic: +, -, *, /, mod, div
- ✅ Comparison: ==, /=, <, >, <=, >=
- ✅ Boolean: &&, ||, not
- ✅ List: :, ++, !!
- ✅ Function: . (composition)

### Built-in Functions
- ✅ List: head, tail, length, null, reverse, take, drop
- ✅ Higher-order: map, filter, fold
- ✅ Utility: error

### Advanced
- ✅ Nested data structures (lists of tuples, tuples of lists)
- ✅ Complex pattern matching
- ✅ Multiple guards with otherwise
- ✅ Chained operators
- ✅ List ranges with steps
