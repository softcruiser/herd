// Ok

// import * as t from '@babel/types';
import { expressionDeps, sortTerms } from '../typing/analyze';
import { idFromName, idName, refName } from '../typing/env';
// import { bool } from '../typing/preset';
import {
    EffectRef,
    Env,
    getAllSubTypes,
    Id,
    RecordDef,
    Reference,
    selfEnv,
    Symbol,
    Term,
    Type,
    typesEqual,
} from '../typing/types';
import { typeScriptPrelude } from './fileToTypeScript';
import { walkPattern, walkTerm, wrapWithAssert } from '../typing/transform';
import * as ir from './ir/intermediateRepresentation';
import {
    optimize,
    optimizeAggressive,
    optimizeDefine,
} from './ir/optimize/optimize';
import {
    Loc,
    Type as IRType,
    OutputOptions as IOutputOptions,
    Expr,
    Record,
    Apply,
} from './ir/types';
import {
    bool,
    builtin,
    float,
    handlersType,
    handlerSym,
    int,
    pureFunction,
    typeFromTermType,
    void_,
} from './ir/utils';
import { liftEffects } from './pre-ir/lift-effectful';
import { args, atom, block, id, items, PP, printToString } from './printer';
import * as pp from './printer';
import { declarationToPretty, enumToPretty, termToPretty } from './printTsLike';
import { optimizeAST } from './typeScriptOptimize';
import {
    printType,
    recordMemberSignature,
    typeIdToString,
    typeToAst,
    typeVblsToParameters,
} from './typeScriptTypePrinter';
import { effectConstructorType } from './ir/cps';
import { getEnumReferences, showLocation } from '../typing/typeExpr';
import { nullLocation } from '../parsing/parser';
import { defaultVisitor, transformExpr } from './ir/transform';
import { uniquesReallyAreUnique } from './ir/analyze';
import { LocatedError } from '../typing/errors';
import { maxUnique, recordAttributeName } from './typeScriptPrinterSimple';
import { explicitSpreads } from './ir/optimize/explicitSpreads';

export type OutputOptions = {
    // readonly scope?: string;
    // readonly noTypes?: boolean;
    // readonly limitExecutionTime?: boolean;
    // readonly discriminant?: string;
    // readonly optimize?: boolean;
    // readonly optimizeAggressive?: boolean;
    readonly includeCanonicalNames?: boolean;
    readonly showAllUniques?: boolean;
};

const builtinTypes: {
    [key: string]: {
        name: string;
        args: Array<{ sub: string | null; idx: number }>;
    };
} = {
    '43802a16': {
        name: 'vec2',
        args: [
            { idx: 0, sub: null },
            { idx: 1, sub: null },
        ],
    },
    '9f1c0644': {
        name: 'vec3',
        args: [
            { idx: 0, sub: '43802a16' },
            { idx: 1, sub: '43802a16' },
            { idx: 0, sub: null },
        ],
    },
    '3b941378': {
        name: 'vec4',
        args: [
            { idx: 0, sub: '43802a16' },
            { idx: 1, sub: '43802a16' },
            { idx: 0, sub: '9f1c0644' },
            { idx: 0, sub: null },
        ],
    },
    d92781e8: {
        name: 'mat4',
        args: [
            { idx: 0, sub: null },
            { idx: 1, sub: null },
            { idx: 2, sub: null },
            { idx: 3, sub: null },
        ],
    },
};

const refType = (idRaw: string): ir.Type => ({
    type: 'ref',
    ref: {
        type: 'user',
        id: idFromName(idRaw),
    },
    typeVbls: [],
    loc: nullLocation,
});

const Vec2: ir.Type = refType('629a8360');
const Vec3: ir.Type = refType('14d8ae44');
const Vec4: ir.Type = refType('5026f640');
const Mat4: ir.Type = refType('d92781e8');

const record = (idRaw: string, rows: Array<Expr>): Expr => {
    return {
        type: 'record',
        base: {
            type: 'Concrete',
            ref: { type: 'user', id: idFromName(idRaw) },
            spread: null,
            rows: rows,
        },
        subTypes: {},
        loc: nullLocation,
        is: refType(idRaw),
    };
};

const builtinVal = (name: string, type: ir.Type): Expr => ({
    type: 'builtin',
    name: name,
    loc: nullLocation,
    is: type,
});

/*
Ok how we do want to do this override?
One way is: replace the hash (e.g. )

*/
const glslBuiltins: { [key: string]: Expr } = {
    '6f186ad1': record('As', [builtinVal('float', pureFunction([int], float))]),
    '184a69ed': record('As', [builtinVal('int', pureFunction([float], int))]),
    '4478b64a': builtinVal('cross', pureFunction([Vec3, Vec3], Vec3)),

    '090f77e7': record('5ac12902', [
        builtinVal('/', pureFunction([Vec2, Vec2], Vec2)),
    ]),
    '68f73ad4': record('5ac12902', [
        builtinVal('/', pureFunction([Vec3, float], Vec3)),
    ]),
    c4a91006: record('1de4e4c0', [
        builtinVal('*', pureFunction([float, Vec3], Vec3)),
    ]),
    afc24bbe: record('5ac12902', [
        builtinVal('/', pureFunction([Vec2, float], Vec2)),
    ]),
    '0555d260': record('b99b22d8', [
        builtinVal('+', pureFunction([Vec4, Vec4], Vec4)),
        builtinVal('-', pureFunction([Vec4, Vec4], Vec4)),
    ]),
    '3b80b971': record('b99b22d8', [
        builtinVal('+', pureFunction([Vec3, float], Vec3)),
        builtinVal('-', pureFunction([Vec3, float], Vec3)),
    ]),
    '6d631644': record('b99b22d8', [
        builtinVal('+', pureFunction([Vec2, float], Vec2)),
        builtinVal('-', pureFunction([Vec2, float], Vec2)),
    ]),
    '56d43c0e': record('5ac12902', [
        builtinVal('/', pureFunction([Vec4, float], Vec4)),
    ]),
    '5776a60e': record('5ac12902', [
        builtinVal('/', pureFunction([Vec4, Vec4], Vec4)),
    ]),
    '28569bc0': record('1de4e4c0', [
        builtinVal('*', pureFunction([Vec2, float], Vec2)),
    ]),
    '1b694fee': record('1de4e4c0', [
        builtinVal('*', pureFunction([Vec4, Vec4], Vec4)),
    ]),
    '16557d10': record('1de4e4c0', [
        builtinVal('*', pureFunction([Mat4, Vec4], Vec4)),
    ]),
    '1c6fdd91': record('b99b22d8', [
        builtinVal('+', pureFunction([Vec3, Vec3], Vec3)),
        builtinVal('-', pureFunction([Vec3, Vec3], Vec3)),
    ]),
    '70bb2056': record('b99b22d8', [
        builtinVal('+', pureFunction([Vec2, Vec2], Vec2)),
        builtinVal('-', pureFunction([Vec2, Vec2], Vec2)),
    ]),
    '73d73040': record('1de4e4c0', [
        builtinVal('*', pureFunction([Vec3, Vec3], Vec3)),
    ]),
    '1d31aa6e': record('1de4e4c0', [
        builtinVal('*', pureFunction([Vec3, float], Vec3)),
    ]),
    '255c39c3': builtinVal('dot', pureFunction([Vec3, Vec3], float)),
    ce463a80: builtinVal('normalize', pureFunction([Vec3], Vec3)),
    '1cc335a2': builtinVal('length', pureFunction([Vec3], Vec3)),
    '5483fdc2': builtinVal('clamp', pureFunction([Vec3, Vec3, Vec3], Vec3)),
    f2f2e188: builtinVal('clamp', pureFunction([float, float, float], float)),
    '65acfcda': builtinVal('round', pureFunction([Vec3], Vec3)),
    '9275f914': record('553b4b8e', [
        builtinVal('==', pureFunction([int, int], bool)),
    ]),
    c41f7386: record('553b4b8e', [
        builtinVal('==', pureFunction([float, float], bool)),
    ]),
};

// Ok plan is:
// - produce a js file that `export default`s a map of `termName` to `glsl string`
// - and maybe that's all? then the harness HTML page can use https://github.com/patriciogonzalezvivo/glslCanvas
//   to make pretty pictures.
// - I would love to also validate the GLSL
//   ooh cool lets try https://github.com/alaingalvan/CrossShader
//   so I can catch errors, that would be awesome
// - https://github.com/evanw/glslx might also be interesting

export const idToGlsl = (
    env: Env,
    opts: OutputOptions,
    id: Id,
    isType: boolean,
) => {
    const idRaw = idName(id);
    if (isType && builtinTypes[idRaw] != null) {
        return atom(builtinTypes[idRaw].name);
    }
    const readableName = env.global.idNames[idRaw];
    if (opts.includeCanonicalNames && readableName) {
        return atom(readableName + '_' + idRaw);
    }
    const prefix = isType ? 'T' : 'V';
    return atom(prefix + idRaw);
};

export const refToGlsl = (
    env: Env,
    opts: OutputOptions,
    ref: Reference,
    isType: boolean,
) => {
    if (ref.type === 'builtin') {
        return atom(ref.name);
    }
    return idToGlsl(env, opts, ref.id, isType);
};

export const typeToGlsl = (
    env: Env,
    opts: OutputOptions,
    type: ir.Type,
): PP => {
    switch (type.type) {
        case 'ref':
            return refToGlsl(env, opts, type.ref, true);
        default:
            return atom(`invalid_${type.type.replace(/-/g, '_')}`);
    }
};

export const symToGlsl = (env: Env, opts: OutputOptions, sym: Symbol) => {
    // return atom(`${sym.name}_${sym.unique}`);
    return atom(printSym(env, opts, sym));
};

const reservedSyms = ['const'];

const printSym = (env: Env, opts: OutputOptions, sym: Symbol) =>
    !opts.showAllUniques &&
    env.local.localNames[sym.name] === sym.unique &&
    !reservedSyms.includes(sym.name)
        ? sym.name
        : // TODO: Need to fix this to ensure we have
          // hygene
          sym.name + '_' + sym.unique;

export const declarationToGlsl = (
    env: Env,
    opts: OutputOptions,
    idRaw: string,
    term: Expr,
    comment: string,
): PP => {
    if (term.type === 'lambda') {
        return items([
            atom('/*' + comment + '*/\n'),
            typeToGlsl(env, opts, term.res),
            atom(' '),
            idToGlsl(env, opts, idFromName(idRaw), false),
            args(
                term.args.map((arg) =>
                    items([
                        typeToGlsl(env, opts, arg.type),
                        atom(' '),
                        symToGlsl(env, opts, arg.sym),
                    ]),
                ),
                '(',
                ')',
                false,
            ),
            atom(' '),
            block(
                term.body.type === 'Block'
                    ? term.body.items.map((item) => stmtToGlsl(env, opts, item))
                    : [
                          stmtToGlsl(env, opts, {
                              type: 'Return',
                              loc: term.body.loc,
                              value: term.body,
                          }),
                      ],
            ),
        ]);
    } else {
        // if (!isBuiltin(term.is) || isLiteral(term)) {
        //     fail it folks
        // }
        return addComment(
            items([
                atom('const '),
                typeToGlsl(env, opts, term.is),
                atom(' '),
                idToGlsl(env, opts, idFromName(idRaw), false),
                // atom('V' + idRaw),
                atom(' = '),
                termToGlsl(env, opts, term),
                atom(';'),
            ]),
            comment,
        );
    }
};

export const stmtToGlsl = (
    env: Env,
    opts: OutputOptions,
    stmt: ir.Stmt,
): PP => {
    switch (stmt.type) {
        case 'Loop':
            return items([
                atom('for '),
                atom('(int i=0; i<10000; i++) '),
                stmtToGlsl(env, opts, stmt.body),
            ]);
        // return items([
        //     atom('while '),
        //     atom('(true) '),
        //     stmtToGlsl(env, opts, stmt.body),
        // ]);
        case 'Continue':
            return atom('continue');
        case 'if':
            return items([
                atom('if ('),
                termToGlsl(env, opts, stmt.cond),
                atom(') '),
                stmtToGlsl(env, opts, stmt.yes),
                ...(stmt.no
                    ? [atom(' else '), stmtToGlsl(env, opts, stmt.no)]
                    : []),
            ]);
        case 'Block':
            return block(stmt.items.map((s) => stmtToGlsl(env, opts, s)));
        case 'Return':
            return items([atom('return '), termToGlsl(env, opts, stmt.value)]);
        case 'Define':
            if (!stmt.value) {
                return items([
                    typeToGlsl(env, opts, stmt.is),
                    atom(' '),
                    symToGlsl(env, opts, stmt.sym),
                ]);
            }
            return items([
                typeToGlsl(env, opts, stmt.is),
                atom(' '),
                symToGlsl(env, opts, stmt.sym),
                atom(' = '),
                termToGlsl(env, opts, stmt.value),
            ]);
        case 'Assign':
            return items([
                symToGlsl(env, opts, stmt.sym),
                atom(' = '),
                termToGlsl(env, opts, stmt.value),
            ]);
        default:
            return atom(`nope_stmt_${stmt.type}`);
    }
};

export const printRecord = (
    env: Env,
    opts: OutputOptions,
    record: Record,
): PP => {
    if (record.base.type === 'Variable') {
        throw new Error('var record');
    }
    const base = record.base;
    const idRaw = idName(record.base.ref.id);
    if (builtinTypes[idRaw]) {
        let args: Array<ir.Expr> = [];
        if (!builtinTypes[idRaw].args.length) {
            throw new Error('nope custom record atm');
        }
        args = builtinTypes[idRaw].args.map(
            (arg): ir.Expr => {
                if (arg.sub) {
                    const item = record.subTypes[arg.sub].rows[arg.idx];
                    if (item) {
                        return item;
                    }
                    // const spread = findSpreadForSub(record, arg.sub)
                    const spread =
                        record.subTypes[arg.sub].spread || record.base.spread;
                    // OOOOOH BUG BUG
                    // Turns out we need spreads to be ordered
                    // because if we spread multiple things
                    // that have some overlap
                    // then we have a consistency error
                    // Ok so yeah need to walk through spreads
                    // Seeing if any of them will provide the thing I'm missing.
                    if (!spread) {
                        console.log(record.base);
                        throw new LocatedError(
                            record.loc,
                            `Invalid state: missing spread for record item ${idRaw} ${arg.sub} ${arg.idx}`,
                        );
                    }
                    return {
                        type: 'tupleAccess',
                        target: spread,
                        idx: arg.idx,
                        loc: record.loc,
                        // STOPSHIP: fix this tho
                        is: void_,
                    };
                }
                const item = base.rows[arg.idx];
                if (item) {
                    return item;
                }
                if (!base.spread) {
                    throw new Error(`no spread`);
                }
                return {
                    type: 'tupleAccess',
                    target: base.spread,
                    idx: arg.idx,
                    loc: record.loc,
                    // STOPSHIP: fix this tho
                    is: void_,
                };
            },
        );
        return items([
            atom(builtinTypes[idRaw].name),
            pp.args(
                args.map((arg) => termToGlsl(env, opts, arg)),
                '(',
                ')',
                false,
            ),
        ]);
    }
    // hmm so I need a canonical ordering for these items
    // if (record.subTypes)
    // return atom(`nope_record${idRaw}`);
    if (record.base.spread) {
        throw new Error(`Unexpected spread`);
    }
    const args = record.base.rows.map((row) => {
        if (!row) {
            throw new Error(`empty row for record`);
        }
        return termToGlsl(env, opts, row);
    });
    if (Object.keys(record.subTypes).length) {
        throw new Error(`subtypes not yet supported`);
    }

    return items([
        idToGlsl(env, opts, idFromName(idRaw), true),
        pp.args(args, '(', ')', false),
    ]);
};

export const binops = [
    '>',
    '<',
    '>=',
    '<=',
    '+',
    '-',
    '/',
    '*',
    '==',
    '|',
    '||',
    '&&',
    '^',
];
export const isBinop = (op: string) => binops.includes(op);

export const printApply = (env: Env, opts: OutputOptions, apply: Apply): PP => {
    if (apply.target.type === 'builtin' && isBinop(apply.target.name)) {
        return items([
            atom('('),
            termToGlsl(env, opts, apply.args[0]),
            atom(' '),
            atom(apply.target.name),
            atom(' '),
            termToGlsl(env, opts, apply.args[1]),
            atom(')'),
        ]);
    }
    return items([
        termToGlsl(env, opts, apply.target),
        args(
            apply.args.map((arg) => termToGlsl(env, opts, arg)),
            '(',
            ')',
            false,
        ),
    ]);
};

export const termToGlsl = (env: Env, opts: OutputOptions, expr: Expr): PP => {
    switch (expr.type) {
        case 'record':
            return printRecord(env, opts, expr);
        case 'term':
            return idToGlsl(env, opts, expr.id, false);
        case 'unary':
            return items([atom(expr.op), termToGlsl(env, opts, expr.inner)]);
        case 'float':
            return atom(expr.value.toFixed(5).replace(/0+$/, '0'));
        case 'int':
        case 'string':
            return atom(expr.value.toString());
        case 'var':
            return symToGlsl(env, opts, expr.sym);
        case 'apply':
            return printApply(env, opts, expr);
        case 'builtin':
            return atom(expr.name);
        case 'attribute':
            return items([
                termToGlsl(env, opts, expr.target),
                atom('.'),
                atom(recordAttributeName(env, expr.ref, expr.idx)),
            ]);
        case 'tupleAccess':
            return items([
                termToGlsl(env, opts, expr.target),
                atom('['),
                atom(expr.idx.toString()),
                atom(']'),
            ]);
        // case 'apply':
        default:
            return atom('nope_term_' + expr.type);
    }
    // return atom(`vec4(1.0,0.0,0.0,1.0)`);
    // return atom('nope' + expr.type);
};

export const addComment = (value: PP, comment: string) =>
    items([atom(`/* ${comment} */\n`), value]);

// Object.keys(env.global.effects).forEach((r) => {
//     const id = idFromName(r);
//     const constrs = env.global.effects[r];
//     items.push(
//         t.tsTypeAliasDeclaration(
//             t.identifier('handle' + r),
//             null,
//             t.tsTupleType(
//                 constrs.map((constr) =>
//                     typeToAst(
//                         env,
//                         opts,
//                         effectConstructorType(
//                             env,
//                             opts,
//                             { type: 'ref', ref: { type: 'user', id } },
//                             constr,
//                             nullLocation,
//                         ),
//                     ),
//                 ),
//             ),
//         ),
//     );
// });

export const fileToGlsl = (
    expressions: Array<Term>,
    env: Env,
    opts: OutputOptions,
    irOpts: IOutputOptions,
    assert: boolean,
    includeImport: boolean,
    builtinNames: Array<string>,
): string => {
    const items: Array<PP> = [
        pp.items([atom('#version 300 es')]),
        pp.items([atom('precision mediump float;')]),
        pp.items([atom('out vec4 fragColor;')]),
        pp.items([atom('const float PI = 3.14159;')]),
        atom('uniform sampler2D u_buffer0;'),
        pp.items([
            atom('uniform '),
            atom('float'),
            atom(' '),
            atom('u_time'),
            atom(';'),
        ]),
        pp.items([
            atom('uniform '),
            atom('vec2'),
            atom(' '),
            atom('u_mouse'),
            atom(';'),
        ]),
        pp.items([
            atom('uniform '),
            atom('vec3'),
            atom(' '),
            atom('u_camera'),
            atom(';'),
        ]),
        pp.items([
            atom('uniform '),
            atom('vec2'),
            atom(' '),
            atom('u_resolution'),
            atom(';'),
        ]),
    ];

    const buffers: Array<string> = [];
    Object.keys(env.global.metaData).forEach((k) => {
        const b = env.global.metaData[k].tags.filter((t) =>
            t.startsWith('buffer'),
        );
        if (!b.length) {
            return;
        }
        if (b.length > 1) {
            throw new Error(`multiple buffer tags`);
        }
        const num = parseInt(b[0].slice('buffer'.length));
        if (isNaN(num)) {
            throw new Error(`Invalid buffer tag ${b[0]}`);
        }
        buffers[num] = k;
    });
    for (let i = 0; i < buffers.length; i++) {
        if (!buffers[i]) {
            throw new Error(
                `No buffer ${i} defined. Must have all buffers in a row.`,
            );
        }
    }

    Object.keys(env.global.types).forEach((r) => {
        const constr = env.global.types[r];
        const id = idFromName(r);
        if (constr.type === 'Enum') {
            return;
        }
        if (constr.typeVbls.length) {
            // No type vbls allowed sorry
            return;
        }
        if (!constr.items.length) {
            return;
        }
        if (builtinTypes[r]) {
            return;
        }
        const subTypes = getAllSubTypes(env.global, constr);
        items.push(
            pp.items([
                atom('struct '),
                idToGlsl(env, opts, id, true),
                block([
                    ...constr.items.map((item, i) =>
                        pp.items([
                            typeToGlsl(
                                env,
                                opts,
                                typeFromTermType(env, irOpts, item),
                            ),
                            atom(' '),
                            atom(
                                recordAttributeName(
                                    env,
                                    { type: 'user', id },
                                    i,
                                ),
                            ),
                        ]),
                    ),
                    ...([] as Array<PP>).concat(
                        ...subTypes.map((id) =>
                            env.global.types[
                                idName(id)
                            ].items.map((item: Type, i: number) =>
                                pp.items([
                                    typeToGlsl(
                                        env,
                                        opts,
                                        typeFromTermType(env, irOpts, item),
                                    ),
                                    atom(' '),
                                    atom(
                                        recordAttributeName(
                                            env,
                                            { type: 'user', id },
                                            i,
                                        ),
                                    ),
                                ]),
                            ),
                        ),
                    ),
                ]),
                atom(';'),
            ]),
        );
    });

    const mains = Object.keys(env.global.metaData).filter((k) =>
        env.global.metaData[k].tags.includes('main'),
    );
    if (mains.length > 1) {
        console.warn(`Only one main allowed; ignoring the others`);
    }
    if (!mains.length) {
        console.error(`No @main defined!`);
        return '// Error: No @main defined';
    }
    const mainId = idFromName(mains[0]);
    const mainTags = env.global.metaData[mains[0]].tags;
    const mainTerm: Term = {
        type: 'ref',
        ref: {
            type: 'user',
            id: mainId,
        },
        location: nullLocation,
        is: env.global.terms[idName(mainId)].is,
    };

    const orderedTerms = expressionDeps(
        env,
        expressions.concat([
            mainTerm,
            ...buffers.map(
                (id) =>
                    ({
                        type: 'ref',
                        ref: {
                            type: 'user',
                            id: idFromName(id),
                        },
                        location: nullLocation,
                        is: env.global.terms[id].is,
                    } as Term),
            ),
        ]),
    );

    // What kinds of things do we want on here?
    // - @inline stuff, got to inline it
    // - things that take a lambda, might have to inline it or specialize it
    // - hmm how do I distinquish. Maybe "have a list of things to always inline,
    //   and then some things that you might want to inline, if the lambda uses in-scope variables?"
    const irTerms: { [idName: string]: Expr } = {};
    const irEnv: {
        inline: {
            [idName: string]: {
                expr: Expr;
                // in the one case, you always inline
                // in the other case, you only inline
                mode: 'always' | 'closure';
            };
        };
        // These are specializations of a function
        specialized: {};
    } = { inline: {}, specialized: {} };

    // So I'm again wondering if there's a way, at the type level,
    // to express whether a term will be valid GLSL.
    // And I'm thinking about Koka's effects, where one of them is
    // "Diverges" (e.g. might not halt)
    // BUT some of this stuff doesn't come into play until IR-generation
    // time.
    // Although I guess I could verify it when typing stuff
    // I would just have to nail down IR options.
    // Anyway
    // Yeah, so I could have a pseudo-effect called "uses heap"
    // for things that require a dynamic array (as opposed to a fixed one)
    // or call a function that allocates
    // hmm, like what would be allocated?
    // ok, so Roc only allocates for things that don't have a fixed size
    // e.g. Lists, Dicts, recursive data types, and Str
    // Yeah, so I could have a `alloc` trait? Or something
    // What was the other pseudo-effect I wanted? "ffi"? though
    // I think I'm going to ditch that... we'll see.
    // Ok, so `unbounded` and `allocates` are the two pseudo-traits
    // that I would need to guard against?
    // Oh also `recursive`? Yeah I guess so.
    //
    // Looking at koka's non-handlable effects
    // - alloc (hey cool) hmmm but it's for mutable allocations, not "any" allocations.
    // - div (unbounded)

    // Ok folks, might need some more syntax. Which is annoying.
    // Or it could be the same syntax as effects, but they're just
    // handled different? Sounds reasonable.
    // Ok, so {:bounded, :noalloc, :norecursion} would be what you
    // need to ensure that it's valid for glsl.
    // Right?
    // And so using strings is `alloc` already, right?
    //
    // Hm so also, I want record types to keep track if they contain
    // functions ... that would be have those pseudo-effects ...
    // right? I mean it'd be inconvenient to have to drill down all the time
    // although maybe I can just cache it? yeah maybe that's fine?
    // because it's only terms that can be roots for a glsl gen job.
    //
    // - bounded
    // - norecursion
    // - noalloc
    // - noclosures
    // - nofnpointesr
    // - noenums
    //
    // hrm that's a lot
    // well let's just take it one step at a time.
    // We can wait to statically guarentee all that stuff until later.
    // For now, let's work on having a nice experience
    // for generating these dealios.

    // Ok, so things to do here:
    /*
    - [ ] only generate type definitions for things that get used
    - [ ] go back through and prune things that didn't end up getting used
    - [ ] break out top-level records into their individual members
    - [ ] uhhhh is this where I do module naming?
        oh wait, I just need to allow multiple things with the same
        name, and also indicate when editing something that the new
        version replaces the old one.
    */

    orderedTerms.forEach((idRaw) => {
        // Don't output anything that I'm overriding with builtins
        if (glslBuiltins[idRaw]) {
            irTerms[idRaw] = glslBuiltins[idRaw];
            return;
        }
        let term = env.global.terms[idRaw];

        const id = idFromName(idRaw);
        const senv = selfEnv(env, { type: 'Term', name: idRaw, ann: term.is });
        const comment = printToString(declarationToPretty(senv, id, term), 100);
        senv.local.unique.current = maxUnique(term) + 1;
        term = liftEffects(senv, term);
        let irTerm = ir.printTerm(senv, irOpts, term);
        try {
            uniquesReallyAreUnique(irTerm);
        } catch (err) {
            const outer = new LocatedError(
                term.location,
                `Failed while typing ${idRaw} : ${env.global.idNames[idRaw]}`,
            ).wrap(err);
            throw outer;
        }
        irTerm = explicitSpreads(senv, irOpts, irTerm);
        irTerm = optimizeAggressive(senv, irTerms, irTerm, id);
        irTerm = optimizeDefine(senv, irTerm, id);
        uniquesReallyAreUnique(irTerm);

        if (
            env.global.metaData[idRaw] &&
            env.global.metaData[idRaw].tags.includes('inline')
        ) {
            irTerms[idRaw] = irTerm;
        }

        items.push(
            declarationToGlsl(
                senv,
                opts,
                idRaw,
                irTerm,
                '*\n```\n' + comment + '\n```\n',
            ),
        );
    });

    const glslEnv: Record = {
        type: 'record',
        base: {
            type: 'Concrete',
            ref: { type: 'user', id: env.global.typeNames['GLSLEnv'] },
            spread: null,
            rows: [
                builtin('u_time', nullLocation, float),
                builtin('u_resolution', nullLocation, Vec2),
                builtin('u_camera', nullLocation, Vec3),
                builtin('u_mouse', nullLocation, Vec2),
            ],
        },
        is: {
            type: 'ref',
            ref: { type: 'user', id: env.global.typeNames['GLSLEnv'] },
            loc: nullLocation,
            typeVbls: [],
        },
        subTypes: {},
        loc: nullLocation,
    };

    let mainArgs = [termToGlsl(env, opts, glslEnv), atom('gl_FragCoord.xy')];

    if (buffers.length > 1) {
        throw new Error('multi buffer not impl');
    }
    if (buffers.length) {
        mainArgs.push(atom('u_buffer0'));
        items.push(atom('#if defined(BUFFER_0)'));

        items.push(
            pp.items([
                atom('void main() '),
                block([
                    pp.items([
                        atom('fragColor'),
                        atom(' = '),
                        idToGlsl(env, opts, idFromName(buffers[0]), false),
                        args(mainArgs, '(', ')', false),
                    ]),
                ]),
            ]),
        );

        items.push(atom('#else'));
    }

    items.push(
        pp.items([
            atom('void main() '),
            block([
                pp.items([
                    atom('fragColor'),
                    atom(' = '),
                    idToGlsl(env, opts, mainId, false),
                    args(mainArgs, '(', ')', false),
                    // args(mainArgs, '(', ')', false),
                ]),
            ]),
        ]),
    );

    if (buffers.length) {
        items.push(atom('#endif\n'));
    }

    return items.map((item) => printToString(item, 100)).join('\n\n');
};