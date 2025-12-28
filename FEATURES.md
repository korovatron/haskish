# Haskell Features Implemented in Haskish

## Language Features

- **Pattern Matching** - Function definitions with pattern matching on lists and values
- **Recursion** - Full support for recursive function definitions
- **Guards** - Conditional logic using `|` syntax with `otherwise` keyword
- **Lambda Functions** - Anonymous functions with `\param -> body` syntax
- **Function Composition** - Composing functions with `.` operator
- **Partial Application** - Currying and partial function application
- **Operator Sections** - `(+10)`, `(*2)`, `(<10)` etc.

## List Operations

- **Cons operator** `:` - Prepend element to list
- **Concatenate** `++` - Join two lists
- **List indexing** `!!` - Access element by index (0-indexed)
- **List ranges** `[1..10]`, `[1,3..10]` - Generate numeric sequences

## Binary Operators

- **Arithmetic**: `+`, `-`, `*`, `/`
- **Comparison**: `==`, `/=`, `<`, `>`, `<=`, `>=`
- **Boolean**: `&&`, `||`
- **List**: `:`, `++`, `!!`
- **Function**: `.` (composition)

## Built-in Functions

- **List functions**: `head`, `tail`, `length`, `null`, `reverse`, `take`, `drop`
- **Higher-order**: `map`, `filter`, `fold`
- **Arithmetic**: `mod`, `div`
- **Boolean**: `not`
- **Utility**: `error`

## Data Types

- **Numbers** - Integer and floating-point
- **Strings** - String literals with double quotes
- **Booleans** - `True`, `False`
- **Lists** - Homogeneous lists (all elements same type) and heterogeneous lists (mixed types)
- **Functions** - First-class functions (can be passed as arguments, returned from functions, stored in variables)

## Syntax Support

- **Comments** - `--` single-line comments
- **String literals** - `"text"` with escape sequences
- **Flexible indentation** - Guards and function definitions

## Notes

- **Homogeneous vs Heterogeneous Lists**: While real Haskell enforces homogeneous lists (all elements must be the same type), Haskish allows heterogeneous lists due to its JavaScript implementation.
- **First-class Functions**: Functions can be treated as values - passed to other functions, returned from functions, and created dynamically with lambdas.
