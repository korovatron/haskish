# Haskish Built-in Functions

This document lists all built-in functions available in Haskish.

## List Functions

- **`head list`** - Returns the first element of a list
  - Error if list is empty
  
- **`tail list`** - Returns all but the first element of a list
  - Error if list is empty
  
- **`length list`** - Returns the length of a list
  
- **`null list`** - Checks if a list is empty, returns `True` or `False`
  
- **`reverse list`** - Reverses a list
  
- **`take n list`** - Takes the first n elements from a list
  
- **`drop n list`** - Drops the first n elements from a list

## Higher-Order Functions

- **`map fn list`** - Applies a function to each element of a list
  
- **`filter predicate list`** - Filters a list by a predicate function, keeping elements that return `True`
  
- **`fold fn acc list`** - Reduces a list with a binary function and an accumulator (left fold)

## Arithmetic Functions

- **`mod a b`** - Modulo operation (remainder after division)
  
- **`div a b`** - Integer division (quotient, rounded down)
  
- **`min a b`** - Returns the minimum of two values
  
- **`max a b`** - Returns the maximum of two values

## Logic Functions

- **`not bool`** - Boolean negation

## Other Functions

- **`error message`** - Throws an error with the given message
  
- **`compose g f`** - Function composition (internally used by the `.` operator)
  - `(g . f) x` is equivalent to `g (f x)`

## Special Keywords

- **`True`** - Boolean true value (capitalized)
- **`False`** - Boolean false value (capitalized)
- **`otherwise`** - Always evaluates to `True` (used in guards)

## Notes

- All functions validate their argument types and counts
- Boolean literals must be capitalized (`True`/`False`) - lowercase versions will throw an error
- Functions are case-sensitive
