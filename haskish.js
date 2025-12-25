// Haskish Interpreter - A subset of Haskell for A Level Computer Science

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
                return list.map(item => this.applyFunction(fn, [item]));
            },
            'filter': (predicate, list) => {
                if (!Array.isArray(list)) {
                    throw new Error('filter: second argument must be a list');
                }
                return list.filter(item => this.applyFunction(predicate, [item]));
            },
            'fold': (fn, acc, list) => {
                if (!Array.isArray(list)) {
                    throw new Error('fold: third argument must be a list');
                }
                return list.reduce((accumulator, item) => 
                    this.applyFunction(fn, [accumulator, item]), acc);
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
            return this.builtins[funcName](...args);
        }

        // Check user-defined functions
        if (!this.functions[funcName]) {
            throw new Error(`Undefined function: ${funcName}`);
        }

        const cases = this.functions[funcName];
        
        // Try each pattern case
        for (let caseObj of cases) {
            const patterns = this.parsePatterns(caseObj.params);
            
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
            { op: ':', fn: (a, b) => [a, ...(Array.isArray(b) ? b : [b])] }
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
                if (token.type === 'paren') return this.evaluate(token.value);
                if (token.type === 'identifier') {
                    // Evaluate identifier to get its value (could be a variable)
                    return this.evaluate(token.value);
                }
                return token.value;
            });

            return this.applyFunction(funcName, args);
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
        const match = section.match(/^\(([+\-*\/<>=]+)\s*(\d+)?\)$/) || 
                      section.match(/^\((\d+)\s*([+\-*\/<>=]+)\)$/);
        
        if (!match) return section;

        // Return a function name that represents this section
        return section;
    }

    // Format output for display
    formatOutput(value) {
        if (Array.isArray(value)) {
            return '[' + value.map(v => this.formatOutput(v)).join(', ') + ']';
        }
        if (typeof value === 'string') {
            return value;
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
            // Check if it's a variable assignment
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
