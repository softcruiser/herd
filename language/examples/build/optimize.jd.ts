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
const arrayEq#7825e3a8: <T#:0>(Array<T#:0>, Array<T#:0>, Eq#553b4b8e<T#:0>) ={}> bool = <T#:0>(
    one#:0: Array<T#:0>,
    two#:1: Array<T#:0>,
    eq#:2: Eq#553b4b8e<T#:0>,
) ={}> {
    switch (one#:0, two#:1) {
        ([], []) => true,
        ([one#:3, ...rone#:4], [two#:5, ...rtwo#:6]) => if eq#:2."=="#553b4b8e#0(one#:3, two#:5) {
            7825e3a8<T#:0>(rone#:4, rtwo#:6, eq#:2);
        } else {
            false;
        },
        _#:7 => false,
    };
}
```
*/
export const hash_7825e3a8: <T_0>(arg_0: Array<T_0>, arg_1: Array<T_0>, arg_2: t_553b4b8e<T_0>) => boolean = <T_0>(one$0: Array<T_0>, two$1: Array<T_0>, eq$2: t_553b4b8e<T_0>) => {
  let one_i$12: number = 0;
  let two_i$13: number = 0;

  while (true) {
    if (two$1.length - two_i$13 == 0 && one$0.length - one_i$12 == 0) {
      return true;
    }

    if (two$1.length - two_i$13 >= 1 && one$0.length - one_i$12 >= 1) {
      if (eq$2.h553b4b8e_0(one$0[0 + one_i$12], two$1[0 + two_i$13])) {
        one_i$12 = one_i$12 + 1;
        two_i$13 = two_i$13 + 1;
        eq$2 = eq$2;
        continue;
      } else {
        return false;
      }
    }

    return false;
  }
};

/**
```
const IntEq#9275f914: Eq#553b4b8e<int> = Eq#553b4b8e<int>{"=="#553b4b8e#0: intEq}
```
*/
export const hash_9275f914: t_553b4b8e<number> = ({
  type: "553b4b8e",
  h553b4b8e_0: intEq
} as t_553b4b8e<number>);

/**
```
const recurse#3306c09c: (int) ={}> int = (n#:0: int) ={}> {
    if (n#:0 > 5) {
        (3306c09c((n#:0 - 1)) + 1);
    } else {
        3;
    };
}
```
*/
export const hash_3306c09c: (arg_0: number) => number = (n$0: number) => {
  if (n$0 > 5) {
    return hash_3306c09c(n$0 - 1) + 1;
  } else {
    return 3;
  }
};

/**
```
const ArrayEq#bef2134a: <T#:0>(Eq#553b4b8e<T#:0>) ={}> Eq#553b4b8e<Array<T#:0>> = <T#:0>(
    eq#:0: Eq#553b4b8e<T#:0>,
) ={}> Eq#553b4b8e<Array<T#:0>>{
    "=="#553b4b8e#0: (one#:1: Array<T#:0>, two#:2: Array<T#:0>) ={}> (IntEq#9275f914."=="#553b4b8e#0(
        len<T#:0>(one#:1),
        len<T#:0>(two#:2),
    ) && arrayEq#7825e3a8<T#:0>(one#:1, two#:2, eq#:0)),
}
```
*/
export const hash_bef2134a: <T_0>(arg_0: t_553b4b8e<T_0>) => t_553b4b8e<Array<T_0>> = <T_0>(eq$0: t_553b4b8e<T_0>) => ({
  type: "553b4b8e",
  h553b4b8e_0: (one$1: Array<T_0>, two$2: Array<T_0>) => intEq(len(one$1), len(two$2)) && hash_7825e3a8(one$1, two$2, eq$0)
} as t_553b4b8e<Array<T_0>>);

/**
```
const m#b92dd000: int = {
    const x#:1 = recurse#3306c09c(({
        const y#:0 = recurse#3306c09c(4);
        ((y#:0 + 2) + y#:0);
    } + 3));
    ((x#:1 + 3) + x#:1);
}
```
*/
export const hash_b92dd000: number = (() => {
  let lambdaBlockResult$2: number;
  let y$0: number = hash_3306c09c(4);
  lambdaBlockResult$2 = y$0 + 2 + y$0;
  let x$1: number = hash_3306c09c(lambdaBlockResult$2 + 3);
  return x$1 + 3 + x$1;
})();

/**
```
const ArrayIntEq#4419935c: Eq#553b4b8e<Array<int>> = ArrayEq#bef2134a<int>(IntEq#9275f914)
```
*/
export const hash_4419935c: t_553b4b8e<Array<T_0>> = hash_bef2134a(hash_9275f914);

/*
ArrayIntEq#4419935c."=="#553b4b8e#0(<int>[1, 2], <int>[1, 2])
*/
assertCall(hash_4419935c.h553b4b8e_0, [1, 2], [1, 2]);

/*
{
    const a#:0 = <int>[1, 2, 3];
    switch a#:0 {
        [a#:1, ...b#:2] => switch b#:2 {
            [b#:3, ...c#:4] => switch c#:4 {
                [c#:5] => ((IntEq#9275f914."=="#553b4b8e#0(a#:1, 1) && IntEq#9275f914."=="#553b4b8e#0(
                    b#:3,
                    2,
                )) && IntEq#9275f914."=="#553b4b8e#0(c#:5, 3)),
                _#:6 => false,
            },
            _#:7 => false,
        },
        _#:8 => false,
    };
}
*/
assert((() => {
  let a$0: Array<number> = [1, 2, 3];

  if (a$0.length >= 1) {
    let b_i$4: number = 1;

    if (a$0.length - b_i$4 >= 1) {
      let c_i$5: number = 1;

      if (a$0.length - (c_i$5 + b_i$4) == 1) {
        return hash_9275f914.h553b4b8e_0(a$0[0], 1) && hash_9275f914.h553b4b8e_0(a$0[0 + b_i$4], 2) && hash_9275f914.h553b4b8e_0(a$0[0 + (c_i$5 + b_i$4)], 3);
      }

      return false;
    }

    return false;
  }

  return false;
})());

/*
m#b92dd000
*/
hash_b92dd000;