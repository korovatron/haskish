// Haskish Interpreter - A subset of Haskell for A Level Computer Science

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
                if (!Array.isArray(list) || list.length === 0) {
                    throw new Error('head: empty list');
                }
                return list[0];
            },
            'tail': (list) => {
                if (!Array.isArray(list) || list.length === 0) {
                    throw new Error('tail: empty list');
                }
                return list.slice(1);
            },
            'map': (fn, list) => {
                if (!Array.isArray(list)) {
                    throw new Error('map: second argument must be a list');
                }
                return list.map(item => {
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
                if (!Array.isArray(list)) {
                    throw new Error('filter: second argument must be a list');
                }
                return list.filter(item => {
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
                if (!Array.isArray(list)) {
                    throw new Error('fold: third argument must be a list');
                }
                return list.reduce((accumulator, item) => {
                    if (fn instanceof PartialFunction) {
                        return fn.apply([accumulator, item]);
                    }
                    if (fn && fn._isOperatorFunction) {
                        return fn.apply([accumulator, item]);
                    }
                    return this.applyFunction(fn, [accumulator, item]);
                }, acc);
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

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Try to match function definition (has parameters before =)
            const funcMatch = line.match(/^(\w+)\s+(.+?)\s*=\s*(.+)$/);
            
            if (funcMatch) {
                // It's a function definition
                const [, funcName, params, body] = funcMatch;
                
                if (currentFunction && currentFunction !== funcName) {
                    this.functions[currentFunction] = currentCases;
                    currentCases = [];
                }
                
                currentFunction = funcName;
                currentCases.push({ params: params.trim(), body: body.trim() });
            } else {
                // Try to match variable binding (no parameters before =)
                const varMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
                if (varMatch) {
                    // It's a variable binding
                    if (currentFunction) {
                        this.functions[currentFunction] = currentCases;
                        currentFunction = null;
                        currentCases = [];
                    }
                    const [, name, value] = varMatch;
                    this.variables[name] = this.evaluate(value.trim());
                }
            }
        }

        if (currentFunction) {
            this.functions[currentFunction] = currentCases;
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

            // Parentheses
            if (expr[i] === '(') {
                let depth = 1;
                let j = i + 1;
                while (j < expr.length && depth > 0) {
                    if (expr[j] === '(') depth++;
                    if (expr[j] === ')') depth--;
                    j++;
                }
                tokens.push({ type: 'paren', value: expr.slice(i + 1, j - 1) });
                i = j;
                continue;
            }

            // Numbers (including negative)
            if (/\d/.test(expr[i]) || (expr[i] === '-' && i + 1 < expr.length && /\d/.test(expr[i + 1]))) {
                let j = i;
                if (expr[j] === '-') j++;
                while (j < expr.length && /[\d.]/.test(expr[j])) j++;
                tokens.push({ type: 'number', value: parseFloat(expr.slice(i, j)) });
                i = j;
                continue;
            }

            // Operators and symbols
            if (/[+\-*\/:<>=!]/.test(expr[i])) {
                let j = i;
                while (j < expr.length && /[+\-*\/:<>=!]/.test(expr[j])) j++;
                tokens.push({ type: 'operator', value: expr.slice(i, j) });
                i = j;
                continue;
            }

            // Identifiers and keywords
            if (/[a-zA-Z_]/.test(expr[i])) {
                let j = i;
                while (j < expr.length && /[a-zA-Z0-9_']/.test(expr[j])) j++;
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

        const elements = [];
        let current = '';
        let depth = 0;

        for (let char of listStr) {
            if (char === '[') depth++;
            if (char === ']') depth--;
            
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

    // Pattern matching helper
    matchPattern(pattern, value) {
        pattern = pattern.trim();

        // Empty list pattern
        if (pattern === '[]') {
            return Array.isArray(value) && value.length === 0 ? {} : null;
        }

        // List destructuring (x:xs)
        const consMatch = pattern.match(/^\((.+?):(.+?)\)$/);
        if (consMatch) {
            if (!Array.isArray(value) || value.length === 0) return null;
            const [, headPat, tailPat] = consMatch;
            return {
                [headPat.trim()]: value[0],
                [tailPat.trim()]: value.slice(1)
            };
        }

        // Specific list pattern like [a, b]
        const listPatMatch = pattern.match(/^\[(.+)\]$/);
        if (listPatMatch) {
            if (!Array.isArray(value)) return null;
            const params = listPatMatch[1].split(',').map(p => p.trim());
            if (params.length !== value.length) return null;
            
            const bindings = {};
            params.forEach((param, i) => {
                bindings[param] = value[i];
            });
            return bindings;
        }

        // Simple variable binding
        if (/^[a-zA-Z_]\w*$/.test(pattern)) {
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
            return builtinFn(...args);
        }

        // Check user-defined functions
        if (!this.functions[funcName]) {
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
                return this.evaluateWithBindings(caseObj.body, bindings);
            }
        }

        throw new Error(`No pattern matched for function ${funcName} with arguments: ${JSON.stringify(args)}`);
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
        // Replace variables in expression
        let result = expr;
        for (let [varName, value] of Object.entries(bindings)) {
            const varRegex = new RegExp(`\\b${varName}\\b`, 'g');
            const replacement = JSON.stringify(value);
            result = result.replace(varRegex, replacement);
        }
        
        return this.evaluate(result);
    }

    // Main evaluation function
    evaluate(expr) {
        expr = expr.trim();

        // Check if it's a variable reference
        if (/^[a-zA-Z_]\w*$/.test(expr) && this.variables[expr] !== undefined) {
            return this.variables[expr];
        }

        // Empty list
        if (expr === '[]') return [];

        // List literal
        if (expr.startsWith('[') && expr.endsWith(']')) {
            return this.parseList(expr);
        }

        // Number literal
        if (/^-?\d+(\.\d+)?$/.test(expr)) {
            return parseFloat(expr);
        }

        // String literal (basic support)
        if (expr.startsWith('"') && expr.endsWith('"')) {
            return expr.slice(1, -1);
        }

        // Operator sections like (<10) or (+)
        const opSectionMatch = expr.match(/^\(([+\-*\/<>=]+)\s*(\d+)?\)$/) || 
                               expr.match(/^\((\d+)\s*([+\-*\/<>=]+)\)$/);
        if (opSectionMatch) {
            return this.createOperatorSection(expr);
        }

        // Binary operations
        const binaryOps = [
            { op: '+', fn: (a, b) => a + b },
            { op: '-', fn: (a, b) => a - b },
            { op: '*', fn: (a, b) => a * b },
            { op: '/', fn: (a, b) => a / b },
            { op: '<', fn: (a, b) => a < b },
            { op: '>', fn: (a, b) => a > b },
            { op: '<=', fn: (a, b) => a <= b },
            { op: '>=', fn: (a, b) => a >= b },
            { op: '==', fn: (a, b) => a == b },
            { op: ':', fn: (a, b) => {
                if (!Array.isArray(b)) {
                    throw new Error('(:) requires a list as the second argument');
                }
                return [a, ...b];
            }}
        ];

        for (let { op, fn } of binaryOps) {
            const parts = this.splitByOperator(expr, op);
            if (parts.length === 2) {
                const left = this.evaluate(parts[0]);
                const right = this.evaluate(parts[1]);
                return fn(left, right);
            }
        }

        // Function application
        const tokens = this.tokenize(expr);
        if (tokens.length > 1 && tokens[0].type === 'identifier') {
            const funcName = tokens[0].value;
            const args = tokens.slice(1).map(token => {
                if (token.type === 'list') return this.parseList(token.value);
                if (token.type === 'number') return token.value;
                if (token.type === 'paren') {
                    // Check if it's an operator section like (*) or (<10)
                    const fullParen = '(' + token.value + ')';
                    if (/^\(([+\-*\/<>=]+)\s*\d*\)$/.test(fullParen) || /^\(\d+\s*[+\-*\/<>=]+\)$/.test(fullParen)) {
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

            // Check if funcName refers to a variable holding a partial function
            if (this.variables[funcName] instanceof PartialFunction) {
                return this.variables[funcName].apply(args);
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

        throw new Error(`Cannot evaluate expression: ${expr}`);
    }

    // Helper to split expression by operator
    splitByOperator(expr, op) {
        let depth = 0;
        let lastSplit = 0;
        const parts = [];

        for (let i = 0; i < expr.length; i++) {
            if (expr[i] === '(' || expr[i] === '[') depth++;
            if (expr[i] === ')' || expr[i] === ']') depth--;

            if (depth === 0 && expr.substr(i, op.length) === op) {
                parts.push(expr.slice(lastSplit, i).trim());
                lastSplit = i + op.length;
            }
        }

        if (parts.length > 0) {
            parts.push(expr.slice(lastSplit).trim());
        }

        return parts.length > 1 ? parts : [expr];
    }

    // Create operator section function
    createOperatorSection(section) {
        // Match patterns like (*), (+), (<10), (10+), etc.
        const opOnlyMatch = section.match(/^\(([+\-*\/<>=]+)\)$/);
        if (opOnlyMatch) {
            const op = opOnlyMatch[1];
            return this.createOperatorFunction(op);
        }
        
        const leftMatch = section.match(/^\(([+\-*\/<>=]+)\s*(\d+)\)$/);
        if (leftMatch) {
            const [, op, num] = leftMatch;
            return this.createPartialOperatorFunction(op, null, parseFloat(num));
        }
        
        const rightMatch = section.match(/^\((\d+)\s*([+\-*\/<>=]+)\)$/);
        if (rightMatch) {
            const [, num, op] = rightMatch;
            return this.createPartialOperatorFunction(op, parseFloat(num), null);
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
            '<': (a, b) => a < b,
            '>': (a, b) => a > b,
            '<=': (a, b) => a <= b,
            '>=': (a, b) => a >= b,
            '==': (a, b) => a == b,
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
            '<': (a, b) => a < b,
            '>': (a, b) => a > b,
            '<=': (a, b) => a <= b,
            '>=': (a, b) => a >= b,
            '==': (a, b) => a == b
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
        if (value instanceof PartialFunction) {
            return value.toString();
        }
        if (value && value._isOperatorFunction) {
            return value.toString();
        }
        if (Array.isArray(value)) {
            return '[' + value.map(v => this.formatOutput(v)).join(',') + ']';
        }
        if (typeof value === 'string') {
            return '"' + value + '"';
        }
        return String(value);
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
            // Check if it's a function definition (has parameters before =)
            const funcMatch = expr.match(/^(\w+)\s+(.+?)\s*=\s*(.+)$/);
            if (funcMatch) {
                const [, funcName, params, body] = funcMatch;
                
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
            
            // Check if it's a variable assignment (no parameters before =)
            const assignMatch = expr.match(/^(\w+)\s*=\s*(.+)$/);
            if (assignMatch) {
                const [, varName, value] = assignMatch;
                
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
