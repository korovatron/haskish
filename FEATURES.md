# Haskell Features Implemented in Haskish

## Language Features

- **Pattern Matching** - Function definitions with pattern matching on lists, tuples, and values
- **Recursion** - Full support for recursive function definitions
- **Guards** - Conditional logic using `|` syntax with `otherwise` keyword
- **Lambda Functions** - Anonymous functions with `\param -> body` syntax
- **Function Composition** - Composing functions with `.` operator
- **Partial Application** - Currying and partial function application
- **Operator Sections** - `(+10)`, `(*2)`, `(<10)` etc.
- **Unary Negation** - `(-x)` syntax for negating variables and expressions
- **Implicit Multiplication** - `3x` automatically becomes `3*x`
- **Syntax Validation** - Comprehensive error checking when loading functions

## List Operations

- **Cons operator** `:` - Prepend element to list
- **Concatenate** `++` - Join two lists
- **List indexing** `!!` - Access element by index (0-indexed)
- **List ranges** `[1..10]`, `[1,3..10]` - Generate numeric sequences

## Binary Operators

- **Arithmetic**: `+`, `-`, `*`, `/`, `mod`, `div`
- **Comparison**: `==`, `/=`, `<`, `>`, `<=`, `>=`
- **Boolean**: `&&`, `||`, `not`
- **List**: `:`, `++`, `!!`
- **Function**: `.` (composition)

## Built-in Functions

- **List functions**: `head`, `tail`, `length`, `null`, `reverse`, `take`, `drop`
- **Higher-order**: `map`, `filter`, `fold`
- **Arithmetic**: `mod`, `div`
- **Boolean**: `not`
- **Utility**: `error`

## Data Types

- **Numbers** - Integer and floating-point with full arithmetic support
- **Strings** - String literals with double quotes
- **Booleans** - `True`, `False` with logical operators
- **Lists** - Homogeneous lists (all elements same type) and heterogeneous lists (mixed types)
- **Tuples** - Fixed-size collections of mixed types: `(1, "hello", True)`
- **Functions** - First-class functions (can be passed as arguments, returned from functions, stored in variables)

## Tuple Support (NEW!)

- **Tuple Literals** - `(1, 2)`, `(x, "hello", True)`, nested tuples `((1,2),(3,4))`
- **Tuple Pattern Matching** - `fst (x, y) = x`, `snd (x, y) = y`
- **Tuple Comparison** - Equality `==` and inequality `/=` operators
- **Mixed Structures** - Lists of tuples `[(1,2),(3,4)]`, tuples of lists `([1,2], [3,4])`

## Syntax Support

- **Comments** - `--` single-line comments
- **String literals** - `"text"` with escape sequences
- **Flexible indentation** - Guards and function definitions
- **Error messages** - Clear error reporting with line numbers and descriptions

## Notes

- **Homogeneous vs Heterogeneous Lists**: While real Haskell enforces homogeneous lists (all elements must be the same type), Haskish allows heterogeneous lists due to its JavaScript implementation.
- **First-class Functions**: Functions can be treated as values - passed to other functions, returned from functions, and created dynamically with lambdas.
- **Unary Negation**: Supports `(-x)` syntax like real Haskell, including in complex expressions `(-x * 2)`
- **Validation**: Comprehensive syntax checking catches errors immediately when loading code, not when executing
