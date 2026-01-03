// Haskish Interpreter - A subset of Haskell for A Level Computer Science

// Class to represent a lambda function
class Lambda {
    constructor(param, body, interpreter, closure = {}) {
        this.param = param;
        this.body = body;
        this.interpreter = interpreter;
        this.closure = closure; // Captured environment for closures
    }

    apply(arg) {
        // Create a binding for the parameter, merging with captured closure
        const bindings = { ...this.closure, [this.param]: arg };
        return this.interpreter.evaluateWithBindings(this.body, bindings);
    }

    toString() {
        return `<lambda \\${this.param} -> ${this.body}>`;
    }
}

// Class to represent a partially applied function
class PartialFunction {
    constructor(funcName, boundArgs, interpreter) {
        this.funcName = funcName;
        this.boundArgs = boundArgs;
        this.interpreter = interpreter;
    }

    apply(additionalArgs) {
        const allArgs = [...this.boundArgs, ...additionalArgs];
        return this.interpreter.applyFunction(this.funcName, allArgs);
    }

    toString() {
        return `<function ${this.funcName} with ${this.boundArgs.length} bound arg(s)>`;
    }
}

// Class to represent an infinite range [n..] or [n,m..]
class InfiniteRange {
    constructor(start, step = 1) {
        this.start = start;
        this.step = step;
        this._isInfiniteRange = true;
    }

    // Generator for lazy iteration
    *[Symbol.iterator]() {
        let current = this.start;
        while (true) {
            yield current;
            current += this.step;
        }
    }

    // Take first n elements
    take(n) {
        const result = [];
        let current = this.start;
        for (let i = 0; i < n; i++) {
            result.push(current);
            current += this.step;
        }
        return result;
    }

    // Get element at index
    at(index) {
        return this.start + (index * this.step);
    }

    // Drop first n elements, return new InfiniteRange
    drop(n) {
        return new InfiniteRange(this.start + (n * this.step), this.step);
    }

    // Get first element
    head() {
        return this.start;
    }

    // Get tail (all but first)
    tail() {
        return new InfiniteRange(this.start + this.step, this.step);
    }

    toString() {
        const preview = this.take(20);
        // Format values properly (handles tuples, etc.)
        const formatted = preview.map(v => {
            if (v && v._isTuple) {
                return '(' + v.elements.map(String).join(',') + ')';
            }
            return String(v);
        });
        return `[${formatted.join(',')}...]`;
    }
}

// Class to represent a mapped infinite range (lazy map over infinite range)
class MappedInfiniteRange {
    constructor(sourceRange, mapFn, interpreter) {
        this.sourceRange = sourceRange;
        this.mapFn = mapFn;
        this.interpreter = interpreter;
        this._isInfiniteRange = true;
    }

    // Apply the mapping function to a value
    _applyFn(value) {
        const fn = this.mapFn;
        if (fn instanceof Lambda) {
            return fn.apply(value);
        }
        if (fn instanceof PartialFunction) {
            return fn.apply([value]);
        }
        if (fn && fn._isOperatorFunction) {
            return fn.apply([value]);
        }
        return this.interpreter.applyFunction(fn, [value]);
    }

    // Generator for lazy iteration
    *[Symbol.iterator]() {
        for (const value of this.sourceRange) {
            yield this._applyFn(value);
        }
    }

    // Take first n elements
    take(n) {
        const result = [];
        let count = 0;
        for (const value of this.sourceRange) {
            if (count >= n) break;
            result.push(this._applyFn(value));
            count++;
        }
        return result;
    }

    // Get element at index
    at(index) {
        const sourceValue = this.sourceRange.at(index);
        return this._applyFn(sourceValue);
    }

    // Drop first n elements, return new MappedInfiniteRange
    drop(n) {
        return new MappedInfiniteRange(this.sourceRange.drop(n), this.mapFn, this.interpreter);
    }

    // Get first element
    head() {
        return this._applyFn(this.sourceRange.head());
    }

    // Get tail (all but first)
    tail() {
        return new MappedInfiniteRange(this.sourceRange.tail(), this.mapFn, this.interpreter);
    }

    toString() {
        const preview = this.take(20);
        // Format values properly (handles tuples, etc.)
        const formatted = preview.map(v => {
            if (v && v._isTuple) {
                return '(' + v.elements.map(String).join(',') + ')';
            }
            return String(v);
        });
        return `[${formatted.join(',')}...]`;
    }
}

// Class to represent a filtered infinite range (lazy filter over infinite range)
class FilteredInfiniteRange {
    constructor(sourceRange, predicate, interpreter) {
        this.sourceRange = sourceRange;
        this.predicate = predicate;
        this.interpreter = interpreter;
        this._isInfiniteRange = true;
    }

    // Test if a value passes the predicate
    _testPredicate(value) {
        const pred = this.predicate;
        if (pred instanceof Lambda) {
            return pred.apply(value);
        }
        if (pred instanceof PartialFunction) {
            return pred.apply([value]);
        }
        if (pred && pred._isOperatorFunction) {
            return pred.apply([value]);
        }
        return this.interpreter.applyFunction(pred, [value]);
    }

    // Generator for lazy iteration
    *[Symbol.iterator]() {
        for (const value of this.sourceRange) {
            if (this._testPredicate(value)) {
                yield value;
            }
        }
    }

    // Take first n elements that pass the filter
    take(n) {
        const result = [];
        let count = 0;
        for (const value of this.sourceRange) {
            if (this._testPredicate(value)) {
                result.push(value);
                count++;
                if (count >= n) break;
            }
        }
        return result;
    }

    // Get element at index (nth element that passes filter)
    at(index) {
        let count = 0;
        for (const value of this.sourceRange) {
            if (this._testPredicate(value)) {
                if (count === index) return value;
                count++;
            }
        }
        throw new Error('Index out of bounds in filtered range');
    }

    // Drop first n elements that pass the filter, return new FilteredInfiniteRange
    drop(n) {
        // We need to scan through and find where to start the new range
        // This is tricky - we'll create a wrapper that skips the first n matches
        let skipped = 0;
        const interpreter = this.interpreter;
        const predicate = this.predicate;
        const sourceIter = this.sourceRange[Symbol.iterator]();
        
        // Create a new source that starts after skipping n matches
        const droppedSource = {
            _isInfiniteRange: true,
            *[Symbol.iterator]() {
                let skipCount = 0;
                for (const value of sourceIter) {
                    const passes = predicate instanceof Lambda ? predicate.apply(value) :
                                   predicate instanceof PartialFunction ? predicate.apply([value]) :
                                   predicate && predicate._isOperatorFunction ? predicate.apply([value]) :
                                   interpreter.applyFunction(predicate, [value]);
                    if (passes) {
                        if (skipCount >= n) {
                            yield value;
                        } else {
                            skipCount++;
                        }
                    } else if (skipCount >= n) {
                        yield value;
                    }
                }
            }
        };
        
        return new FilteredInfiniteRange(droppedSource, predicate, interpreter);
    }

    // Get first element that passes filter
    head() {
        for (const value of this.sourceRange) {
            if (this._testPredicate(value)) {
                return value;
            }
        }
        throw new Error('No elements match filter');
    }

    // Get tail (all but first element that passes filter)
    tail() {
        return this.drop(1);
    }

    toString() {
        const preview = this.take(20);
        // Format values properly (handles tuples, etc.)
        const formatted = preview.map(v => {
            if (v && v._isTuple) {
                return '(' + v.elements.map(String).join(',') + ')';
            }
            return String(v);
        });
        return `[${formatted.join(',')}...]`;
    }
}

// Class to represent an infinite range with prepended elements (cons)
class ConsedInfiniteRange {
    constructor(prependedElements, tailRange) {
        this.prependedElements = Array.isArray(prependedElements) ? prependedElements : [prependedElements];
        this.tailRange = tailRange;
        this._isInfiniteRange = true;
    }

    // Generator for lazy iteration
    *[Symbol.iterator]() {
        // Yield prepended elements first
        for (const elem of this.prependedElements) {
            yield elem;
        }
        // Then yield from the tail range
        for (const elem of this.tailRange) {
            yield elem;
        }
    }

    // Take first n elements
    take(n) {
        const result = [];
        let count = 0;
        for (const elem of this) {
            if (count >= n) break;
            result.push(elem);
            count++;
        }
        return result;
    }

    // Get element at index
    at(index) {
        if (index < this.prependedElements.length) {
            return this.prependedElements[index];
        }
        return this.tailRange.at(index - this.prependedElements.length);
    }

    // Drop first n elements
    drop(n) {
        if (n <= 0) return this;
        if (n < this.prependedElements.length) {
            return new ConsedInfiniteRange(this.prependedElements.slice(n), this.tailRange);
        }
        return this.tailRange.drop(n - this.prependedElements.length);
    }

    // Get first element
    head() {
        if (this.prependedElements.length > 0) {
            return this.prependedElements[0];
        }
        return this.tailRange.head();
    }

    // Get tail (all but first)
    tail() {
        if (this.prependedElements.length > 1) {
            return new ConsedInfiniteRange(this.prependedElements.slice(1), this.tailRange);
        }
        return this.tailRange;
    }

    toString() {
        const preview = this.take(20);
        // Format values properly (handles tuples, etc.)
        const formatted = preview.map(v => {
            if (v && v._isTuple) {
                return '(' + v.elements.map(String).join(',') + ')';
            }
            return String(v);
        });
        return `[${formatted.join(',')}...]`;
    }
}

class HaskishInterpreter {
    constructor() {
        this.functions = {};
        this.variables = {};
        this.initializeBuiltins();
    }

    initializeBuiltins() {
        // Built-in functions available to all programs
        this.builtins = {
            'head': (list) => {
                if (list && list._isInfiniteRange) {
                    return list.head();
                }
                if (typeof list === 'string') {
                    if (list.length === 0) {
                        throw new Error('head: empty list');
                    }
                    return list[0];
                }
                if (!Array.isArray(list) || list.length === 0) {
                    throw new Error('head: empty list');
                }
                return list[0];
            },
            'tail': (list) => {
                if (list && list._isInfiniteRange) {
                    return list.tail();
                }
                if (typeof list === 'string') {
                    if (list.length === 0) {
                        throw new Error('tail: empty list');
                    }
                    return list.slice(1);
                }
                if (!Array.isArray(list) || list.length === 0) {
                    throw new Error('tail: empty list');
                }
                return list.slice(1);
            },
            'map': (fn, list) => {
                if (list && list._isInfiniteRange) {
                    // Return a new MappedInfiniteRange for lazy mapping
                    return new MappedInfiniteRange(list, fn, this);
                }
                if (typeof list === 'string') {
                    // Map over string characters, return array of results
                    return list.split('').map(item => {
                        if (fn instanceof Lambda) {
                            return fn.apply(item);
                        }
                        if (fn instanceof PartialFunction) {
                            return fn.apply([item]);
                        }
                        if (fn && fn._isOperatorFunction) {
                            return fn.apply([item]);
                        }
                        return this.applyFunction(fn, [item]);
                    });
                }
                if (!Array.isArray(list)) {
                    throw new Error('map: second argument must be a list');
                }
                return list.map(item => {
                    if (fn instanceof Lambda) {
                        return fn.apply(item);
                    }
                    if (fn instanceof PartialFunction) {
                        return fn.apply([item]);
                    }
                    if (fn && fn._isOperatorFunction) {
                        return fn.apply([item]);
                    }
                    return this.applyFunction(fn, [item]);
                });
            },
            'filter': (predicate, list) => {
                if (list && list._isInfiniteRange) {
                    // Return a new FilteredInfiniteRange for lazy filtering
                    return new FilteredInfiniteRange(list, predicate, this);
                }
                if (typeof list === 'string') {
                    // Filter string characters, return string
                    return list.split('').filter(item => {
                        if (predicate instanceof Lambda) {
                            return predicate.apply(item);
                        }
                        if (predicate instanceof PartialFunction) {
                            return predicate.apply([item]);
                        }
                        if (predicate && predicate._isOperatorFunction) {
                            return predicate.apply([item]);
                        }
                        return this.applyFunction(predicate, [item]);
                    }).join('');
                }
                if (!Array.isArray(list)) {
                    throw new Error('filter: second argument must be a list');
                }
                return list.filter(item => {
                    if (predicate instanceof Lambda) {
                        return predicate.apply(item);
                    }
                    if (predicate instanceof PartialFunction) {
                        return predicate.apply([item]);
                    }
                    if (predicate && predicate._isOperatorFunction) {
                        return predicate.apply([item]);
                    }
                    return this.applyFunction(predicate, [item]);
                });
            },
            'fold': (fn, acc, list) => {
                if (list && list._isInfiniteRange) {
                    throw new Error('fold: cannot fold infinite range');
                }
                if (typeof list === 'string') {
                    // Fold over string characters
                    return list.split('').reduce((accumulator, item) => {
                        if (fn instanceof Lambda) {
                            // Multi-parameter lambdas are curried: apply accumulator, then item
                            const step1 = fn.apply(accumulator);
                            if (step1 instanceof Lambda) {
                                return step1.apply(item);
                            }
                            return step1;
                        }
                        if (fn instanceof PartialFunction) {
                            return fn.apply([accumulator, item]);
                        }
                        if (fn && fn._isOperatorFunction) {
                            return fn.apply([accumulator, item]);
                        }
                        return this.applyFunction(fn, [accumulator, item]);
                    }, acc);
                }
                if (!Array.isArray(list)) {
                    throw new Error('fold: third argument must be a list');
                }
                return list.reduce((accumulator, item) => {
                    if (fn instanceof Lambda) {
                        // Multi-parameter lambdas are curried: apply accumulator, then item
                        const step1 = fn.apply(accumulator);
                        if (step1 instanceof Lambda) {
                            return step1.apply(item);
                        }
                        return step1;
                    }
                    if (fn instanceof PartialFunction) {
                        return fn.apply([accumulator, item]);
                    }
                    if (fn && fn._isOperatorFunction) {
                        return fn.apply([accumulator, item]);
                    }
                    return this.applyFunction(fn, [accumulator, item]);
                }, acc);
            },
            'length': (list) => {
                if (list && list._isInfiniteRange) {
                    throw new Error('length: cannot get length of infinite range');
                }
                if (typeof list === 'string') {
                    return list.length;
                }
                if (!Array.isArray(list)) {
                    throw new Error('length: argument must be a list');
                }
                return list.length;
            },
            'null': (list) => {
                if (list && list._isInfiniteRange) {
                    return false; // Infinite ranges are never empty
                }
                if (typeof list === 'string') {
                    return list.length === 0;
                }
                if (!Array.isArray(list)) {
                    throw new Error('null: argument must be a list');
                }
                return list.length === 0;
            },
            'reverse': (list) => {
                if (list && list._isInfiniteRange) {
                    throw new Error('reverse: cannot reverse infinite range');
                }
                if (typeof list === 'string') {
                    return list.split('').reverse().join('');
                }
                if (!Array.isArray(list)) {
                    throw new Error('reverse: argument must be a list');
                }
                return list.slice().reverse();
            },
            'take': (n, list) => {
                if (list && list._isInfiniteRange) {
                    return list.take(n);
                }
                if (typeof list === 'string') {
                    return list.slice(0, n);
                }
                if (!Array.isArray(list)) {
                    throw new Error('take: second argument must be a list');
                }
                return list.slice(0, n);
            },
            'drop': (n, list) => {
                if (list && list._isInfiniteRange) {
                    return list.drop(n);
                }
                if (typeof list === 'string') {
                    return list.slice(n);
                }
                if (!Array.isArray(list)) {
                    throw new Error('drop: second argument must be a list');
                }
                return list.slice(n);
            },
            'not': (bool) => {
                return !bool;
            },
            'error': (message) => {
                throw new Error(message);
            },
            'mod': (a, b) => {
                return a % b;
            },
            'div': (a, b) => {
                return Math.floor(a / b);
            },
            'min': (a, b) => {
                return a < b ? a : b;
            },
            'max': (a, b) => {
                return a > b ? a : b;
            },
            'ord': (char) => {
                if (typeof char !== 'string' || char.length !== 1) {
                    throw new Error('ord: argument must be a single character');
                }
                return char.charCodeAt(0);
            },
            'chr': (code) => {
                if (typeof code !== 'number' || code < 0 || code > 1114111) {
                    throw new Error('chr: argument must be a valid Unicode code point (0-1114111)');
                }
                return String.fromCharCode(code);
            },
            'compose': (g, f) => {
                // Function composition: (g . f) x = g(f(x))
                const interpreter = this;
                return {
                    _isComposedFunction: true,
                    g: g,
                    f: f,
                    apply: (args) => {
                        // Apply f first
                        let fResult;
                        if (f instanceof Lambda) {
                            fResult = f.apply(args[0]);
                        } else if (f instanceof PartialFunction) {
                            fResult = f.apply(args);
                        } else if (f && f._isOperatorFunction) {
                            fResult = f.apply(args);
                        } else if (f && f._isComposedFunction) {
                            fResult = f.apply(args);
                        } else {
                            fResult = interpreter.applyFunction(f, args);
                        }
                        
                        // Apply g to the result
                        if (g instanceof Lambda) {
                            return g.apply(fResult);
                        } else if (g instanceof PartialFunction) {
                            return g.apply([fResult]);
                        } else if (g && g._isOperatorFunction) {
                            return g.apply([fResult]);
                        } else if (g && g._isComposedFunction) {
                            return g.apply([fResult]);
                        } else {
                            return interpreter.applyFunction(g, [fResult]);
                        }
                    },
                    toString: () => `<composed function>`
                };
            }
        };
    }

    // Parse function definitions and variable bindings
    parseFunctionDefinitions(code) {
        this.functions = {};
        this.variables = {};
        const lines = code.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith('--');
        });

        let currentFunction = null;
        let currentCases = [];
        let currentParams = null;
        let currentGuards = [];
        let lineNumber = 0;
        const originalLines = code.split('\n');

        for (let line of lines) {
            // Find the line number in the original code
            lineNumber = originalLines.findIndex((origLine, idx) => 
                idx >= lineNumber && origLine.trim() === line.trim()
            ) + 1;

            line = line.trim();
            if (!line) continue;

            // Strip optional 'let' keyword at the start
            const originalLine = line;
            line = line.replace(/^let\s+/, '');

            // Check for invalid assignment operators like -=, +=, *=, /=
            if (/[+\-*/%]=/.test(line) && !/[=<>!\/]=/.test(line.match(/[+\-*/%]=/)?.[0])) {
                throw new Error(`Invalid operator on line ${lineNumber}: "${originalLine}". Did you mean '=' instead of '${line.match(/[+\-*/%]=/)?.[0]}'?`);
            }

            // Check if this is a guard line (starts with |)
            // Need to find the = that separates condition from body, not == in comparisons
            if (line.startsWith('|') && currentFunction && currentParams) {
                // Remove the leading |
                const guardLine = line.slice(1).trim();
                
                // Find the = that's not part of ==, <=, >=, /=
                let eqIndex = -1;
                for (let i = 0; i < guardLine.length; i++) {
                    if (guardLine[i] === '=' && 
                        (i === 0 || guardLine[i-1] !== '=' && guardLine[i-1] !== '<' && guardLine[i-1] !== '>' && guardLine[i-1] !== '!' && guardLine[i-1] !== '/') &&
                        (i === guardLine.length - 1 || guardLine[i+1] !== '=')) {
                        eqIndex = i;
                        break;
                    }
                }
                
                if (eqIndex !== -1) {
                    const condition = guardLine.slice(0, eqIndex).trim();
                    const body = guardLine.slice(eqIndex + 1).trim();
                    currentGuards.push({ condition, body });
                    continue;
                } else {
                    throw new Error(`Invalid guard syntax on line ${lineNumber}: "${originalLine}"`);
                }
            }

            // Try to match function definition (has parameters before =)
            const funcMatch = line.match(/^(\w+'*)\s+(.+?)\s*=\s*(.+)$/);
            
            if (funcMatch) {
                // Save previous guards if any
                if (currentGuards.length > 0) {
                    currentCases.push({ params: currentParams, guards: currentGuards });
                    currentGuards = [];
                    currentParams = null;
                }

                // It's a function definition
                const [, funcName, params, body] = funcMatch;
                
                // Validate parameters - should only contain valid pattern syntax
                // Allow: words, numbers, spaces, parentheses, brackets, colons, commas, underscores
                // Disallow: operators like +, -, *, /, etc. in parameters
                if (!/^[\w\s()\[\]:,_]+$/.test(params)) {
                    throw new Error(`Invalid parameters on line ${lineNumber}: "${originalLine}". Parameters cannot contain operators.`);
                }
                
                if (currentFunction && currentFunction !== funcName) {
                    this.functions[currentFunction] = currentCases;
                    currentCases = [];
                }
                
                currentFunction = funcName;
                currentParams = params.trim();
                currentCases.push({ params: currentParams, body: body.trim() });
                currentParams = null; // Reset since this is a complete definition
                continue;
            }

            // Check for function header without = (for guard syntax)
            const headerMatch = line.match(/^(\w+'*)\s+(.+)$/);
            if (headerMatch && !line.includes('=')) {
                // Save previous guards if any
                if (currentGuards.length > 0) {
                    currentCases.push({ params: currentParams, guards: currentGuards });
                    currentGuards = [];
                    currentParams = null;
                }

                const [, funcName, params] = headerMatch;
                
                // Validate parameters - should only contain valid pattern syntax
                if (!/^[\w\s()\[\]:,_]+$/.test(params)) {
                    throw new Error(`Invalid parameters on line ${lineNumber}: "${originalLine}". Parameters cannot contain operators.`);
                }
                
                if (currentFunction && currentFunction !== funcName) {
                    this.functions[currentFunction] = currentCases;
                    currentCases = [];
                }
                
                currentFunction = funcName;
                currentParams = params.trim();
                // Don't add to cases yet - wait for guards
                continue;
            }

            // Check if it's a tuple pattern assignment like (a, b) = expr
            let tupleAssignMatch = null;
            if (line.startsWith('(')) {
                // Find the matching closing paren
                let depth = 0;
                let endIndex = -1;
                for (let i = 0; i < line.length; i++) {
                    if (line[i] === '(') depth++;
                    if (line[i] === ')') depth--;
                    if (depth === 0) {
                        endIndex = i;
                        break;
                    }
                }
                
                // Check if there's an = after the closing paren (not ==, /=, <=, >=)
                if (endIndex !== -1) {
                    const afterParen = line.slice(endIndex + 1).trimStart();
                    if (afterParen.startsWith('=') && !afterParen.startsWith('==')) {
                        const pattern = line.slice(0, endIndex + 1);
                        const valueExpr = afterParen.slice(1).trimStart();
                        if (valueExpr) {
                            tupleAssignMatch = [line, pattern, valueExpr];
                        }
                    }
                }
            }
            
            if (tupleAssignMatch) {
                // Save pending guards first
                if (currentGuards.length > 0) {
                    currentCases.push({ params: currentParams, guards: currentGuards });
                    currentGuards = [];
                    currentParams = null;
                }

                // It's a tuple destructuring assignment
                if (currentFunction) {
                    this.functions[currentFunction] = currentCases;
                    currentFunction = null;
                    currentCases = [];
                }
                
                const [, pattern, valueExpr] = tupleAssignMatch;
                
                // Evaluate the right-hand side
                const evaluated = this.evaluate(valueExpr.trim());
                
                // Use existing matchPattern to destructure
                const bindings = this.matchPattern(pattern, evaluated);
                
                if (bindings === null) {
                    throw new Error(`Pattern match failure on line ${lineNumber}: ${pattern} does not match ${this.formatOutput(evaluated)}`);
                }
                
                // Add all the bindings to variables
                for (const [varName, varValue] of Object.entries(bindings)) {
                    if (this.builtins[varName]) {
                        throw new Error(`Cannot use '${varName}' as a variable name: it is a built-in function`);
                    }
                    this.variables[varName] = varValue;
                }
                continue;
            }
            
            // Try to match variable binding (no parameters before =)
            const varMatch = line.match(/^(\w+'*)\s*=\s*(.+)$/);
            if (varMatch) {
                // Save pending guards first
                if (currentGuards.length > 0) {
                    currentCases.push({ params: currentParams, guards: currentGuards });
                    currentGuards = [];
                    currentParams = null;
                }

                // It's a variable binding
                if (currentFunction) {
                    this.functions[currentFunction] = currentCases;
                    currentFunction = null;
                    currentCases = [];
                }
                const [, name, value] = varMatch;
                // Check if the variable name shadows a built-in function
                if (this.builtins[name]) {
                    throw new Error(`Cannot use '${name}' as a variable name: it is a built-in function`);
                }
                this.variables[name] = this.evaluate(value.trim());
                continue;
            }

            // If we reach here, the line doesn't match any valid pattern
            throw new Error(`Invalid syntax on line ${lineNumber}: "${originalLine}"`);
        }

        // Save any pending guards
        if (currentGuards.length > 0) {
            currentCases.push({ params: currentParams, guards: currentGuards });
            currentParams = null; // Reset after saving guards
        }

        // Check for incomplete function definition (header without guards or body)
        if (currentFunction && currentParams !== null) {
            throw new Error(`Incomplete function definition for '${currentFunction}': expected guards (|) or assignment (=) after parameters.`);
        }

        if (currentFunction) {
            this.functions[currentFunction] = currentCases;
        }

        // Validate all function bodies and variable expressions for syntax errors
        this.validateDefinitions();
    }

    // Validate function bodies and variable expressions
    validateDefinitions() {
        // Validate variable expressions
        for (const [varName, value] of Object.entries(this.variables)) {
            // Variables are already evaluated during parsing, so if we got here they're valid
        }

        // Validate function bodies by attempting to tokenize them
        for (const [funcName, cases] of Object.entries(this.functions)) {
            for (let i = 0; i < cases.length; i++) {
                const funcCase = cases[i];
                
                // If this case has guards, validate each guard's condition and body
                if (funcCase.guards) {
                    for (const guard of funcCase.guards) {
                        try {
                            this.tokenize(guard.condition);
                        } catch (error) {
                            throw new Error(`Syntax error in function '${funcName}' guard condition: ${error.message}`);
                        }
                        try {
                            this.tokenize(guard.body);
                        } catch (error) {
                            throw new Error(`Syntax error in function '${funcName}' guard body: ${error.message}`);
                        }
                    }
                } else if (funcCase.body) {
                    // Validate the function body
                    try {
                        this.tokenize(funcCase.body);
                    } catch (error) {
                        throw new Error(`Syntax error in function '${funcName}': ${error.message}`);
                    }
                }
            }
        }
    }

    // Tokenize an expression
    tokenize(expr) {
        expr = expr.trim();
        const tokens = [];
        let i = 0;

        while (i < expr.length) {
            // Skip whitespace
            if (/\s/.test(expr[i])) {
                i++;
                continue;
            }

            // String literals (double quotes)
            if (expr[i] === '"') {
                let j = i + 1;
                while (j < expr.length && expr[j] !== '"') {
                    if (expr[j] === '\\') j++; // Skip escaped characters
                    j++;
                }
                if (j < expr.length) j++; // Include closing quote
                tokens.push({ type: 'string', value: expr.slice(i, j) });
                i = j;
                continue;
            }

            // String literals (single quotes) - treat as double-quoted strings
            if (expr[i] === "'") {
                let j = i + 1;
                while (j < expr.length && expr[j] !== "'") {
                    if (expr[j] === '\\') j++; // Skip escaped characters
                    j++;
                }
                if (j < expr.length) j++; // Include closing quote
                // Convert to double-quoted string format
                const content = expr.slice(i + 1, j - 1);
                tokens.push({ type: 'string', value: '"' + content + '"' });
                i = j;
                continue;
            }

            // Lists
            if (expr[i] === '[') {
                let depth = 1;
                let j = i + 1;
                while (j < expr.length && depth > 0) {
                    if (expr[j] === '[') depth++;
                    if (expr[j] === ']') depth--;
                    j++;
                }
                tokens.push({ type: 'list', value: expr.slice(i, j) });
                i = j;
                continue;
            }

            // Parentheses (including lambdas and tuples)
            if (expr[i] === '(') {
                let depth = 1;
                let j = i + 1;
                while (j < expr.length && depth > 0) {
                    if (expr[j] === '(') depth++;
                    if (expr[j] === ')') depth--;
                    j++;
                }
                const parenContent = expr.slice(i + 1, j - 1).trim();
                
                // Check for tuple (contains commas at depth 0)
                let hasTupleComma = false;
                let tupleDepth = 0;
                for (let k = 0; k < parenContent.length; k++) {
                    if (parenContent[k] === '(' || parenContent[k] === '[') tupleDepth++;
                    if (parenContent[k] === ')' || parenContent[k] === ']') tupleDepth--;
                    if (tupleDepth === 0 && parenContent[k] === ',') {
                        hasTupleComma = true;
                        break;
                    }
                }
                
                if (hasTupleComma) {
                    tokens.push({ type: 'tuple', value: parenContent });
                    i = j;
                    continue;
                }
                
                // Check for unary negation: (-x) where x is just an identifier
                // This transforms (-x) to (0 - x) to handle unary minus
                if (parenContent.startsWith('-') && parenContent.length > 1) {
                    const afterMinus = parenContent.slice(1).trim();
                    // Only transform if:
                    // 1. Not a number literal
                    // 2. Not an arrow (->)
                    // 3. Just a simple identifier (no operators or spaces after)
                    const isSimpleId = /^[a-zA-Z_]\w*'*$/.test(afterMinus);
                    const isNestedParen = afterMinus.startsWith('(');
                    
                    if (!afterMinus.startsWith('>') && (isSimpleId || isNestedParen)) {
                        // Transform (-x) to (0 - x) or (-(...)) to (0 - (...))
                        const transformedContent = '0 - ' + afterMinus;
                        tokens.push({ type: 'paren', value: transformedContent });
                        i = j;
                        continue;
                    }
                }
                
                // Check if it's a lambda expression (-> at top level, not in nested parens/brackets)
                let isLambda = false;
                let checkDepth = 0;
                for (let k = 0; k < parenContent.length - 1; k++) {
                    if (parenContent[k] === '(' || parenContent[k] === '[') checkDepth++;
                    if (parenContent[k] === ')' || parenContent[k] === ']') checkDepth--;
                    if (checkDepth === 0 && parenContent[k] === '-' && parenContent[k + 1] === '>') {
                        isLambda = true;
                        break;
                    }
                }
                if (isLambda) {
                    tokens.push({ type: 'lambda', value: parenContent });
                } else {
                    tokens.push({ type: 'paren', value: parenContent });
                }
                i = j;
                continue;
            }
            
            // Backslash for lambda (alternative syntax without parens)
            if (expr[i] === '\\') {
                // Find the end of the lambda (up to the end of expression or balanced parens)
                let j = i + 1;
                let depth = 0;
                while (j < expr.length) {
                    if (expr[j] === '(') depth++;
                    if (expr[j] === ')') {
                        if (depth === 0) break;
                        depth--;
                    }
                    if (expr[j] === '[') depth++;
                    if (expr[j] === ']') {
                        if (depth === 0) break;
                        depth--;
                    }
                    // Lambda ends at whitespace when depth is 0 and we've seen ->
                    if (depth === 0 && /\s/.test(expr[j]) && expr.slice(i, j).includes('->')) {
                        break;
                    }
                    j++;
                }
                tokens.push({ type: 'lambda', value: expr.slice(i + 1, j) });
                i = j;
                continue;
            }

            // Numbers (including negative)
            // Don't parse as number if preceded by a letter or underscore (it's part of an identifier)
            const prevToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;
            const canBeNegative = expr[i] === '-' && i + 1 < expr.length && /\d/.test(expr[i + 1]) &&
                (!prevToken || (prevToken.type !== 'number' && prevToken.type !== 'paren'));
            
            if (((/\d/.test(expr[i]) || canBeNegative) && (i === 0 || !/[a-zA-Z_]/.test(expr[i - 1])))) {
                let j = i;
                if (expr[j] === '-') j++;
                while (j < expr.length && /[\d.]/.test(expr[j])) j++;
                
                // Handle scientific notation (e.g., 1.5e-10, 2E+5)
                let hasScientificNotation = false;
                if (j < expr.length && /[eE]/.test(expr[j])) {
                    hasScientificNotation = true;
                    j++; // consume 'e' or 'E'
                    if (j < expr.length && /[+\-]/.test(expr[j])) j++; // optional sign
                    while (j < expr.length && /\d/.test(expr[j])) j++; // exponent digits
                }
                
                tokens.push({ type: 'number', value: parseFloat(expr.slice(i, j)) });
                
                // Implicit multiplication: if number is directly followed by identifier, insert *
                // But NOT if we just parsed scientific notation (the 'e' was part of the number)
                if (!hasScientificNotation && j < expr.length && /[a-zA-Z_]/.test(expr[j])) {
                    tokens.push({ type: 'operator', value: '*' });
                }
                
                i = j;
                continue;
            }

            // Operators and symbols (including . for composition, && and ||)
            if (/[+\-*\/:<>=!.&|]/.test(expr[i])) {
                // Skip . if it's part of a decimal number (preceded by digit or followed by digit)
                if (expr[i] === '.' && (
                    (i > 0 && /\d/.test(expr[i - 1])) ||
                    (i + 1 < expr.length && /\d/.test(expr[i + 1]))
                )) {
                    i++;
                    continue;
                }
                
                let j = i;
                // Special handling for .. (range operator) vs . (composition)
                if (expr[i] === '.' && i + 1 < expr.length && expr[i + 1] === '.') {
                    // This is a range operator, not composition - skip it here
                    i++;
                    continue;
                }
                while (j < expr.length && /[+\-*\/:<>=!.&|]/.test(expr[j])) {
                    // Stop at .. to avoid capturing range operator
                    if (expr[j] === '.' && j + 1 < expr.length && expr[j + 1] === '.') break;
                    // Stop if . is part of a decimal number
                    if (expr[j] === '.' && j + 1 < expr.length && /\d/.test(expr[j + 1])) break;
                    j++;
                }
                tokens.push({ type: 'operator', value: expr.slice(i, j) });
                i = j;
                continue;
            }

            // Identifiers and keywords
            if (/[a-zA-Z_]/.test(expr[i])) {
                let j = i;
                while (j < expr.length && /[a-zA-Z0-9_]/.test(expr[j])) j++;
                // Allow trailing prime characters (Haskell-style)
                while (j < expr.length && expr[j] === "'") j++;
                tokens.push({ type: 'identifier', value: expr.slice(i, j) });
                i = j;
                continue;
            }

            i++;
        }

        return tokens;
    }

    // Parse a list literal
    parseList(listStr) {
        listStr = listStr.trim();
        if (listStr === '[]') return [];
        
        // Remove outer brackets
        if (listStr.startsWith('[') && listStr.endsWith(']')) {
            listStr = listStr.slice(1, -1);
        }

        // Check for list comprehension: [expr | generator, ...]
        // Need to find the | at depth 0 (not inside nested brackets)
        let bracketDepth = 0;
        let pipeIndex = -1;
        for (let i = 0; i < listStr.length; i++) {
            const char = listStr[i];
            if (char === '[' || char === '(') bracketDepth++;
            if (char === ']' || char === ')') bracketDepth--;
            if (char === '|' && bracketDepth === 0) {
                pipeIndex = i;
                break;
            }
        }
        
        if (pipeIndex !== -1) {
            // This is a list comprehension
            return this.parseListComprehension(listStr, pipeIndex);
        }

        // Check for infinite range syntax: [start..] or [start,next..]
        const infiniteRangeMatch = listStr.match(/^(-?\d+)(?:,(-?\d+))?\.\.$/);
        if (infiniteRangeMatch) {
            const start = parseInt(infiniteRangeMatch[1]);
            const next = infiniteRangeMatch[2] ? parseInt(infiniteRangeMatch[2]) : null;
            const step = next !== null ? (next - start) : 1;
            
            if (step === 0) {
                throw new Error('Range step cannot be zero');
            }
            
            return new InfiniteRange(start, step);
        }

        // Check for finite range syntax: [start..end] or [start,next..end]
        const rangeMatch = listStr.match(/^(-?\d+)(?:,(-?\d+))?\.\.(-?\d+)$/);
        if (rangeMatch) {
            const start = parseInt(rangeMatch[1]);
            const end = parseInt(rangeMatch[3]);
            const next = rangeMatch[2] ? parseInt(rangeMatch[2]) : null;
            
            // Calculate step
            const step = next !== null ? (next - start) : (start <= end ? 1 : -1);
            
            if (step === 0) {
                throw new Error('Range step cannot be zero');
            }
            
            // Generate range
            const result = [];
            if (step > 0) {
                for (let i = start; i <= end; i += step) {
                    result.push(i);
                }
            } else {
                for (let i = start; i >= end; i += step) {
                    result.push(i);
                }
            }
            return result;
        }

        const elements = [];
        let current = '';
        let depth = 0;

        for (let char of listStr) {
            if (char === '[' || char === '(') depth++;
            if (char === ']' || char === ')') depth--;
            
            if (char === ',' && depth === 0) {
                elements.push(this.evaluate(current.trim()));
                current = '';
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            elements.push(this.evaluate(current.trim()));
        }

        return elements;
    }

    // Parse a tuple literal
    parseTuple(tupleStr) {
        tupleStr = tupleStr.trim();
        
        const elements = [];
        let current = '';
        let depth = 0;

        for (let char of tupleStr) {
            if (char === '(' || char === '[') depth++;
            if (char === ')' || char === ']') depth--;
            
            if (char === ',' && depth === 0) {
                elements.push(this.evaluate(current.trim()));
                current = '';
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            elements.push(this.evaluate(current.trim()));
        }

        // Return as a special tuple object
        return { _isTuple: true, elements: elements };
    }

    // Parse list comprehension: [expr | x <- list, guard, y <- list2, ...]
    parseListComprehension(comprehensionStr, pipeIndex) {
        const outputExpr = comprehensionStr.substring(0, pipeIndex).trim();
        const clausesStr = comprehensionStr.substring(pipeIndex + 1).trim();
        
        // Parse clauses (generators and guards)
        const clauses = [];
        let current = '';
        let depth = 0;
        
        for (let char of clausesStr) {
            if (char === '[' || char === '(') depth++;
            if (char === ']' || char === ')') depth--;
            
            if (char === ',' && depth === 0) {
                clauses.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        if (current.trim()) {
            clauses.push(current.trim());
        }
        
        // Parse each clause as either generator (x <- list) or guard (boolean expr)
        const generators = [];
        const guards = [];
        
        for (const clause of clauses) {
            // Try to match tuple pattern: (a, b, c) <- list
            const tuplePattern = clause.match(/^\(([^)]+)\)\s*<-\s*(.+)$/);
            // Try to match simple pattern: x <- list
            const simplePattern = clause.match(/^(\w+)\s*<-\s*(.+)$/);
            
            if (tuplePattern) {
                // Parse tuple pattern variables
                const vars = tuplePattern[1].split(',').map(v => v.trim());
                generators.push({
                    variables: vars,
                    list: tuplePattern[2],
                    isTuple: true
                });
            } else if (simplePattern) {
                generators.push({
                    variable: simplePattern[1],
                    list: simplePattern[2],
                    isTuple: false
                });
            } else {
                // It's a guard (filter condition)
                guards.push(clause);
            }
        }
        
        if (generators.length === 0) {
            throw new Error('List comprehension must have at least one generator');
        }
        
        // Evaluate the list comprehension
        return this.evaluateListComprehension(outputExpr, generators, guards);
    }
    
    // Evaluate list comprehension with nested generators and guards
    evaluateListComprehension(outputExpr, generators, guards, bindings = {}, genIndex = 0) {
        // Special case: single generator from infinite range with guards
        // Return a lazy filtered infinite range instead of materializing
        if (genIndex === 0 && generators.length === 1 && Object.keys(bindings).length === 0) {
            const generator = generators[0];
            const listExpr = this.evaluate(generator.list);
            
            // Check if we can create a lazy filtered/mapped infinite range
            // Skip optimization for tuple patterns - they need full evaluation
            if (listExpr && listExpr._isInfiniteRange && !generator.isTuple) {
                const varName = generator.variable;
                
                // Check if output expression is just the variable (simple identity)
                const isIdentity = outputExpr.trim() === varName;
                
                // If we have guards, create a combined predicate
                if (guards.length > 0) {
                    const combinedPredicate = new Lambda(varName, guards.map(g => `(${g})`).join(' && '), this, {});
                    
                    if (isIdentity) {
                        // Just filter: [x | x <- [n..], guard(x)]
                        return new FilteredInfiniteRange(listExpr, combinedPredicate, this);
                    } else {
                        // Filter and map: [expr | x <- [n..], guard(x)]
                        const filtered = new FilteredInfiniteRange(listExpr, combinedPredicate, this);
                        const mapLambda = new Lambda(varName, outputExpr, this, {});
                        return new MappedInfiniteRange(filtered, mapLambda, this);
                    }
                } else if (!isIdentity) {
                    // Just map, no filter: [expr | x <- [n..]]
                    const mapLambda = new Lambda(varName, outputExpr, this, {});
                    return new MappedInfiniteRange(listExpr, mapLambda, this);
                } else {
                    // Identity with no guards: [x | x <- [n..]] - just return the range
                    return listExpr;
                }
            }
        }
        
        if (genIndex >= generators.length) {
            // Base case: all generators exhausted, check guards and produce output
            // Check all guards
            for (const guard of guards) {
                const guardResult = this.evaluateWithBindings(guard, bindings);
                if (!guardResult) {
                    return []; // Guard failed, skip this combination
                }
            }
            // All guards passed, evaluate output expression
            const result = this.evaluateWithBindings(outputExpr, bindings);
            return [result];
        }
        
        // Recursive case: process current generator
        const generator = generators[genIndex];
        const listExpr = this.evaluateWithBindings(generator.list, bindings);
        
        // Handle infinite ranges specially - take a reasonable amount
        let sourceList;
        if (listExpr && listExpr._isInfiniteRange) {
            // For infinite ranges in comprehensions, take first 100 elements
            sourceList = listExpr.take(100);
        } else if (typeof listExpr === 'string') {
            // Handle strings as character lists
            sourceList = listExpr.split('');
        } else if (Array.isArray(listExpr)) {
            sourceList = listExpr;
        } else {
            throw new Error(`Generator expression must evaluate to a list: ${generator.list}`);
        }
        
        // Iterate through the list and recursively process remaining generators
        const results = [];
        for (const item of sourceList) {
            let newBindings = { ...bindings };
            
            if (generator.isTuple) {
                // Destructure tuple pattern
                if (!item || !item._isTuple) {
                    throw new Error(`Pattern match failure: expected tuple but got ${JSON.stringify(item)}`);
                }
                if (item.elements.length !== generator.variables.length) {
                    throw new Error(`Pattern match failure: tuple has ${item.elements.length} elements but pattern expects ${generator.variables.length}`);
                }
                // Bind each variable from the tuple
                generator.variables.forEach((varName, i) => {
                    newBindings[varName] = item.elements[i];
                });
            } else {
                // Simple pattern: bind single variable
                newBindings[generator.variable] = item;
            }
            
            const subResults = this.evaluateListComprehension(outputExpr, generators, guards, newBindings, genIndex + 1);
            results.push(...subResults);
        }
        
        return results;
    }

    // Pattern matching helper
    matchPattern(pattern, value) {
        pattern = pattern.trim();

        // Check for cons pattern BEFORE tuple pattern (to handle ((x,y):rest))
        if (pattern.startsWith('(') && pattern.endsWith(')')) {
            const inner = pattern.slice(1, -1);
            
            // Find the cons operator (:) at depth 0
            let depth = 0;
            let consIndex = -1;
            for (let i = 0; i < inner.length; i++) {
                if (inner[i] === '(' || inner[i] === '[') depth++;
                if (inner[i] === ')' || inner[i] === ']') depth--;
                if (inner[i] === ':' && depth === 0) {
                    consIndex = i;
                    break;
                }
            }
            
            // If we found a cons operator, this is a list pattern
            if (consIndex !== -1) {
                // Convert string to array for pattern matching
                const listValue = typeof value === 'string' ? value.split('') : value;
                
                if (!Array.isArray(listValue) || listValue.length === 0) return null;
                
                const headPat = inner.slice(0, consIndex).trim();
                const tailPat = inner.slice(consIndex + 1).trim();
                
                // Recursively match the head pattern (could be a tuple or nested pattern)
                const headMatch = this.matchPattern(headPat, listValue[0]);
                if (headMatch === null) return null;
                
                // Check if tail pattern is another cons pattern
                if (tailPat.includes(':')) {
                    // Recursively match the tail pattern with the rest of the list
                    // Keep as string if original was string
                    const tailValue = typeof value === 'string' ? listValue.slice(1).join('') : listValue.slice(1);
                    const tailMatch = this.matchPattern('(' + tailPat + ')', tailValue);
                    if (tailMatch === null) return null;
                    return {
                        ...headMatch,
                        ...tailMatch
                    };
                } else {
                    // Simple case: just head and tail variable
                    // Keep as string if original was string
                    const tailValue = typeof value === 'string' ? listValue.slice(1).join('') : listValue.slice(1);
                    return {
                        ...headMatch,
                        [tailPat]: tailValue
                    };
                }
            }
        }

        // Tuple pattern like (x, y) or (a, b, c)
        if (pattern.includes(',') && pattern.startsWith('(') && pattern.endsWith(')')) {
            if (!value || !value._isTuple) return null;
            
            // Extract tuple element patterns
            const patternContent = pattern.slice(1, -1);
            const patterns = [];
            let current = '';
            let depth = 0;
            
            for (let char of patternContent) {
                if (char === '(' || char === '[') depth++;
                if (char === ')' || char === ']') depth--;
                
                if (char === ',' && depth === 0) {
                    patterns.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            if (current.trim()) {
                patterns.push(current.trim());
            }
            
            // Check if tuple sizes match
            if (patterns.length !== value.elements.length) return null;
            
            // Match each element
            const bindings = {};
            for (let i = 0; i < patterns.length; i++) {
                const elemPattern = patterns[i];
                const elemValue = value.elements[i];
                
                // Recursively match nested patterns
                const elemMatch = this.matchPattern(elemPattern, elemValue);
                if (elemMatch === null) return null;
                Object.assign(bindings, elemMatch);
            }
            
            return bindings;
        }

        // Empty list pattern
        if (pattern === '[]') {
            // Match empty array or empty string
            if (Array.isArray(value) && value.length === 0) return {};
            if (typeof value === 'string' && value.length === 0) return {};
            return null;
        }

        // Specific list pattern like [a, b]
        const listPatMatch = pattern.match(/^\[(.+)\]$/);
        if (listPatMatch) {
            // Convert string to array for pattern matching
            const listValue = typeof value === 'string' ? value.split('') : value;
            if (!Array.isArray(listValue)) return null;
            const params = listPatMatch[1].split(',').map(p => p.trim());
            if (params.length !== listValue.length) return null;
            
            const bindings = {};
            params.forEach((param, i) => {
                bindings[param] = listValue[i];
            });
            return bindings;
        }

        // Simple variable binding
        if (/^[a-zA-Z_]\w*'*$/.test(pattern)) {
            return { [pattern]: value };
        }

        // Literal match
        const literalValue = this.evaluate(pattern);
        return literalValue === value ? {} : null;
    }

    // Apply a function with arguments
    applyFunction(funcName, args) {
        // Check built-ins first
        if (this.builtins[funcName]) {
            // For built-ins, check if we have enough arguments
            const builtinFn = this.builtins[funcName];
            if (args.length < builtinFn.length) {
                // Return a partially applied function
                return new PartialFunction(funcName, args, this);
            }
            // Check if too many arguments provided
            if (args.length > builtinFn.length) {
                throw new Error(`Function '${funcName}' expects ${builtinFn.length} argument${builtinFn.length === 1 ? '' : 's'}, but got ${args.length}`);
            }
            return builtinFn(...args);
        }

        // Check user-defined functions
        if (!this.functions[funcName]) {
            // Check if it's in variables - better error message
            if (this.variables[funcName]) {
                throw new Error(`'${funcName}' is a variable, not a function. Use it without explicit function call syntax.`);
            }
            throw new Error(`Undefined function: ${funcName}`);
        }

        const cases = this.functions[funcName];
        
        // Try each pattern case
        for (let caseObj of cases) {
            const patterns = this.parsePatterns(caseObj.params);
            
            // If not enough arguments, return a partial function
            if (args.length < patterns.length) {
                return new PartialFunction(funcName, args, this);
            }
            
            if (patterns.length !== args.length) continue;

            let bindings = {};
            let matched = true;

            for (let i = 0; i < patterns.length; i++) {
                const match = this.matchPattern(patterns[i], args[i]);
                if (match === null) {
                    matched = false;
                    break;
                }
                Object.assign(bindings, match);
            }

            if (matched) {
                // Check if this case has guards
                if (caseObj.guards) {
                    // Evaluate guards in order
                    for (let guard of caseObj.guards) {
                        const conditionResult = this.evaluateWithBindings(guard.condition, bindings);
                        if (conditionResult === true) {
                            return this.evaluateWithBindings(guard.body, bindings);
                        }
                    }
                    // No guard matched - continue to next case
                    continue;
                } else {
                    // No guards, just return the body
                    return this.evaluateWithBindings(caseObj.body, bindings);
                }
            }
        }

        // Format args for error message without JSON.stringify to avoid circular reference
        const argsStr = args.map(arg => {
            if (arg instanceof Lambda) return arg.toString();
            if (arg instanceof PartialFunction) return arg.toString();
            if (arg && arg._isOperatorFunction) return '<operator function>';
            if (arg && arg._isComposedFunction) return '<composed function>';
            return JSON.stringify(arg);
        }).join(', ');
        throw new Error(`No pattern matched for function ${funcName} with arguments: ${argsStr}`);
    }

    // Parse parameter patterns
    parsePatterns(paramsStr) {
        const patterns = [];
        let current = '';
        let depth = 0;

        for (let char of paramsStr) {
            if (char === '(' || char === '[') depth++;
            if (char === ')' || char === ']') depth--;
            
            if (char === ' ' && depth === 0 && current.trim()) {
                patterns.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        if (current.trim()) {
            patterns.push(current.trim());
        }

        return patterns;
    }

    // Evaluate expression with variable bindings
    evaluateWithBindings(expr, bindings) {
        // Preprocess: Add implicit multiplication (3x becomes 3*x) BEFORE substitution
        // Skip this if expression contains lambda syntax to avoid corruption
        // Also be careful not to insert * in the middle of identifiers (like multiple3or5)
        // Also skip scientific notation (1e-5, 2E+3)
        if (!expr.includes('\\')) {
            // Don't insert * between digit and e/E if it looks like scientific notation
            expr = expr.replace(/(?<![a-zA-Z_])(\d)([a-zA-Z_])/g, (match, digit, letter, offset) => {
                // Check if this is scientific notation: digit followed by e/E followed by optional +/- and digits
                if (/[eE]/.test(letter)) {
                    const rest = expr.slice(offset + match.length);
                    if (/^[+\-]?\d/.test(rest)) {
                        return match; // Keep as-is, it's scientific notation
                    }
                }
                return digit + '*' + letter;
            });
        }
        
        // For function objects (Lambda, operator sections, etc), store them in the variables table
        // during evaluation, since they can't be stringified
        const tempVars = {};
        
        for (let [varName, value] of Object.entries(bindings)) {
            // Check if this is a function object that can't be stringified
            if (value instanceof Lambda || 
                (value && value._isOperatorFunction) ||
                (value && value._isComposedFunction) ||
                value instanceof PartialFunction) {
                // Store directly in variables table under the binding name
                tempVars[varName] = value;
            }
        }
        
        // Temporarily add function objects to the variables table
        const originalVars = {};
        for (let [varName, funcValue] of Object.entries(tempVars)) {
            originalVars[varName] = this.variables[varName];
            this.variables[varName] = funcValue;
        }
        
        try {
            // Replace non-function variables in expression
            let result = expr;
            for (let [varName, value] of Object.entries(bindings)) {
                // Skip function objects - they're already in variables table
                if (tempVars.hasOwnProperty(varName)) {
                    continue;
                }
                
                const varRegex = new RegExp(`\\b${varName}\\b`, 'g');
                let replacement;
                if (typeof value === 'number' && value < 0) {
                    // Wrap negative numbers in parentheses to avoid issues like -n becoming --6
                    replacement = `(${value})`;
                } else if (typeof value === 'number') {
                    // Convert number to string and check for scientific notation
                    const numStr = String(value);
                    // If scientific notation (contains e or E), wrap in parentheses to prevent 'e' being parsed as identifier
                    if (/[eE]/.test(numStr)) {
                        replacement = `(${numStr})`;
                    } else {
                        replacement = numStr;
                    }
                } else {
                    // Use formatOutput to properly handle booleans (True/False) and other types
                    replacement = this.formatOutput(value);
                }
                result = result.replace(varRegex, replacement);
            }
            
            const evalResult = this.evaluate(result);
            
            // If the result is a Lambda, capture the current bindings as its closure
            // BUT: if the lambda already has a closure from a nested computation, preserve it
            // and only add bindings for free variables in the body
            if (evalResult instanceof Lambda && Object.keys(bindings).length > 0) {
                // If lambda already has a closure, it came from a nested evaluation - don't override it
                if (Object.keys(evalResult.closure).length > 0) {
                    return evalResult;
                }
                // Otherwise, create a new Lambda with captured bindings
                return new Lambda(evalResult.param, evalResult.body, this, bindings);
            }
            
            return evalResult;
        } finally {
            // Restore original variables
            for (let varName of Object.keys(tempVars)) {
                if (originalVars[varName] === undefined) {
                    delete this.variables[varName];
                } else {
                    this.variables[varName] = originalVars[varName];
                }
            }
        }
    }

    // Main evaluation function
    evaluate(expr) {
        expr = expr.trim();
        
        // Handle unit value () - return null to represent unit
        if (expr === '') {
            return null;
        }
        
        // Number literal (check EARLY before preprocessing) - including scientific notation
        if (/^-?\d+(\.\d+)?([eE][+\-]?\d+)?$/.test(expr)) {
            return parseFloat(expr);
        }
        
        // Preprocess: Add implicit multiplication (3x becomes 3*x)
        // Skip this if expression contains lambda syntax to avoid corruption
        // Also be careful not to insert * in the middle of identifiers (like multiple3or5)
        // Also skip scientific notation (1e-5, 2E+3)
        if (!expr.includes('\\')) {
            // Don't insert * between digit and e/E if it looks like scientific notation
            expr = expr.replace(/(?<![a-zA-Z_])(\d)([a-zA-Z_])/g, (match, digit, letter, offset) => {
                // Check if this is scientific notation: digit followed by e/E followed by optional +/- and digits
                if (/[eE]/.test(letter)) {
                    const rest = expr.slice(offset + match.length);
                    if (/^[+\-]?\d/.test(rest)) {
                        return match; // Keep as-is, it's scientific notation
                    }
                }
                return digit + '*' + letter;
            });
        }

        // Boolean literals (only capitalized versions - proper Haskell)
        if (expr === 'True') {
            return true;
        }
        if (expr === 'False') {
            return false;
        }
        
        // Helpful error messages for lowercase boolean literals
        if (expr === 'true') {
            throw new Error("Unknown identifier 'true'. Did you mean 'True'? In Haskell, boolean constructors must be capitalized.");
        }
        if (expr === 'false') {
            throw new Error("Unknown identifier 'false'. Did you mean 'False'? In Haskell, boolean constructors must be capitalized.");
        }

        // Special handling for 'otherwise' keyword
        if (expr === 'otherwise') {
            return true;
        }

        // if/then/else expression
        // Find 'if', 'then', 'else' at depth 0 (not inside parens/brackets)
        if (expr.trimStart().startsWith('if ')) {
            let depth = 0;
            let ifIndex = -1;
            let thenIndex = -1;
            let elseIndex = -1;
            
            for (let i = 0; i < expr.length; i++) {
                if (expr[i] === '(' || expr[i] === '[') depth++;
                if (expr[i] === ')' || expr[i] === ']') depth--;
                
                if (depth === 0) {
                    // Match 'if' as a word boundary
                    if (ifIndex === -1 && expr.substr(i, 3) === 'if ' && (i === 0 || /\s/.test(expr[i-1]))) {
                        ifIndex = i;
                    }
                    // Match 'then' as a word boundary
                    else if (ifIndex !== -1 && thenIndex === -1 && 
                             expr.substr(i, 5) === 'then ' && /\s/.test(expr[i-1])) {
                        thenIndex = i;
                    }
                    // Match 'else' as a word boundary
                    else if (thenIndex !== -1 && elseIndex === -1 && 
                             expr.substr(i, 5) === 'else ' && /\s/.test(expr[i-1])) {
                        elseIndex = i;
                    }
                }
            }
            
            if (ifIndex !== -1 && thenIndex !== -1 && elseIndex !== -1) {
                const condition = expr.slice(ifIndex + 3, thenIndex).trim();
                const thenExpr = expr.slice(thenIndex + 5, elseIndex).trim();
                const elseExpr = expr.slice(elseIndex + 5).trim();
                
                const condResult = this.evaluate(condition);
                return condResult ? this.evaluate(thenExpr) : this.evaluate(elseExpr);
            } else if (ifIndex !== -1 && thenIndex !== -1) {
                throw new Error("if/then expression requires an 'else' clause. In Haskell, if-expressions must handle both branches.");
            } else {
                throw new Error("Malformed if/then/else expression");
            }
        }

        // Bare operator - convert to operator function
        if (/^([+*\/<>=\-]+|\+\+|!!|&&|\|\||\/=)$/.test(expr)) {
            return this.createOperatorFunction(expr);
        }

        // Lambda expression (\param -> body)
        // Must be the entire expression, not part of a larger expression like composition
        const lambdaMatch = expr.match(/^\\(\w+)\s*->\s*(.+)$/);
        if (lambdaMatch) {
            const [, param, body] = lambdaMatch;
            return new Lambda(param, body.trim(), this);
        }
        
        // Lambda with parens: (\param -> body) - only if it's the complete expression
        // The body cannot contain ) at depth 0 (which would close the lambda early)
        const parenLambdaMatch = expr.match(/^\(\\(\w+)\s*->\s*([^)]+(?:\([^)]*\)[^)]*)*)\)$/);
        if (parenLambdaMatch) {
            const [, param, body] = parenLambdaMatch;
            return new Lambda(param, body.trim(), this);
        }

        // Check if it's a variable reference
        if (/^[a-zA-Z_]\w*'*$/.test(expr) && this.variables[expr] !== undefined) {
            return this.variables[expr];
        }

        // Empty list
        if (expr === '[]') return [];

        // Check for unary negation patterns
        // Pattern 1: (-5) or (-x) or (-(...)) - parenthesized negation
        if (/^\(-/.test(expr) && expr.endsWith(')')) {
            const inner = expr.slice(2, -1).trim();
            // Check if it's (-number) or (-identifier) or (-(...))
            if (/^\d/.test(inner) || /^[a-zA-Z_]/.test(inner) || /^\(/.test(inner)) {
                return this.evaluate('(0-' + inner + ')');
            }
        }
        
        // Pattern 2: -(expr) - unary minus before a parenthesized expression
        if (/^-\(/.test(expr)) {
            const inner = expr.slice(1); // Get everything after the -
            return this.evaluate('(0-' + inner + ')');
        }

        // Operator sections like (<10) or (+) or (+(-1)) or (== "cat") but not negative numbers
        const opSectionMatch = expr.match(/^\(([+*\/<>=&|]+|\+\+|!!|&&|\|\||\/=)(\s*\d+|\s*\(.+\)|\s*["'][^"']*["'])?\)$/) || 
                               expr.match(/^\((\d+|\(.+\)|["'][^"']*["'])\s*([+*\/<>=&|]+|\+\+|!!|&&|\|\||\/=)\)$/);
        if (opSectionMatch) {
            return this.createOperatorSection(expr);
        }

        // Binary operations (check BEFORE list literals to handle [1,2]++[3,4])
        const binaryOps = [
            { op: '.', fn: (g, f) => {
                // Function composition operator
                return this.builtins['compose'].call(this, g, f);
            }},
            { op: '!!', fn: (list, index) => {
                if (list && list._isInfiniteRange) {
                    if (typeof index !== 'number' || index < 0) {
                        throw new Error(`(!!) index must be a non-negative number`);
                    }
                    return list.at(Math.floor(index));
                }
                if (typeof list === 'string') {
                    if (typeof index !== 'number' || index < 0 || index >= list.length) {
                        throw new Error(`(!!) index ${index} out of range for list of length ${list.length}`);
                    }
                    return list[Math.floor(index)];
                }
                if (!Array.isArray(list)) {
                    throw new Error('(!!) requires a list as the first argument');
                }
                if (typeof index !== 'number' || index < 0 || index >= list.length) {
                    throw new Error(`(!!) index ${index} out of range for list of length ${list.length}`);
                }
                return list[Math.floor(index)];
            }},
            { op: '++', fn: (a, b) => {
                // Handle string concatenation
                if (typeof a === 'string' && typeof b === 'string') {
                    return a + b;
                }
                // Can prepend finite list to infinite range, but not append
                if (b && b._isInfiniteRange) {
                    if (a && a._isInfiniteRange) {
                        throw new Error('(++) cannot concatenate two infinite ranges');
                    }
                    if (!Array.isArray(a)) {
                        throw new Error('(++) requires two lists');
                    }
                    // Prepend finite list to infinite range using ConsedInfiniteRange
                    return new ConsedInfiniteRange(a, b);
                }
                if (a && a._isInfiniteRange) {
                    throw new Error('(++) cannot append to infinite range');
                }
                if (!Array.isArray(a) || !Array.isArray(b)) {
                    throw new Error('(++) requires two lists or two strings');
                }
                return [...a, ...b];
            }},
            { op: '&&', fn: (a, b) => a && b },
            { op: '||', fn: (a, b) => a || b },
            { op: '/=', fn: (a, b) => {
                // Handle array comparison (lists)
                if (Array.isArray(a) && Array.isArray(b)) {
                    if (a.length !== b.length) return true;
                    for (let i = 0; i < a.length; i++) {
                        // Recursively check each element
                        const elementsEqual = (() => {
                            const equalOp = binaryOps.find(op => op.op === '==');
                            return equalOp.fn(a[i], b[i]);
                        })();
                        if (!elementsEqual) return true;
                    }
                    return false;
                }
                // Handle tuple comparison
                if (a && a._isTuple && b && b._isTuple) {
                    if (a.elements.length !== b.elements.length) return true;
                    for (let i = 0; i < a.elements.length; i++) {
                        // Recursively check each element
                        const elementsEqual = (() => {
                            const equalOp = binaryOps.find(op => op.op === '==');
                            return equalOp.fn(a.elements[i], b.elements[i]);
                        })();
                        if (!elementsEqual) return true;
                    }
                    return false;
                }
                return a != b;
            }},
            { op: '==', fn: (a, b) => {
                // Handle array comparison (lists)
                if (Array.isArray(a) && Array.isArray(b)) {
                    if (a.length !== b.length) return false;
                    for (let i = 0; i < a.length; i++) {
                        // Recursively check each element
                        const elementsEqual = (() => {
                            const equalOp = binaryOps.find(op => op.op === '==');
                            return equalOp.fn(a[i], b[i]);
                        })();
                        if (!elementsEqual) return false;
                    }
                    return true;
                }
                // Handle tuple comparison
                if (a && a._isTuple && b && b._isTuple) {
                    if (a.elements.length !== b.elements.length) return false;
                    for (let i = 0; i < a.elements.length; i++) {
                        // Recursively check each element
                        const elementsEqual = (() => {
                            const equalOp = binaryOps.find(op => op.op === '==');
                            return equalOp.fn(a.elements[i], b.elements[i]);
                        })();
                        if (!elementsEqual) return false;
                    }
                    return true;
                }
                return a == b;
            }},
            { op: '<=', fn: (a, b) => a <= b },
            { op: '>=', fn: (a, b) => a >= b },
            { op: '<', fn: (a, b) => a < b },
            { op: '>', fn: (a, b) => a > b },
            { op: '+', fn: (a, b) => a + b },
            { op: '-', fn: (a, b) => a - b },
            { op: '^', fn: (a, b) => Math.pow(a, b) },
            { op: '*', fn: (a, b) => a * b },
            { op: '/', fn: (a, b) => a / b },
            { op: ':', fn: (a, b) => {
                if (b && b._isInfiniteRange) {
                    // Create a new ConsedInfiniteRange
                    return new ConsedInfiniteRange(a, b);
                }
                if (!Array.isArray(b)) {
                    throw new Error('(:) requires a list as the second argument');
                }
                return [a, ...b];
            }}
        ];

        for (let { op, fn } of binaryOps) {
            const parts = this.splitByOperator(expr, op);
            if (parts.length >= 2) {
                // Cons (:) is right-associative: 1:2:3:[] means 1:(2:(3:[]))
                // All other operators are left-associative
                if (op === ':') {
                    // Evaluate right-to-left for cons
                    let result = this.evaluate(parts[parts.length - 1]);
                    for (let i = parts.length - 2; i >= 0; i--) {
                        const left = this.evaluate(parts[i]);
                        result = fn(left, result);
                    }
                    return result;
                } else {
                    // Evaluate left-to-right for other operators (a ++ b ++ c)
                    let result = this.evaluate(parts[0]);
                    for (let i = 1; i < parts.length; i++) {
                        const right = this.evaluate(parts[i]);
                        result = fn(result, right);
                    }
                    return result;
                }
            }
        }

        // List literal (check AFTER binary operations to handle [1,2]++[3,4])
        if (expr.startsWith('[') && expr.endsWith(']')) {
            return this.parseList(expr);
        }

        // String literal (basic support) - check AFTER binary operations
        if (expr.startsWith('"') && expr.endsWith('"')) {
            return expr.slice(1, -1);
        }
        
        // String literal with single quotes
        if (expr.startsWith("'") && expr.endsWith("'")) {
            return expr.slice(1, -1);
        }

        // Function application
        const tokens = this.tokenize(expr);
        
        // Handle single number token
        if (tokens.length === 1 && tokens[0].type === 'number') {
            return tokens[0].value;
        }
        
        // Handle single tuple
        if (tokens.length === 1 && tokens[0].type === 'tuple') {
            return this.parseTuple(tokens[0].value);
        }
        
        // Handle single parenthesized expression
        if (tokens.length === 1 && tokens[0].type === 'paren') {
            return this.evaluate(tokens[0].value);
        }
        
        // Handle lambda followed by arguments: (\x -> x + 1) 5
        if (tokens.length > 1 && tokens[0].type === 'lambda') {
            const lambda = this.evaluate('(' + tokens[0].value + ')');
            const args = tokens.slice(1).map(token => {
                if (token.type === 'list') return this.parseList(token.value);
                if (token.type === 'number') return token.value;
                if (token.type === 'string') return token.value.slice(1, -1); // Remove quotes
                if (token.type === 'paren') {
                    // Handle unit () as null
                    return token.value.trim() === '' ? null : this.evaluate(token.value);
                }
                if (token.type === 'identifier') return this.evaluate(token.value);
                return token.value;
            });
            
            // Apply lambda to arguments
            let result = lambda;
            for (const arg of args) {
                if (result instanceof Lambda) {
                    result = result.apply(arg);
                } else {
                    throw new Error('Too many arguments for lambda');
                }
            }
            return result;
        }
        
        // Handle parenthesized function followed by arguments: (f . g) x
        if (tokens.length > 1 && tokens[0].type === 'paren') {
            const funcExpr = this.evaluate(tokens[0].value);
            const args = tokens.slice(1).map(token => {
                if (token.type === 'list') return this.parseList(token.value);
                if (token.type === 'number') return token.value;
                if (token.type === 'string') return token.value.slice(1, -1); // Remove quotes
                if (token.type === 'paren') {
                    // Handle unit () as null
                    return token.value.trim() === '' ? null : this.evaluate(token.value);
                }
                if (token.type === 'identifier') return this.evaluate(token.value);
                return token.value;
            });
            
            // Apply the function to the arguments
            if (funcExpr && funcExpr._isComposedFunction) {
                return funcExpr.apply(args);
            }
            if (funcExpr instanceof Lambda) {
                // Apply arguments one at a time (currying)
                let result = funcExpr;
                for (const arg of args) {
                    if (result instanceof Lambda) {
                        result = result.apply(arg);
                    } else {
                        throw new Error('Too many arguments for lambda');
                    }
                }
                return result;
            }
            if (funcExpr instanceof PartialFunction) {
                return funcExpr.apply(args);
            }
            if (funcExpr && funcExpr._isOperatorFunction) {
                return funcExpr.apply(args);
            }
            // If it's a function name, apply it
            if (typeof funcExpr === 'string' || funcExpr instanceof String) {
                return this.applyFunction(funcExpr, args);
            }
        }
        
        if (tokens.length > 1 && tokens[0].type === 'identifier') {
            const funcName = tokens[0].value;
            const args = tokens.slice(1).map(token => {
                if (token.type === 'list') return this.parseList(token.value);
                if (token.type === 'tuple') return this.parseTuple(token.value);
                if (token.type === 'number') return token.value;
                if (token.type === 'string') return token.value.slice(1, -1); // Remove quotes
                if (token.type === 'lambda') {
                    // Parse lambda expression (with or without leading backslash)
                    // Support multi-parameter lambdas like \x y -> x + y by converting to nested lambdas
                    const lambdaMatch = token.value.match(/^\\?([\w\s]+)\s*->\s*(.+)$/);
                    if (lambdaMatch) {
                        const [, paramsStr, body] = lambdaMatch;
                        const params = paramsStr.trim().split(/\s+/);
                        
                        // Create nested lambdas for multi-parameter functions
                        // \acc x -> acc + x becomes \acc -> (\x -> acc + x)
                        // Build the body string from inside out
                        let bodyStr = body.trim();
                        for (let i = params.length - 1; i > 0; i--) {
                            bodyStr = `\\${params[i]} -> ${bodyStr}`;
                        }
                        // Note: No closure here - lambdas as direct arguments don't need to capture outer scope
                        return new Lambda(params[0], bodyStr, this);
                    }
                    throw new Error(`Invalid lambda syntax: ${token.value}`);
                }
                if (token.type === 'paren') {
                    // Handle unit () as null
                    if (token.value.trim() === '') {
                        return null;
                    }
                    // Check if it's an operator section like (*) or (<10) or (+(-1)) or (=="cat") or (&&) but NOT (- ...) which is unary negation
                    const fullParen = '(' + token.value + ')';
                    // Match operator sections: operators only, operators with number, string, or parenthesized expr
                    if (/^\(([+*\/\^<>=]+|\+\+|!!|&&|\|\||\/=)(\s*\d+|\s*\(.+\)|\s*["'][^"']*["'])?\)$/.test(fullParen) || /^\((\d+|\(.+\)|["'][^"']*["']){1}\s*([+*\/\^<>=]+|\+\+|!!|&&|\|\||\/=)\)$/.test(fullParen)) {
                        return this.createOperatorSection(fullParen);
                    }
                    return this.evaluate(token.value);
                }
                if (token.type === 'identifier') {
                    // Evaluate identifier to get its value (could be a variable)
                    return this.evaluate(token.value);
                }
                return token.value;
            });

            // Check if funcName refers to a variable holding a special function
            if (this.variables[funcName]) {
                const varValue = this.variables[funcName];
                if (varValue instanceof Lambda) {
                    // Lambda functions take one argument at a time
                    let result = varValue;
                    for (const arg of args) {
                        result = result.apply(arg);
                    }
                    return result;
                }
                if (varValue instanceof PartialFunction) {
                    return varValue.apply(args);
                }
                if (varValue && varValue._isComposedFunction) {
                    return varValue.apply(args);
                }
                if (varValue && varValue._isOperatorFunction) {
                    return varValue.apply(args);
                }
            }

            return this.applyFunction(funcName, args);
        }
        
        // Single token that might be a function reference
        if (tokens.length === 1 && tokens[0].type === 'identifier') {
            const name = tokens[0].value;
            // Check if it's a function name (for partial application like: addone = add 1)
            if (this.functions[name] || this.builtins[name]) {
                // Return a partial function with 0 arguments bound
                return new PartialFunction(name, [], this);
            }
        }

        throw new Error(`Cannot evaluate expression: "${expr}"`);
    }

    // Helper to split expression by operator
    splitByOperator(expr, op) {
        let depth = 0;
        let inString = false;
        let stringChar = null;
        let lastSplit = 0;
        const parts = [];

        for (let i = 0; i < expr.length; i++) {
            // Track string literals (both double and single quotes)
            if ((expr[i] === '"' || expr[i] === "'") && (i === 0 || expr[i-1] !== '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = expr[i];
                } else if (expr[i] === stringChar) {
                    inString = false;
                    stringChar = null;
                }
            }
            
            // Don't process operators inside strings
            if (inString) continue;
            
            if (expr[i] === '(' || expr[i] === '[') depth++;
            if (expr[i] === ')' || expr[i] === ']') depth--;

            if (depth === 0) {
                // Check if we have the operator at this position
                let matches = true;
                for (let j = 0; j < op.length; j++) {
                    if (i + j >= expr.length || expr[i + j] !== op[j]) {
                        matches = false;
                        break;
                    }
                }
                
                // Special case: if operator is '.' and it's part of a decimal number, don't split
                if (matches && op === '.') {
                    const prevChar = i > 0 ? expr[i - 1] : '';
                    const nextChar = i + 1 < expr.length ? expr[i + 1] : '';
                    // Skip if . is between digits (decimal number)
                    if (/\d/.test(prevChar) && /\d/.test(nextChar)) {
                        matches = false;
                    }
                }
                
                // Special case: if operator is '-' and it's a negative number, don't split
                if (matches && op === '-') {
                    const prevChar = i > 0 ? expr[i - 1] : '';
                    const nextChar = i + 1 < expr.length ? expr[i + 1] : '';
                    // It's a negative number if: preceded by space/start and followed by digit
                    // But NOT if preceded by a digit or closing paren (that's binary minus)
                    if (/\d/.test(nextChar) && !/[\d)]/.test(prevChar)) {
                        matches = false;
                    }
                }
                
                if (matches) {
                    const part = expr.slice(lastSplit, i).trim();
                    if (part) parts.push(part);  // Only push non-empty parts
                    lastSplit = i + op.length;
                    i += op.length - 1; // Skip past the operator (loop will increment)
                }
            }
        }

        if (parts.length > 0) {
            const lastPart = expr.slice(lastSplit).trim();
            if (lastPart) parts.push(lastPart);  // Only push non-empty parts
        }

        return parts.length > 1 ? parts : [expr];
    }

    // Create operator section function
    createOperatorSection(section) {
        // Match patterns like (*), (+), (<10), (10+), (&&), (||), etc.
        // But NOT negative numbers like (-5) which could be (0 - 5) evaluated
        const opOnlyMatch = section.match(/^\(([+*\/\^<>=]+|\+\+|!!|&&|\|\||\/=)\)$/);  // Removed - from here
        if (opOnlyMatch) {
            const op = opOnlyMatch[1];
            return this.createOperatorFunction(op);
        }
        
        // Left section with string literal like (== "cat") or (== 'cat')
        const leftStringMatch = section.match(/^\(([+*\/\^<>=]+|\+\+|!!|&&|\|\||\/=)\s*(["'][^"']*["'])\)$/);
        if (leftStringMatch) {
            const [, op, str] = leftStringMatch;
            const stringValue = this.evaluate(str);
            return this.createPartialOperatorFunction(op, null, stringValue);
        }
        
        // Left section like (<10), (>5), (*2) but not (- or (-5)
        const leftMatch = section.match(/^\(([+*\/\^<>=]+|\+\+|!!|&&|\|\||\/=)\s*(\d+)\)$/);  // Removed -
        if (leftMatch) {
            const [, op, num] = leftMatch;
            return this.createPartialOperatorFunction(op, null, parseFloat(num));
        }
        
        // Left section with parenthesized expression like (+(..))  
        const leftParenMatch = section.match(/^\(([+*\/\^<>=]+|\+\+|!!|&&|\|\||\/=)\s*(\(.+\))\)$/);
        if (leftParenMatch) {
            const [, op, parenExpr] = leftParenMatch;
            const evaluatedValue = this.evaluate(parenExpr);
            return this.createPartialOperatorFunction(op, null, evaluatedValue);
        }
        
        // Right section with string literal like ("cat" ==) or ('cat' ==)
        const rightStringMatch = section.match(/^\((["'][^"']*["'])\s*([+*\/\^<>=]+|\+\+|!!|&&|\|\||\/=)\)$/);
        if (rightStringMatch) {
            const [, str, op] = rightStringMatch;
            const stringValue = this.evaluate(str);
            return this.createPartialOperatorFunction(op, stringValue, null);
        }
        
        // Right section like (10+), (5*) but not (-10)
        const rightMatch = section.match(/^\((\d+)\s*([+*\/\^<>=]+|\+\+|!!|&&|\|\||\/=)\)$/);  // Removed -
        if (rightMatch) {
            const [, num, op] = rightMatch;
            return this.createPartialOperatorFunction(op, parseFloat(num), null);
        }
        
        // Right section with parenthesized expression like ((..)+)
        const rightParenMatch = section.match(/^\((\(.+\))\s*([+*\/\^<>=]+|\+\+|!!|&&|\|\||\/=)\)$/);
        if (rightParenMatch) {
            const [, parenExpr, op] = rightParenMatch;
            const evaluatedValue = this.evaluate(parenExpr);
            return this.createPartialOperatorFunction(op, evaluatedValue, null);
        }
        
        return section;
    }
    
    // Create a function for a binary operator
    createOperatorFunction(op) {
        const opMap = {
            '+': (a, b) => a + b,
            '-': (a, b) => a - b,
            '*': (a, b) => a * b,
            '/': (a, b) => a / b,
            '^': (a, b) => Math.pow(a, b),
            '<': (a, b) => a < b,
            '>': (a, b) => a > b,
            '<=': (a, b) => a <= b,
            '>=': (a, b) => a >= b,
            '==': (a, b) => a == b,
            '/=': (a, b) => a != b,
            '&&': (a, b) => a && b,
            '||': (a, b) => a || b,
            '++': (a, b) => {
                // Concatenate lists or strings
                if (typeof a === 'string' && typeof b === 'string') {
                    return a + b;
                }
                if (Array.isArray(a) && Array.isArray(b)) {
                    return [...a, ...b];
                }
                if (typeof a === 'string' && typeof b === 'string') {
                    return a + b;
                }
                throw new Error('(++) requires two lists or two strings');
            },
            '!!': (list, index) => {
                if (typeof list === 'string') {
                    if (typeof index !== 'number' || index < 0 || index >= list.length) {
                        throw new Error(`(!!) index ${index} out of range for list of length ${list.length}`);
                    }
                    return list[Math.floor(index)];
                }
                if (!Array.isArray(list)) {
                    throw new Error('(!!) requires a list as the first argument');
                }
                if (typeof index !== 'number' || index < 0 || index >= list.length) {
                    throw new Error(`(!!) index ${index} out of range for list of length ${list.length}`);
                }
                return list[Math.floor(index)];
            },
            ':': (a, b) => {
                if (!Array.isArray(b)) {
                    throw new Error('(:) requires a list as the second argument');
                }
                return [a, ...b];
            }
        };
        
        if (!opMap[op]) {
            throw new Error(`Unknown operator: ${op}`);
        }
        
        // Create a pseudo function that can be applied
        return {
            _isOperatorFunction: true,
            op: op,
            fn: opMap[op],
            apply: function(args) {
                if (args.length < 2) {
                    throw new Error(`Operator ${op} requires 2 arguments`);
                }
                return this.fn(args[0], args[1]);
            },
            toString: function() {
                return `<operator ${op}>`;
            }
        };
    }
    
    // Create a partially applied operator function
    createPartialOperatorFunction(op, leftVal, rightVal) {
        const opMap = {
            '+': (a, b) => a + b,
            '-': (a, b) => a - b,
            '*': (a, b) => a * b,
            '/': (a, b) => a / b,
            '^': (a, b) => Math.pow(a, b),
            '<': (a, b) => a < b,
            '>': (a, b) => a > b,
            '<=': (a, b) => a <= b,
            '>=': (a, b) => a >= b,
            '==': (a, b) => a == b,
            '/=': (a, b) => a != b,
            '&&': (a, b) => a && b,
            '||': (a, b) => a || b,
            '++': (a, b) => {
                if (typeof a === 'string' && typeof b === 'string') {
                    return a + b;
                }
                if (Array.isArray(a) && Array.isArray(b)) {
                    return [...a, ...b];
                }
                throw new Error('(++) requires two lists or two strings');
            },
            '!!': (list, index) => {
                if (typeof list === 'string') {
                    if (typeof index !== 'number' || index < 0 || index >= list.length) {
                        throw new Error(`(!!) index ${index} out of range for list of length ${list.length}`);
                    }
                    return list[Math.floor(index)];
                }
                if (!Array.isArray(list)) {
                    throw new Error('(!!) requires a list as the first argument');
                }
                if (typeof index !== 'number' || index < 0 || index >= list.length) {
                    throw new Error(`(!!) index ${index} out of range for list of length ${list.length}`);
                }
                return list[Math.floor(index)];
            },
            ':': (a, b) => {
                if (!Array.isArray(b)) {
                    throw new Error('(:) requires a list as the second argument');
                }
                return [a, ...b];
            }
        };
        
        if (!opMap[op]) {
            throw new Error(`Unknown operator: ${op}`);
        }
        
        return {
            _isOperatorFunction: true,
            op: op,
            leftVal: leftVal,
            rightVal: rightVal,
            apply: function(args) {
                if (args.length < 1) {
                    throw new Error(`Partial operator requires 1 argument`);
                }
                if (leftVal !== null) {
                    return opMap[op](leftVal, args[0]);
                } else {
                    return opMap[op](args[0], rightVal);
                }
            },
            toString: function() {
                if (leftVal !== null) return `<operator ${leftVal}${op}>`;
                return `<operator ${op}${rightVal}>`;
            }
        };
    }

    // Format output for display
    formatOutput(value) {
        if (value instanceof Lambda) {
            return value.toString();
        }
        if (value instanceof PartialFunction) {
            return value.toString();
        }
        if (value && value._isComposedFunction) {
            return value.toString();
        }
        if (value && value._isOperatorFunction) {
            return value.toString();
        }
        if (value && value._isInfiniteRange) {
            return value.toString();
        }
        if (value && value._isTuple) {
            return '(' + value.elements.map(v => this.formatOutput(v)).join(',') + ')';
        }
        if (Array.isArray(value)) {
            return '[' + value.map(v => this.formatOutput(v)).join(',') + ']';
        }
        if (typeof value === 'string') {
            return '"' + value + '"';
        }
        if (typeof value === 'boolean') {
            return value ? 'True' : 'False';
        }
        return String(value);
    }

    // Handle REPL commands (starting with :)
    handleReplCommand(cmd) {
        const parts = cmd.slice(1).trim().split(/\s+/);
        const command = parts[0].toLowerCase();
        const arg = parts.slice(1).join(' ');

        switch (command) {
            case 'show':
            case 'bindings': {
                const funcNames = Object.keys(this.functions);
                const varNames = Object.keys(this.variables);
                
                if (funcNames.length === 0 && varNames.length === 0) {
                    return { success: true, result: 'No functions or variables defined.' };
                }
                
                let output = '';
                
                if (funcNames.length > 0) {
                    output += 'Functions:\n';
                    funcNames.forEach(name => {
                        const patterns = this.functions[name].map(f => {
                            return `  ${name} ${f.params}`;
                        }).join('\n');
                        output += patterns + '\n';
                    });
                }
                
                if (varNames.length > 0) {
                    if (output) output += '\n';
                    output += 'Variables:\n';
                    varNames.forEach(name => {
                        const value = this.formatOutput(this.variables[name]);
                        output += `  ${name} = ${value}\n`;
                    });
                }
                
                return { success: true, result: output.trim(), highlighted: true };
            }

            case 'functions': {
                const funcNames = Object.keys(this.functions);
                
                if (funcNames.length === 0) {
                    return { success: true, result: 'No functions defined.', plainText: true };
                }
                
                let output = 'Functions:\n';
                funcNames.forEach(name => {
                    const patterns = this.functions[name].map(f => {
                        return `  ${name} ${f.params}`;
                    }).join('\n');
                    output += patterns + '\n';
                });
                
                return { success: true, result: output.trim(), highlighted: true };
            }

            case 'variables':
            case 'vars': {
                const varNames = Object.keys(this.variables);
                
                if (varNames.length === 0) {
                    return { success: true, result: 'No variables defined.', plainText: true };
                }
                
                let output = 'Variables:\n';
                varNames.forEach(name => {
                    const value = this.formatOutput(this.variables[name]);
                    output += `  ${name} = ${value}\n`;
                });
                
                return { success: true, result: output.trim(), highlighted: true };
            }

            case 'info':
            case 'i': {
                if (!arg) {
                    return { success: false, error: 'Usage: :info <name>' };
                }
                
                // Check if it's a function
                if (this.functions[arg]) {
                    let output = `Function: ${arg}\n\nDefinitions:\n`;
                    this.functions[arg].forEach((f, i) => {
                        if (f.guards && f.guards.length > 0) {
                            output += `${arg} ${f.params}\n`;
                            f.guards.forEach(g => {
                                output += `  | ${g.condition} = ${g.body}\n`;
                            });
                        } else {
                            output += `${arg} ${f.params} = ${f.body}\n`;
                        }
                        if (i < this.functions[arg].length - 1) output += '\n';
                    });
                    return { success: true, result: output.trim(), highlighted: true };
                }
                
                // Check if it's a variable
                if (this.variables[arg] !== undefined) {
                    const value = this.formatOutput(this.variables[arg]);
                    return { success: true, result: `Variable: ${arg}\n${arg} = ${value}`, highlighted: true };
                }
                
                // Check if it's a built-in
                if (this.builtins[arg]) {
                    return { success: true, result: `Built-in function: ${arg}`, plainText: true };
                }
                
                return { success: false, error: `'${arg}' is not defined` };
            }

            case 'help':
            case 'h':
            case '?': {
                const helpText = `Available REPL commands:
  :show, :bindings    Show all defined functions and variables
  :functions          Show only functions
  :variables, :vars   Show only variables
  :info <name>        Show definition of a function or variable
  :help, :?           Show this help message`;
                return { success: true, result: helpText, plainText: true };
            }

            default:
                return { success: false, error: `Unknown command: :${command}\nType :help for available commands` };
        }
    }

    // Run code and return result
    run(code) {
        try {
            this.parseFunctionDefinitions(code);
            const funcCount = Object.keys(this.functions).length;
            const varCount = Object.keys(this.variables).length;
            console.log('Loaded functions:', Object.keys(this.functions));
            console.log('Loaded variables:', Object.keys(this.variables));
            return { success: true, message: `Loaded ${funcCount} function(s) and ${varCount} variable(s)` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Evaluate a REPL expression
    evaluateRepl(expr) {
        try {
            expr = expr.trim();
            
            // Handle REPL commands (starting with :)
            if (expr.startsWith(':')) {
                return this.handleReplCommand(expr);
            }
            
            // Strip optional 'let' keyword at the start
            expr = expr.replace(/^let\s+/, '');
            
            // Check if it's a function definition (has parameters before =)
            // Function name must start with a letter (not a number)
            // Use negative lookbehind/lookahead to avoid matching ==, /=, <=, >=
            const funcMatch = expr.match(/^([a-zA-Z_]\w*'*)\s+(.+?)\s*(?<![=/<>])=(?![=])(.+)$/);
            if (funcMatch) {
                const [, funcName, params, body] = funcMatch;
                
                // Check if params is only whitespace or starts with \ - if so, this is a lambda/variable assignment, not a function definition
                const trimmedParams = params.trim();
                if (trimmedParams === '' || trimmedParams.startsWith('\\')) {
                    // Fall through to variable assignment handling below
                } else {
                    // Check if function already exists
                    if (this.functions[funcName]) {
                        // Add to existing function cases (for pattern matching)
                        this.functions[funcName].push({ params: params.trim(), body: body.trim() });
                    } else {
                        // Create new function
                        this.functions[funcName] = [{ params: params.trim(), body: body.trim() }];
                    }
                    
                    return { success: true, result: `Defined function: ${funcName}` };
                }
            }
            
            // Check if it's a tuple pattern assignment like (a, b) = expr
            // Need to match balanced parentheses for nested tuples like ((a, b), c)
            let tupleAssignMatch = null;
            if (expr.startsWith('(')) {
                // Find the matching closing paren
                let depth = 0;
                let endIndex = -1;
                for (let i = 0; i < expr.length; i++) {
                    if (expr[i] === '(') depth++;
                    if (expr[i] === ')') depth--;
                    if (depth === 0) {
                        endIndex = i;
                        break;
                    }
                }
                
                // Check if there's an = after the closing paren (not ==, /=, <=, >=)
                if (endIndex !== -1) {
                    const afterParen = expr.slice(endIndex + 1).trimStart();
                    if (afterParen.startsWith('=') && !afterParen.startsWith('==')) {
                        const pattern = expr.slice(0, endIndex + 1);
                        const valueExpr = afterParen.slice(1).trimStart();
                        if (valueExpr) {
                            tupleAssignMatch = [expr, pattern, valueExpr];
                        }
                    }
                }
            }
            
            if (tupleAssignMatch) {
                const [, pattern, valueExpr] = tupleAssignMatch;
                
                // Evaluate the right-hand side
                const evaluated = this.evaluate(valueExpr.trim());
                
                // Use existing matchPattern to destructure
                const bindings = this.matchPattern(pattern, evaluated);
                
                if (bindings === null) {
                    return { success: false, error: `Pattern match failure: ${pattern} does not match ${this.formatOutput(evaluated)}` };
                }
                
                // Check for conflicts with built-ins and existing variables
                for (const varName in bindings) {
                    if (this.builtins[varName]) {
                        return { success: false, error: `Cannot use '${varName}' as a variable name: it is a built-in function` };
                    }
                    if (this.variables[varName] !== undefined) {
                        return { success: false, error: `Cannot reassign '${varName}' - variables are immutable in functional programming!` };
                    }
                }
                
                // Bind all variables
                Object.assign(this.variables, bindings);
                
                // Format output showing all bindings
                const bindingStrs = Object.entries(bindings).map(([k, v]) => `${k} = ${this.formatOutput(v)}`);
                return { success: true, result: bindingStrs.join('\n') };
            }
            
            // Check if it's a simple variable assignment (no parameters before =)
            // Variable name must start with a letter and only have a single =
            // Use negative lookahead to avoid matching ==, /=, <=, >=
            const assignMatch = expr.match(/^([a-zA-Z_]\w*'*)\s*(?<![=/<>])=(?![=])\s*(.+)$/);
            if (assignMatch) {
                const [, varName, value] = assignMatch;
                
                // Check if variable name shadows a built-in function
                if (this.builtins[varName]) {
                    return { success: false, error: `Cannot use '${varName}' as a variable name: it is a built-in function` };
                }
                
                // Check if variable already exists (immutability check)
                if (this.variables[varName] !== undefined) {
                    return { success: false, error: `Cannot reassign '${varName}' - variables are immutable in functional programming!` };
                }
                
                const evaluated = this.evaluate(value.trim());
                this.variables[varName] = evaluated;
                return { success: true, result: `${varName} = ${this.formatOutput(evaluated)}` };
            }
            
            const result = this.evaluate(expr);
            return { success: true, result: this.formatOutput(result) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HaskishInterpreter;
}
