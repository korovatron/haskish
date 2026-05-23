// Let/Where regression suite for Haskish.
//
// Purpose:
// - Guard against parser/evaluator regressions around let/in, where, guards,
//   recursion, and multiline layout-sensitive forms.
//
// Run:
// - node .\\tests\\let-regression.js
//
// Expected:
// - Exits with code 0 and prints "All ... regression tests passed.".

const fs = require('fs');
const path = require('path');

const interpreterSource = fs.readFileSync(path.join(__dirname, '..', 'haskish.js'), 'utf8');
const HaskishInterpreter = eval(interpreterSource + '; HaskishInterpreter');

function evaluateReplOrThrow(interpreter, input) {
    const result = interpreter.evaluateRepl(input);
    if (!result.success) {
        throw new Error(result.error);
    }
    return result.result;
}

function runRegression() {
    const interpreter = new HaskishInterpreter();

    const cases = [
        {
            name: 'mutual recursion: even 10',
            input: `let
  even n = if n == 0 then True else odd (n-1)
  odd  n = if n == 0 then False else even (n-1)
in even 10`,
            expected: 'True'
        },
        {
            name: 'mutual recursion: odd 7',
            input: `let
  even n = if n == 0 then True else odd (n-1)
  odd  n = if n == 0 then False else even (n-1)
in odd 7`,
            expected: 'True'
        },
        {
            name: 'mutual lambda references',
            input: `let
  f = \\n -> if n == 0 then 1 else g (n-1)
  g = \\n -> if n == 0 then 2 else f (n-1)
in f 5`,
            expected: '2'
        },
        {
            name: 'guarded local function',
            input: `let
  classify x
    | x < 0     = "neg"
    | x == 0    = "zero"
    | otherwise = "pos"
in map classify [-2,-1,0,1,2]`,
            expected: '["neg","neg","zero","pos","pos"]'
        },
        {
            name: 'guarded mutually recursive local functions',
            input: `let
  f x
    | x == 0    = 0
    | otherwise = g (x-1)

  g x
    | x == 0    = 1
    | otherwise = f (x-1)
in f 5`,
            expected: '1'
        },
        {
            name: 'define function with where containing multiline let',
            input: `f x = y
  where
    y = let a = x+1
            b = a*2
        in b*b`,
            expected: 'Defined function: f'
        },
        {
            name: 'call defined function f 5',
            input: 'f 5',
            expected: '144'
        },
        {
            name: 'call defined function f 3',
            input: 'f 3',
            expected: '64'
        },
        {
            name: 'let-local function with where',
            input: `let
  f x = y
    where y = x * 3
in f 10`,
            expected: '30'
        },
        {
            name: 'let-local where plus inner let',
            input: `let
  f x = g x
    where g y = let z = y+1 in z*z
in f 4`,
            expected: '25'
        },
        {
            name: 'deep let chain',
            input: `let a1 = 1 in
let a2 = a1 + 1 in
let a3 = a2 + 1 in
let a4 = a3 + 1 in
let a5 = a4 + 1 in
let a6 = a5 + 1 in
let a7 = a6 + 1 in
let a8 = a7 + 1 in
let a9 = a8 + 1 in
let a10 = a9 + 1 in
a10`,
            expected: '10'
        },
        {
            name: 'nested let chain in lambda',
            input: `(\\x ->
  let a = x+1 in
  let b = a+1 in
  let c = b+1 in
  let d = c+1 in
  let e = d+1 in
  e
) 5`,
            expected: '10'
        },
        {
            name: 'recursive local sum with pattern matching',
            input: `let
  sum []     = 0
  sum (x:xs) = let y = sum xs in x + y
in sum [1,2,3,4,5]`,
            expected: '15'
        }
    ];

    let failed = 0;

    for (const testCase of cases) {
        try {
            const actual = evaluateReplOrThrow(interpreter, testCase.input);
            if (actual !== testCase.expected) {
                failed++;
                console.log(`FAIL ${testCase.name}`);
                console.log(`  expected: ${testCase.expected}`);
                console.log(`  actual:   ${actual}`);
            } else {
                console.log(`PASS ${testCase.name}`);
            }
        } catch (error) {
            failed++;
            console.log(`FAIL ${testCase.name}`);
            console.log(`  error: ${error.message}`);
        }
    }

    if (failed > 0) {
        console.log(`\n${failed} regression test(s) failed.`);
        process.exit(1);
    }

    console.log(`\nAll ${cases.length} let/where regression tests passed.`);
}

runRegression();
