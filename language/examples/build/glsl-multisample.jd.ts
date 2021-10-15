import { handleSimpleShallow2Multi3, handleSimpleShallow2Multi2, handleSimpleShallow2Multi, raise, handleSimpleShallow2, assertCall, assert, assertEqual, pureCPS, log, isSquare, texture, intToString, intToFloat, floatToString, floatToInt, pow, round, TAU, PI, sqrt, abs, max, min, floor, ceil, mod, modInt, sin, ln, cos, tan, asin, acos, atan, atan2, concat, len, intEq, floatEq, stringEq, $trace } from "./prelude.mjs";
import { Handlers } from "./prelude.mjs";

/**
```
@ffi("Vec2") type Vec2#08f7c2ac = {
    x: float#builtin,
    y: float#builtin,
}
```
*/
type t_08f7c2ac = {
  type: "Vec2";
  x: number;
  y: number;
};

/**
```
@ffi("Vec3") type Vec3#b79db448 = {
    ...Vec2#08f7c2ac,
    z: float#builtin,
}
```
*/
type t_b79db448 = {
  type: "Vec3";
  z: number;
  x: number;
  y: number;
};

/**
```
@ffi("Vec4") type Vec4#b1f05ae8 = {
    ...Vec3#b79db448,
    w: float#builtin,
}
```
*/
type t_b1f05ae8 = {
  type: "Vec4";
  w: number;
  z: number;
  x: number;
  y: number;
};

/**
```
@ffi("GLSLEnv") type GLSLEnv#a25a17de = {
    time: float#builtin,
    resolution: Vec2#08f7c2ac,
    camera: Vec3#b79db448,
    mouse: Vec2#08f7c2ac,
}
```
*/
type t_a25a17de = {
  type: "GLSLEnv";
  time: number;
  resolution: t_08f7c2ac;
  camera: t_b79db448;
  mouse: t_08f7c2ac;
};

/**
```
@ffi("Mat4") type Mat4#0d95d60e = {
    r1: Vec4#b1f05ae8,
    r2: Vec4#b1f05ae8,
    r3: Vec4#b1f05ae8,
    r4: Vec4#b1f05ae8,
}
```
*/
type t_0d95d60e = {
  type: "Mat4";
  r1: t_b1f05ae8;
  r2: t_b1f05ae8;
  r3: t_b1f05ae8;
  r4: t_b1f05ae8;
};

/**
```
@unique(1) type Mul#02cc25c4<A#:0, B#:1, C#:2> = {
    "*": (A#:0, B#:1) ={}> C#:2,
}
```
*/
type t_02cc25c4<T_0, T_1, T_2> = {
  type: "02cc25c4";
  h02cc25c4_0: (arg_0: T_0, arg_1: T_1) => T_2;
};

/**
```
@unique(0) type AddSub#3d436b7e<A#:0, B#:1, C#:2> = {
    "+": (A#:0, B#:1) ={}> C#:2,
    "-": (A#:0, B#:1) ={}> C#:2,
}
```
*/
type t_3d436b7e<T_0, T_1, T_2> = {
  type: "3d436b7e";
  h3d436b7e_0: (arg_0: T_0, arg_1: T_1) => T_2;
  h3d436b7e_1: (arg_0: T_0, arg_1: T_1) => T_2;
};

/**
```
@unique(3) type Neg#616f559e<A#:0, B#:1> = {
    "-": (A#:0) ={}> B#:1,
}
```
*/
type t_616f559e<T_0, T_1> = {
  type: "616f559e";
  h616f559e_0: (arg_0: T_0) => T_1;
};

/**
```
@unique(2) type Div#3b763160<A#:0, B#:1, C#:2> = {
    "/": (A#:0, B#:1) ={}> C#:2,
}
```
*/
type t_3b763160<T_0, T_1, T_2> = {
  type: "3b763160";
  h3b763160_0: (arg_0: T_0, arg_1: T_1) => T_2;
};

/**
```
const length#57739f70 = (v#:0: Vec3#b79db448): float#builtin ={}> sqrt#builtin(
    v#:0.x#08f7c2ac#0 *#builtin v#:0.x#08f7c2ac#0 
            +#builtin v#:0.y#08f7c2ac#1 *#builtin v#:0.y#08f7c2ac#1 
        +#builtin v#:0.z#b79db448#0 *#builtin v#:0.z#b79db448#0,
)
(v#:0: Vec3#😦): float => sqrt(
    v#:0.#Vec2#🍱🐶💣#0 * v#:0.#Vec2#🍱🐶💣#0 + v#:0.#Vec2#🍱🐶💣#1 * v#:0.#Vec2#🍱🐶💣#1 + v#:0.#Vec3#😦#0 * v#:0.#Vec3#😦#0,
)
```
*/
export const hash_57739f70: (arg_0: t_b79db448) => number = (v: t_b79db448) => sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

/**
```
const ScaleVec3Rev#f86c15e0 = Div#3b763160<Vec3#b79db448, float#builtin, Vec3#b79db448>{
    "/"#3b763160#0: (v#:0: Vec3#b79db448, scale#:1: float#builtin): Vec3#b79db448 ={}> Vec3#b79db448{
        x#08f7c2ac#0: v#:0.x#08f7c2ac#0 /#builtin scale#:1,
        y#08f7c2ac#1: v#:0.y#08f7c2ac#1 /#builtin scale#:1,
        z#b79db448#0: v#:0.z#b79db448#0 /#builtin scale#:1,
    },
}
Div#🧜‍♂️🧖💧{TODO SPREADs}{
    h3b763160_0: (v#:0: Vec3#😦, scale#:1: float): Vec3#😦 => Vec3#😦{TODO SPREADs}{
        z: v#:0.#Vec3#😦#0 / scale#:1,
        x: v#:0.#Vec2#🍱🐶💣#0 / scale#:1,
        y: v#:0.#Vec2#🍱🐶💣#1 / scale#:1,
    },
}
```
*/
export const hash_f86c15e0: t_3b763160<t_b79db448, number, t_b79db448> = ({
  type: "3b763160",
  h3b763160_0: (v: t_b79db448, scale: number) => ({
    type: "Vec3",
    x: v.x / scale,
    y: v.y / scale,
    z: v.z / scale
  } as t_b79db448)
} as t_3b763160<t_b79db448, number, t_b79db448>);

/**
```
const dot#f22a3fca = (a#:0: Vec4#b1f05ae8, b#:1: Vec4#b1f05ae8): float#builtin ={}> {
    a#:0.x#08f7c2ac#0 *#builtin b#:1.x#08f7c2ac#0 
                +#builtin a#:0.y#08f7c2ac#1 *#builtin b#:1.y#08f7c2ac#1 
            +#builtin a#:0.z#b79db448#0 *#builtin b#:1.z#b79db448#0 
        +#builtin a#:0.w#b1f05ae8#0 *#builtin b#:1.w#b1f05ae8#0;
}
(a#:0: Vec4#🌎, b#:1: Vec4#🌎): float => a#:0.#Vec2#🍱🐶💣#0 * b#:1.#Vec2#🍱🐶💣#0 + a#:0.#Vec2#🍱🐶💣#1 * b#:1.#Vec2#🍱🐶💣#1 + a#:0.#Vec3#😦#0 * b#:1.#Vec3#😦#0 + a#:0.#Vec4#🌎#0 * b#:1.#Vec4#🌎#0
```
*/
export const hash_f22a3fca: (arg_0: t_b1f05ae8, arg_1: t_b1f05ae8) => number = (a: t_b1f05ae8, b: t_b1f05ae8) => a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;

/**
```
const vec4#67fdfe9c = (
    x#:0: float#builtin,
    y#:1: float#builtin,
    z#:2: float#builtin,
    w#:3: float#builtin,
): Vec4#b1f05ae8 ={}> Vec4#b1f05ae8{
    z#b79db448#0: z#:2,
    x#08f7c2ac#0: x#:0,
    y#08f7c2ac#1: y#:1,
    w#b1f05ae8#0: w#:3,
}
(x#:0: float, y#:1: float, z#:2: float, w#:3: float): Vec4#🌎 => Vec4#🌎{TODO SPREADs}{
    w: w#:3,
    z: z#:2,
}
```
*/
export const hash_67fdfe9c: (arg_0: number, arg_1: number, arg_2: number, arg_3: number) => t_b1f05ae8 = (x: number, y: number, z: number, w: number) => ({
  type: "Vec4",
  z: z,
  x: x,
  y: y,
  w: w
} as t_b1f05ae8);

/**
```
const NegVec3#4d12c551 = Neg#616f559e<Vec3#b79db448, Vec3#b79db448>{
    "-"#616f559e#0: (v#:0: Vec3#b79db448): Vec3#b79db448 ={}> Vec3#b79db448{
        x#08f7c2ac#0: -v#:0.x#08f7c2ac#0,
        y#08f7c2ac#1: -v#:0.y#08f7c2ac#1,
        z#b79db448#0: -v#:0.z#b79db448#0,
    },
}
Neg#🚣‍♀️⚾🐭😃{TODO SPREADs}{
    h616f559e_0: (v#:0: Vec3#😦): Vec3#😦 => Vec3#😦{TODO SPREADs}{
        z: -v#:0.#Vec3#😦#0,
        x: -v#:0.#Vec2#🍱🐶💣#0,
        y: -v#:0.#Vec2#🍱🐶💣#1,
    },
}
```
*/
export const hash_4d12c551: t_616f559e<t_b79db448, t_b79db448> = ({
  type: "616f559e",
  h616f559e_0: (v: t_b79db448) => ({
    type: "Vec3",
    x: -v.x,
    y: -v.y,
    z: -v.z
  } as t_b79db448)
} as t_616f559e<t_b79db448, t_b79db448>);

/**
```
const cross#3748673e = (one#:0: Vec3#b79db448, two#:1: Vec3#b79db448): Vec3#b79db448 ={}> Vec3#b79db448{
    x#08f7c2ac#0: one#:0.y#08f7c2ac#1 *#builtin two#:1.z#b79db448#0 
        -#builtin two#:1.y#08f7c2ac#1 *#builtin one#:0.z#b79db448#0,
    y#08f7c2ac#1: one#:0.z#b79db448#0 *#builtin two#:1.x#08f7c2ac#0 
        -#builtin two#:1.z#b79db448#0 *#builtin one#:0.x#08f7c2ac#0,
    z#b79db448#0: one#:0.x#08f7c2ac#0 *#builtin two#:1.y#08f7c2ac#1 
        -#builtin two#:1.x#08f7c2ac#0 *#builtin one#:0.y#08f7c2ac#1,
}
(one#:0: Vec3#😦, two#:1: Vec3#😦): Vec3#😦 => Vec3#😦{TODO SPREADs}{
    z: one#:0.#Vec2#🍱🐶💣#0 * two#:1.#Vec2#🍱🐶💣#1 - two#:1.#Vec2#🍱🐶💣#0 * one#:0.#Vec2#🍱🐶💣#1,
    x: one#:0.#Vec2#🍱🐶💣#1 * two#:1.#Vec3#😦#0 - two#:1.#Vec2#🍱🐶💣#1 * one#:0.#Vec3#😦#0,
    y: one#:0.#Vec3#😦#0 * two#:1.#Vec2#🍱🐶💣#0 - two#:1.#Vec3#😦#0 * one#:0.#Vec2#🍱🐶💣#0,
}
```
*/
export const hash_3748673e: (arg_0: t_b79db448, arg_1: t_b79db448) => t_b79db448 = (one: t_b79db448, two: t_b79db448) => ({
  type: "Vec3",
  x: one.y * two.z - two.y * one.z,
  y: one.z * two.x - two.z * one.x,
  z: one.x * two.y - two.x * one.y
} as t_b79db448);

/**
```
const AddSubVec3#dff30886 = AddSub#3d436b7e<Vec3#b79db448, Vec3#b79db448, Vec3#b79db448>{
    "+"#3d436b7e#0: (one#:0: Vec3#b79db448, two#:1: Vec3#b79db448): Vec3#b79db448 ={}> Vec3#b79db448{
        x#08f7c2ac#0: one#:0.x#08f7c2ac#0 +#builtin two#:1.x#08f7c2ac#0,
        y#08f7c2ac#1: one#:0.y#08f7c2ac#1 +#builtin two#:1.y#08f7c2ac#1,
        z#b79db448#0: one#:0.z#b79db448#0 +#builtin two#:1.z#b79db448#0,
    },
    "-"#3d436b7e#1: (one#:2: Vec3#b79db448, two#:3: Vec3#b79db448): Vec3#b79db448 ={}> Vec3#b79db448{
        x#08f7c2ac#0: one#:2.x#08f7c2ac#0 -#builtin two#:3.x#08f7c2ac#0,
        y#08f7c2ac#1: one#:2.y#08f7c2ac#1 -#builtin two#:3.y#08f7c2ac#1,
        z#b79db448#0: one#:2.z#b79db448#0 -#builtin two#:3.z#b79db448#0,
    },
}
AddSub#🕕🧑‍🦲⚽{TODO SPREADs}{
    h3d436b7e_0: (one#:0: Vec3#😦, two#:1: Vec3#😦): Vec3#😦 => Vec3#😦{TODO SPREADs}{
        z: one#:0.#Vec3#😦#0 + two#:1.#Vec3#😦#0,
        x: one#:0.#Vec2#🍱🐶💣#0 + two#:1.#Vec2#🍱🐶💣#0,
        y: one#:0.#Vec2#🍱🐶💣#1 + two#:1.#Vec2#🍱🐶💣#1,
    },
    h3d436b7e_1: (one#:2: Vec3#😦, two#:3: Vec3#😦): Vec3#😦 => Vec3#😦{TODO SPREADs}{
        z: one#:2.#Vec3#😦#0 - two#:3.#Vec3#😦#0,
        x: one#:2.#Vec2#🍱🐶💣#0 - two#:3.#Vec2#🍱🐶💣#0,
        y: one#:2.#Vec2#🍱🐶💣#1 - two#:3.#Vec2#🍱🐶💣#1,
    },
}
```
*/
export const hash_dff30886: t_3d436b7e<t_b79db448, t_b79db448, t_b79db448> = ({
  type: "3d436b7e",
  h3d436b7e_0: (one: t_b79db448, two: t_b79db448) => ({
    type: "Vec3",
    x: one.x + two.x,
    y: one.y + two.y,
    z: one.z + two.z
  } as t_b79db448),
  h3d436b7e_1: (one$2: t_b79db448, two$3: t_b79db448) => ({
    type: "Vec3",
    x: one$2.x - two$3.x,
    y: one$2.y - two$3.y,
    z: one$2.z - two$3.z
  } as t_b79db448)
} as t_3d436b7e<t_b79db448, t_b79db448, t_b79db448>);

/**
```
const normalize#2dc09b90 = (v#:0: Vec3#b79db448): Vec3#b79db448 ={}> v#:0 
    /#f86c15e0#3b763160#0 length#57739f70(v#:0)
(v#:0: Vec3#😦): Vec3#😦 => ScaleVec3Rev#👨‍👧.#Div#🧜‍♂️🧖💧#0(v#:0, length#⏲️🙅‍♂️🧎😃(v#:0))
```
*/
export const hash_2dc09b90: (arg_0: t_b79db448) => t_b79db448 = (v: t_b79db448) => hash_f86c15e0.h3b763160_0(v, hash_57739f70(v));

/**
```
const vec3#30188c24 = (v#:0: Vec2#08f7c2ac, z#:1: float#builtin): Vec3#b79db448 ={}> Vec3#b79db448{
    ...v#:0,
    z#b79db448#0: z#:1,
}
(v#:0: Vec2#🍱🐶💣, z#:1: float): Vec3#😦 => Vec3#😦{TODO SPREADs}{z: z#:1, x: _#:0, y: _#:0}
```
*/
export const hash_30188c24: (arg_0: t_08f7c2ac, arg_1: number) => t_b79db448 = (v: t_08f7c2ac, z$1: number) => ({ ...v,
  type: "Vec3",
  z: z$1
} as t_b79db448);

/**
```
const radians#dabe7f9c = (degrees#:0: float#builtin): float#builtin ={}> degrees#:0 /#builtin 180.0 
    *#builtin PI#builtin
(degrees#:0: float): float => degrees#:0 / 180 * PI
```
*/
export const hash_dabe7f9c: (arg_0: number) => number = (degrees: number) => degrees / 180 * PI;

/**
```
const ScaleVec2Rev#02622a76 = Div#3b763160<Vec2#08f7c2ac, float#builtin, Vec2#08f7c2ac>{
    "/"#3b763160#0: (v#:0: Vec2#08f7c2ac, scale#:1: float#builtin): Vec2#08f7c2ac ={}> Vec2#08f7c2ac{
        x#08f7c2ac#0: v#:0.x#08f7c2ac#0 /#builtin scale#:1,
        y#08f7c2ac#1: v#:0.y#08f7c2ac#1 /#builtin scale#:1,
    },
}
Div#🧜‍♂️🧖💧{TODO SPREADs}{
    h3b763160_0: (v#:0: Vec2#🍱🐶💣, scale#:1: float): Vec2#🍱🐶💣 => Vec2#🍱🐶💣{TODO SPREADs}{
        x: v#:0.#Vec2#🍱🐶💣#0 / scale#:1,
        y: v#:0.#Vec2#🍱🐶💣#1 / scale#:1,
    },
}
```
*/
export const hash_02622a76: t_3b763160<t_08f7c2ac, number, t_08f7c2ac> = ({
  type: "3b763160",
  h3b763160_0: (v: t_08f7c2ac, scale: number) => ({
    type: "Vec2",
    x: v.x / scale,
    y: v.y / scale
  } as t_08f7c2ac)
} as t_3b763160<t_08f7c2ac, number, t_08f7c2ac>);

/**
```
const AddSubVec2#04f14e9c = AddSub#3d436b7e<Vec2#08f7c2ac, Vec2#08f7c2ac, Vec2#08f7c2ac>{
    "+"#3d436b7e#0: (one#:0: Vec2#08f7c2ac, two#:1: Vec2#08f7c2ac): Vec2#08f7c2ac ={}> Vec2#08f7c2ac{
        x#08f7c2ac#0: one#:0.x#08f7c2ac#0 +#builtin two#:1.x#08f7c2ac#0,
        y#08f7c2ac#1: one#:0.y#08f7c2ac#1 +#builtin two#:1.y#08f7c2ac#1,
    },
    "-"#3d436b7e#1: (one#:2: Vec2#08f7c2ac, two#:3: Vec2#08f7c2ac): Vec2#08f7c2ac ={}> Vec2#08f7c2ac{
        x#08f7c2ac#0: one#:2.x#08f7c2ac#0 -#builtin two#:3.x#08f7c2ac#0,
        y#08f7c2ac#1: one#:2.y#08f7c2ac#1 -#builtin two#:3.y#08f7c2ac#1,
    },
}
AddSub#🕕🧑‍🦲⚽{TODO SPREADs}{
    h3d436b7e_0: (one#:0: Vec2#🍱🐶💣, two#:1: Vec2#🍱🐶💣): Vec2#🍱🐶💣 => Vec2#🍱🐶💣{TODO SPREADs}{
        x: one#:0.#Vec2#🍱🐶💣#0 + two#:1.#Vec2#🍱🐶💣#0,
        y: one#:0.#Vec2#🍱🐶💣#1 + two#:1.#Vec2#🍱🐶💣#1,
    },
    h3d436b7e_1: (one#:2: Vec2#🍱🐶💣, two#:3: Vec2#🍱🐶💣): Vec2#🍱🐶💣 => Vec2#🍱🐶💣{TODO SPREADs}{
        x: one#:2.#Vec2#🍱🐶💣#0 - two#:3.#Vec2#🍱🐶💣#0,
        y: one#:2.#Vec2#🍱🐶💣#1 - two#:3.#Vec2#🍱🐶💣#1,
    },
}
```
*/
export const hash_04f14e9c: t_3d436b7e<t_08f7c2ac, t_08f7c2ac, t_08f7c2ac> = ({
  type: "3d436b7e",
  h3d436b7e_0: (one: t_08f7c2ac, two: t_08f7c2ac) => ({
    type: "Vec2",
    x: one.x + two.x,
    y: one.y + two.y
  } as t_08f7c2ac),
  h3d436b7e_1: (one$2: t_08f7c2ac, two$3: t_08f7c2ac) => ({
    type: "Vec2",
    x: one$2.x - two$3.x,
    y: one$2.y - two$3.y
  } as t_08f7c2ac)
} as t_3d436b7e<t_08f7c2ac, t_08f7c2ac, t_08f7c2ac>);

/**
```
const EPSILON#17261aaa = 0.0001
0.0001
```
*/
export const hash_17261aaa: number = 0.0001;

/**
```
const vec3#2441942c = (x#:0: float#builtin, y#:1: float#builtin, z#:2: float#builtin): Vec3#b79db448 ={}> Vec3#b79db448{
    x#08f7c2ac#0: x#:0,
    y#08f7c2ac#1: y#:1,
    z#b79db448#0: z#:2,
}
(x#:0: float, y#:1: float, z#:2: float): Vec3#😦 => Vec3#😦{TODO SPREADs}{z: z#:2, x: x#:0, y: y#:1}
```
*/
export const hash_2441942c: (arg_0: number, arg_1: number, arg_2: number) => t_b79db448 = (x: number, y: number, z: number) => ({
  type: "Vec3",
  x: x,
  y: y,
  z: z
} as t_b79db448);

/**
```
const ScaleVec3#6bec1050 = Mul#02cc25c4<float#builtin, Vec3#b79db448, Vec3#b79db448>{
    "*"#02cc25c4#0: (scale#:0: float#builtin, v#:1: Vec3#b79db448): Vec3#b79db448 ={}> Vec3#b79db448{
        x#08f7c2ac#0: v#:1.x#08f7c2ac#0 *#builtin scale#:0,
        y#08f7c2ac#1: v#:1.y#08f7c2ac#1 *#builtin scale#:0,
        z#b79db448#0: v#:1.z#b79db448#0 *#builtin scale#:0,
    },
}
Mul#👫🏭😪{TODO SPREADs}{
    h02cc25c4_0: (scale#:0: float, v#:1: Vec3#😦): Vec3#😦 => Vec3#😦{TODO SPREADs}{
        z: v#:1.#Vec3#😦#0 * scale#:0,
        x: v#:1.#Vec2#🍱🐶💣#0 * scale#:0,
        y: v#:1.#Vec2#🍱🐶💣#1 * scale#:0,
    },
}
```
*/
export const hash_6bec1050: t_02cc25c4<number, t_b79db448, t_b79db448> = ({
  type: "02cc25c4",
  h02cc25c4_0: (scale$0: number, v$1: t_b79db448) => ({
    type: "Vec3",
    x: v$1.x * scale$0,
    y: v$1.y * scale$0,
    z: v$1.z * scale$0
  } as t_b79db448)
} as t_02cc25c4<number, t_b79db448, t_b79db448>);

/**
```
const MatByVector#c7283624 = Mul#02cc25c4<Mat4#0d95d60e, Vec4#b1f05ae8, Vec4#b1f05ae8>{
    "*"#02cc25c4#0: (mat#:0: Mat4#0d95d60e, vec#:1: Vec4#b1f05ae8): Vec4#b1f05ae8 ={}> Vec4#b1f05ae8{
        z#b79db448#0: dot#f22a3fca(a: mat#:0.r3#0d95d60e#2, b: vec#:1),
        x#08f7c2ac#0: dot#f22a3fca(a: mat#:0.r1#0d95d60e#0, b: vec#:1),
        y#08f7c2ac#1: dot#f22a3fca(a: mat#:0.r2#0d95d60e#1, b: vec#:1),
        w#b1f05ae8#0: dot#f22a3fca(a: mat#:0.r4#0d95d60e#3, b: vec#:1),
    },
}
Mul#👫🏭😪{TODO SPREADs}{
    h02cc25c4_0: (mat#:0: Mat4#🐐🧍‍♂️👩‍🦲, vec#:1: Vec4#🌎): Vec4#🌎 => Vec4#🌎{TODO SPREADs}{
        w: dot#🎁(mat#:0.#Mat4#🐐🧍‍♂️👩‍🦲#3, vec#:1),
        z: dot#🎁(mat#:0.#Mat4#🐐🧍‍♂️👩‍🦲#2, vec#:1),
    },
}
```
*/
export const hash_c7283624: t_02cc25c4<t_0d95d60e, t_b1f05ae8, t_b1f05ae8> = ({
  type: "02cc25c4",
  h02cc25c4_0: (mat: t_0d95d60e, vec: t_b1f05ae8) => ({
    type: "Vec4",
    z: hash_f22a3fca(mat.r3, vec),
    x: hash_f22a3fca(mat.r1, vec),
    y: hash_f22a3fca(mat.r2, vec),
    w: hash_f22a3fca(mat.r4, vec)
  } as t_b1f05ae8)
} as t_02cc25c4<t_0d95d60e, t_b1f05ae8, t_b1f05ae8>);

/**
```
const xyz#4e75153a = (v#:0: Vec4#b1f05ae8): Vec3#b79db448 ={}> Vec3#b79db448{
    x#08f7c2ac#0: v#:0.x#08f7c2ac#0,
    y#08f7c2ac#1: v#:0.y#08f7c2ac#1,
    z#b79db448#0: v#:0.z#b79db448#0,
}
(v#:0: Vec4#🌎): Vec3#😦 => Vec3#😦{TODO SPREADs}{
    z: v#:0.#Vec3#😦#0,
    x: v#:0.#Vec2#🍱🐶💣#0,
    y: v#:0.#Vec2#🍱🐶💣#1,
}
```
*/
export const hash_4e75153a: (arg_0: t_b1f05ae8) => t_b79db448 = (v: t_b1f05ae8) => ({
  type: "Vec3",
  x: v.x,
  y: v.y,
  z: v.z
} as t_b79db448);

/**
```
const viewMatrix#75e3ca34 = (eye#:0: Vec3#b79db448, center#:1: Vec3#b79db448, up#:2: Vec3#b79db448): Mat4#0d95d60e ={}> {
    const f#:3 = normalize#2dc09b90(v: center#:1 -#dff30886#3d436b7e#1 eye#:0);
    const s#:4 = normalize#2dc09b90(v: cross#3748673e(one: f#:3, two: up#:2));
    const u#:5 = cross#3748673e(one: s#:4, two: f#:3);
    Mat4#0d95d60e{
        r1#0d95d60e#0: Vec4#b1f05ae8{...s#:4, w#b1f05ae8#0: 0.0},
        r2#0d95d60e#1: Vec4#b1f05ae8{...u#:5, w#b1f05ae8#0: 0.0},
        r3#0d95d60e#2: Vec4#b1f05ae8{...NegVec3#4d12c551."-"#616f559e#0(f#:3), w#b1f05ae8#0: 0.0},
        r4#0d95d60e#3: vec4#67fdfe9c(x: 0.0, y: 0.0, z: 0.0, w: 1.0),
    };
}
(eye#:0: Vec3#😦, center#:1: Vec3#😦, up#:2: Vec3#😦): Mat4#🐐🧍‍♂️👩‍🦲 => {
    const f#:3: Vec3#😦 = normalize#🌗😒🥃(AddSubVec3#🖤.#AddSub#🕕🧑‍🦲⚽#1(center#:1, eye#:0));
    const s#:4: Vec3#😦 = normalize#🌗😒🥃(cross#🚚🐹🕐(f#:3, up#:2));
    return Mat4#🐐🧍‍♂️👩‍🦲{TODO SPREADs}{
        r1: Vec4#🌎{TODO SPREADs}{w: 0, z: _#:0},
        r2: Vec4#🌎{TODO SPREADs}{w: 0, z: _#:0},
        r3: Vec4#🌎{TODO SPREADs}{w: 0, z: _#:0},
        r4: vec4#🥪🕡🍆😃(0, 0, 0, 1),
    };
}
```
*/
export const hash_75e3ca34: (arg_0: t_b79db448, arg_1: t_b79db448, arg_2: t_b79db448) => t_0d95d60e = (eye: t_b79db448, center: t_b79db448, up: t_b79db448) => {
  let f: t_b79db448 = hash_2dc09b90(hash_dff30886.h3d436b7e_1(center, eye));
  let s: t_b79db448 = hash_2dc09b90(hash_3748673e(f, up));
  return ({
    type: "Mat4",
    r1: ({ ...s,
      type: "Vec4",
      w: 0
    } as t_b1f05ae8),
    r2: ({ ...hash_3748673e(s, f),
      type: "Vec4",
      w: 0
    } as t_b1f05ae8),
    r3: ({ ...hash_4d12c551.h616f559e_0(f),
      type: "Vec4",
      w: 0
    } as t_b1f05ae8),
    r4: hash_67fdfe9c(0, 0, 0, 1)
  } as t_0d95d60e);
};

/**
```
const rayDirection#08d4f757 = (
    fieldOfView#:0: float#builtin,
    size#:1: Vec2#08f7c2ac,
    fragCoord#:2: Vec2#08f7c2ac,
): Vec3#b79db448 ={}> {
    const xy#:3 = fragCoord#:2 -#04f14e9c#3d436b7e#1 size#:1 /#02622a76#3b763160#0 2.0;
    const z#:4 = size#:1.y#08f7c2ac#1 
        /#builtin tan#builtin(radians#dabe7f9c(degrees: fieldOfView#:0) /#builtin 2.0);
    normalize#2dc09b90(v: vec3#30188c24(v: xy#:3, z: -z#:4));
}
(fieldOfView#:0: float, size#:1: Vec2#🍱🐶💣, fragCoord#:2: Vec2#🍱🐶💣): Vec3#😦 => normalize#🌗😒🥃(
    vec3#😶🦥🏤(
        AddSubVec2#🥪😓😱.#AddSub#🕕🧑‍🦲⚽#1(
            fragCoord#:2,
            ScaleVec2Rev#🍏💥😒.#Div#🧜‍♂️🧖💧#0(size#:1, 2),
        ),
        -size#:1.#Vec2#🍱🐶💣#1 / tan(radians#🌟(fieldOfView#:0) / 2),
    ),
)
```
*/
export const hash_08d4f757: (arg_0: number, arg_1: t_08f7c2ac, arg_2: t_08f7c2ac) => t_b79db448 = (fieldOfView: number, size: t_08f7c2ac, fragCoord: t_08f7c2ac) => hash_2dc09b90(hash_30188c24(hash_04f14e9c.h3d436b7e_1(fragCoord, hash_02622a76.h3b763160_0(size, 2)), -(size.y / tan(hash_dabe7f9c(fieldOfView) / 2))));

/**
```
const vec4#0a02c024 = (v#:0: Vec3#b79db448, w#:1: float#builtin): Vec4#b1f05ae8 ={}> Vec4#b1f05ae8{
    ...v#:0,
    w#b1f05ae8#0: w#:1,
}
(v#:0: Vec3#😦, w#:1: float): Vec4#🌎 => Vec4#🌎{TODO SPREADs}{w: w#:1, z: _#:0}
```
*/
export const hash_0a02c024: (arg_0: t_b79db448, arg_1: number) => t_b1f05ae8 = (v: t_b79db448, w$1: number) => ({ ...v,
  type: "Vec4",
  w: w$1
} as t_b1f05ae8);

/**
```
const rotate#348c3554 = (tx#:0: float#builtin, ty#:1: float#builtin, tz#:2: float#builtin): Mat4#0d95d60e ={}> {
    const cg#:3 = cos#builtin(tx#:0);
    const sg#:4 = sin#builtin(tx#:0);
    const cb#:5 = cos#builtin(ty#:1);
    const sb#:6 = sin#builtin(ty#:1);
    const ca#:7 = cos#builtin(tz#:2);
    const sa#:8 = sin#builtin(tz#:2);
    Mat4#0d95d60e{
        r1#0d95d60e#0: vec4#67fdfe9c(
            x: ca#:7 *#builtin cb#:5,
            y: ca#:7 *#builtin sb#:6 *#builtin sg#:4 -#builtin sa#:8 *#builtin cg#:3,
            z: ca#:7 *#builtin sb#:6 *#builtin cg#:3 +#builtin sa#:8 *#builtin sg#:4,
            w: 0.0,
        ),
        r2#0d95d60e#1: vec4#67fdfe9c(
            x: sa#:8 *#builtin cb#:5,
            y: sa#:8 *#builtin sb#:6 *#builtin sg#:4 +#builtin ca#:7 *#builtin cg#:3,
            z: sa#:8 *#builtin sb#:6 *#builtin cg#:3 -#builtin ca#:7 *#builtin sg#:4,
            w: 0.0,
        ),
        r3#0d95d60e#2: vec4#67fdfe9c(
            x: -sb#:6,
            y: cb#:5 *#builtin sg#:4,
            z: cb#:5 *#builtin cg#:3,
            w: 0.0,
        ),
        r4#0d95d60e#3: vec4#67fdfe9c(x: 0.0, y: 0.0, z: 0.0, w: 1.0),
    };
}
(tx#:0: float, ty#:1: float, tz#:2: float): Mat4#🐐🧍‍♂️👩‍🦲 => {
    const cg#:3: float = cos(tx#:0);
    const sg#:4: float = sin(tx#:0);
    const cb#:5: float = cos(ty#:1);
    const sb#:6: float = sin(ty#:1);
    const ca#:7: float = cos(tz#:2);
    const sa#:8: float = sin(tz#:2);
    return Mat4#🐐🧍‍♂️👩‍🦲{TODO SPREADs}{
        r1: vec4#🥪🕡🍆😃(
            ca#:7 * cb#:5,
            ca#:7 * sb#:6 * sg#:4 - sa#:8 * cg#:3,
            ca#:7 * sb#:6 * cg#:3 + sa#:8 * sg#:4,
            0,
        ),
        r2: vec4#🥪🕡🍆😃(
            sa#:8 * cb#:5,
            sa#:8 * sb#:6 * sg#:4 + ca#:7 * cg#:3,
            sa#:8 * sb#:6 * cg#:3 - ca#:7 * sg#:4,
            0,
        ),
        r3: vec4#🥪🕡🍆😃(-sb#:6, cb#:5 * sg#:4, cb#:5 * cg#:3, 0),
        r4: vec4#🥪🕡🍆😃(0, 0, 0, 1),
    };
}
```
*/
export const hash_348c3554: (arg_0: number, arg_1: number, arg_2: number) => t_0d95d60e = (tx: number, ty: number, tz: number) => {
  let cg: number = cos(tx);
  let sg: number = sin(tx);
  let cb: number = cos(ty);
  let sb: number = sin(ty);
  let ca: number = cos(tz);
  let sa: number = sin(tz);
  return ({
    type: "Mat4",
    r1: hash_67fdfe9c(ca * cb, ca * sb * sg - sa * cg, ca * sb * cg + sa * sg, 0),
    r2: hash_67fdfe9c(sa * cb, sa * sb * sg + ca * cg, sa * sb * cg - ca * sg, 0),
    r3: hash_67fdfe9c(-sb, cb * sg, cb * cg, 0),
    r4: hash_67fdfe9c(0, 0, 0, 1)
  } as t_0d95d60e);
};

/**
```
const estimateNormal#7e77af90 = (
    sceneSDF#:0: (GLSLEnv#a25a17de, Vec3#b79db448) ={}> float#builtin,
    env#:1: GLSLEnv#a25a17de,
    p#:2: Vec3#b79db448,
): Vec3#b79db448 ={}> normalize#2dc09b90(
    v: vec3#2441942c(
        x: sceneSDF#:0(
                env#:1,
                Vec3#b79db448{...p#:2, x#08f7c2ac#0: p#:2.x#08f7c2ac#0 +#builtin EPSILON#17261aaa},
            ) 
            -#builtin sceneSDF#:0(
                env#:1,
                Vec3#b79db448{...p#:2, x#08f7c2ac#0: p#:2.x#08f7c2ac#0 -#builtin EPSILON#17261aaa},
            ),
        y: sceneSDF#:0(
                env#:1,
                Vec3#b79db448{...p#:2, y#08f7c2ac#1: p#:2.y#08f7c2ac#1 +#builtin EPSILON#17261aaa},
            ) 
            -#builtin sceneSDF#:0(
                env#:1,
                Vec3#b79db448{...p#:2, y#08f7c2ac#1: p#:2.y#08f7c2ac#1 -#builtin EPSILON#17261aaa},
            ),
        z: sceneSDF#:0(
                env#:1,
                Vec3#b79db448{...p#:2, z#b79db448#0: p#:2.z#b79db448#0 +#builtin EPSILON#17261aaa},
            ) 
            -#builtin sceneSDF#:0(
                env#:1,
                Vec3#b79db448{...p#:2, z#b79db448#0: p#:2.z#b79db448#0 -#builtin EPSILON#17261aaa},
            ),
    ),
)
(sceneSDF#:0: (GLSLEnv#🏏, Vec3#😦) => float, env#:1: GLSLEnv#🏏, p#:2: Vec3#😦): Vec3#😦 => normalize#🌗😒🥃(
    vec3#😪👾🐬(
        sceneSDF#:0(
            env#:1,
            Vec3#😦{TODO SPREADs}{z: _#:0, x: p#:2.#Vec2#🍱🐶💣#0 + EPSILON#🧂💃🚶‍♂️, y: _#:0},
        ) - sceneSDF#:0(
            env#:1,
            Vec3#😦{TODO SPREADs}{z: _#:0, x: p#:2.#Vec2#🍱🐶💣#0 - EPSILON#🧂💃🚶‍♂️, y: _#:0},
        ),
        sceneSDF#:0(
            env#:1,
            Vec3#😦{TODO SPREADs}{z: _#:0, x: _#:0, y: p#:2.#Vec2#🍱🐶💣#1 + EPSILON#🧂💃🚶‍♂️},
        ) - sceneSDF#:0(
            env#:1,
            Vec3#😦{TODO SPREADs}{z: _#:0, x: _#:0, y: p#:2.#Vec2#🍱🐶💣#1 - EPSILON#🧂💃🚶‍♂️},
        ),
        sceneSDF#:0(
            env#:1,
            Vec3#😦{TODO SPREADs}{z: p#:2.#Vec3#😦#0 + EPSILON#🧂💃🚶‍♂️, x: _#:0, y: _#:0},
        ) - sceneSDF#:0(
            env#:1,
            Vec3#😦{TODO SPREADs}{z: p#:2.#Vec3#😦#0 - EPSILON#🧂💃🚶‍♂️, x: _#:0, y: _#:0},
        ),
    ),
)
```
*/
export const hash_7e77af90: (arg_0: (arg_0: t_a25a17de, arg_1: t_b79db448) => number, arg_1: t_a25a17de, arg_2: t_b79db448) => t_b79db448 = (sceneSDF: (arg_0: t_a25a17de, arg_1: t_b79db448) => number, env: t_a25a17de, p: t_b79db448) => hash_2dc09b90(hash_2441942c(sceneSDF(env, ({ ...p,
  type: "Vec3",
  x: p.x + hash_17261aaa
} as t_b79db448)) - sceneSDF(env, ({ ...p,
  type: "Vec3",
  x: p.x - hash_17261aaa
} as t_b79db448)), sceneSDF(env, ({ ...p,
  type: "Vec3",
  y: p.y + hash_17261aaa
} as t_b79db448)) - sceneSDF(env, ({ ...p,
  type: "Vec3",
  y: p.y - hash_17261aaa
} as t_b79db448)), sceneSDF(env, ({ ...p,
  type: "Vec3",
  z: p.z + hash_17261aaa
} as t_b79db448)) - sceneSDF(env, ({ ...p,
  type: "Vec3",
  z: p.z - hash_17261aaa
} as t_b79db448))));

/**
```
const ScaleVec3_#24e970fe = Mul#02cc25c4<Vec3#b79db448, float#builtin, Vec3#b79db448>{
    "*"#02cc25c4#0: (v#:0: Vec3#b79db448, scale#:1: float#builtin): Vec3#b79db448 ={}> Vec3#b79db448{
        x#08f7c2ac#0: v#:0.x#08f7c2ac#0 *#builtin scale#:1,
        y#08f7c2ac#1: v#:0.y#08f7c2ac#1 *#builtin scale#:1,
        z#b79db448#0: v#:0.z#b79db448#0 *#builtin scale#:1,
    },
}
Mul#👫🏭😪{TODO SPREADs}{
    h02cc25c4_0: (v#:0: Vec3#😦, scale#:1: float): Vec3#😦 => Vec3#😦{TODO SPREADs}{
        z: v#:0.#Vec3#😦#0 * scale#:1,
        x: v#:0.#Vec2#🍱🐶💣#0 * scale#:1,
        y: v#:0.#Vec2#🍱🐶💣#1 * scale#:1,
    },
}
```
*/
export const hash_24e970fe: t_02cc25c4<t_b79db448, number, t_b79db448> = ({
  type: "02cc25c4",
  h02cc25c4_0: (v: t_b79db448, scale: number) => ({
    type: "Vec3",
    x: v.x * scale,
    y: v.y * scale,
    z: v.z * scale
  } as t_b79db448)
} as t_02cc25c4<t_b79db448, number, t_b79db448>);

/**
```
const vec4#1f417702 = (x#:0: float#builtin): Vec4#b1f05ae8 ={}> Vec4#b1f05ae8{
    z#b79db448#0: x#:0,
    x#08f7c2ac#0: x#:0,
    y#08f7c2ac#1: x#:0,
    w#b1f05ae8#0: x#:0,
}
(x#:0: float): Vec4#🌎 => Vec4#🌎{TODO SPREADs}{w: x#:0, z: x#:0}
```
*/
export const hash_1f417702: (arg_0: number) => t_b1f05ae8 = (x: number) => ({
  type: "Vec4",
  z: x,
  x: x,
  y: x,
  w: x
} as t_b1f05ae8);

/**
```
const rec shortestDistanceToSurface#50a50902 = (
    sceneSDF#:0: (GLSLEnv#a25a17de, Vec3#b79db448) ={}> float#builtin,
    env#:1: GLSLEnv#a25a17de,
    eye#:2: Vec3#b79db448,
    marchingDirection#:3: Vec3#b79db448,
    start#:4: float#builtin,
    end#:5: float#builtin,
    stepsLeft#:6: int#builtin,
): float#builtin ={}> {
    const dist#:7 = sceneSDF#:0(
        env#:1,
        eye#:2 +#dff30886#3d436b7e#0 start#:4 *#6bec1050#02cc25c4#0 marchingDirection#:3,
    );
    if dist#:7 <#builtin EPSILON#17261aaa {
        start#:4;
    } else {
        const depth#:8 = start#:4 +#builtin dist#:7;
        if depth#:8 >=#builtin end#:5 ||#builtin stepsLeft#:6 <=#builtin 0 {
            end#:5;
        } else {
            50a50902#self(
                sceneSDF#:0,
                env#:1,
                eye#:2,
                marchingDirection#:3,
                depth#:8,
                end#:5,
                stepsLeft#:6 -#builtin 1,
            );
        };
    };
}
(
    sceneSDF#:0: (GLSLEnv#🏏, Vec3#😦) => float,
    env#:1: GLSLEnv#🏏,
    eye#:2: Vec3#😦,
    marchingDirection#:3: Vec3#😦,
    start#:4: float,
    end#:5: float,
    stepsLeft#:6: int,
): float => {
    loop(unbounded) {
        const dist#:7: float = sceneSDF#:0(
            env#:1,
            AddSubVec3#🖤.#AddSub#🕕🧑‍🦲⚽#0(
                eye#:2,
                ScaleVec3#😖🏨🦞😃.#Mul#👫🏭😪#0(start#:4, marchingDirection#:3),
            ),
        );
        if dist#:7 < EPSILON#🧂💃🚶‍♂️ {
            return start#:4;
        } else {
            const depth#:8: float = start#:4 + dist#:7;
            if depth#:8 >= end#:5 || stepsLeft#:6 <= 0 {
                return end#:5;
            } else {
                start#:4 = depth#:8;
                stepsLeft#:6 = stepsLeft#:6 - 1;
                continue;
            };
        };
    };
}
```
*/
export const hash_50a50902: (arg_0: (arg_0: t_a25a17de, arg_1: t_b79db448) => number, arg_1: t_a25a17de, arg_2: t_b79db448, arg_3: t_b79db448, arg_4: number, arg_5: number, arg_6: number) => number = (sceneSDF: (arg_0: t_a25a17de, arg_1: t_b79db448) => number, env: t_a25a17de, eye$2: t_b79db448, marchingDirection: t_b79db448, start: number, end: number, stepsLeft: number) => {
  while (true) {
    let dist: number = sceneSDF(env, hash_dff30886.h3d436b7e_0(eye$2, hash_6bec1050.h02cc25c4_0(start, marchingDirection)));

    if (dist < hash_17261aaa) {
      return start;
    } else {
      let depth: number = start + dist;

      if (depth >= end || stepsLeft <= 0) {
        return end;
      } else {
        start = depth;
        stepsLeft = stepsLeft - 1;
        continue;
      }
    }
  }
};

/**
```
const getWorldDir#7fa41182 = (
    resolution#:0: Vec2#08f7c2ac,
    coord#:1: Vec2#08f7c2ac,
    eye#:2: Vec3#b79db448,
    fieldOfView#:3: float#builtin,
): Vec3#b79db448 ={}> {
    const viewDir#:4 = rayDirection#08d4f757(
        fieldOfView#:3,
        size: resolution#:0,
        fragCoord: coord#:1,
    );
    const eye#:5 = Vec3#b79db448{x#08f7c2ac#0: 0.0, y#08f7c2ac#1: 0.0, z#b79db448#0: 5.0};
    const viewToWorld#:6 = viewMatrix#75e3ca34(
        eye#:5,
        center: Vec3#b79db448{x#08f7c2ac#0: 0.0, y#08f7c2ac#1: 0.0, z#b79db448#0: 0.0},
        up: Vec3#b79db448{x#08f7c2ac#0: 0.0, y#08f7c2ac#1: 1.0, z#b79db448#0: 0.0},
    );
    xyz#4e75153a(
        v: viewToWorld#:6 *#c7283624#02cc25c4#0 Vec4#b1f05ae8{...viewDir#:4, w#b1f05ae8#0: 0.0},
    );
}
(resolution#:0: Vec2#🍱🐶💣, coord#:1: Vec2#🍱🐶💣, eye#:2: Vec3#😦, fieldOfView#:3: float): Vec3#😦 => xyz#🤴👰‍♂️🙅‍♂️😃(
    MatByVector#🦦.#Mul#👫🏭😪#0(
        viewMatrix#🦢🧏🛫😃(
            Vec3#😦{TODO SPREADs}{z: 5, x: 0, y: 0},
            Vec3#😦{TODO SPREADs}{z: 0, x: 0, y: 0},
            Vec3#😦{TODO SPREADs}{z: 0, x: 0, y: 1},
        ),
        Vec4#🌎{TODO SPREADs}{w: 0, z: _#:0},
    ),
)
```
*/
export const hash_7fa41182: (arg_0: t_08f7c2ac, arg_1: t_08f7c2ac, arg_2: t_b79db448, arg_3: number) => t_b79db448 = (resolution: t_08f7c2ac, coord: t_08f7c2ac, eye$2: t_b79db448, fieldOfView$3: number) => hash_4e75153a(hash_c7283624.h02cc25c4_0(hash_75e3ca34(({
  type: "Vec3",
  x: 0,
  y: 0,
  z: 5
} as t_b79db448), ({
  type: "Vec3",
  x: 0,
  y: 0,
  z: 0
} as t_b79db448), ({
  type: "Vec3",
  x: 0,
  y: 1,
  z: 0
} as t_b79db448)), ({ ...hash_08d4f757(fieldOfView$3, resolution, coord),
  type: "Vec4",
  w: 0
} as t_b1f05ae8)));

/**
```
const Scale4#26cc7591 = Div#3b763160<Vec4#b1f05ae8, float#builtin, Vec4#b1f05ae8>{
    "/"#3b763160#0: (v#:0: Vec4#b1f05ae8, scale#:1: float#builtin): Vec4#b1f05ae8 ={}> Vec4#b1f05ae8{
        z#b79db448#0: v#:0.z#b79db448#0 /#builtin scale#:1,
        x#08f7c2ac#0: v#:0.x#08f7c2ac#0 /#builtin scale#:1,
        y#08f7c2ac#1: v#:0.y#08f7c2ac#1 /#builtin scale#:1,
        w#b1f05ae8#0: v#:0.w#b1f05ae8#0 /#builtin scale#:1,
    },
}
Div#🧜‍♂️🧖💧{TODO SPREADs}{
    h3b763160_0: (v#:0: Vec4#🌎, scale#:1: float): Vec4#🌎 => Vec4#🌎{TODO SPREADs}{
        w: v#:0.#Vec4#🌎#0 / scale#:1,
        z: v#:0.#Vec3#😦#0 / scale#:1,
    },
}
```
*/
export const hash_26cc7591: t_3b763160<t_b1f05ae8, number, t_b1f05ae8> = ({
  type: "3b763160",
  h3b763160_0: (v: t_b1f05ae8, scale: number) => ({
    type: "Vec4",
    z: v.z / scale,
    x: v.x / scale,
    y: v.y / scale,
    w: v.w / scale
  } as t_b1f05ae8)
} as t_3b763160<t_b1f05ae8, number, t_b1f05ae8>);

/**
```
const vec2#fa534764 = (x#:0: float#builtin, y#:1: float#builtin): Vec2#08f7c2ac ={}> Vec2#08f7c2ac{
    x#08f7c2ac#0: x#:0,
    y#08f7c2ac#1: y#:1,
}
(x#:0: float, y#:1: float): Vec2#🍱🐶💣 => Vec2#🍱🐶💣{TODO SPREADs}{x: x#:0, y: y#:1}
```
*/
export const hash_fa534764: (arg_0: number, arg_1: number) => t_08f7c2ac = (x: number, y: number) => ({
  type: "Vec2",
  x: x,
  y: y
} as t_08f7c2ac);

/**
```
const AddSubVec4#24c21a2e = AddSub#3d436b7e<Vec4#b1f05ae8, Vec4#b1f05ae8, Vec4#b1f05ae8>{
    "+"#3d436b7e#0: (one#:0: Vec4#b1f05ae8, two#:1: Vec4#b1f05ae8): Vec4#b1f05ae8 ={}> Vec4#b1f05ae8{
        z#b79db448#0: one#:0.z#b79db448#0 +#builtin two#:1.z#b79db448#0,
        x#08f7c2ac#0: one#:0.x#08f7c2ac#0 +#builtin two#:1.x#08f7c2ac#0,
        y#08f7c2ac#1: one#:0.y#08f7c2ac#1 +#builtin two#:1.y#08f7c2ac#1,
        w#b1f05ae8#0: one#:0.w#b1f05ae8#0 +#builtin two#:1.w#b1f05ae8#0,
    },
    "-"#3d436b7e#1: (one#:2: Vec4#b1f05ae8, two#:3: Vec4#b1f05ae8): Vec4#b1f05ae8 ={}> Vec4#b1f05ae8{
        z#b79db448#0: one#:2.z#b79db448#0 -#builtin two#:3.z#b79db448#0,
        x#08f7c2ac#0: one#:2.x#08f7c2ac#0 -#builtin two#:3.x#08f7c2ac#0,
        y#08f7c2ac#1: one#:2.y#08f7c2ac#1 -#builtin two#:3.y#08f7c2ac#1,
        w#b1f05ae8#0: one#:2.w#b1f05ae8#0 -#builtin two#:3.w#b1f05ae8#0,
    },
}
AddSub#🕕🧑‍🦲⚽{TODO SPREADs}{
    h3d436b7e_0: (one#:0: Vec4#🌎, two#:1: Vec4#🌎): Vec4#🌎 => Vec4#🌎{TODO SPREADs}{
        w: one#:0.#Vec4#🌎#0 + two#:1.#Vec4#🌎#0,
        z: one#:0.#Vec3#😦#0 + two#:1.#Vec3#😦#0,
    },
    h3d436b7e_1: (one#:2: Vec4#🌎, two#:3: Vec4#🌎): Vec4#🌎 => Vec4#🌎{TODO SPREADs}{
        w: one#:2.#Vec4#🌎#0 - two#:3.#Vec4#🌎#0,
        z: one#:2.#Vec3#😦#0 - two#:3.#Vec3#😦#0,
    },
}
```
*/
export const hash_24c21a2e: t_3d436b7e<t_b1f05ae8, t_b1f05ae8, t_b1f05ae8> = ({
  type: "3d436b7e",
  h3d436b7e_0: (one: t_b1f05ae8, two: t_b1f05ae8) => ({
    type: "Vec4",
    z: one.z + two.z,
    x: one.x + two.x,
    y: one.y + two.y,
    w: one.w + two.w
  } as t_b1f05ae8),
  h3d436b7e_1: (one$2: t_b1f05ae8, two$3: t_b1f05ae8) => ({
    type: "Vec4",
    z: one$2.z - two$3.z,
    x: one$2.x - two$3.x,
    y: one$2.y - two$3.y,
    w: one$2.w - two$3.w
  } as t_b1f05ae8)
} as t_3d436b7e<t_b1f05ae8, t_b1f05ae8, t_b1f05ae8>);

/**
```
const rotate#06db0e50 = (
    v#:0: Vec3#b79db448,
    x#:1: float#builtin,
    y#:2: float#builtin,
    z#:3: float#builtin,
): Vec3#b79db448 ={}> {
    xyz#4e75153a(
        v: rotate#348c3554(tx: x#:1, ty: y#:2, tz: z#:3) 
            *#c7283624#02cc25c4#0 vec4#0a02c024(v#:0, w: 1.0),
    );
}
(v#:0: Vec3#😦, x#:1: float, y#:2: float, z#:3: float): Vec3#😦 => xyz#🤴👰‍♂️🙅‍♂️😃(
    MatByVector#🦦.#Mul#👫🏭😪#0(rotate#🦹‍♂️🗼🛴(x#:1, y#:2, z#:3), vec4#😶👐🤘(v#:0, 1)),
)
```
*/
export const hash_06db0e50: (arg_0: t_b79db448, arg_1: number, arg_2: number, arg_3: number) => t_b79db448 = (v: t_b79db448, x$1: number, y$2: number, z$3: number) => hash_4e75153a(hash_c7283624.h02cc25c4_0(hash_348c3554(x$1, y$2, z$3), hash_0a02c024(v, 1)));

/**
```
const marchNormals#34c7f2b0 = (sceneSDF#:0: (GLSLEnv#a25a17de, Vec3#b79db448) ={}> float#builtin): (
    env: GLSLEnv#a25a17de,
    coord: Vec2#08f7c2ac,
) ={}> Vec4#b1f05ae8 ={}> (env#:1: GLSLEnv#a25a17de, coord#:2: Vec2#08f7c2ac): Vec4#b1f05ae8 ={}> {
    const eye#:3 = Vec3#b79db448{x#08f7c2ac#0: 0.0, y#08f7c2ac#1: 0.0, z#b79db448#0: 5.0};
    const worldDir#:4 = getWorldDir#7fa41182(
        resolution: env#:1.resolution#a25a17de#1,
        coord#:2,
        eye#:3,
        fieldOfView: 45.0,
    );
    const maxDist#:5 = 100.0;
    const dist#:6 = shortestDistanceToSurface#50a50902(
        sceneSDF#:0,
        env#:1,
        eye#:3,
        marchingDirection: worldDir#:4,
        start: 0.0,
        end: maxDist#:5,
        stepsLeft: 255,
    );
    if dist#:6 >#builtin maxDist#:5 -#builtin EPSILON#17261aaa {
        vec4#1f417702(x: 0.0);
    } else {
        const worldPos#:7 = eye#:3 +#dff30886#3d436b7e#0 worldDir#:4 *#24e970fe#02cc25c4#0 dist#:6;
        const normal#:8 = estimateNormal#7e77af90(sceneSDF#:0, env#:1, p: worldPos#:7);
        vec4#0a02c024(v: normal#:8, w: 1.0);
    };
}
(sceneSDF#:0: (GLSLEnv#🏏, Vec3#😦) => float): (GLSLEnv#🏏, Vec2#🍱🐶💣) => Vec4#🌎 => (
    env#:1: GLSLEnv#🏏,
    coord#:2: Vec2#🍱🐶💣,
): Vec4#🌎 => {
    const eye#:3: Vec3#😦 = Vec3#😦{TODO SPREADs}{z: 5, x: 0, y: 0};
    const worldDir#:4: Vec3#😦 = getWorldDir#👩‍🦽🧑‍🏫🧸😃(
        env#:1.#GLSLEnv#🏏#1,
        coord#:2,
        eye#:3,
        45,
    );
    const dist#:6: float = shortestDistanceToSurface#👨‍🎓🤵‍♂️🧑‍🌾😃(
        sceneSDF#:0,
        env#:1,
        eye#:3,
        worldDir#:4,
        0,
        100,
        255,
    );
    if dist#:6 > 100 - EPSILON#🧂💃🚶‍♂️ {
        return vec4#🏥💀🐩(0);
    } else {
        return vec4#😶👐🤘(
            estimateNormal#🌗👣⛳😃(
                sceneSDF#:0,
                env#:1,
                AddSubVec3#🖤.#AddSub#🕕🧑‍🦲⚽#0(
                    eye#:3,
                    ScaleVec3_#🧑‍⚕️🥀🐜.#Mul#👫🏭😪#0(worldDir#:4, dist#:6),
                ),
            ),
            1,
        );
    };
}
```
*/
export const hash_34c7f2b0: (arg_0: (arg_0: t_a25a17de, arg_1: t_b79db448) => number) => (arg_0: t_a25a17de, arg_1: t_08f7c2ac) => t_b1f05ae8 = (sceneSDF: (arg_0: t_a25a17de, arg_1: t_b79db448) => number) => (env: t_a25a17de, coord$2: t_08f7c2ac) => {
  let eye$3: t_b79db448 = ({
    type: "Vec3",
    x: 0,
    y: 0,
    z: 5
  } as t_b79db448);
  let worldDir: t_b79db448 = hash_7fa41182(env.resolution, coord$2, eye$3, 45);
  let dist$6: number = hash_50a50902(sceneSDF, env, eye$3, worldDir, 0, 100, 255);

  if (dist$6 > 100 - hash_17261aaa) {
    return hash_1f417702(0);
  } else {
    return hash_0a02c024(hash_7e77af90(sceneSDF, env, hash_dff30886.h3d436b7e_0(eye$3, hash_24e970fe.h02cc25c4_0(worldDir, dist$6))), 1);
  }
};

/**
```
const multiSample#023337fb = (fn#:0: (GLSLEnv#a25a17de, Vec2#08f7c2ac) ={}> Vec4#b1f05ae8): (
    env: GLSLEnv#a25a17de,
    pos: Vec2#08f7c2ac,
) ={}> Vec4#b1f05ae8 ={}> (env#:1: GLSLEnv#a25a17de, pos#:2: Vec2#08f7c2ac): Vec4#b1f05ae8 ={}> {
    const total#:3 = fn#:0(env#:1, pos#:2) 
                    +#24c21a2e#3d436b7e#0 fn#:0(
                        env#:1,
                        pos#:2 +#04f14e9c#3d436b7e#0 vec2#fa534764(x: 0.5, y: 0.0),
                    ) 
                +#24c21a2e#3d436b7e#0 fn#:0(
                    env#:1,
                    pos#:2 +#04f14e9c#3d436b7e#0 vec2#fa534764(x: -0.5, y: 0.0),
                ) 
            +#24c21a2e#3d436b7e#0 fn#:0(
                env#:1,
                pos#:2 +#04f14e9c#3d436b7e#0 vec2#fa534764(x: 0.0, y: 0.5),
            ) 
        +#24c21a2e#3d436b7e#0 fn#:0(
            env#:1,
            pos#:2 +#04f14e9c#3d436b7e#0 vec2#fa534764(x: 0.0, y: -0.5),
        );
    total#:3 /#26cc7591#3b763160#0 5.0;
}
(fn#:0: (GLSLEnv#🏏, Vec2#🍱🐶💣) => Vec4#🌎): (GLSLEnv#🏏, Vec2#🍱🐶💣) => Vec4#🌎 => (
    env#:1: GLSLEnv#🏏,
    pos#:2: Vec2#🍱🐶💣,
): Vec4#🌎 => Scale4#🧗‍♀️🌇🍃.#Div#🧜‍♂️🧖💧#0(
    AddSubVec4#🐥🖤🦋.#AddSub#🕕🧑‍🦲⚽#0(
        AddSubVec4#🐥🖤🦋.#AddSub#🕕🧑‍🦲⚽#0(
            AddSubVec4#🐥🖤🦋.#AddSub#🕕🧑‍🦲⚽#0(
                AddSubVec4#🐥🖤🦋.#AddSub#🕕🧑‍🦲⚽#0(
                    fn#:0(env#:1, pos#:2),
                    fn#:0(env#:1, AddSubVec2#🥪😓😱.#AddSub#🕕🧑‍🦲⚽#0(pos#:2, vec2#🚠(0.5, 0))),
                ),
                fn#:0(env#:1, AddSubVec2#🥪😓😱.#AddSub#🕕🧑‍🦲⚽#0(pos#:2, vec2#🚠(-0.5, 0))),
            ),
            fn#:0(env#:1, AddSubVec2#🥪😓😱.#AddSub#🕕🧑‍🦲⚽#0(pos#:2, vec2#🚠(0, 0.5))),
        ),
        fn#:0(env#:1, AddSubVec2#🥪😓😱.#AddSub#🕕🧑‍🦲⚽#0(pos#:2, vec2#🚠(0, -0.5))),
    ),
    5,
)
```
*/
export const hash_023337fb: (arg_0: (arg_0: t_a25a17de, arg_1: t_08f7c2ac) => t_b1f05ae8) => (arg_0: t_a25a17de, arg_1: t_08f7c2ac) => t_b1f05ae8 = (fn: (arg_0: t_a25a17de, arg_1: t_08f7c2ac) => t_b1f05ae8) => (env: t_a25a17de, pos: t_08f7c2ac) => hash_26cc7591.h3b763160_0(hash_24c21a2e.h3d436b7e_0(hash_24c21a2e.h3d436b7e_0(hash_24c21a2e.h3d436b7e_0(hash_24c21a2e.h3d436b7e_0(fn(env, pos), fn(env, hash_04f14e9c.h3d436b7e_0(pos, hash_fa534764(0.5, 0)))), fn(env, hash_04f14e9c.h3d436b7e_0(pos, hash_fa534764(-0.5, 0)))), fn(env, hash_04f14e9c.h3d436b7e_0(pos, hash_fa534764(0, 0.5)))), fn(env, hash_04f14e9c.h3d436b7e_0(pos, hash_fa534764(0, -0.5)))), 5);

/**
```
const ok#c9c866d4 = multiSample#023337fb(
    fn: marchNormals#34c7f2b0(
        sceneSDF: (env#:0: GLSLEnv#a25a17de, pos#:1: Vec3#b79db448): float#builtin ={}> {
            const pos#:2 = rotate#06db0e50(
                v: pos#:1,
                x: 0.0,
                y: env#:0.time#a25a17de#0 /#builtin 2.0,
                z: env#:0.time#a25a17de#0,
            );
            const mag#:3 = (sin#builtin(env#:0.time#a25a17de#0 /#builtin 2.0) +#builtin 1.0) 
                    *#builtin 60.0 
                +#builtin 1.0;
            const period#:4 = 30.0 *#builtin (sin#builtin(env#:0.time#a25a17de#0) +#builtin 1.0);
            const sphere#:5 = length#57739f70(v: pos#:2) -#builtin 0.5;
            const bumps#:6 = sin#builtin(pos#:2.x#08f7c2ac#0 *#builtin period#:4) 
                    +#builtin sin#builtin(pos#:2.z#b79db448#0 *#builtin period#:4) 
                +#builtin sin#builtin(pos#:2.y#08f7c2ac#1 *#builtin period#:4);
            sphere#:5 -#builtin bumps#:6 /#builtin mag#:3;
        },
    ),
)
multiSample#♠️🧔😑(
    marchNormals#🍛🐯🛤️(
        (env#:0: GLSLEnv#🏏, pos#:1: Vec3#😦): float => {
            const pos#:2: Vec3#😦 = rotate#🐞🍧🙀(
                pos#:1,
                0,
                env#:0.#GLSLEnv#🏏#0 / 2,
                env#:0.#GLSLEnv#🏏#0,
            );
            const period#:4: float = 30 * sin(env#:0.#GLSLEnv#🏏#0) + 1;
            return length#⏲️🙅‍♂️🧎😃(pos#:2) - 0.5 - (sin(pos#:2.#Vec2#🍱🐶💣#0 * period#:4) + sin(
                pos#:2.#Vec3#😦#0 * period#:4,
            ) + sin(pos#:2.#Vec2#🍱🐶💣#1 * period#:4)) / ((sin(env#:0.#GLSLEnv#🏏#0 / 2) + 1) * (60) + 1);
        },
    ),
)
```
*/
export const hash_c9c866d4: (arg_0: t_a25a17de, arg_1: t_08f7c2ac) => t_b1f05ae8 = hash_023337fb(hash_34c7f2b0((env$0: t_a25a17de, pos$1: t_b79db448) => {
  let pos: t_b79db448 = hash_06db0e50(pos$1, 0, env$0.time / 2, env$0.time);
  let period: number = 30 * (sin(env$0.time) + 1);
  return hash_57739f70(pos) - 0.5 - (sin(pos.x * period) + sin(pos.z * period) + sin(pos.y * period)) / ((sin(env$0.time / 2) + 1) * 60 + 1);
}));
export const ok = hash_c9c866d4;