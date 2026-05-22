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
        // Check execution timeout (catches infinite/exponential lambda recursion, e.g. Z combinator misuse)
        if (this.interpreter && this.interpreter.executionStartTime > 0) {
            const elapsed = Date.now() - this.interpreter.executionStartTime;
            if (elapsed > this.interpreter.maxExecutionTime) {
                this.interpreter.executionStartTime = 0;
                throw new Error(`Execution timeout (${this.interpreter.maxExecutionTime}ms exceeded). Your function implementation may be intractable with exponential O(kⁿ) or factorial O(n!) complexity, or have infinite recursion.`);
            }
        }

        // Use matchPattern for any parenthesised pattern: tuples (x,y), cons sub-patterns
        // (x:xs, y:ys), nested tuples ((a,b),(c,d)), wildcards, etc.
        // Also use matchPattern for list patterns: [], [x,y], etc.
        if ((this.param.startsWith('(') && this.param.endsWith(')')) ||
            (this.param.startsWith('[') && this.param.endsWith(']'))) {
            const bindings = this.interpreter.matchPattern(this.param, arg);
            if (bindings === null) {
                throw new Error(`Pattern match failure: ${this.param} does not match value`);
            }
            return this.interpreter.evaluateWithBindings(this.body, { ...this.closure, ...bindings });
        }

        // Regular single parameter binding
        const bindings = { ...this.closure, [this.param]: arg };
        return this.interpreter.evaluateWithBindings(this.body, bindings);
    }

    toString() {
        return `<lambda \\${this.param} -> ${this.body}>`;
    }
}

// Class to represent a multi-case where-local function that tries each equation in order
class DispatchLambda extends Lambda {
    constructor(cases, interpreter) {
        super('__dispatch__', '', interpreter, {});
        this.cases = cases; // array of Lambda objects, tried in order
        this._callDepth = 0; // for lazy evaluation of infinite-range recursion
    }

    apply(arg) {
        // When recursively called with an InfiniteRange, defer via a lazy thunk
        // to avoid unbounded eager recursion (same principle as applyFunction's lazy guard).
        if (this._callDepth >= 1 && arg && arg._isInfiniteRange) {
            return new LazyDispatchCall(this, arg);
        }
        this._callDepth++;
        try {
            return this._applyEager(arg);
        } finally {
            this._callDepth--;
        }
    }

    _applyEager(arg) {
        for (const caseLambda of this.cases) {
            try {
                return caseLambda.apply(arg);
            } catch (e) {
                if (e.message && e.message.startsWith('Pattern match failure')) {
                    continue; // try next case
                }
                throw e;
            }
        }
        throw new Error('Pattern match failure: no case matched in where-local function');
    }

    toString() {
        return '<multi-case lambda>';
    }
}

// Lazy thunk for a recursive WHERE-local DispatchLambda call on an infinite range.
// When a where-local multi-case function recurses with an InfiniteRange argument,
// returning this defers evaluation until elements are actually demanded (lazy cons semantics).
class LazyDispatchCall {
    constructor(dispatchFn, arg) {
        this.dispatchFn = dispatchFn;
        this.arg = arg;
        this._isInfiniteRange = true;
        this._resolved = null;
    }

    _resolve() {
        if (this._resolved === null) {
            this._resolved = this.dispatchFn._applyEager(this.arg);
        }
        return this._resolved;
    }

    head() {
        const r = this._resolve();
        if (r && r.head) return r.head();
        if (Array.isArray(r)) return r[0];
        throw new Error('LazyDispatchCall: empty result');
    }

    tail() {
        const r = this._resolve();
        if (r && r.tail) return r.tail();
        if (Array.isArray(r)) return r.slice(1);
        return [];
    }

    take(n) {
        if (n <= 0) return [];
        const r = this._resolve();
        if (r && r.take) return r.take(n);
        if (Array.isArray(r)) return r.slice(0, n);
        return [];
    }

    at(index) {
        const r = this._resolve();
        if (r && r.at) return r.at(index);
        if (Array.isArray(r)) return r[index];
        throw new Error('Index out of bounds in lazy dispatch call');
    }

    drop(n) {
        if (n <= 0) return this;
        const r = this._resolve();
        if (r && r.drop) return r.drop(n);
        if (Array.isArray(r)) return r.slice(n);
        return [];
    }

    *[Symbol.iterator]() {
        yield* this._resolve();
    }

    toString() {
        const preview = this.take(20);
        const formatted = preview.map(v => {
            if (v && v._isTuple) return '(' + v.elements.map(String).join(',') + ')';
            return String(v);
        });
        return `[${formatted.join(',')}...]`;
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
            // Check for timeout if execution is being timed
            if (this.interpreter.executionStartTime > 0) {
                const elapsed = Date.now() - this.interpreter.executionStartTime;
                if (elapsed > this.interpreter.maxExecutionTime) {
                    throw new Error(`Execution timeout while filtering infinite list. Filter may not match enough elements.`);
                }
            }
            
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
            // Check for timeout if execution is being timed
            if (this.interpreter.executionStartTime > 0) {
                const elapsed = Date.now() - this.interpreter.executionStartTime;
                if (elapsed > this.interpreter.maxExecutionTime) {
                    throw new Error(`Execution timeout while filtering infinite list.`);
                }
            }
            
            if (this._testPredicate(value)) {
                if (count === index) return value;
                count++;
            }
        }
        throw new Error('Index out of bounds in filtered range');
    }

    // Drop first n elements that pass the filter, return new FilteredInfiniteRange
    drop(n) {
        if (n <= 0) return this;
        let result = this;
        for (let i = 0; i < n; i++) {
            result = result.tail();
        }
        return result;
    }

    // Get first element that passes filter
    head() {
        for (const value of this.sourceRange) {
            // Check for timeout if execution is being timed
            if (this.interpreter.executionStartTime > 0) {
                const elapsed = Date.now() - this.interpreter.executionStartTime;
                if (elapsed > this.interpreter.maxExecutionTime) {
                    throw new Error(`Execution timeout while filtering infinite list.`);
                }
            }
            
            if (this._testPredicate(value)) {
                return value;
            }
        }
        throw new Error('No elements match filter');
    }

    // Get tail (all but first element that passes filter)
    tail() {
        const self = this;
        // Create a source that, on each iteration, rescans self.sourceRange and
        // skips everything up to and including the first element that passes self.predicate,
        // then yields the remainder. Closing over `self` (not a shared iterator) means
        // each call to [Symbol.iterator]() starts fresh.
        const newSource = {
            _isInfiniteRange: true,
            *[Symbol.iterator]() {
                let foundFirst = false;
                for (const value of self.sourceRange) {
                    if (!foundFirst) {
                        const pred = self.predicate;
                        const passes = pred instanceof Lambda ? pred.apply(value) :
                                       pred instanceof PartialFunction ? pred.apply([value]) :
                                       pred && pred._isOperatorFunction ? pred.apply([value]) :
                                       self.interpreter.applyFunction(pred, [value]);
                        if (passes) {
                            foundFirst = true; // skip head, yield everything after
                        }
                    } else {
                        yield value;
                    }
                }
            }
        };
        return new FilteredInfiniteRange(newSource, self.predicate, self.interpreter);
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

// Lazy thunk for a recursive user-function call on an infinite range.
// When a user function like sieve recurses on an infinite range, returning this
// defers evaluation until elements are actually demanded (lazy cons semantics).
class LazyFunctionCall {
    constructor(funcName, args, interpreter) {
        this.funcName = funcName;
        this.args = args;
        this.interpreter = interpreter;
        this._isInfiniteRange = true;
        this._resolved = null;
    }

    _resolve() {
        if (this._resolved === null) {
            this._resolved = this.interpreter.applyFunction(this.funcName, this.args);
        }
        return this._resolved;
    }

    head() {
        const r = this._resolve();
        if (r && r.head) return r.head();
        if (Array.isArray(r)) return r[0];
        throw new Error('LazyFunctionCall: empty result');
    }

    tail() {
        const r = this._resolve();
        if (r && r.tail) return r.tail();
        if (Array.isArray(r)) return r.slice(1);
        return [];
    }

    take(n) {
        if (n <= 0) return [];
        const r = this._resolve();
        if (r && r.take) return r.take(n);
        if (Array.isArray(r)) return r.slice(0, n);
        return [];
    }

    at(index) {
        const r = this._resolve();
        if (r && r.at) return r.at(index);
        if (Array.isArray(r)) return r[index];
        throw new Error('Index out of bounds in lazy function call');
    }

    drop(n) {
        if (n <= 0) return this;
        const r = this._resolve();
        if (r && r.drop) return r.drop(n);
        if (Array.isArray(r)) return r.slice(n);
        return [];
    }

    *[Symbol.iterator]() {
        yield* this._resolve();
    }

    toString() {
        const preview = this.take(20);
        const formatted = preview.map(v => {
            if (v && v._isTuple) return '(' + v.elements.map(String).join(',') + ')';
            return String(v);
        });
        return `[${formatted.join(',')}...]`;
    }
}

// Lazy thunk for the tail of a self-referential variable definition.
// Used when evaluating e.g. fib = 0 : 1 : zip (+) fib (tail fib) to defer
// evaluation of "zip (+) fib (tail fib)" until fib is already bound.
class LazyExprThunk {
    constructor(expr, interpreter) {
        this._isInfiniteRange = true;
        this._expr = expr;
        // Store evaluate as a function (not a property object) so JSON.stringify
        // skips it and never follows the path back to interpreter.variables.
        this._evalFn = (e) => interpreter.evaluate(e);
        this._resolvedValue = undefined;
    }

    _resolve() {
        if (this._resolvedValue === undefined) {
            this._resolvedValue = this._evalFn(this._expr);
        }
        return this._resolvedValue;
    }

    head() {
        const r = this._resolve();
        if (r && r.head) return r.head();
        if (Array.isArray(r)) return r[0];
        throw new Error('head: empty list');
    }

    tail() {
        const r = this._resolve();
        if (r && r.tail) return r.tail();
        if (Array.isArray(r)) return r.slice(1);
        return [];
    }

    take(n) {
        if (n <= 0) return [];
        const r = this._resolve();
        if (r && r.take) return r.take(n);
        if (Array.isArray(r)) return r.slice(0, n);
        return [];
    }

    at(index) {
        const r = this._resolve();
        if (r && r.at) return r.at(index);
        if (Array.isArray(r)) return r[index];
        throw new Error('Index out of bounds in lazy expression thunk');
    }

    drop(n) {
        if (n <= 0) return this;
        const r = this._resolve();
        if (r && r.drop) return r.drop(n);
        if (Array.isArray(r)) return r.slice(n);
        return [];
    }

    *[Symbol.iterator]() {
        yield* this._resolve();
    }

    toString() {
        const preview = this.take(20);
        const formatted = preview.map(v => {
            if (v && v._isTuple) return '(' + v.elements.map(String).join(',') + ')';
            return String(v);
        });
        return `[${formatted.join(',')}...]`;
    }
}

class HaskishInterpreter {
    constructor() {
        this.functions = {};
        this.variables = {};
        this.warnings = [];
        this.executionStartTime = 0;
        this.maxExecutionTime = 5000; // 5 seconds max execution
        this.functionCallDepth = {}; // tracks recursion depth per function for lazy infinite evaluation
        this.lazyStreamFunctions = new Set(); // functions that are unconditionally self-recursive (no base case)
        this._selfRefConsMode = null; // set to varName while evaluating a self-referential variable RHS
        this.initializeBuiltins();
    }

    // Helper to determine the type of a value for homogeneous list checking
    getTypeCategory(value) {
        if (value === null || value === undefined) return 'null';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'string') return 'string';
        if (Array.isArray(value)) return 'list';
        if (value && value._isTuple) return 'tuple';
        if (value && value._isInfiniteRange) return 'infiniteRange';
        if (value instanceof Lambda) return 'lambda';
        if (value instanceof PartialFunction) return 'partialFunction';
        return 'other';
    }

    initializeBuiltins() {
        // Built-in functions available to all programs
        this.builtins = {
            'head': (list) => {
                if (list && list._isInfiniteRange) {
                    return list.head();
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
                    if (fn && fn._isComposedFunction) {
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
                    if (predicate && predicate._isComposedFunction) {
                        return predicate.apply([item]);
                    }
                    return this.applyFunction(predicate, [item]);
                });
            },
            'fold': (fn, acc, list) => {
                if (list && list._isInfiniteRange) {
                    throw new Error('fold: cannot fold infinite range');
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
                    if (fn && fn._isComposedFunction) {
                        const step1 = fn.apply([accumulator]);
                        if (step1 instanceof Lambda) return step1.apply(item);
                        if (step1 && step1._isOperatorFunction) return step1.apply([item]);
                        return step1;
                    }
                    return this.applyFunction(fn, [accumulator, item]);
                }, acc);
            },
            'foldl': (fn, acc, list) => {
                // Alias for fold - both do the same thing (left fold)
                return this.builtins['fold'](fn, acc, list);
            },
            'foldr': (fn, acc, list) => {
                if (list && list._isInfiniteRange) {
                    throw new Error('foldr: cannot fold infinite range');
                }
                if (!Array.isArray(list)) {
                    throw new Error('foldr: third argument must be a list');
                }
                return list.reduceRight((accumulator, item) => {
                    if (fn instanceof Lambda) {
                        const step1 = fn.apply(item);
                        if (step1 instanceof Lambda) {
                            return step1.apply(accumulator);
                        }
                        return step1;
                    }
                    if (fn instanceof PartialFunction) {
                        return fn.apply([item, accumulator]);
                    }
                    if (fn && fn._isOperatorFunction) {
                        return fn.apply([item, accumulator]);
                    }
                    if (fn && fn._isComposedFunction) {
                        const step1 = fn.apply([item]);
                        if (step1 instanceof Lambda) return step1.apply(accumulator);
                        if (step1 && step1._isOperatorFunction) return step1.apply([accumulator]);
                        return step1;
                    }
                    return this.applyFunction(fn, [item, accumulator]);
                }, acc);
            },
            'length': (list) => {
                if (list && list._isInfiniteRange) {
                    return Infinity; // Infinite ranges have infinite length
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
                if (!Array.isArray(list)) {
                    throw new Error('null: argument must be a list');
                }
                return list.length === 0;
            },
            'reverse': (list) => {
                if (list && list._isInfiniteRange) {
                    throw new Error('reverse: cannot reverse infinite range');
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
                if (!Array.isArray(list)) {
                    throw new Error('take: second argument must be a list');
                }
                return list.slice(0, n);
            },
            'drop': (n, list) => {
                if (list && list._isInfiniteRange) {
                    return list.drop(n);
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
                // Convert Haskish string (array of chars) to JavaScript string
                if (Array.isArray(message)) {
                    message = message.join('');
                }
                throw new Error(message);
            },
            'mod': (a, b) => {
                return a % b;
            },
            'div': (a, b) => {
                return Math.floor(a / b);
            },
            'min': (a, b) => {
                if (typeof a !== typeof b) {
                    throw new Error(`Type error: min requires same types, got ${typeof a} and ${typeof b}`);
                }
                return a < b ? a : b;
            },
            'max': (a, b) => {
                if (typeof a !== typeof b) {
                    throw new Error(`Type error: max requires same types, got ${typeof a} and ${typeof b}`);
                }
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
            'show': (value) => {
                // Convert any value to a Haskell string (list of characters)
                let str;
                if (typeof value === 'string') {
                    str = value;
                } else if (typeof value === 'number') {
                    str = String(value);
                } else if (typeof value === 'boolean') {
                    str = value ? 'True' : 'False';
                } else if (Array.isArray(value)) {
                    str = this.formatOutput(value);
                } else if (value && value._isTuple) {
                    str = this.formatOutput(value);
                } else {
                    str = String(value);
                }
                // Convert JavaScript string to Haskell string (array of characters)
                return Array.from(str);
            },
            'putStr': (value) => {
                if (!Array.isArray(value)) throw new Error('putStr: expected a String (list of Char)');
                return { _isRawOutput: true, value: value.join('') };
            },
            'putStrLn': (value) => {
                if (!Array.isArray(value)) throw new Error('putStrLn: expected a String (list of Char)');
                return { _isRawOutput: true, value: value.join('') + '\n' };
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

    // Find the position of the 'where' keyword as a standalone word (not inside a string/comment)
    // Returns -1 if not found
    findWhereKeyword(str) {
        let inString = false;
        let stringChar = null;
        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            const isPrime = ch === "'" && !inString && i > 0 && /[\w']/.test(str[i - 1]);
            if ((ch === '"' || (ch === "'" && !isPrime)) && (i === 0 || str[i - 1] !== '\\')) {
                if (!inString) { inString = true; stringChar = ch; }
                else if (ch === stringChar) { inString = false; stringChar = null; }
                continue;
            }
            if (inString) continue;
            if (str.slice(i, i + 5) === 'where') {
                const before = i > 0 ? str[i - 1] : ' ';
                const after = i + 5 < str.length ? str[i + 5] : ' ';
                if (!/\w/.test(before) && !/\w/.test(after)) {
                    return i;
                }
            }
        }
        return -1;
    }

    // Pre-processing pass: detect 'where' blocks and merge their binding lines
    // into the LAST non-empty line that precedes the 'where' keyword using a
    // special marker, so the bracket-depth pass sees them as one logical line.
    //
    // Output format:  "<last func/guard line> __HASKISH_WHERE__ <b1> __HASKISH_WSEP__ <b2> ..."
    //
    // Guard continuation lines belonging to a where-local-function are merged
    // back onto their header, e.g.:
    //   helper y       →  "helper y | y > 0 = y | otherwise = negate y"
    //   | y > 0 = y
    //   | otherwise = negate y
    preprocessWhereBlocks(rawLines) {
        const out = [];

        // Group lines into "blocks": each block starts with a non-indented,
        // non-empty, non-comment line and includes all following indented/empty lines.
        const blocks = [];
        let currentBlock = [];
        for (const line of rawLines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('--') && !/^\s/.test(line)) {
                if (currentBlock.length > 0) blocks.push(currentBlock);
                currentBlock = [line];
            } else {
                currentBlock.push(line);
            }
        }
        if (currentBlock.length > 0) blocks.push(currentBlock);

        for (const block of blocks) {
            // Find the index of the first line containing 'where' as a keyword
            let whereLineIdx = -1;
            for (let i = 0; i < block.length; i++) {
                const trimmed = block[i].trim();
                if (!trimmed || trimmed.startsWith('--')) continue;
                if (this.findWhereKeyword(this.stripComments(trimmed)) !== -1) {
                    whereLineIdx = i;
                    break;
                }
            }

            if (whereLineIdx === -1) {
                // No 'where' in this block – output unchanged
                for (const line of block) out.push(line);
                continue;
            }

            // Lines before the 'where' line are the function/guard lines
            const funcLines = block.slice(0, whereLineIdx);

            // Parse the 'where' line itself
            const firstWhereLine = block[whereLineIdx].trim();
            const stripped0 = this.stripComments(firstWhereLine);
            const wPos = this.findWhereKeyword(stripped0);
            // Content on the same line before 'where' (e.g. "f x = body where ...")
            const beforeWherePart = stripped0.slice(0, wPos).trimEnd();
            if (beforeWherePart) funcLines.push(beforeWherePart);
            // Content on the same line after 'where'
            const afterWhere = stripped0.slice(wPos + 5).trim();

            // Collect all binding lines (after the 'where' keyword)
            const bindingLines = [];
            if (afterWhere) bindingLines.push(afterWhere);
            for (let i = whereLineIdx + 1; i < block.length; i++) {
                const t = block[i].trim();
                if (!t || t.startsWith('--')) continue;
                bindingLines.push(t);
            }

            // Merge guard-continuation '|' lines back onto the preceding binding
            const mergedBindings = [];
            for (const bl of bindingLines) {
                if (bl.startsWith('|') && mergedBindings.length > 0) {
                    mergedBindings[mergedBindings.length - 1] += ' ' + bl;
                } else {
                    mergedBindings.push(bl);
                }
            }

            if (mergedBindings.length === 0) {
                for (const line of funcLines) out.push(line);
                continue;
            }

            const whereMarker = ' __HASKISH_WHERE__ ' + mergedBindings.join(' __HASKISH_WSEP__ ');

            // Append the marker to the LAST non-empty func line
            let lastFuncLineIdx = -1;
            for (let i = funcLines.length - 1; i >= 0; i--) {
                if (funcLines[i].trim()) { lastFuncLineIdx = i; break; }
            }

            if (lastFuncLineIdx === -1) {
                // No func lines – output marker standalone (edge case)
                out.push(whereMarker.trim());
            } else {
                for (let i = 0; i < funcLines.length; i++) {
                    out.push(i === lastFuncLineIdx
                        ? funcLines[i].trimEnd() + whereMarker
                        : funcLines[i]);
                }
            }
        }

        return out;
    }

    // Extract __HASKISH_WHERE__ marker from an expression string.
    // Returns { expr, whereRaw } where whereRaw is [] if no marker present.
    extractWhere(exprStr) {
        const MARKER = ' __HASKISH_WHERE__ ';
        const markerIdx = exprStr.indexOf(MARKER);
        if (markerIdx === -1) return { expr: exprStr, whereRaw: [] };
        const expr = exprStr.slice(0, markerIdx).trim();
        const whereStr = exprStr.slice(markerIdx + MARKER.length);
        const whereRaw = whereStr.split(' __HASKISH_WSEP__ ').map(s => s.trim()).filter(Boolean);
        return { expr, whereRaw };
    }

    // Given the raw where-binding strings stored on a case object and the current
    // parameter bindings, evaluate each binding in sequence and return an object
    // of name → value that can be merged into the local scope.
    //
    // Supports:
    //   name = expr                   (simple variable)
    //   name p1 p2 = expr             (local function, single case)
    //   name p1 | cond = e | ...      (local function with guards)
    evaluateWhereBindings(whereRaw, outerBindings) {
        const scope = Object.assign({}, outerBindings); // accumulated scope
        const result = {};

        // Shared mutable closures for multi-case local functions.
        // Each function name maps to one closure object that is reused across all
        // equations for that name, so later equations see earlier ones and the
        // dispatch function can be patched in for self-recursion.
        const sharedClosures = {};

        // Pending simple-variable bindings deferred because a name they reference
        // wasn't yet in scope (e.g. `topArea = pi * r * r` before `pi = 3.14159`).
        // We retry until stable so that where bindings are order-independent, as in Haskell.
        const pending = []; // { lhs, rhs, isPattern }

        const trySimple = (lhs, rhs, isPattern, defer) => {
            const capturedScope = Object.assign({}, scope, result);
            try {
                const value = this.evaluateWithBindings(rhs, capturedScope);
                if (isPattern) {
                    const matches = this.matchPattern(lhs, value);
                    if (matches !== null) {
                        Object.assign(result, matches);
                        Object.assign(scope, matches);
                    }
                } else {
                    result[lhs] = value;
                    scope[lhs] = value;
                }
                return true;
            } catch (e) {
                if (defer) { pending.push({ lhs, rhs, isPattern }); }
                else { throw e; }
                return false;
            }
        };

        for (const raw of whereRaw) {
            const str = raw.trim();
            if (!str || str.startsWith('--')) continue;

            // Check whether there are guards (| after optional header)
            // Split into "header" part and guard parts
            const guardParts = this.splitWhereGuards(str);

            if (guardParts.guards.length > 0) {
                // Local function with guards: "name p1 p2 | cond = body | ..."
                const header = guardParts.header.trim(); // "name p1 p2"
                const spaceIdx = header.indexOf(' ');
                const name = spaceIdx === -1 ? header : header.slice(0, spaceIdx);
                const params = spaceIdx === -1 ? '' : header.slice(spaceIdx + 1).trim();
                const guards = guardParts.guards; // [{condition, body}]

                if (!sharedClosures[name]) sharedClosures[name] = Object.assign({}, scope, result);
                const fn = this.makeWhereLocalFunction(params, null, guards, sharedClosures[name]);
                if (result[name] instanceof DispatchLambda) {
                    result[name].cases.push(fn);
                } else if (result[name] !== undefined) {
                    result[name] = new DispatchLambda([result[name], fn], this);
                } else {
                    result[name] = fn;
                }
                sharedClosures[name][name] = result[name];
                scope[name] = result[name];
                continue;
            }

            // Find the assignment = (not ==, /=, <=, >=)
            const eqIdx = this.findWhereAssignmentEquals(str);
            if (eqIdx === -1) {
                // Could be a function header without = (guards were not merged properly)
                // Skip gracefully
                continue;
            }

            const lhs = str.slice(0, eqIdx).trim();
            const rhs = str.slice(eqIdx + 1).trim();

            // Pattern destructuring in where: (a,b) = expr  or  [x,y] = expr
            const isPattern = (lhs.startsWith('(') && lhs.endsWith(')')) || (lhs.startsWith('[') && lhs.endsWith(']'));
            if (isPattern) {
                trySimple(lhs, rhs, true, true);
                continue;
            }

            const spaceIdx = lhs.indexOf(' ');
            if (spaceIdx === -1) {
                // Simple variable binding: try now, defer on failure
                trySimple(lhs, rhs, false, true);
            } else {
                // Local function: name p1 p2 = expr
                const name = lhs.slice(0, spaceIdx);
                const params = lhs.slice(spaceIdx + 1).trim();
                if (!sharedClosures[name]) sharedClosures[name] = Object.assign({}, scope, result);
                const fn = this.makeWhereLocalFunction(params, rhs, [], sharedClosures[name]);
                if (result[name] instanceof DispatchLambda) {
                    result[name].cases.push(fn);
                } else if (result[name] !== undefined) {
                    result[name] = new DispatchLambda([result[name], fn], this);
                } else {
                    result[name] = fn;
                }
                sharedClosures[name][name] = result[name];
                scope[name] = result[name];
            }
        }

        // Retry deferred bindings until all resolve or no progress is made
        let progress = true;
        while (pending.length > 0 && progress) {
            progress = false;
            const retry = pending.splice(0);
            for (const { lhs, rhs, isPattern } of retry) {
                if (trySimple(lhs, rhs, isPattern, true)) {
                    progress = true;
                }
            }
        }
        // Any still-pending bindings have genuine unresolvable references — throw the real error
        for (const { lhs, rhs, isPattern } of pending) {
            trySimple(lhs, rhs, isPattern, false);
        }

        return result;
    }

    // Split a where-binding string that may contain inline guards.
    // e.g. "helper y | y > 0 = y | otherwise = negate y"
    // Returns { header: "helper y", guards: [{condition, body}, ...] }
    // If no guards, returns { header: str, guards: [] }
    splitWhereGuards(str) {
        // Find first | at depth 0 (not inside parens/brackets/strings)
        let depth = 0;
        let inString = false;
        let stringChar = null;

        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            // Apostrophe after a word char or prime is a trailing identifier prime, not a string opener
            const isPrime = ch === "'" && !inString && i > 0 && /[\w']/.test(str[i - 1]);
            if ((ch === '"' || (ch === "'" && !isPrime)) && (i === 0 || str[i - 1] !== '\\')) {
                if (!inString) { inString = true; stringChar = ch; }
                else if (ch === stringChar) { inString = false; stringChar = null; }
                continue;
            }
            if (inString) continue;
            if (ch === '(' || ch === '[') depth++;
            if (ch === ')' || ch === ']') depth--;
            if (depth === 0 && ch === '|' && (i === 0 || str[i - 1] !== '|') && (i + 1 >= str.length || str[i + 1] !== '|')) {
                // Found first guard separator – parse all guards from here
                const header = str.slice(0, i).trim();
                const guardStr = str.slice(i); // "| cond = body | cond = body"
                const guards = this.parseWhereGuardString(guardStr);
                return { header, guards };
            }
        }
        return { header: str, guards: [] };
    }

    // Parse a string of guards like "| cond = body | cond = body" into [{condition, body}, ...]
    parseWhereGuardString(str) {
        const guards = [];
        // Split on | at depth 0
        const parts = [];
        let depth = 0;
        let inString = false;
        let stringChar = null;
        let current = '';

        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            // Apostrophe after a word char or prime is a trailing identifier prime, not a string opener
            const isPrime = ch === "'" && !inString && i > 0 && /[\w']/.test(str[i - 1]);
            if ((ch === '"' || (ch === "'" && !isPrime)) && (i === 0 || str[i - 1] !== '\\')) {
                if (!inString) { inString = true; stringChar = ch; }
                else if (ch === stringChar) { inString = false; stringChar = null; }
                current += ch;
                continue;
            }
            if (inString) { current += ch; continue; }
            if (ch === '(' || ch === '[') depth++;
            if (ch === ')' || ch === ']') depth--;
            if (depth === 0 && ch === '|' && (i === 0 || str[i - 1] !== '|') && (i + 1 >= str.length || str[i + 1] !== '|')) {
                if (current.trim()) parts.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        if (current.trim()) parts.push(current.trim());

        for (const part of parts) {
            const eqIdx = this.findWhereAssignmentEquals(part);
            if (eqIdx !== -1) {
                guards.push({
                    condition: part.slice(0, eqIdx).trim(),
                    body: part.slice(eqIdx + 1).trim()
                });
            }
        }
        return guards;
    }

    // Find the position of the assignment = in a where-binding LHS string,
    // skipping ==, /=, <=, >=
    findWhereAssignmentEquals(str) {
        let depth = 0;
        let inString = false;
        let stringChar = null;

        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            // Apostrophe after a word char or prime is a trailing identifier prime (e.g. fst', not'), not a string opener
            const isPrime = ch === "'" && !inString && i > 0 && /[\w']/.test(str[i - 1]);
            if ((ch === '"' || (ch === "'" && !isPrime)) && (i === 0 || str[i - 1] !== '\\')) {
                if (!inString) { inString = true; stringChar = ch; }
                else if (ch === stringChar) { inString = false; stringChar = null; }
                continue;
            }
            if (inString) continue;
            if (ch === '(' || ch === '[') depth++;
            if (ch === ')' || ch === ']') depth--;
            if (depth === 0 && ch === '=') {
                const prev = i > 0 ? str[i - 1] : ' ';
                const next = i + 1 < str.length ? str[i + 1] : ' ';
                if (prev !== '=' && prev !== '<' && prev !== '>' && prev !== '/' && prev !== '!' &&
                    next !== '=') {
                    return i;
                }
            }
        }
        return -1;
    }

    // Build a Lambda (or nested Lambdas) for a where-local function definition.
    // params: space-separated parameter names (may include tuple patterns)
    // body:   expression string, or null if guards are used
    // guards: [{condition, body}, ...] – used when body is null
    // closure: the bindings to capture
    makeWhereLocalFunction(params, body, guards, closure) {
        if (!params || params.trim() === '') {
            // No parameters – evaluate immediately as a value
            if (guards.length > 0) {
                throw new Error('where: guard-only binding without parameter');
            }
            return this.evaluateWithBindings(body, closure);
        }

        // Split params (space-delimited, parens-aware)
        const paramList = [];
        let current = '';
        let depth = 0;
        for (const ch of params) {
            if (ch === '(' || ch === '[') depth++;
            if (ch === ')' || ch === ']') depth--;
            if (ch === ' ' && depth === 0 && current.trim()) {
                paramList.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        if (current.trim()) paramList.push(current.trim());

        if (paramList.length === 0) {
            if (guards.length > 0) throw new Error('where: guard-only binding without parameter');
            return this.evaluateWithBindings(body, closure);
        }

        // Determine the innermost body string
        let innerBody;
        if (guards.length > 0) {
            innerBody = this.guardsToIfChain(guards);
        } else {
            innerBody = body;
        }

        // Build nested lambda using string representation: \p1 -> \p2 -> ... body
        // The outermost Lambda carries the captured closure.
        let bodyStr = innerBody;
        for (let i = paramList.length - 1; i > 0; i--) {
            bodyStr = `\\${paramList[i]} -> ${bodyStr}`;
        }
        return new Lambda(paramList[0], bodyStr, this, closure);
    }

    // Convert an array of {condition, body} guards to a nested if/then/else string
    guardsToIfChain(guards) {
        // Build from last to first: if cN then bN else <error>
        // Guards should have 'otherwise' as the last fallback
        let chain = `error "Non-exhaustive guards in where"`;
        for (let i = guards.length - 1; i >= 0; i--) {
            const { condition, body } = guards[i];
            if (condition === 'otherwise' || condition === 'True') {
                chain = body;
                // Everything after 'otherwise' is unreachable; stop
                for (let j = i - 1; j >= 0; j--) {
                    chain = `if ${guards[j].condition} then ${guards[j].body} else ${chain}`;
                }
                return chain;
            }
            chain = `if ${condition} then ${body} else ${chain}`;
        }
        return chain;
    }

    // Helper function to remove multiline comments from code (supports nesting)
    removeMultilineComments(code) {
        let result = '';
        let inString = false;
        let stringChar = null;
        let commentDepth = 0;  // Track nesting level
        let i = 0;
        
        while (i < code.length) {
            const char = code[i];
            const nextChar = code[i + 1];
            
            // Handle escape sequences in strings
            if (inString && char === '\\' && i + 1 < code.length) {
                result += char + nextChar;
                i += 2;
                continue;
            }
            
            // Track string boundaries (only when not in comment)
            const isPrime = char === "'" && !inString && i > 0 && /[\w']/.test(code[i - 1]);
            if (commentDepth === 0 && (char === '"' || (char === "'" && !isPrime))) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = null;
                }
                result += char;
                i++;
                continue;
            }
            
            // Not in a string, check for multiline comments
            if (!inString) {
                // Check for multiline comment start
                if (char === '{' && nextChar === '-') {
                    commentDepth++;
                    i += 2;
                    continue;
                }
                
                // Check for multiline comment end
                if (commentDepth > 0 && char === '-' && nextChar === '}') {
                    commentDepth--;
                    i += 2;
                    continue;
                }
            }
            
            // Add character if not in a comment
            if (commentDepth === 0) {
                result += char;
            }
            i++;
        }
        
        return result;
    }

    // Helper function to strip both single-line and multiline comments
    stripComments(text) {
        // Note: multiline comments are already removed in preprocessing
        let result = '';
        let inString = false;
        let stringChar = null;
        let i = 0;
        
        while (i < text.length) {
            const char = text[i];
            const nextChar = text[i + 1];
            
            // Handle escape sequences in strings
            if (inString && char === '\\' && i + 1 < text.length) {
                result += char + nextChar;
                i += 2;
                continue;
            }
            
            // Track string boundaries
            const isPrime = char === "'" && !inString && i > 0 && /[\w']/.test(text[i - 1]);
            if (char === '"' || (char === "'" && !isPrime)) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = null;
                }
                result += char;
                i++;
                continue;
            }
            
            // Check for single-line comment
            if (!inString && char === '-' && nextChar === '-') {
                // Rest of line is a comment
                break;
            }
            
            result += char;
            i++;
        }
        
        return result;
    }

    // Parse function definitions and variable bindings
    parseFunctionDefinitions(code) {
        this.functions = {};
        this.variables = {};
        this.warnings = [];
        
        // Preprocess: Remove all multiline comments first
        code = this.removeMultilineComments(code);

        // Preprocess: merge 'where' blocks into their preceding function lines
        const preprocessedLines = this.preprocessWhereBlocks(code.split('\n'));

        // First pass: combine lines with unclosed brackets
        const rawLines = preprocessedLines;
        const combinedLines = [];
        const lineNumberMap = []; // Track which original line each combined line starts at
        let buffer = '';
        let bracketDepth = 0;
        let bufferStartLine = 0;
        
        for (let i = 0; i < rawLines.length; i++) {
            const rawLine = rawLines[i];
            const trimmed = rawLine.trim();
            
            // Skip empty lines and comments when not continuing
            if (!buffer && (!trimmed || trimmed.startsWith('--'))) {
                continue;
            }
            
            // Add to buffer
            if (buffer) {
                buffer += '\n' + rawLine;
            } else {
                buffer = rawLine;
                bufferStartLine = i + 1; // 1-indexed
            }
            
            // Strip comments before counting brackets (but keep them in buffer)
            let lineForBrackets = this.stripComments(trimmed);
            
            // Count brackets in this line (ignore brackets in strings and char literals)
            let inString = false;
            let escapeNext = false;
            
            for (let j = 0; j < lineForBrackets.length; j++) {
                const char = lineForBrackets[j];
                
                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }
                // Only treat backslash as escape if we're in a string
                if (char === '\\' && inString) {
                    escapeNext = true;
                    continue;
                }
                if (char === '"') {
                    inString = !inString;
                    continue;
                }
                // Character literal: 'x' - skip it entirely
                if (char === "'" && !inString && j + 2 < lineForBrackets.length) {
                    // Check if it's a valid char literal 'x' or '\x'
                    if (lineForBrackets[j + 1] === '\\' && j + 3 < lineForBrackets.length && lineForBrackets[j + 3] === "'") {
                        // Escaped char like '\n'
                        j += 3; // skip over entire '\x'
                        continue;
                    } else if (lineForBrackets[j + 2] === "'") {
                        // Regular char like 'a'
                        j += 2; // skip over entire 'x'
                        continue;
                    }
                }
                
                if (!inString) {
                    if (char === '[' || char === '(') bracketDepth++;
                    if (char === ']' || char === ')') bracketDepth--;
                }
            }
            
            // If brackets are balanced and line isn't a comment, flush buffer
            if (bracketDepth === 0 && trimmed && !trimmed.startsWith('--')) {
                // Don't flush if the buffer ends with a bare '=' — the function body
                // is on the next (indented) line, e.g.:
                //   lookup key ((k,v):xs) =
                //       if key == k then v else lookup key xs
                const strippedSoFar = buffer.split('\n')
                    .map(l => this.stripComments(l.trim())).join(' ').trimEnd();
                if (/(?<![=<>!\/])=$/.test(strippedSoFar)) {
                    continue; // keep accumulating
                }
                // Don't flush if the buffer ends with a bare 'then' or 'else' —
                // the branch body is on the next indented line
                if (/\b(then|else)\s*$/.test(strippedSoFar)) {
                    continue; // keep accumulating
                }
                // Don't flush if there's an incomplete if/then/else
                // (more 'if' keywords than 'else' at this point means the else branch is still coming)
                // Strip string literals first so keywords inside strings don't affect the count
                const noStrings = strippedSoFar.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');
                const ifCount = (noStrings.match(/\bif\b/g) || []).length;
                const elseCount = (noStrings.match(/\belse\b/g) || []).length;
                if (ifCount > elseCount) {
                    continue; // keep accumulating
                }
                // Don't flush if the next non-empty line starts with a binary infix operator —
                // it's a continuation of the current expression (e.g. "other" \n ++ "!!!").
                // Binary operators can never legally start a new top-level definition.
                // Excludes '-' (ambiguous with unary negation) and '|' (guard lines).
                let nextNonEmptyTrimmed = '';
                for (let j = i + 1; j < rawLines.length; j++) {
                    const nt = rawLines[j].trim();
                    if (nt && !nt.startsWith('--')) { nextNonEmptyTrimmed = nt; break; }
                }
                if (/^(\+\+|&&|\|\||[+*^]|:[^:]|\/(?![\/=]))/.test(nextNonEmptyTrimmed)) {
                    continue; // keep accumulating — next line is a binary operator continuation
                }
                // Replace internal newlines with spaces for parsing, and strip comments
                const normalizedBuffer = buffer.split('\n').map(l => {
                    return this.stripComments(l.trim());
                }).join(' ');
                combinedLines.push(normalizedBuffer);
                lineNumberMap.push(bufferStartLine);
                buffer = '';
            }
        }
        
        // Don't forget any remaining buffer
        if (buffer.trim()) {
            // Check if brackets are still unclosed
            if (bracketDepth > 0) {
                throw new Error(`Unclosed brackets on line ${bufferStartLine}: missing ${bracketDepth} closing bracket(s)`);
            } else if (bracketDepth < 0) {
                throw new Error(`Too many closing brackets on line ${bufferStartLine}: ${-bracketDepth} extra closing bracket(s)`);
            }
            
            // Replace internal newlines with spaces for parsing, and strip comments
            const normalizedBuffer = buffer.split('\n').map(l => {
                return this.stripComments(l.trim());
            }).join(' ');
            combinedLines.push(normalizedBuffer);
            lineNumberMap.push(bufferStartLine);
        }
        
        const lines = combinedLines;

        let currentFunction = null;
        let currentCases = [];
        let currentParams = null;
        let currentParamsLineNumber = null;
        let currentGuards = [];
        let currentWhereRaw = null; // where bindings for the current guard-style case

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const lineNumber = lineNumberMap[i];

            line = line.trim();
            if (!line) continue;

            // Skip type signature lines like: funcName :: Type -> Type
            if (/^\w+'*\s*::/.test(line)) continue;

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
                    const rawBody = guardLine.slice(eqIndex + 1).trim();
                    // Extract any where bindings embedded in the last guard body
                    const { expr: cleanBody, whereRaw } = this.extractWhere(rawBody);
                    if (whereRaw.length > 0) currentWhereRaw = whereRaw;
                    currentGuards.push({ condition, body: cleanBody });
                    continue;
                } else {
                    throw new Error(`Invalid guard syntax on line ${lineNumber}: "${originalLine}"`);
                }
            }

            // Check if it's a simple variable binding (no parameters) vs function definition (has parameters)
            // Variable: "name = expr" (name followed directly by optional spaces and =)
            // Function: "name param1 param2 = body" (name followed by space and params before =)
            
            // Simple check: does the line have the pattern "word whitespace =" at the start?
            // If so, it's a variable assignment, not a function definition
            const isSimpleVar = /^(\w+'*)\s*=\s/.test(line);
            
            if (!isSimpleVar) {
                // Try infix operator definition: a *** b = ...
                // Left and right params are constrained to valid pattern syntax [\w\s()\[\]:,_'"] so
                // operator chars in the function BODY (like &&, ==, -1) cannot be mistaken for the
                // infix operator being defined.  '=' and '|' are also excluded from the operator
                // class: '=' is the definition symbol, and '|' is the guard separator.
                const infixFuncMatch = line.match(/^([\w\s()\[\]:,_'"]+?)\s+([+\-*\/:<>!.&^$%]+)\s+([\w\s()\[\]:,_'"]+?)\s*=\s*(.+)$/);
                if (infixFuncMatch) {
                    // Check for incomplete function from previous lines
                    if (currentParams !== null && currentGuards.length === 0) {
                        throw new Error(`Incomplete function definition for '${currentFunction}' on line ${currentParamsLineNumber}: expected guards (|) or assignment (=) after parameters.`);
                    }

                    // Save previous guards if any
                    if (currentGuards.length > 0) {
                        currentCases.push({ params: currentParams, guards: currentGuards, whereRaw: currentWhereRaw || [] });
                        currentGuards = [];
                        currentWhereRaw = null;
                        currentParams = null;
                        currentParamsLineNumber = null;
                    }

                    const [, leftParam, opName, rightParam, rawBody] = infixFuncMatch;
                    const params = `${leftParam.trim()} ${rightParam.trim()}`;

                    // Validate infix parameters (patterns only)
                    const paramsNoCharLiterals = params.replace(/'(?:[^'\\]|\\.)*'/g, '_');
                    if (!/^[\w\s()\[\]:,_'"-]+$/.test(paramsNoCharLiterals)) {
                        throw new Error(`Invalid parameters on line ${lineNumber}: "${originalLine}". Parameters cannot contain operators.`);
                    }

                    if (currentFunction && currentFunction !== opName) {
                        this.functions[currentFunction] = currentCases;
                        currentCases = [];
                    }

                    // Extract where bindings from the body if present
                    const { expr: cleanBody, whereRaw } = this.extractWhere(rawBody.trim());

                    currentFunction = opName;
                    currentParams = params;
                    currentCases.push({ params: currentParams, body: cleanBody, whereRaw });
                    currentParams = null;
                    currentParamsLineNumber = null;
                    continue;
                }

                // Try to match function definition (has parameters before =)
                // The lookbehind (?<![<>!=\/]) prevents matching the = inside <=, >=, !=, ==, /=
                const funcMatch = line.match(/^(\w+'*)\s+(.+?)\s*(?<![<>!=\/])=(?!=)\s*(.+)$/);
                
                if (funcMatch) {
                // Check for incomplete function from previous lines
                if (currentParams !== null && currentGuards.length === 0) {
                    throw new Error(`Incomplete function definition for '${currentFunction}' on line ${currentParamsLineNumber}: expected guards (|) or assignment (=) after parameters.`);
                }
                
                // Save previous guards if any
                if (currentGuards.length > 0) {
                    currentCases.push({ params: currentParams, guards: currentGuards, whereRaw: currentWhereRaw || [] });
                    currentGuards = [];
                    currentWhereRaw = null;
                    currentParams = null;
                    currentParamsLineNumber = null;
                }

                // It's a function definition
                const [, funcName, params, rawBody] = funcMatch;

                // Detect inline guard: "f params | condition = body" — funcMatch's non-greedy
                // grab stops at the first =, so the guard ends up inside params.  Split it off.
                let actualParams = params.trim();
                let inlineGuardCondition = null;
                const inlinePipeMatch = actualParams.match(/^(.*?)\s*\|\s*(.+)$/);
                if (inlinePipeMatch) {
                    actualParams = inlinePipeMatch[1].trim();
                    inlineGuardCondition = inlinePipeMatch[2].trim();
                }

                // Validate parameters - should only contain valid pattern syntax
                // Strip char literals first (e.g. '?', ' ', '\n') so their contents aren't flagged
                // Allow: words, numbers, spaces, parentheses, brackets, colons, commas, underscores, quotes
                // Disallow: operators like +, -, *, /, etc. in parameters
                const paramsNoCharLiterals = actualParams.replace(/'(?:[^'\\]|\\.)*'/g, '_');
                if (!/^[\w\s()\[\]:,_'"]+$/.test(paramsNoCharLiterals)) {
                    throw new Error(`Invalid parameters on line ${lineNumber}: "${originalLine}". Parameters cannot contain operators.`);
                }
                
                if (currentFunction && currentFunction !== funcName) {
                    this.functions[currentFunction] = currentCases;
                    currentCases = [];
                }
                
                // Check if the function name shadows a built-in function
                if (this.builtins[funcName]) {
                    throw new Error(`Cannot redefine '${funcName}': it is a built-in function`);
                }
                
                // Extract where bindings from the body if present
                const { expr: cleanBody, whereRaw } = this.extractWhere(rawBody.trim());
                
                currentFunction = funcName;
                if (inlineGuardCondition) {
                    // Inline guard: "f params | condition = body"
                    // Leave currentParams set so that subsequent | lines on the next lines
                    // are recognised as guard continuations (style: first guard inline,
                    // remaining guards indented below).  The case is finalised lazily when
                    // the next function / EOF is reached, exactly like a header-only line.
                    currentParams = actualParams;
                    currentGuards.push({ condition: inlineGuardCondition, body: cleanBody });
                    if (whereRaw && whereRaw.length > 0) currentWhereRaw = whereRaw;
                } else {
                    currentCases.push({ params: actualParams, body: cleanBody, whereRaw });
                    currentParams = null; // Reset since this is a complete definition
                    currentParamsLineNumber = null;
                }
                continue;
                }
            }

            // Check for function header without = (for guard syntax)
            const headerMatch = line.match(/^(\w+'*)\s+(.+)$/);
            if (headerMatch && !line.includes('=')) {
                // Check for incomplete function from previous lines
                if (currentParams !== null && currentGuards.length === 0) {
                    throw new Error(`Incomplete function definition for '${currentFunction}' on line ${currentParamsLineNumber}: expected guards (|) or assignment (=) after parameters.`);
                }
                
                // Save previous guards if any
                if (currentGuards.length > 0) {
                    currentCases.push({ params: currentParams, guards: currentGuards, whereRaw: currentWhereRaw || [] });
                    currentGuards = [];
                    currentWhereRaw = null;
                    currentParams = null;
                    currentParamsLineNumber = null;
                }

                const [, funcName, params] = headerMatch;
                
                // Validate parameters - should only contain valid pattern syntax
                // Strip char literals first (e.g. '?', ' ', '\n') so their contents aren't flagged
                const paramsNoCharLiterals = params.replace(/'(?:[^'\\]|\\.)*'/g, '_');
                if (!/^[\w\s()\[\]:,_'"]+$/.test(paramsNoCharLiterals)) {
                    throw new Error(`Invalid parameters on line ${lineNumber}: "${originalLine}". Parameters cannot contain operators.`);
                }
                
                if (currentFunction && currentFunction !== funcName) {
                    this.functions[currentFunction] = currentCases;
                    currentCases = [];
                }
                
                // Check if the function name shadows a built-in function
                if (this.builtins[funcName]) {
                    throw new Error(`Cannot redefine '${funcName}': it is a built-in function`);
                }
                
                currentFunction = funcName;
                currentParams = params.trim();
                currentParamsLineNumber = lineNumber;
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
                // Check for incomplete function from previous lines
                if (currentParams !== null && currentGuards.length === 0) {
                    throw new Error(`Incomplete function definition for '${currentFunction}' on line ${currentParamsLineNumber}: expected guards (|) or assignment (=) after parameters.`);
                }
                
                // Save pending guards first
                if (currentGuards.length > 0) {
                    currentCases.push({ params: currentParams, guards: currentGuards });
                    currentGuards = [];
                    currentParams = null;
                    currentParamsLineNumber = null;
                }

                // It's a tuple destructuring assignment
                if (currentFunction) {
                    this.functions[currentFunction] = currentCases;
                    currentFunction = null;
                    currentCases = [];
                }
                
                const [, pattern, valueExpr] = tupleAssignMatch;
                
                // Update lazy-stream detection before evaluating, in case the RHS
                // calls a function that was just defined above on this same Run Code click.
                this.detectLazyStreamFunctions();
                
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
                        throw new Error(`Cannot use '${varName}' as a variable name on line ${lineNumber}: it is a built-in function`);
                    }
                    this.variables[varName] = varValue;
                }
                continue;
            }
            
            // Try to match variable binding (no parameters before =)
            const varMatch = line.match(/^(\w+'*)\s*=\s*(.+)$/);
            if (varMatch) {
                // Check for incomplete function from previous lines
                if (currentParams !== null && currentGuards.length === 0) {
                    throw new Error(`Incomplete function definition for '${currentFunction}' on line ${currentParamsLineNumber}: expected guards (|) or assignment (=) after parameters.`);
                }
                
                // Save pending guards first
                if (currentGuards.length > 0) {
                    currentCases.push({ params: currentParams, guards: currentGuards });
                    currentGuards = [];
                    currentParams = null;
                    currentParamsLineNumber = null;
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
                    throw new Error(`Cannot use '${name}' as a variable name on line ${lineNumber}: it is a built-in function`);
                }
                // Check if variable is being redefined (immutability)
                if (this.variables.hasOwnProperty(name)) {
                    throw new Error(`Cannot reassign '${name}' on line ${lineNumber} - variables are immutable in functional programming!`);
                }
                // Update lazy-stream detection before evaluating, in case the RHS
                // calls a function that was just defined above on this same Run Code click.
                this.detectLazyStreamFunctions();
                // Extract any where bindings from the value expression
                const { expr: cleanVarExpr, whereRaw: varWhereRaw } = this.extractWhere(value.trim());
                // If the RHS references the variable itself (e.g. fib = 0 : 1 : zip (+) fib (tail fib)),
                // enter self-ref cons mode so the trailing cons operand is deferred as a LazyExprThunk.
                const isSelfRef = new RegExp('\\b' + name + '\\b').test(cleanVarExpr);
                if (isSelfRef) this._selfRefConsMode = name;
                try {
                    if (varWhereRaw.length > 0) {
                        const whereBindings = this.evaluateWhereBindings(varWhereRaw, {});
                        this.variables[name] = this.evaluateWithBindings(cleanVarExpr, whereBindings);
                    } else {
                        this.variables[name] = this.evaluate(cleanVarExpr);
                    }
                } finally {
                    this._selfRefConsMode = null;
                }
                continue;
            }

            // If we reach here, the line doesn't match any valid pattern
            throw new Error(`Invalid syntax on line ${lineNumber}: "${originalLine}"`);
        }

        // Save any pending guards
        if (currentGuards.length > 0) {
            currentCases.push({ params: currentParams, guards: currentGuards, whereRaw: currentWhereRaw || [] });
            currentWhereRaw = null;
            currentParams = null; // Reset after saving guards
            currentParamsLineNumber = null;
        }

        // Check for incomplete function definition (header without guards or body)
        if (currentFunction && currentParams !== null) {
            throw new Error(`Incomplete function definition for '${currentFunction}' on line ${currentParamsLineNumber}: expected guards (|) or assignment (=) after parameters.`);
        }

        if (currentFunction) {
            this.functions[currentFunction] = currentCases;
        }

        // Validate all function bodies and variable expressions for syntax errors
        this.validateDefinitions();
        this.detectLazyStreamFunctions();
    }

    // Detect functions that are unconditionally self-recursive with no non-recursive base case.
    // These are infinite stream generators (e.g. fibHelper a b = a : fibHelper b (a+b)) and
    // need lazy treatment even when their arguments are plain scalars — unlike sieve which is
    // already handled by the _isInfiniteRange arg check.
    //
    // A function qualifies if:
    //   - Every case has a plain body (no guards)
    //   - Every body contains a self-recursive call
    //   - No body contains an 'if' keyword (which could hide a non-recursive branch)
    //
    // This conservative check avoids false-positives like:
    //   countdown n = if n == 0 then [] else n : countdown (n-1)
    // which appears recursive in all cases but is actually finite.
    detectLazyStreamFunctions() {
        this.lazyStreamFunctions = new Set();
        for (const [funcName, cases] of Object.entries(this.functions)) {
            if (cases.length === 0) continue;
            // Skip any function that has guard cases — guards can provide non-recursive branches
            if (cases.some(c => c.guards)) continue;
            const escapedFuncName = funcName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const namePattern = new RegExp('\\b' + escapedFuncName + '\\b');
            const allCasesUnconditionallyRecursive = cases.every(caseObj => {
                if (!caseObj.body) return false;
                const body = caseObj.body;
                // Must call itself
                if (!namePattern.test(body)) return false;
                // Must not use 'if' (could hide a non-recursive else/then branch)
                if (/\bif\b/.test(body)) return false;
                return true;
            });
            if (allCasesUnconditionallyRecursive) {
                this.lazyStreamFunctions.add(funcName);
            }
        }
    }

    // Validate function bodies and variable expressions
    validateDefinitions() {
        // Validate variable expressions
        for (const [varName, value] of Object.entries(this.variables)) {
            // Variables are already evaluated during parsing, so if we got here they're valid
        }

        // Validate function bodies by attempting to tokenize them
        for (const [funcName, cases] of Object.entries(this.functions)) {
            // Check for duplicate patterns (same parameters)
            // But only for cases without guards - guard cases are supposed to share params
            // Changed from error to warning to match GHC behavior
            if (cases.length > 1) {
                const patterns = cases.filter(c => !c.guards).map(c => c.params);
                for (let i = 0; i < patterns.length; i++) {
                    for (let j = i + 1; j < patterns.length; j++) {
                        if (patterns[i] === patterns[j]) {
                            // Add warning instead of throwing error
                            this.warnings.push(`Warning: Pattern '${funcName} ${patterns[i]}' has multiple definitions - only the first will be used`);
                        }
                    }
                }
            }
            
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
                // Convert to double-quoted string format but mark as char literal
                const content = expr.slice(i + 1, j - 1);
                tokens.push({ type: 'string', value: '"' + content + '"', isChar: true });
                i = j;
                continue;
            }

            // Lists
            if (expr[i] === '[') {
                let depth = 1;
                let j = i + 1;
                let inString = false;
                let inChar = false;
                let escapeNext = false;
                
                while (j < expr.length && depth > 0) {
                    if (escapeNext) {
                        escapeNext = false;
                        j++;
                        continue;
                    }
                    if (expr[j] === '\\') {
                        escapeNext = true;
                        j++;
                        continue;
                    }
                    if (expr[j] === '"' && !inChar) {
                        inString = !inString;
                    }
                    if (expr[j] === "'" && !inString) {
                        if (inChar) {
                            // Closing quote of a char literal — always close regardless of previous char
                            inChar = false;
                        } else {
                            // Opening quote — only if not a prime suffix on an identifier
                            const isListPrime = j > 0 && /[\w']/.test(expr[j - 1]);
                            if (!isListPrime) inChar = true;
                        }
                    }
                    if (!inString && !inChar) {
                        if (expr[j] === '[') depth++;
                        if (expr[j] === ']') depth--;
                    }
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
                let inString = false;
                let inChar = false;
                let escapeNext = false;
                
                while (j < expr.length && depth > 0) {
                    if (escapeNext) {
                        escapeNext = false;
                        j++;
                        continue;
                    }
                    // Only treat backslash as escape if we're in a string
                    if (expr[j] === '\\' && (inString || inChar)) {
                        escapeNext = true;
                        j++;
                        continue;
                    }
                    if (expr[j] === '"' && !inChar) {
                        inString = !inString;
                    }
                    if (expr[j] === "'" && !inString) {
                        if (inChar) {
                            // Closing quote of a char literal — always close regardless of previous char
                            inChar = false;
                        } else {
                            // Opening quote — only if not a prime suffix on an identifier
                            const isParenPrime = j > 0 && /[\w']/.test(expr[j - 1]);
                            if (!isParenPrime) inChar = true;
                        }
                    }
                    if (!inString && !inChar) {
                        if (expr[j] === '(') depth++;
                        if (expr[j] === ')') depth--;
                    }
                    j++;
                }
                const parenContent = expr.slice(i + 1, j - 1).trim();
                
                // Check if it's a lambda expression FIRST (before tuple check)
                // This is important for nested tuple patterns like \((a,b),(c,d)) -> ...
                // Special case: if it starts with \, treat parens in the parameter as part of the pattern
                let isLambda = false;
                let checkDepth = 0;
                let inLambdaParam = parenContent.startsWith('\\');
                
                for (let k = 0; k < parenContent.length - 1; k++) {
                    // If we're in the lambda parameter section (before ->), don't count parens for tuple patterns
                    if (inLambdaParam && parenContent[k] === '-' && parenContent[k + 1] === '>') {
                        // Found the arrow, so we've left the parameter section
                        inLambdaParam = false;
                        isLambda = true;
                        break;
                    }
                    
                    // Only track depth if we're not in the lambda parameter section
                    if (!inLambdaParam) {
                        if (parenContent[k] === '(' || parenContent[k] === '[') checkDepth++;
                        if (parenContent[k] === ')' || parenContent[k] === ']') checkDepth--;
                        if (checkDepth === 0 && parenContent[k] === '-' && parenContent[k + 1] === '>') {
                            isLambda = true;
                            break;
                        }
                    }
                }
                
                if (isLambda) {
                    tokens.push({ type: 'lambda', value: parenContent });
                    i = j;
                    continue;
                }
                
                // Check for tuple (contains commas at depth 0, not inside strings)
                let hasTupleComma = false;
                let tupleDepth = 0;
                // Reuse inString and reset it for tuple comma checking
                inString = false;
                let stringChar = null;
                for (let k = 0; k < parenContent.length; k++) {
                    const ch = parenContent[k];
                    
                    // Track string boundaries
                    if ((ch === '"' || ch === "'") && (k === 0 || parenContent[k - 1] !== '\\')) {
                        if (!inString) {
                            inString = true;
                            stringChar = ch;
                        } else if (ch === stringChar) {
                            inString = false;
                            stringChar = null;
                        }
                    }
                    
                    // Only track depth and check for commas outside of strings
                    if (!inString) {
                        if (ch === '(' || ch === '[') tupleDepth++;
                        if (ch === ')' || ch === ']') tupleDepth--;
                        if (tupleDepth === 0 && ch === ',') {
                            hasTupleComma = true;
                            break;
                        }
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
                
                // If not lambda or tuple, it's a regular parenthesized expression
                tokens.push({ type: 'paren', value: parenContent });
                i = j;
                continue;
            }
            
            // Backslash for lambda (alternative syntax without parens)
            if (expr[i] === '\\') {
                // Find the end of the lambda (up to the end of expression or balanced parens)
                let j = i + 1;
                let depth = 0;
                let seenArrow = false;
                
                while (j < expr.length) {
                    // Check for arrow
                    if (j < expr.length - 1 && expr[j] === '-' && expr[j + 1] === '>') {
                        seenArrow = true;
                        j += 2;
                        continue;
                    }
                    
                    if (expr[j] === '(') depth++;
                    if (expr[j] === ')') {
                        // Only break if we've seen the arrow and depth is 0
                        // Otherwise this ) might be part of a tuple pattern parameter
                        if (depth === 0 && seenArrow) break;
                        if (depth > 0) depth--;
                    }
                    if (expr[j] === '[') depth++;
                    if (expr[j] === ']') {
                        if (depth === 0 && seenArrow) break;
                        if (depth > 0) depth--;
                    }
                    // Lambda ends at whitespace when depth is 0 and we've seen ->
                    if (depth === 0 && seenArrow && /\s/.test(expr[j])) {
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
            listStr = listStr.slice(1, -1).trim();
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

        // Check for invalid range syntax: [..n] (missing start) — only at depth 0
        if (/^\s*\.\./.test(listStr)) {
            throw new Error('Invalid range syntax: range must have a starting value (e.g., [1..10] not [..10])');
        }

        // Depth-aware scan for '..' at bracket depth 0.
        // Regex-based detection would match '..' inside nested lists like [[1..],[2..]].
        let dotsIndex = -1;
        {
            let _d = 0;
            for (let i = 0; i < listStr.length - 1; i++) {
                const c = listStr[i];
                if (c === '[' || c === '(') _d++;
                if (c === ']' || c === ')') _d--;
                if (c === '.' && listStr[i + 1] === '.' && _d === 0) { dotsIndex = i; break; }
            }
        }

        if (dotsIndex !== -1) {
            const before = listStr.slice(0, dotsIndex).trim();
            const after  = listStr.slice(dotsIndex + 2).trim();

            // Find comma in 'before' at depth 0 (for [start,next..] syntax)
            let commaIdx = -1;
            {
                let _d = 0;
                for (let i = 0; i < before.length; i++) {
                    const c = before[i];
                    if (c === '[' || c === '(') _d++;
                    if (c === ']' || c === ')') _d--;
                    if (c === ',' && _d === 0) { commaIdx = i; break; }
                }
            }

            const startStr = commaIdx === -1 ? before : before.slice(0, commaIdx).trim();
            const nextStr  = commaIdx === -1 ? null   : before.slice(commaIdx + 1).trim();
            const start = this.evaluate(startStr);
            const next  = nextStr ? this.evaluate(nextStr) : null;

            if (after === '') {
                // Infinite range: [start..] or [start,next..]
                if (typeof start === 'number' && (next === null || typeof next === 'number')) {
                    const step = next !== null ? (next - start) : 1;
                    if (step === 0) throw new Error('Range step cannot be zero');
                    return new InfiniteRange(start, step);
                }
                // Not a valid range, fall through to regular list parsing
            } else {
                // Finite range: [start..end] or [start,next..end]
                const end = this.evaluate(after);
                if (typeof start === 'number' && typeof end === 'number' && (next === null || typeof next === 'number')) {
                    const step = next !== null ? (next - start) : 1;
                    if (step === 0) throw new Error('Range step cannot be zero');
                    const result = [];
                    if (step > 0 && start <= end) {
                        for (let i = start; i <= end; i += step) result.push(i);
                    } else if (step < 0 && start >= end) {
                        for (let i = start; i >= end; i += step) result.push(i);
                    }
                    return result;
                }
                // Not a valid range, fall through to regular list parsing
            }
        }

        const elements = [];
        let current = '';
        let depth = 0;
        let inString = false;
        let stringChar = null;

        for (let i = 0; i < listStr.length; i++) {
            const char = listStr[i];
            
            // Track string/char literal boundaries
            // Apostrophe after a word char or prime is a trailing identifier prime, not a string opener
            const isPrime = char === "'" && !inString && i > 0 && /[\w']/.test(listStr[i - 1]);
            if ((char === '"' || (char === "'" && !isPrime)) && (i === 0 || listStr[i - 1] !== '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = null;
                }
            }
            
            // Only track depth and split on commas outside of strings
            if (!inString) {
                if (char === '[' || char === '(') depth++;
                if (char === ']' || char === ')') depth--;
                
                if (char === ',' && depth === 0) {
                    elements.push(this.evaluate(current.trim()));
                    current = '';
                    continue;
                }
            }
            
            current += char;
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
        let inString = false;
        let stringChar = null;

        for (let i = 0; i < tupleStr.length; i++) {
            const char = tupleStr[i];
            
            // Track string boundaries
            // Apostrophe after a word char or prime is a trailing identifier prime, not a string opener
            const isPrime = char === "'" && !inString && i > 0 && /[\w']/.test(tupleStr[i - 1]);
            if ((char === '"' || (char === "'" && !isPrime)) && (i === 0 || tupleStr[i - 1] !== '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = null;
                }
            }
            
            // Only track depth and split on commas outside of strings
            if (!inString) {
                if (char === '(' || char === '[') depth++;
                if (char === ')' || char === ']') depth--;
                
                if (char === ',' && depth === 0) {
                    elements.push(this.evaluate(current.trim()));
                    current = '';
                    continue;
                }
            }
            
            current += char;
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
            // Try to match simple pattern: x <- list (including primed names like x', c'')
            const simplePattern = clause.match(/^(\w+'*)\s*<-\s*(.+)$/);
            
            if (tuplePattern) {
                const innerPat = tuplePattern[1];
                // Check if this is a cons pattern like (h:_) rather than a tuple (a,b)
                let pd = 0, hasTopComma = false;
                for (let i = 0; i < innerPat.length; i++) {
                    if (innerPat[i] === '(' || innerPat[i] === '[') pd++;
                    if (innerPat[i] === ')' || innerPat[i] === ']') pd--;
                    if (innerPat[i] === ',' && pd === 0) { hasTopComma = true; break; }
                }
                if (!hasTopComma) {
                    // It's a cons/wildcard pattern like (h:_) — use matchPattern, skip on failure
                    generators.push({
                        consPattern: '(' + innerPat + ')',
                        list: tuplePattern[2],
                        isCons: true
                    });
                } else {
                    // Parse tuple pattern variables
                    const vars = tuplePattern[1].split(',').map(v => v.trim());
                    generators.push({
                        variables: vars,
                        list: tuplePattern[2],
                        isTuple: true
                    });
                }
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
        } else if (Array.isArray(listExpr)) {
            sourceList = listExpr;
        } else {
            throw new Error(`Generator expression must evaluate to a list: ${generator.list}`);
        }
        
        // Iterate through the list and recursively process remaining generators
        const results = [];
        for (const item of sourceList) {
            let newBindings = { ...bindings };
            
            if (generator.isCons) {
                // Cons/pattern generator: skip items that don't match (Haskell semantics)
                const match = this.matchPattern(generator.consPattern, item);
                if (match === null) continue;
                Object.assign(newBindings, match);
            } else if (generator.isTuple) {
                // Destructure tuple pattern; skip items that don't match (Haskell semantics)
                if (!item || !item._isTuple) continue;
                if (item.elements.length !== generator.variables.length) continue;
                // Match each element pattern (handles sub-patterns like h:_ inside a tuple)
                let tupleMatched = true;
                for (let ti = 0; ti < generator.variables.length; ti++) {
                    const elemMatch = this.matchPattern(generator.variables[ti], item.elements[ti]);
                    if (elemMatch === null) { tupleMatched = false; break; }
                    Object.assign(newBindings, elemMatch);
                }
                if (!tupleMatched) continue;
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
            
            // First check if there's a comma at depth 0 — that means it's a tuple
            // pattern like (x:_, y:_), not a cons pattern.
            let depth = 0;
            let hasTopComma = false;
            for (let i = 0; i < inner.length; i++) {
                if (inner[i] === '(' || inner[i] === '[') depth++;
                if (inner[i] === ')' || inner[i] === ']') depth--;
                if (inner[i] === ',' && depth === 0) { hasTopComma = true; break; }
            }

            // Find the cons operator (:) at depth 0 — only when there's no top-level comma
            depth = 0;
            let consIndex = -1;
            if (!hasTopComma) {
                for (let i = 0; i < inner.length; i++) {
                    if (inner[i] === '(' || inner[i] === '[') depth++;
                    if (inner[i] === ')' || inner[i] === ']') depth--;
                    if (inner[i] === ':' && depth === 0) {
                        consIndex = i;
                        break;
                    }
                }
            }
            
            // If we found a cons operator (and no top-level comma), this is a list pattern
            if (consIndex !== -1) {
                // Convert string to array for pattern matching
                const listValue = typeof value === 'string' ? value.split('') : value;

                // Handle infinite ranges (e.g. sieve (p:xs) applied to [2..])
                if (listValue && listValue._isInfiniteRange) {
                    const headPat = inner.slice(0, consIndex).trim();
                    const tailPat = inner.slice(consIndex + 1).trim();

                    const headMatch = this.matchPattern(headPat, listValue.head());
                    if (headMatch === null) return null;

                    const tailValue = listValue.tail();
                    if (tailPat.includes(':')) {
                        const tailMatch = this.matchPattern('(' + tailPat + ')', tailValue);
                        if (tailMatch === null) return null;
                        return { ...headMatch, ...tailMatch };
                    } else {
                        return { ...headMatch, [tailPat]: tailValue };
                    }
                }

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

        // Specific list pattern like [a, b] or [((a,b),[c]),(_, d)]
        const listPatMatch = pattern.match(/^\[(.+)\]$/);
        if (listPatMatch) {
            // Convert string to array for pattern matching
            const listValue = typeof value === 'string' ? value.split('') : value;
            if (!Array.isArray(listValue)) return null;

            // Depth-aware comma split — handles nested patterns like [((a,b),[c]),(x,y)]
            const params = [];
            let current = '';
            let depth = 0;
            for (const char of listPatMatch[1]) {
                if (char === '(' || char === '[') depth++;
                if (char === ')' || char === ']') depth--;
                if (char === ',' && depth === 0) {
                    params.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            if (current.trim()) params.push(current.trim());

            if (params.length !== listValue.length) return null;

            // Recursively match each element pattern (handles nested tuples, lists, wildcards)
            const bindings = {};
            for (let i = 0; i < params.length; i++) {
                const elemMatch = this.matchPattern(params[i], listValue[i]);
                if (elemMatch === null) return null;
                Object.assign(bindings, elemMatch);
            }
            return bindings;
        }

        // Literal match for boolean constructors (before variable binding)
        if (pattern === 'True') {
            return value === true ? {} : null;
        }
        if (pattern === 'False') {
            return value === false ? {} : null;
        }

        // Wildcard pattern - matches anything without binding
        if (pattern === '_') {
            return {};
        }

        // Simple variable binding
        if (/^[a-zA-Z_]\w*'*$/.test(pattern)) {
            return { [pattern]: value };
        }

        // Bare cons pattern without outer parens, e.g. x:xs or x:_ as a tuple element.
        // Wrap in parens and delegate to the parenthesized cons handler above.
        {
            let d = 0, bareConsIdx = -1;
            for (let i = 0; i < pattern.length; i++) {
                if (pattern[i] === '(' || pattern[i] === '[') d++;
                if (pattern[i] === ')' || pattern[i] === ']') d--;
                if (pattern[i] === ':' && d === 0) { bareConsIdx = i; break; }
            }
            if (bareConsIdx !== -1) {
                return this.matchPattern('(' + pattern + ')', value);
            }
        }

        // Literal match (for numbers, strings, etc.)
        const literalValue = this.evaluate(pattern);
        return literalValue === value ? {} : null;
    }

    // Apply a function with arguments
    applyFunction(funcName, args) {
        // If called with an actual function value rather than a name string, dispatch it.
        if (typeof funcName !== 'string') {
            if (funcName instanceof Lambda) {
                let result = funcName;
                for (const arg of args) {
                    if (result instanceof Lambda) result = result.apply(arg);
                    else throw new Error('Too many arguments for lambda');
                }
                return result;
            }
            if (funcName instanceof PartialFunction) return funcName.apply(args);
            if (funcName && funcName._isOperatorFunction) return funcName.apply(args);
            if (funcName && funcName._isComposedFunction) return funcName.apply(args);
            throw new Error(`Cannot apply non-function value: ${String(funcName)}`);
        }

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

        // Check execution timeout to catch exponential algorithms and infinite loops
        if (this.executionStartTime > 0) {
            const elapsed = Date.now() - this.executionStartTime;
            if (elapsed > this.maxExecutionTime) {
                this.executionStartTime = 0;
                throw new Error(`Execution timeout (${this.maxExecutionTime}ms exceeded). Your function implementation may be intractable with exponential O(kⁿ) or factorial O(n!) complexity, or have infinite recursion.`);
            }
        }

        // Check user-defined functions
        if (!this.functions[funcName]) {
            // Check if it's in variables - better error message
            if (this.variables[funcName]) {
                throw new Error(`'${funcName}' is a variable, not a function. Use it without explicit function call syntax.`);
            }
            throw new Error(`Undefined function: ${funcName}`);
        }

        // Lazy evaluation: when recursively calling a user function, return a deferred
        // computation instead of recursing eagerly.  Two cases trigger this:
        //   1. Any argument is an infinite range (handles sieve-style functions).
        //   2. The function was detected as an unconditionally self-recursive stream
        //      generator (handles fibHelper-style functions whose args are always scalars).
        const currentDepth = this.functionCallDepth[funcName] || 0;
        if (currentDepth >= 1 && (
            args.some(a => a && a._isInfiniteRange) ||
            (this.lazyStreamFunctions && this.lazyStreamFunctions.has(funcName))
        )) {
            return new LazyFunctionCall(funcName, args, this);
        }

        // Increment depth before evaluating body; decrement in finally so it's correct
        // even if the body throws.
        this.functionCallDepth[funcName] = currentDepth + 1;

        try {

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
                // Evaluate and inject 'where' bindings (if any) into local scope
                if (caseObj.whereRaw && caseObj.whereRaw.length > 0) {
                    const whereScope = this.evaluateWhereBindings(caseObj.whereRaw, bindings);
                    Object.assign(bindings, whereScope);
                }
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

        // Format args for error message – use formatOutput so infinite ranges and
        // other non-serialisable values are rendered safely (no JSON.stringify).
        const argsStr = args.map(arg => {
            if (arg instanceof Lambda) return arg.toString();
            if (arg instanceof PartialFunction) return arg.toString();
            if (arg && arg._isOperatorFunction) return '<operator function>';
            if (arg && arg._isComposedFunction) return '<composed function>';
            try { return this.formatOutput(arg); } catch (_) { return String(arg); }
        }).join(', ');
        
        // Check for common mistake: negative number without parentheses
        if (args.length >= 2 && args[args.length - 2] === '-' && typeof args[args.length - 1] === 'number') {
            throw new Error(`Cannot apply operator '-' to a partially applied function.\nDid you mean to pass a negative number? Use parentheses, e.g., ${funcName} ... (-${args[args.length - 1]})`);
        }
        
        throw new Error(`No pattern matched for function ${funcName} with arguments: ${argsStr}`);
        } finally {
            this.functionCallDepth[funcName] = currentDepth;
        }
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

    // Format value for substitution back into expressions
    // Different from formatOutput which is for display to users
    // Capture free variables from this.variables (temp bindings) into a Lambda's closure.
    // Deep structural equality — handles character arrays (Haskish strings), nested lists, tuples.
    deepEquals(a, b) {
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!this.deepEquals(a[i], b[i])) return false;
            }
            return true;
        }
        if (a && a._isTuple && b && b._isTuple) {
            if (a.elements.length !== b.elements.length) return false;
            for (let i = 0; i < a.elements.length; i++) {
                if (!this.deepEquals(a.elements[i], b.elements[i])) return false;
            }
            return true;
        }
        return a === b;
    }

    // This is needed when a Lambda is created as an argument inside evaluateWithBindings,
    // because it may escape the scope where its free variables are live.
    captureCurrentScope(lambda) {
        if (!(lambda instanceof Lambda)) return lambda;
        if (Object.keys(lambda.closure).length > 0) return lambda; // already has closure
        // Find identifiers in the body that exist in this.variables (temp bindings only)
        const candidates = new Set(lambda.body.match(/\b[a-zA-Z_][a-zA-Z0-9_']*\b/g) || []);
        const captured = {};
        for (const id of candidates) {
            if (id === lambda.param) continue;            // don't capture own param
            if (this.builtins[id] || this.functions[id]) continue; // skip builtins/user fns
            if (this.variables[id] !== undefined) {
                captured[id] = this.variables[id];
            }
        }
        if (Object.keys(captured).length === 0) return lambda;
        return new Lambda(lambda.param, lambda.body, this, captured);
    }

    formatForSubstitution(value) {
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
            return '(' + value.elements.map(v => this.formatForSubstitution(v)).join(',') + ')';
        }
        if (Array.isArray(value)) {
            // Check if this is a character array (String = [Char] in Haskell)
            // Format as double-quoted string so tokenizer will convert back to array
            if (value.length > 0 && value.every(item => typeof item === 'string' && item.length === 1)) {
                return '"' + value.join('') + '"';
            }
            return '[' + value.map(v => this.formatForSubstitution(v)).join(',') + ']';
        }
        if (typeof value === 'string') {
            // Single character - must use SINGLE quotes so it stays as Char, not becomes String array
            if (value.length === 1) {
                return "'" + value + "'";
            }
            // Multi-char string (shouldn't normally happen, but handle it)
            return '"' + value + '"';
        }
        if (typeof value === 'boolean') {
            return value ? 'True' : 'False';
        }
        return String(value);
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
        
        // For function objects and single-char strings (Chars), store them in the variables table
        // during evaluation, since they can't be safely stringified and re-parsed
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
            // Store infinite ranges directly — their toString() includes '...' which is invalid syntax
            else if (value && value._isInfiniteRange) {
                tempVars[varName] = value;
            }
            // Also store single-char strings (Chars) to preserve them during evaluation
            // This prevents 'A' from becoming ['A'] when substituted
            else if (typeof value === 'string' && value.length === 1) {
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

            // Protect string literals before substitution so that a parameter like `n`
            // never corrupts escape sequences inside strings (e.g. "\n", "\t").
            const stringLiterals = [];
            result = result.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, (m) => {
                const idx = stringLiterals.length;
                stringLiterals.push(m);
                return `\x00STR${idx}\x00`;
            });

            for (let [varName, value] of Object.entries(bindings)) {
                // Skip function objects - they're already in variables table
                if (tempVars.hasOwnProperty(varName)) {
                    continue;
                }
                
                // Use lookahead/lookbehind instead of \b so names ending with ' (e.g. fst', even') match correctly
                const escapedVarName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const varRegex = new RegExp(`(?<![a-zA-Z0-9_'])${escapedVarName}(?![a-zA-Z0-9_'])`, 'g');
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
                    // Use formatForSubstitution to properly handle all types for re-evaluation
                    replacement = this.formatForSubstitution(value);
                }
                result = result.replace(varRegex, replacement);
            }

            // Restore string literals now that all variable substitutions are done
            if (stringLiterals.length > 0) {
                result = result.replace(/\x00STR(\d+)\x00/g, (_, i) => stringLiterals[+i]);
            }
            
            const evalResult = this.evaluate(result);
            
            // Never re-wrap a DispatchLambda — it already carries its own closures per-case
            if (evalResult instanceof DispatchLambda) return evalResult;

            // If the result is a Lambda, capture the current bindings as its closure
            if (evalResult instanceof Lambda && Object.keys(bindings).length > 0) {
                // Collect only the Lambda/function-type bindings (safe to patch with)
                const lambdaBindings = {};
                for (const [k, v] of Object.entries(bindings)) {
                    if (v instanceof Lambda || (v && v._isOperatorFunction) ||
                        (v && v._isComposedFunction) || v instanceof PartialFunction) {
                        lambdaBindings[k] = v;
                    }
                }

                if (Object.keys(evalResult.closure).length > 0) {
                    // Result already has a closure (from a nested evaluation).
                    // Patch any Lambda values inside that closure which have empty closures:
                    // they were likely created as arguments and never captured outer bindings.
                    if (Object.keys(lambdaBindings).length > 0) {
                        const patchedClosure = {};
                        let changed = false;
                        for (const [k, v] of Object.entries(evalResult.closure)) {
                            if (v instanceof Lambda && Object.keys(v.closure).length === 0) {
                                patchedClosure[k] = new Lambda(v.param, v.body, this, lambdaBindings);
                                changed = true;
                            } else {
                                patchedClosure[k] = v;
                            }
                        }
                        if (changed) {
                            return new Lambda(evalResult.param, evalResult.body, this, patchedClosure);
                        }
                    }
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
            let ifNesting = 0; // tracks inner if/else pairs after the outermost 'then'
            
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
                    // After 'then', track nested if/else to find the matching 'else' for the outermost 'if'
                    else if (thenIndex !== -1 && elseIndex === -1) {
                        if (expr.substr(i, 3) === 'if ' && (i === 0 || /\s/.test(expr[i-1]))) {
                            ifNesting++;
                        } else if (expr.substr(i, 5) === 'else ' && /\s/.test(expr[i-1])) {
                            if (ifNesting === 0) {
                                elseIndex = i;
                            } else {
                                ifNesting--;
                            }
                        }
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
        // Support both simple params (\x) and tuple patterns (\(x,y))
        const lambdaMatch = expr.match(/^\\(\w+|\([^)]+\))\s*->\s*(.+)$/);
        if (lambdaMatch) {
            const [, param, body] = lambdaMatch;
            return new Lambda(param, body.trim(), this);
        }
        
        // Lambda with parens: (\param -> body) - only if it's the complete expression
        // The body cannot contain ) at depth 0 (which would close the lambda early)
        // Support both simple params and tuple patterns
        const parenLambdaMatch = expr.match(/^\(\\(\w+|\([^)]+\))\s*->\s*([^)]+(?:\([^)]*\)[^)]*)*)\)$/);
        if (parenLambdaMatch) {
            const [, param, body] = parenLambdaMatch;
            return new Lambda(param, body.trim(), this);
        }

        // Check if it's a variable reference
        if (/^[a-zA-Z_]\w*'*$/.test(expr) && this.variables[expr] !== undefined) {
            // Prevent using _ as a variable (it's a wildcard pattern only)
            if (expr === '_') {
                throw new Error("Wildcard '_' cannot be used as a variable. It only matches values in patterns without binding.");
            }
            return this.variables[expr];
        }

        // Empty list
        if (expr === '[]') return [];

        // Check for unary negation patterns
        // Pattern 1: (-5) or (-x) or (-(...)) - parenthesized negation
        // Requires no space between ( and - and the value: (-10) yes, (- 10) no (that's a right section)
        if (/^\(-[^\s]/.test(expr) && expr.endsWith(')')) {
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
        const opSectionMatch = expr.match(/^\(([+*\/<>=&|:]+|\+\+|!!|&&|\|\||\/=)(\s*\d+|\s*\(.+\)|\s*["'][^"']*["'])?\)$/) ||
                       expr.match(/^\(-\s+(.+)\)$/) ||
                       expr.match(/^\((\d+|\(.+\)|["'][^"']*["'])\s*([+\-*\/<>=&|:]+|\+\+|!!|&&|\|\||\/=)\s*\)$/);
        if (opSectionMatch) {
            return this.createOperatorSection(expr);
        }

        // Custom symbolic operators (e.g., ***, <+>)
        // Evaluate these before built-ins so 10 *** 3 doesn't get parsed as 10 * * * 3.
        const builtinOps = new Set(['!!', '++', '&&', '||', '<=', '>=', '==', '/=', '.', ':', '^', '*', '/', '+', '-', '<', '>']);
        const customOps = Object.keys(this.functions)
            .filter(name => /^[+\-*\/:<>=!.&|^$%]+$/.test(name) && !builtinOps.has(name))
            .sort((a, b) => b.length - a.length);
        for (const op of customOps) {
            const parts = this.splitByOperator(expr, op);
            if (parts.length > 1) {
                let result = this.evaluate(parts[0]);
                for (let i = 1; i < parts.length; i++) {
                    const right = this.evaluate(parts[i]);
                    result = this.applyFunction(op, [result, right]);
                }
                return result;
            }
        }

        // If a symbolic operator token appears but is neither built-in nor user-defined,
        // report it explicitly instead of accidentally interpreting it as repeated built-ins.
        const unknownOperatorToken = this.tokenize(expr).find(token =>
            token.type === 'operator' &&
            token.value !== '->' &&
            !builtinOps.has(token.value) &&
            !customOps.includes(token.value)
        );
        if (unknownOperatorToken) {
            throw new Error(`Undefined operator: ${unknownOperatorToken.value}`);
        }

        // Binary operations (check BEFORE list literals to handle [1,2]++[3,4])
        const isFunctionValue = (value) => (
            value instanceof Lambda ||
            value instanceof PartialFunction ||
            (value && value._isOperatorFunction) ||
            (value && value._isComposedFunction)
        );

        const applyFunctionValue = (fnValue, arg) => {
            if (fnValue instanceof Lambda) {
                return fnValue.apply(arg);
            }
            if (fnValue instanceof PartialFunction) {
                return fnValue.apply([arg]);
            }
            if (fnValue && fnValue._isOperatorFunction) {
                return fnValue.apply([arg]);
            }
            if (fnValue && fnValue._isComposedFunction) {
                return fnValue.apply([arg]);
            }
            throw new Error('Expected a function value');
        };

        const numericBinaryOp = (opSymbol, opFn, a, b) => {
            if (!isFunctionValue(a) && !isFunctionValue(b)) {
                if (typeof a !== 'number' || typeof b !== 'number') {
                    throw new Error(`Type error: (${opSymbol}) requires numbers, got ${typeof a} and ${typeof b}`);
                }
                return opFn(a, b);
            }

            return {
                _isOperatorFunction: true,
                op: opSymbol,
                apply: function(args) {
                    if (args.length < 1) {
                        throw new Error(`Partial operator requires 1 argument`);
                    }
                    const x = args[0];
                    const left = isFunctionValue(a) ? applyFunctionValue(a, x) : a;
                    const right = isFunctionValue(b) ? applyFunctionValue(b, x) : b;
                    if (typeof left !== 'number' || typeof right !== 'number') {
                        throw new Error(`Type error: (${opSymbol}) requires numbers, got ${typeof left} and ${typeof right}`);
                    }
                    return opFn(left, right);
                },
                toString: function() {
                    return `<operator ${opSymbol}>`;
                }
            };
        };

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
                if (!Array.isArray(list)) {
                    throw new Error('(!!) requires a list as the first argument');
                }
                if (typeof index !== 'number' || index < 0 || index >= list.length) {
                    throw new Error(`(!!) index ${index} out of range for list of length ${list.length}`);
                }
                return list[Math.floor(index)];
            }},
            { op: '++', fn: (a, b) => {
                // Can prepend finite list to infinite range, but not append
                if (b && b._isInfiniteRange) {
                    if (a && a._isInfiniteRange) {
                        throw new Error('(++) cannot concatenate two infinite ranges');
                    }
                    if (!Array.isArray(a)) {
                        throw new Error('(++) requires two lists');
                    }
                    // Check type compatibility between finite list and infinite range
                    if (a.length > 0) {
                        const firstListType = this.getTypeCategory(a[0]);
                        const rangeType = 'number'; // Infinite ranges are always numbers
                        if (firstListType !== rangeType) {
                            throw new Error(`Type error: (++) cannot concatenate ${firstListType} list with number range`);
                        }
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
                // Check type compatibility between two lists
                if (a.length > 0 && b.length > 0) {
                    const firstTypeA = this.getTypeCategory(a[0]);
                    const firstTypeB = this.getTypeCategory(b[0]);
                    if (firstTypeA !== firstTypeB) {
                        throw new Error(`Type error: (++) cannot concatenate ${firstTypeA} list with ${firstTypeB} list`);
                    }
                }
                return [...a, ...b];
            }},
            { op: '&&', fn: (a, b) => {
                if (typeof a !== 'boolean' || typeof b !== 'boolean') {
                    throw new Error(`Type error: (&&) requires booleans, got ${typeof a} and ${typeof b}`);
                }
                return a && b;
            }},
            { op: '||', fn: (a, b) => {
                if (typeof a !== 'boolean' || typeof b !== 'boolean') {
                    throw new Error(`Type error: (||) requires booleans, got ${typeof a} and ${typeof b}`);
                }
                return a || b;
            }},
            { op: '/=', fn: (a, b) => {
                // Type check first (unless both are lists or tuples which have special handling)
                if (!Array.isArray(a) && !(a && a._isTuple) && !Array.isArray(b) && !(b && b._isTuple)) {
                    if (typeof a !== typeof b) {
                        throw new Error(`Type error: (/=) requires same types, got ${typeof a} and ${typeof b}`);
                    }
                }
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
                // Check type mismatch for list vs non-list
                if (Array.isArray(a) !== Array.isArray(b)) {
                    throw new Error(`Type error: (/=) requires same types, got ${Array.isArray(a) ? 'list' : typeof a} and ${Array.isArray(b) ? 'list' : typeof b}`);
                }
                if ((a && a._isTuple) || (b && b._isTuple)) {
                    if (!(a && a._isTuple) || !(b && b._isTuple)) {
                        throw new Error(`Type error: (/=) requires same types, got ${a && a._isTuple ? 'tuple' : typeof a} and ${b && b._isTuple ? 'tuple' : typeof b}`);
                    }
                }
                return a !== b;
            }},
            { op: '==', fn: (a, b) => {
                // Type check first (unless both are lists or tuples which have special handling)
                if (!Array.isArray(a) && !(a && a._isTuple) && !Array.isArray(b) && !(b && b._isTuple)) {
                    if (typeof a !== typeof b) {
                        throw new Error(`Type error: (==) requires same types, got ${typeof a} and ${typeof b}`);
                    }
                }
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
                // Check type mismatch for list vs non-list
                if (Array.isArray(a) !== Array.isArray(b)) {
                    throw new Error(`Type error: (==) requires same types, got ${Array.isArray(a) ? 'list' : typeof a} and ${Array.isArray(b) ? 'list' : typeof b}`);
                }
                if ((a && a._isTuple) || (b && b._isTuple)) {
                    if (!(a && a._isTuple) || !(b && b._isTuple)) {
                        throw new Error(`Type error: (==) requires same types, got ${a && a._isTuple ? 'tuple' : typeof a} and ${b && b._isTuple ? 'tuple' : typeof b}`);
                    }
                }
                return a === b;
            }},
            { op: '<=', fn: (a, b) => {
                if (typeof a !== typeof b) {
                    throw new Error(`Type error: (<=) requires same types, got ${typeof a} and ${typeof b}`);
                }
                return a <= b;
            }},
            { op: '>=', fn: (a, b) => {
                if (typeof a !== typeof b) {
                    throw new Error(`Type error: (>=) requires same types, got ${typeof a} and ${typeof b}`);
                }
                return a >= b;
            }},
            { op: '<', fn: (a, b) => {
                if (typeof a !== typeof b) {
                    throw new Error(`Type error: (<) requires same types, got ${typeof a} and ${typeof b}`);
                }
                return a < b;
            }},
            { op: '>', fn: (a, b) => {
                if (typeof a !== typeof b) {
                    throw new Error(`Type error: (>) requires same types, got ${typeof a} and ${typeof b}`);
                }
                return a > b;
            }},
            { op: '+', fn: (a, b) => {
                return numericBinaryOp('+', (x, y) => x + y, a, b);
            }},
            { op: '-', fn: (a, b) => {
                return numericBinaryOp('-', (x, y) => x - y, a, b);
            }},
            { op: '^', fn: (a, b) => {
                return numericBinaryOp('^', (x, y) => Math.pow(x, y), a, b);
            }},
            { op: '*', fn: (a, b) => {
                return numericBinaryOp('*', (x, y) => x * y, a, b);
            }},
            { op: '/', fn: (a, b) => {
                return numericBinaryOp('/', (x, y) => x / y, a, b);
            }},
            { op: ':', fn: (a, b) => {
                if (b && b._isInfiniteRange) {
                    // For a LazyExprThunk or LazyDispatchCall the resolved element type is
                    // not yet known, so skip the number-only guard.
                    // Also allow InfiniteRange elements (list-of-lists scenario).
                    if (!(b instanceof LazyExprThunk) && !(a && a._isInfiniteRange)) {
                        // Type check: element must match range type (numbers)
                        const elementType = this.getTypeCategory(a);
                        if (elementType !== 'number') {
                            throw new Error(`Type error: (:) cannot cons ${elementType} onto number range`);
                        }
                    }
                    // Create a new ConsedInfiniteRange
                    return new ConsedInfiniteRange(a, b);
                }
                if (!Array.isArray(b)) {
                    throw new Error('(:) requires a list as the second argument');
                }
                // Type check: element must match list element type
                if (b.length > 0) {
                    const elementType = this.getTypeCategory(a);
                    const listType = this.getTypeCategory(b[0]);
                    if (elementType !== listType) {
                        throw new Error(`Type error: (:) cannot cons ${elementType} onto ${listType} list`);
                    }
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
                    // Evaluate right-to-left for cons.
                    // When inside a self-referential variable definition (e.g. fib = 0:1:zip (+) fib (tail fib)),
                    // defer the rightmost operand as a LazyExprThunk so that the variable can be
                    // bound before the recursive reference inside it is evaluated.
                    let result = this._selfRefConsMode
                        ? new LazyExprThunk(parts[parts.length - 1], this)
                        : this.evaluate(parts[parts.length - 1]);
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

        // Backtick sections:
        //   (a `f`)   desugars to  \x -> f a x
        //   (`f` a)   desugars to  \x -> f x a
        // Keep this before full backtick infix handling.
        const backtickLeftSection = expr.match(/^(.+?)\s+`([a-zA-Z_]\w*'*|[+\-*\/<>=!.&|^$%:]+)`\s*$/);
        if (backtickLeftSection) {
            const [, leftExpr, fnName] = backtickLeftSection;
            const leftValue = this.evaluate(leftExpr.trim());
            const fnValue = this.evaluate(fnName);
            const interpreter = this;
            return {
                _isOperatorFunction: true,
                op: '`' + fnName + '`',
                apply: function(args) {
                    if (args.length < 1) {
                        throw new Error(`Partial operator requires 1 argument`);
                    }
                    const rightValue = args[0];
                    if (fnValue instanceof Lambda) {
                        const step = fnValue.apply(leftValue);
                        return step instanceof Lambda ? step.apply(rightValue) : step;
                    }
                    if (fnValue instanceof PartialFunction) {
                        return fnValue.apply([leftValue, rightValue]);
                    }
                    if (fnValue && fnValue._isOperatorFunction) {
                        return fnValue.apply([leftValue, rightValue]);
                    }
                    return interpreter.applyFunction(fnName, [leftValue, rightValue]);
                },
                toString: function() {
                    return `<operator ${leftExpr.trim()} ${'`' + fnName + '`'}>`;
                }
            };
        }

        const backtickRightSection = expr.match(/^`([a-zA-Z_]\w*'*|[+\-*\/<>=!.&|^$%:]+)`\s+(.+)$/);
        if (backtickRightSection) {
            const [, fnName, rightExpr] = backtickRightSection;
            const rightValue = this.evaluate(rightExpr.trim());
            const fnValue = this.evaluate(fnName);
            const interpreter = this;
            return {
                _isOperatorFunction: true,
                op: '`' + fnName + '`',
                apply: function(args) {
                    if (args.length < 1) {
                        throw new Error(`Partial operator requires 1 argument`);
                    }
                    const leftValue = args[0];
                    if (fnValue instanceof Lambda) {
                        const step = fnValue.apply(leftValue);
                        return step instanceof Lambda ? step.apply(rightValue) : step;
                    }
                    if (fnValue instanceof PartialFunction) {
                        return fnValue.apply([leftValue, rightValue]);
                    }
                    if (fnValue && fnValue._isOperatorFunction) {
                        return fnValue.apply([leftValue, rightValue]);
                    }
                    return interpreter.applyFunction(fnName, [leftValue, rightValue]);
                },
                toString: function() {
                    return `<operator ${'`' + fnName + '`'} ${rightExpr.trim()}>`;
                }
            };
        }

        // Backtick infix: a `f` b  desugars to  f a b  (curried, left-associative)
        // Checked after all binary ops so arithmetic/comparison splits happen first.
        const backtickParts = this.splitByBacktickInfix(expr);
        if (backtickParts !== null) {
            const { parts: btParts, fns: btFns } = backtickParts;
            let btResult = this.evaluate(btParts[0]);
            for (let i = 0; i < btFns.length; i++) {
                const btFn  = this.evaluate(btFns[i]);
                const btArg = this.evaluate(btParts[i + 1]);
                // Apply btFn to (btResult, btArg) — honouring Lambda and PartialFunction
                let btPartial;
                if (btFn instanceof Lambda) {
                    btPartial = btFn.apply(btResult);
                } else if (btFn instanceof PartialFunction) {
                    btPartial = btFn.apply([btResult]);
                } else if (btFn && btFn._isOperatorFunction) {
                    btPartial = btFn.apply([btResult]);
                } else {
                    throw new Error(`Backtick infix: '${btFns[i]}' is not a function`);
                }
                if (btPartial instanceof Lambda) {
                    btResult = btPartial.apply(btArg);
                } else if (btPartial instanceof PartialFunction) {
                    btResult = btPartial.apply([btArg]);
                } else if (btPartial && btPartial._isOperatorFunction) {
                    btResult = btPartial.apply([btArg]);
                } else {
                    btResult = btPartial; // already fully applied (e.g. 1-arg fn used as infix)
                }
            }
            return btResult;
        }

        // List literal (check AFTER binary operations to handle [1,2]++[3,4])
        if (expr.startsWith('[') && expr.endsWith(']')) {
            return this.parseList(expr);
        }

        // String literal (double quotes) - convert to list of characters (true Haskell behavior: String = [Char])
        if (expr.startsWith('"') && expr.endsWith('"')) {
            const content = this.processStringEscapes(expr.slice(1, -1));
            // Split into array of single-character strings
            return content.split('');
        }
        
        // String literal with single quotes - single character (Char type)
        if (expr.startsWith("'") && expr.endsWith("'")) {
            return this.processStringEscapes(expr.slice(1, -1));
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
        
        // Handle single lambda expression
        if (tokens.length === 1 && tokens[0].type === 'lambda') {
            // Parse the lambda directly without re-wrapping
            // Find the arrow (->) at the top level (not inside parens)
            let arrowPos = -1;
            let depth = 0;
            const lambdaStr = tokens[0].value;
            
            // Skip leading backslash if present
            let startPos = lambdaStr.startsWith('\\') ? 1 : 0;
            
            for (let i = startPos; i < lambdaStr.length - 1; i++) {
                if (lambdaStr[i] === '(') depth++;
                if (lambdaStr[i] === ')') depth--;
                if (depth === 0 && lambdaStr[i] === '-' && lambdaStr[i + 1] === '>') {
                    arrowPos = i;
                    break;
                }
            }
            
            if (arrowPos === -1) {
                throw new Error(`Invalid lambda syntax: ${lambdaStr} (arrow not found)`);
            }
            
            const paramsStr = lambdaStr.slice(startPos, arrowPos).trim();
            const body = lambdaStr.slice(arrowPos + 2).trim();
            
            // Smart parameter splitting: split on spaces, but keep tuple patterns together
            const params = [];
            let current = '';
            depth = 0;
            for (let i = 0; i < paramsStr.length; i++) {
                const ch = paramsStr[i];
                if (ch === '(') depth++;
                if (ch === ')') depth--;
                
                if (ch === ' ' && depth === 0) {
                    if (current.trim()) {
                        params.push(current.trim());
                        current = '';
                    }
                } else {
                    current += ch;
                }
            }
            if (current.trim()) {
                params.push(current.trim());
            }
            
            // If only one parameter, return simple lambda
            if (params.length === 1) {
                return new Lambda(params[0], body, this);
            }
            
            // Create nested lambdas for multi-parameter functions
            let bodyStr = body;
            for (let i = params.length - 1; i > 0; i--) {
                bodyStr = `\\${params[i]} -> ${bodyStr}`;
            }
            return new Lambda(params[0], bodyStr, this);
        }
        
        // Handle lambda followed by arguments: (\x -> x + 1) 5
        if (tokens.length > 1 && tokens[0].type === 'lambda') {
            // Parse the lambda token directly (don't re-evaluate which would re-tokenize)
            const lambdaToken = tokens[0];
            
            // Parse the lambda using the same logic as single lambda
            let arrowPos = -1;
            let depth = 0;
            const lambdaStr = lambdaToken.value;
            let startPos = lambdaStr.startsWith('\\') ? 1 : 0;
            
            for (let i = startPos; i < lambdaStr.length - 1; i++) {
                if (lambdaStr[i] === '(') depth++;
                if (lambdaStr[i] === ')') depth--;
                if (depth === 0 && lambdaStr[i] === '-' && lambdaStr[i + 1] === '>') {
                    arrowPos = i;
                    break;
                }
            }
            
            if (arrowPos === -1) {
                throw new Error(`Invalid lambda syntax: ${lambdaStr}`);
            }
            
            const paramsStr = lambdaStr.slice(startPos, arrowPos).trim();
            const body = lambdaStr.slice(arrowPos + 2).trim();
            
            // Smart parameter splitting
            const params = [];
            let current = '';
            depth = 0;
            for (let i = 0; i < paramsStr.length; i++) {
                const ch = paramsStr[i];
                if (ch === '(') depth++;
                if (ch === ')') depth--;
                if (ch === ' ' && depth === 0) {
                    if (current.trim()) {
                        params.push(current.trim());
                        current = '';
                    }
                } else {
                    current += ch;
                }
            }
            if (current.trim()) {
                params.push(current.trim());
            }
            
            // Create the lambda
            let lambda;
            if (params.length === 1) {
                lambda = new Lambda(params[0], body, this);
            } else {
                let bodyStr = body;
                for (let i = params.length - 1; i > 0; i--) {
                    bodyStr = `\\${params[i]} -> ${bodyStr}`;
                }
                lambda = new Lambda(params[0], bodyStr, this);
            }
            
            const args = tokens.slice(1).map(token => {
                if (token.type === 'list') return this.parseList(token.value);
                if (token.type === 'tuple') return this.parseTuple(token.value);
                if (token.type === 'number') return token.value;
                if (token.type === 'string') {
                    const str = this.processStringEscapes(token.value.slice(1, -1));
                    // Single-quoted literals are Chars, double-quoted are Strings
                    return token.isChar ? str : str.split('');
                }
                if (token.type === 'lambda') {
                    // Parse lambda token into a Lambda object (handles (\x -> e) as argument)
                    // Capture free vars from current scope so the lambda works outside this context
                    return this.captureCurrentScope(this.evaluate('(' + token.value + ')'));
                }
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
        
        // Handle parenthesized function followed by arguments: (f . g) x or (+10) 3
        if (tokens.length > 1 && tokens[0].type === 'paren') {
            // Check if the paren is an operator section like (+10) or (*2)
            const fullParen = '(' + tokens[0].value + ')';
            let funcExpr;
            if (/^\(([+*\/\^<>=]+|\+\+|!!|&&|\|\||\/=)(\s*\d+|\s*\(.+\)|\s*["'][^"']*["'])?\)$/.test(fullParen) || /^\(-\s+.+\)$/.test(fullParen) || /^\((\d+|\(.+\)|["'][^"']*["']){1}\s*([+\-*\/\^<>=]+|\+\+|!!|&&|\|\||\/=)\s*\)$/.test(fullParen)) {
                funcExpr = this.createOperatorSection(fullParen);
            } else {
                funcExpr = this.evaluate(tokens[0].value);
            }
            const args = tokens.slice(1).map(token => {
                if (token.type === 'list') return this.parseList(token.value);
                if (token.type === 'number') return token.value;
                if (token.type === 'string') {
                    const str = this.processStringEscapes(token.value.slice(1, -1));
                    // Single-quoted literals are Chars (single-char strings)
                    // Double-quoted literals are Strings (arrays)
                    return token.isChar ? str : str.split('');
                }
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
            // Fallthrough: funcExpr is not a known function type (e.g. a number literal)
            return this.applyFunction(funcExpr, args);
        }
        
        if (tokens.length > 1 && tokens[0].type === 'identifier') {
            const funcName = tokens[0].value;
            const args = tokens.slice(1).map(token => {
                if (token.type === 'list') return this.parseList(token.value);
                if (token.type === 'tuple') return this.parseTuple(token.value);
                if (token.type === 'number') return token.value;
                if (token.type === 'string') {
                    const str = this.processStringEscapes(token.value.slice(1, -1));
                    // Single-quoted literals are Chars (single-char strings)
                    // Double-quoted literals are Strings (arrays)
                    return token.isChar ? str : str.split('');
                }
                if (token.type === 'lambda') {
                    // Parse lambda expression (with or without leading backslash)
                    // Support multi-parameter lambdas like \x y -> x + y by converting to nested lambdas
                    // Also support tuple patterns like \(x,y) -> x + y and \(a,b) (c,d) -> ...
                    const lambdaMatch = token.value.match(/^\\?([\w\s().,\']+)\s*->\s*(.+)$/s);
                    if (lambdaMatch) {
                        const [, paramsStr, body] = lambdaMatch;
                        
                        // Smart parameter splitting: split on spaces, but keep tuple patterns together
                        const params = [];
                        let current = '';
                        let depth = 0;
                        for (let i = 0; i < paramsStr.length; i++) {
                            const ch = paramsStr[i];
                            if (ch === '(') depth++;
                            if (ch === ')') depth--;
                            
                            if (ch === ' ' && depth === 0) {
                                if (current.trim()) {
                                    params.push(current.trim());
                                    current = '';
                                }
                            } else {
                                current += ch;
                            }
                        }
                        if (current.trim()) {
                            params.push(current.trim());
                        }
                        
                        // If only one parameter, return simple lambda
                        if (params.length === 1) {
                            return new Lambda(params[0], body.trim(), this);
                        }
                        
                        // Create nested lambdas for multi-parameter functions
                        // \acc x -> acc + x becomes \acc -> (\x -> acc + x)
                        // Build the body string from inside out
                        let bodyStr = body.trim();
                        for (let i = params.length - 1; i > 0; i--) {
                            bodyStr = `\\${params[i]} -> ${bodyStr}`;
                        }
                        // Capture free vars from current scope so the lambda works outside this context
                        return this.captureCurrentScope(new Lambda(params[0], bodyStr, this));
                    }
                    throw new Error(`Invalid lambda syntax: ${token.value}`);
                }
                if (token.type === 'paren') {
                    // Handle unit () as null
                    if (token.value.trim() === '') {
                        return null;
                    }
                    // Check if it's an operator section like (*) or (<10) or (+(-1)) or (- val) or (=="cat") or (&&) but NOT (-val) which is unary negation
                    const fullParen = '(' + token.value + ')';
                    // Match operator sections: operators only, operators with number, string, or parenthesized expr
                    if (/^\(([+*\/\^<>=:]+|\+\+|!!|&&|\|\||\/=)(\s*\d+|\s*\(.+\)|\s*["'][^"']*["'])?\)$/.test(fullParen) || /^\(-\s+.+\)$/.test(fullParen) || /^\((\d+|\(.+\)|["'][^"']*["']){1}\s*([+\-*\/\^<>=:]+|\+\+|!!|&&|\|\||\/=)\s*\)$/.test(fullParen)) {
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
            // Apostrophe after a word char or prime is a trailing identifier prime, not a string opener
            const isPrime = expr[i] === "'" && !inString && i > 0 && /[\w']/.test(expr[i-1]);
            if ((expr[i] === '"' || (expr[i] === "'" && !isPrime)) && (i === 0 || expr[i-1] !== '\\')) {
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

            // Skip backtick-quoted sections entirely (e.g. `div`, `***`)
            // so that `*` inside `***` doesn't split the expression.
            if (expr[i] === '`') {
                const closeIdx = expr.indexOf('`', i + 1);
                if (closeIdx > i) {
                    i = closeIdx; // jump to closing backtick; loop will increment past it
                    continue;
                }
            }
            
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

    // Split an expression on backtick infix operators: a `f` b `g` c
    // Returns { parts: string[], fns: string[] } or null if none found.
    // Respects paren/bracket depth and string literals.
    splitByBacktickInfix(expr) {
        let depth = 0;
        let inString = false;
        let stringChar = null;
        const parts = [];
        const fns = [];
        let lastSplit = 0;
        let found = false;

        for (let i = 0; i < expr.length; i++) {
            const ch = expr[i];
            const isPrime = ch === "'" && !inString && i > 0 && /[\w']/.test(expr[i - 1]);
            if ((ch === '"' || (ch === "'" && !isPrime)) && (i === 0 || expr[i - 1] !== '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = ch;
                } else if (ch === stringChar) {
                    inString = false;
                    stringChar = null;
                }
            }
            if (inString) continue;

            if (ch === '(' || ch === '[') depth++;
            if (ch === ')' || ch === ']') depth--;

            if (depth === 0 && ch === '`') {
                const closeIdx = expr.indexOf('`', i + 1);
                if (closeIdx > i + 1) {
                    const fnName = expr.slice(i + 1, closeIdx);
                    if (/^[a-zA-Z_][\w]*'*$/.test(fnName) || /^[+\-*\/<>=!.&|^$%:]+$/.test(fnName)) {
                        const lhs = expr.slice(lastSplit, i).trim();
                        if (!lhs) return null; // backtick at start — invalid
                        found = true;
                        parts.push(lhs);
                        fns.push(fnName);
                        lastSplit = closeIdx + 1;
                        i = closeIdx;
                    }
                }
            }
        }

        if (!found) return null;
        const last = expr.slice(lastSplit).trim();
        if (!last) return null; // backtick at end — invalid
        parts.push(last);
        return { parts, fns };
    }

    // Create operator section function
    createOperatorSection(section) {
        // Right subtraction section: (- val) with a space distinguishes it from (-val) negative literal
        const subtractRightMatch = section.match(/^\(-\s+(.+)\)$/);
        if (subtractRightMatch) {
            const rightVal = this.evaluate(subtractRightMatch[1].trim());
            return this.createPartialOperatorFunction('-', null, rightVal);
        }

        // Match patterns like (*), (+), (<10), (10+), (&&), (||), (:), etc.
        // But NOT negative numbers like (-5) which could be (0 - 5) evaluated
        const opOnlyMatch = section.match(/^\(([+*\/\^<>=:]+|\+\+|!!|&&|\|\||\/=)\)$/);  // Removed - from here
        if (opOnlyMatch) {
            const op = opOnlyMatch[1];
            return this.createOperatorFunction(op);
        }
        
        // Left section with string literal like (== "cat") or (== 'cat')
        const leftStringMatch = section.match(/^\(([+*\/\^<>=:]+|\+\+|!!|&&|\|\||\/=)\s*(["'][^"']*["'])\)$/);
        if (leftStringMatch) {
            const [, op, str] = leftStringMatch;
            const stringValue = this.evaluate(str);
            return this.createPartialOperatorFunction(op, null, stringValue);
        }
        
        // Left section like (<10), (>5), (*2) but not (- or (-5)
        const leftMatch = section.match(/^\(([+*\/\^<>=:]+|\+\+|!!|&&|\|\||\/=)\s*(\d+)\)$/);  // Removed -
        if (leftMatch) {
            const [, op, num] = leftMatch;
            return this.createPartialOperatorFunction(op, null, parseFloat(num));
        }
        
        // Left section with parenthesized expression like (+(..))  
        const leftParenMatch = section.match(/^\(([+*\/\^<>=:]+|\+\+|!!|&&|\|\||\/=)\s*(\(.+\))\)$/);
        if (leftParenMatch) {
            const [, op, parenExpr] = leftParenMatch;
            const evaluatedValue = this.evaluate(parenExpr);
            return this.createPartialOperatorFunction(op, null, evaluatedValue);
        }
        
        // Right section with string literal like ("cat" ==) or ('cat' ==)
        const rightStringMatch = section.match(/^\((["'][^"']*["'])\s*([+\-*\/\^<>=:]+|\+\+|!!|&&|\|\||\/=)\)$/);
        if (rightStringMatch) {
            const [, str, op] = rightStringMatch;
            const stringValue = this.evaluate(str);
            return this.createPartialOperatorFunction(op, stringValue, null);
        }
        
        // Right section like (10+), (5*) but not (-10)
        const rightMatch = section.match(/^\((\d+)\s*([+\-*\/\^<>=:]+|\+\+|!!|&&|\|\||\/=)\)$/);
        if (rightMatch) {
            const [, num, op] = rightMatch;
            return this.createPartialOperatorFunction(op, parseFloat(num), null);
        }
        
        // Right section with parenthesized expression like ((..)+)
        const rightParenMatch = section.match(/^\((\(.+\))\s*([+\-*\/\^<>=:]+|\+\+|!!|&&|\|\||\/=)\)$/);
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
            '==': (a, b) => this.deepEquals(a, b),
            '/=': (a, b) => !this.deepEquals(a, b),
            '&&': (a, b) => a && b,
            '||': (a, b) => a || b,
            '++': (a, b) => {
                // Concatenate lists (strings are now lists)
                if (Array.isArray(a) && Array.isArray(b)) {
                    return [...a, ...b];
                }
                throw new Error('(++) requires two lists');
            },
            '!!': (list, index) => {
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
        
        const interpreter = this;

        if (!opMap[op]) {
            // Support user-defined symbolic operators as first-class values.
            if (!this.functions[op]) {
                throw new Error(`Unknown operator: ${op}`);
            }
            return {
                _isOperatorFunction: true,
                op: op,
                apply: function(args) {
                    if (args.length < 1) {
                        throw new Error(`Operator ${op} requires at least 1 argument`);
                    }
                    if (args.length === 1) {
                        return interpreter.createPartialOperatorFunction(op, args[0], null);
                    }
                    return interpreter.applyFunction(op, [args[0], args[1]]);
                },
                toString: function() {
                    return `<operator ${op}>`;
                }
            };
        }

        // Create a pseudo function that can be applied
        return {
            _isOperatorFunction: true,
            op: op,
            fn: opMap[op],
            apply: function(args) {
                if (args.length < 1) {
                    throw new Error(`Operator ${op} requires at least 1 argument`);
                }
                if (args.length === 1) {
                    // Curry bare operators so ((-) 10) works like Haskell sections.
                    return interpreter.createPartialOperatorFunction(op, args[0], null);
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
            '==': (a, b) => this.deepEquals(a, b),
            '/=': (a, b) => !this.deepEquals(a, b),
            '&&': (a, b) => a && b,
            '||': (a, b) => a || b,
            '++': (a, b) => {
                if (Array.isArray(a) && Array.isArray(b)) {
                    return [...a, ...b];
                }
                throw new Error('(++) requires two lists');
            },
            '!!': (list, index) => {
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
            if (!this.functions[op]) {
                throw new Error(`Unknown operator: ${op}`);
            }
            const interpreter = this;
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
                        return interpreter.applyFunction(op, [leftVal, args[0]]);
                    }
                    return interpreter.applyFunction(op, [args[0], rightVal]);
                },
                toString: function() {
                    if (leftVal !== null) return `<operator ${leftVal}${op}>`;
                    return `<operator ${op}${rightVal}>`;
                }
            };
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

    // Process escape sequences in string literals (\n, \t, \\, \", \')
    processStringEscapes(str) {
        let result = '';
        let i = 0;
        while (i < str.length) {
            if (str[i] === '\\' && i + 1 < str.length) {
                switch (str[i + 1]) {
                    case 'n':  result += '\n'; i += 2; break;
                    case 't':  result += '\t'; i += 2; break;
                    case '\\': result += '\\'; i += 2; break;
                    case '"':  result += '"';  i += 2; break;
                    case "'":  result += "'";  i += 2; break;
                    default:   result += str[i]; i++; break;
                }
            } else {
                result += str[i++];
            }
        }
        return result;
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
        if (value && value._isRawOutput) {
            return value.value;
        }
        if (value && value._isTuple) {
            return '(' + value.elements.map(v => this.formatOutput(v)).join(',') + ')';
        }
        if (Array.isArray(value)) {
            // Check if this is a character array (String = [Char] in Haskell)
            // Display as "string" if all elements are single-character strings
            if (value.length > 0 && value.every(item => typeof item === 'string' && item.length === 1)) {
                const escaped = value.join('')
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, '\\n')
                    .replace(/\t/g, '\\t');
                return '"' + escaped + '"';
            }
            return '[' + value.map(v => this.formatOutput(v)).join(',') + ']';
        }
        if (typeof value === 'string') {
            // Single character (Char type) - display with single quotes
            if (value.length === 1) {
                const esc = value === '\\' ? '\\\\' : value === "'" ? "\\'" : value === '\n' ? '\\n' : value === '\t' ? '\\t' : value;
                return "'" + esc + "'";
            }
            // Shouldn't happen with new implementation, but handle gracefully
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
            return { 
                success: true, 
                message: `Loaded ${funcCount} function(s) and ${varCount} variable(s)`,
                warnings: this.warnings
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Evaluate a REPL expression
    evaluateRepl(expr) {
        try {
            // Start execution timer
            this.executionStartTime = Date.now();
            
            expr = expr.trim();
            
            // Handle REPL commands (starting with :)
            if (expr.startsWith(':')) {
                return this.handleReplCommand(expr);
            }
            
            // Strip optional 'let' keyword at the start
            expr = expr.replace(/^let\s+/, '');
            
            // Find the assignment = more carefully, skipping over string literals
            // This prevents "fold (\x -> x ++ "=" ++ y)" from being treated as a function definition
            let assignmentPos = -1;
            let inString = false;
            let stringChar = null;
            let depth = 0;
            
            for (let i = 0; i < expr.length; i++) {
                const ch = expr[i];
                
                // Track string boundaries
                // isPrime: ' is a trailing identifier prime (e.g. g', fst''), not a char literal opener
                const isPrime = ch === "'" && !inString && i > 0 && /[\w']/.test(expr[i - 1]);
                if ((ch === '"' || (ch === "'" && !isPrime)) && (i === 0 || expr[i - 1] !== '\\')) {
                    if (!inString) {
                        inString = true;
                        stringChar = ch;
                    } else if (ch === stringChar) {
                        inString = false;
                        stringChar = null;
                    }
                }
                
                // Skip if in string
                if (inString) continue;
                
                // Track depth
                if (ch === '(' || ch === '[') depth++;
                if (ch === ')' || ch === ']') depth--;
                
                // Look for = at depth 0, not part of ==, /=, <=, >=
                if (depth === 0 && ch === '=' && 
                    (i === 0 || (expr[i-1] !== '=' && expr[i-1] !== '<' && expr[i-1] !== '>' && expr[i-1] !== '/' && expr[i-1] !== '!')) &&
                    (i === expr.length - 1 || expr[i+1] !== '=')) {
                    assignmentPos = i;
                    break;
                }
            }
            
            // Check if it's a function definition vs variable assignment
            let funcMatch = null;
            if (assignmentPos > 0) {
                const beforeEq = expr.slice(0, assignmentPos).trim();
                const afterEq = expr.slice(assignmentPos + 1).trim();

                // Infix operator definition in REPL: a *** b = ...
                const infixReplMatch = beforeEq.match(/^(.+?)\s+([+\-*\/:<>=!.&|^$%]+)\s+(.+)$/);
                if (infixReplMatch) {
                    const [, leftParam, opName, rightParam] = infixReplMatch;
                    const params = `${leftParam.trim()} ${rightParam.trim()}`;
                    const paramsNoCharLiterals = params.replace(/'(?:[^'\\]|\\.)*'/g, '_');
                    if (/^[\w\s()\[\]:,_'"-]+$/.test(paramsNoCharLiterals)) {
                        funcMatch = [expr, opName, params, afterEq];
                    }
                }
                
                // Check if there's a space in beforeEq - indicates parameters
                const spaceIndex = beforeEq.indexOf(' ');
                if (!funcMatch && spaceIndex > 0) {
                    // Could be a function definition
                    const funcName = beforeEq.slice(0, spaceIndex);
                    const params = beforeEq.slice(spaceIndex + 1).trim();
                    
                    // Validate function name
                    if (/^[a-zA-Z_]\w*'*$/.test(funcName) && params) {
                        funcMatch = [expr, funcName, params, afterEq];
                    }
                }
            }
            
            if (funcMatch) {
                const [, funcName, params, body] = funcMatch;
                
                // Check if params is only whitespace or starts with \ - if so, this is a lambda/variable assignment, not a function definition
                const trimmedParams = params.trim();
                if (trimmedParams === '' || trimmedParams.startsWith('\\')) {
                    // Fall through to variable assignment handling below
                } else {
                    // Check if the function name shadows a built-in function
                    if (this.builtins[funcName]) {
                        throw new Error(`Cannot redefine '${funcName}': it is a built-in function`);
                    }
                    
                    // Check if function already exists
                    const isRedefinition = this.functions[funcName] !== undefined;
                    
                    // In REPL, replace function entirely (like GHCi behavior)
                    // Pattern matching cases should only be added via the definition panel
                    this.functions[funcName] = [{ params: params.trim(), body: body.trim() }];
                    this.detectLazyStreamFunctions();
                    
                    if (isRedefinition) {
                        return { success: true, result: `Redefined function: ${funcName}`, isWarning: true };
                    } else {
                        return { success: true, result: `Defined function: ${funcName}` };
                    }
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
            const assignMatch = expr.match(/^([a-zA-Z_]\w*'*)\s*(?<![=/<>])=(?![=])\s*(.+)$/s);
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
                
                const isSelfRef = new RegExp('\\b' + varName + '\\b').test(value);
                if (isSelfRef) this._selfRefConsMode = varName;
                let evaluated;
                try {
                    evaluated = this.evaluate(value.trim());
                } finally {
                    this._selfRefConsMode = null;
                }
                this.variables[varName] = evaluated;
                return { success: true, result: `${varName} = ${this.formatOutput(evaluated)}` };
            }
            
            const result = this.evaluate(expr);
            if (result && result._isRawOutput) {
                return { success: true, result: result.value, plainText: true };
            }
            return { success: true, result: this.formatOutput(result) };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            // Always clear the timer so stale timestamps don't cause instant timeouts
            // on subsequent parseFunctionDefinitions calls (e.g. clicking Run Code again)
            this.executionStartTime = 0;
        }
    }
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HaskishInterpreter;
}
