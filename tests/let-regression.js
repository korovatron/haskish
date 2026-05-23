// Let/Where/Case regression suite for Haskish.
//
// Purpose:
// - Guard against parser/evaluator regressions around let/in, case/of, where,
//   guards, recursion, and multiline layout-sensitive forms.
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
        },
        {
            name: 'case/of simple value branches',
            input: 'case 2 of 0 -> 10; 1 -> 11; _ -> 12',
            expected: '12'
        },
        {
            name: 'case/of list patterns',
            input: 'case [9,8,7] of [] -> 0; (x:_) -> x',
            expected: '9'
        },
        {
            name: 'case/of tuple pattern',
            input: 'case (10,20) of (a,b) -> a + b',
            expected: '30'
        },
        {
            name: 'case/of constructor pattern with tuple payload',
            input: `case (Just (1,2)) of
  Just (a,b) -> a + b
  Nothing -> 0`,
            expected: '3'
        },
        {
            name: 'case/of nullary constructor pattern',
            input: `case Nothing of
  Just x -> x
  Nothing -> 0`,
            expected: '0'
        },
        {
            name: 'case/of layout alternatives',
            input: `case [1,2,3] of
  [] -> 0
  (x:_) -> x`,
            expected: '1'
        },
        {
            name: 'case/of inside let body',
            input: `let
  describe n = case n of
    0 -> "zero"
    _ -> "many"
in describe 3`,
            expected: '"many"'
        },
        {
            name: 'case/of guarded alternatives',
            input: `case 4 of
  n | n < 0 -> "neg"
  n | n == 0 -> "zero"
  _ -> "pos"`,
            expected: '"pos"'
        },
        {
            name: 'case/of guard with otherwise',
            input: `case 0 of
  n | n < 0 -> "neg"
  _ | otherwise -> "fallback"`,
            expected: '"fallback"'
        },
        {
            name: 'case/of guard continuation inherits pattern',
            input: `case 5 of
  n | n < 3     -> "small"
    | n < 10    -> "medium"
    | otherwise -> "large"`,
            expected: '"medium"'
        },
        {
            name: 'define guard function using case in guard',
            input: `gCase x
  | case x of 0 -> True; _ -> False = "zero"
  | otherwise = "nonzero"`,
            expected: 'Defined function: gCase'
        },
        {
            name: 'guard function using case in guard: f 0',
            input: 'gCase 0',
            expected: '"zero"'
        },
        {
            name: 'guard function using case in guard: f 5',
            input: 'gCase 5',
            expected: '"nonzero"'
        },
        {
            name: 'define recursive sum2 with multiline case',
            input: `sum2 xs =
  case xs of
    []     -> 0
    (x:xs) -> x + sum2 xs`,
            expected: 'Defined function: sum2'
        },
        {
            name: 'recursive sum2 call',
            input: 'sum2 [1,2,3,4]',
            expected: '10'
        },
        {
            name: 'let mutual recursion with multiline case',
            input: `let
  even n =
    case n of
      0 -> True
      _ -> odd (n-1)

  odd n =
    case n of
      0 -> False
      _ -> even (n-1)
in even 10`,
            expected: 'True'
        },
        {
            name: 'case alternative body with where bindings',
            input: `case 10 of
  n -> result
    where result = n * 2`,
            expected: '20'
        },
        {
            name: 'case/of malformed branch uses equals',
            input: 'case 1 of 1 = 10; _ -> 0',
            expectedError: "Malformed case/of expression: invalid alternative '1 = 10'. Use '->' (not '=') in case branches."
        },
        {
            name: 'constructor equality',
            input: 'Just 5 == Just 5',
            expected: 'True'
        },
        {
            name: 'constructor inequality by payload',
            input: 'Just 5 /= Just 6',
            expected: 'True'
        },
        {
            name: 'constructor inequality by tag',
            input: 'Just 5 /= Nothing',
            expected: 'True'
        },
        {
            name: 'constructor function in higher-order call',
            input: `data Maybe a = Nothing | Just a
map Just [1,2,3]`,
            expected: '[Just 1,Just 2,Just 3]'
        },
        {
            name: 'constructor function as lambda argument',
            input: `data Wrap a = W a
(\\f -> f 99) W`,
            expected: 'W 99'
        },
        {
            name: 'nested constructor pattern match',
            input: `data Maybe a = Nothing | Just a
case Just (Just 5) of
  Just (Just x) -> x
  _             -> 0`,
            expected: '5'
        },
        {
            name: 'nested constructor literal pattern',
            input: `data A = A1 B | A2
data B = B1 A | B2
case A1 (B1 A2) of
  A1 (B1 A2) -> "ok"
  _          -> "nope"`,
            expected: '"ok"'
        },
        {
            name: 'multiline definitions with trailing expression in one input',
            input: `data Tree a = Leaf a | Node (Tree a) (Tree a)
sumTree t =
  case t of
    Leaf x     -> x
    Node l r   -> sumTree l + sumTree r
sumTree (Node (Leaf 1) (Node (Leaf 2) (Leaf 3)))`,
            expected: '6'
        },
        {
            name: 'data declaration then multiline case expression',
            input: `data Maybe a = Nothing | Just a

case Just 10 of
  Nothing -> 0
  Just x  -> x + 1`,
            expected: '11'
        },
        {
            name: 'data declaration only in repl',
            input: 'data Boolish = Yep | Nope',
            expected: 'Registered data declaration: data Boolish = Yep | Nope'
        },
        {
            name: 'multiline data declaration with pipe continuations',
            input: `data Boolish = Yep
  | Nope

case Yep of
  Yep  -> 1
  Nope -> 0`,
            expected: '1'
                },
                {
                        name: 'multiline data declaration with equals continuation',
                        input: `data Expr
    = Lit Int
    | Add Expr Expr
    | Mul Expr Expr
    | Var String
    | Let String Expr Expr

case Var "x" of
    Var _ -> 1
    _ -> 0`,
                        expected: '1'
                },
                {
                        name: 'interpreter-style constructor stress test',
                        input: `data Expr
    = Lit Int
    | Add Expr Expr
    | Mul Expr Expr
    | Var String
    | Let String Expr Expr
data Env = Empty | Bind String Int Env

lookupEnv name env =
    case env of
        Empty -> error "unbound"
        Bind k v rest ->
            if k == name then v else lookupEnv name rest

eval expr env =
    case expr of
        Lit n        -> n
        Add a b      -> eval a env + eval b env
        Mul a b      -> eval a env * eval b env
        Var x        -> lookupEnv x env
        Let x e body ->
            let v = eval e env
            in eval body (Bind x v env)

program =
    Let "x" (Lit 10)
        (Let "y" (Mul (Var "x") (Lit 2))
            (Add (Var "x") (Var "y")))

eval program Empty`,
                        expected: '30'
        }
    ];

    let failed = 0;

    for (const testCase of cases) {
        try {
            const actual = evaluateReplOrThrow(interpreter, testCase.input);
            if (testCase.expectedError) {
                failed++;
                console.log(`FAIL ${testCase.name}`);
                console.log(`  expected error: ${testCase.expectedError}`);
                console.log(`  actual result:  ${actual}`);
                continue;
            }
            if (actual !== testCase.expected) {
                failed++;
                console.log(`FAIL ${testCase.name}`);
                console.log(`  expected: ${testCase.expected}`);
                console.log(`  actual:   ${actual}`);
            } else {
                console.log(`PASS ${testCase.name}`);
            }
        } catch (error) {
            if (testCase.expectedError) {
                if (error.message === testCase.expectedError) {
                    console.log(`PASS ${testCase.name}`);
                } else {
                    failed++;
                    console.log(`FAIL ${testCase.name}`);
                    console.log(`  expected error: ${testCase.expectedError}`);
                    console.log(`  actual error:   ${error.message}`);
                }
                continue;
            }
            failed++;
            console.log(`FAIL ${testCase.name}`);
            console.log(`  error: ${error.message}`);
        }
    }

    if (failed > 0) {
        console.log(`\n${failed} regression test(s) failed.`);
        process.exit(1);
    }

    console.log(`\nAll ${cases.length} let/where/case regression tests passed.`);
}

runRegression();
