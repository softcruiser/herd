import { handleSimpleShallow2Multi3, handleSimpleShallow2Multi2, handleSimpleShallow2Multi, raise, handleSimpleShallow2, assertCall, assert, assertEqual, pureCPS, log, isSquare, texture, intToString, intToFloat, floatToString, floatToInt, pow, round, TAU, PI, sqrt, abs, max, min, floor, ceil, mod, sin, ln, cos, tan, asin, acos, atan, atan2, concat, len, intEq, floatEq, stringEq } from "./prelude.mjs";
import { Handlers } from "./prelude.mjs";

/**
```
type As#As<T#:10000, T#:10001> = {
    as: (T#:10000) ={}> Y#:10001,
}
```
*/
type t_As<T_10000, T_10001> = {
  type: "As";
  hAs_0: (arg_0: T_10000) => T_10001;
};

/**
```
type None#None = {}
```
*/
type t_None = {
  type: "None";
};

/**
```
type Some#Some<T#:10000> = {
    contents: T#:10000,
}
```
*/
type t_Some<T_10000> = {
  type: "Some";
  hSome_0: T_10000;
};

/**
```
type ToStr#b416ead2<T#:0> = {
    str: (T#:0) ={}> string,
}
```
*/
type t_b416ead2<T_0> = {
  type: "b416ead2";
  hb416ead2_0: (arg_0: T_0) => string;
};

/**
```
type ToFloat#c13d2c8a<T#:0> = {
    float: (T#:0) ={}> float,
}
```
*/
type t_c13d2c8a<T_0> = {
  type: "c13d2c8a";
  hc13d2c8a_0: (arg_0: T_0) => number;
};

/**
```
type ToInt#c5d60378<T#:0> = {
    int: (T#:0) ={}> int,
}
```
*/
type t_c5d60378<T_0> = {
  type: "c5d60378";
  hc5d60378_0: (arg_0: T_0) => number;
};

/**
```
type Eq#553b4b8e<T#:0> = {
    "==": (T#:0, T#:0) ={}> bool,
}
```
*/
type t_553b4b8e<T_0> = {
  type: "553b4b8e";
  h553b4b8e_0: (arg_0: T_0, arg_1: T_0) => boolean;
};

/**
```
@ffi type Vec2#43802a16 = {
    x: float,
    y: float,
}
```
*/
type t_43802a16 = {
  type: "Vec2";
  x: number;
  y: number;
};

/**
```
@ffi type Vec3#9f1c0644 = {
    ...Vec2#43802a16,
    z: float,
}
```
*/
type t_9f1c0644 = {
  type: "Vec3";
  z: number;
  x: number;
  y: number;
};

/**
```
@ffi type Vec4#3b941378 = {
    ...Vec3#9f1c0644,
    w: float,
}
```
*/
type t_3b941378 = {
  type: "Vec4";
  w: number;
  z: number;
  x: number;
  y: number;
};

/**
```
@ffi type Mat4#d92781e8 = {
    r1: Vec4#3b941378,
    r2: Vec4#3b941378,
    r3: Vec4#3b941378,
    r4: Vec4#3b941378,
}
```
*/
type t_d92781e8 = {
  type: "Mat4";
  r1: t_3b941378;
  r2: t_3b941378;
  r3: t_3b941378;
  r4: t_3b941378;
};

/**
```
type AddSub#b99b22d8<T#:0, T#:1, T#:2> = {
    "+": (A#:0, B#:1) ={}> C#:2,
    "-": (A#:0, B#:1) ={}> C#:2,
}
```
*/
type t_b99b22d8<T_0, T_1, T_2> = {
  type: "b99b22d8";
  hb99b22d8_0: (arg_0: T_0, arg_1: T_1) => T_2;
  hb99b22d8_1: (arg_0: T_0, arg_1: T_1) => T_2;
};

/**
```
type Mul#1de4e4c0<T#:0, T#:1, T#:2> = {
    "*": (A#:0, B#:1) ={}> C#:2,
}
```
*/
type t_1de4e4c0<T_0, T_1, T_2> = {
  type: "1de4e4c0";
  h1de4e4c0_0: (arg_0: T_0, arg_1: T_1) => T_2;
};

/**
```
type Div#5ac12902<T#:0, T#:1, T#:2> = {
    "/": (A#:0, B#:1) ={}> C#:2,
}
```
*/
type t_5ac12902<T_0, T_1, T_2> = {
  type: "5ac12902";
  h5ac12902_0: (arg_0: T_0, arg_1: T_1) => T_2;
};

/**
```
const z#6b583f49: Array<string> = <string>["hi", "ho"]
```
*/
export const hash_6b583f49: Array<string> = ["hi", "ho"];

/**
```
const b#05ebca85: Array<string> = <string>["Good", ...z#6b583f49, "uhuh"]
```
*/
export const hash_05ebca85: Array<string> = ["Good", ...hash_6b583f49, "uhuh"];

/**
```
const a#707b8ca0: Array<string> = <string>[...z#6b583f49, "Yes"]
```
*/
export const hash_707b8ca0: Array<string> = [...hash_6b583f49, "Yes"];

/*
switch a#707b8ca0 {[] => false, [..._#:0, "Yes"] => true, _#:1 => false}
*/
assert((() => {
  if (hash_707b8ca0.length == 0) {
    return false;
  }

  if (hash_707b8ca0.length >= 1 && hash_707b8ca0[hash_707b8ca0.length - 1] === "Yes") {
    return true;
  }

  return false;
})());

/*
switch <void>[] {[one#:0, ...rest#:1] => false, [] => true}
*/
assert((() => {
  let discriminant$2: Array<void> = [];

  if (discriminant$2.length >= 1) {
    return false;
  }

  if (discriminant$2.length == 0) {
    return true;
  }

  throw "Math failed";
})());

/*
switch a#707b8ca0 {[] => false, [..._#:0, "Yes"] => true, _#:1 => false}
*/
assert((() => {
  if (hash_707b8ca0.length == 0) {
    return false;
  }

  if (hash_707b8ca0.length >= 1 && hash_707b8ca0[hash_707b8ca0.length - 1] === "Yes") {
    return true;
  }

  return false;
})());

/*
switch b#05ebca85 {
    [] => false,
    ["Bad"] => false,
    ["Bad", ..._#:0] => false,
    ["Good", ..._#:1, "Bad"] => false,
    ["Good", ..._#:2, "uhuh"] => true,
    _#:3 => false,
}
*/
assert((() => {
  if (hash_05ebca85.length == 0) {
    return false;
  }

  if (hash_05ebca85.length == 1 && hash_05ebca85[0] === "Bad") {
    return false;
  }

  if (hash_05ebca85.length >= 1 && hash_05ebca85[0] === "Bad") {
    return false;
  }

  if (hash_05ebca85.length >= 2 && hash_05ebca85[0] === "Good" && hash_05ebca85[hash_05ebca85.length - 1] === "Bad") {
    return false;
  }

  if (hash_05ebca85.length >= 2 && hash_05ebca85[0] === "Good" && hash_05ebca85[hash_05ebca85.length - 1] === "uhuh") {
    return true;
  }

  return false;
})());

/*
switch a#707b8ca0 {[one#:0, ...rest#:1] => true, [] => false}
*/
assert((() => {
  if (hash_707b8ca0.length >= 1) {
    return true;
  }

  if (hash_707b8ca0.length == 0) {
    return false;
  }

  throw "Math failed";
})());