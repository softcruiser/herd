import { handleSimpleShallow2Multi3, handleSimpleShallow2Multi2, handleSimpleShallow2Multi, raise, handleSimpleShallow2, assertCall, assert, assertEqual, pureCPS, log, isSquare, texture, intToString, intToFloat, floatToString, floatToInt, pow, round, TAU, PI, sqrt, abs, max, min, floor, ceil, mod, modInt, sin, ln, cos, tan, asin, acos, atan, atan2, concat, len, intEq, floatEq, stringEq, $trace } from "./prelude.mjs";
import { Handlers } from "./prelude.mjs";

/**
```
type Eq#553b4b8e<T#:0> = {
    "==": (T#:0, T#:0) ={}> bool#builtin,
}
```
*/
type t_553b4b8e<T_0> = {
  type: "553b4b8e";
  h553b4b8e_0: (arg_0: T_0, arg_1: T_0) => boolean;
};

/**
```
const IntEq#9275f914 = Eq#553b4b8e<int#builtin>{"=="#553b4b8e#0: intEq#builtin}
```
*/
export const hash_9275f914: t_553b4b8e<number> = ({
  type: "553b4b8e",
  h553b4b8e_0: intEq
} as t_553b4b8e<number>);

/**
```
const rec fib#ad971daa = (prev#:0: int#builtin, cur#:1: int#builtin, n#:2: int#builtin): int#builtin ={}> if n#:2 
    ==#9275f914#553b4b8e#0 0 {
    prev#:0;
} else {
    ad971daa#self(cur#:1, prev#:0 +#builtin cur#:1, n#:2 -#builtin 1);
}
```
*/
export const hash_ad971daa: (arg_0: number, arg_1: number, arg_2: number) => number = (prev: number, cur: number, n: number) => {
  while (true) {
    if (hash_9275f914.h553b4b8e_0(n, 0)) {
      return prev;
    } else {
      let recur: number = prev + cur;
      prev = cur;
      cur = recur;
      n = n - 1;
      continue;
    }
  }
};

/**
```
const z#ce5d9b4c = (n#:0: int#builtin): int#builtin ={}> {
    const m#:1 = n#:0 +#builtin 2;
    m#:1 -#builtin 1;
}
```
*/
export const hash_ce5d9b4c: (arg_0: number) => number = (n$0: number) => n$0 + 2 - 1;

/**
```
const x#0c634e04 = {
    const y#:0 = 10;
    y#:0;
}
```
*/
export const hash_0c634e04: number = 10;

/*
x#0c634e04 ==#9275f914#553b4b8e#0 10
*/
assertCall(hash_9275f914.h553b4b8e_0, hash_0c634e04, 10);

/*
z#ce5d9b4c(n: 10) ==#9275f914#553b4b8e#0 11
*/
assertCall(hash_9275f914.h553b4b8e_0, hash_ce5d9b4c(10), 11);

/*
fib#ad971daa(prev: 0, cur: 1, n: 10) ==#9275f914#553b4b8e#0 55
*/
assertCall(hash_9275f914.h553b4b8e_0, hash_ad971daa(0, 1, 10), 55);