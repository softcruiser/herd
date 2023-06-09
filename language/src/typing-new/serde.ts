import { DecoratorArg, Toplevel } from '../parsing/parser';
import { args, atom, id, items, PP, printToString } from '../printing/printer';
import {
    declarationToPretty,
    decoratorToPretty,
    effectToPretty,
    effToPretty,
    enumToPretty,
    recordToPretty,
    refToPretty,
    termToPretty,
} from '../printing/printTsLike';
import { sortAllDeps } from '../typing/analyze';
import {
    transformDecoratorDef,
    transformEffectDef,
    transformEnumDef,
    transformRecordDef,
    transformTerm,
    transformType,
    Visitor,
} from '../typing/auto-transform';
import { idFromName, idName } from '../typing/env';
import { refName } from '../typing/typePattern';
import {
    Env,
    Id,
    isErrorTerm,
    isErrorType,
    nullLocation,
    Reference,
    selfEnv,
    ToplevelDefine,
    ToplevelT,
    TypeDef,
    MetaData as TMetaData,
    UserReference,
    GlobalEnv,
} from '../typing/types';
import { Context, MetaData, NamedDefns } from './Context';
import { Ctx, dependenciesVisitor } from './dependencies';
import { Library } from './Library';
import { ctxToEnv } from './migrate';

export type TopRef = {
    id: Id;
    type: 'Define' | 'Decorator' | 'Type' | 'Effect';
};

const getNamesForIds = <T>(
    namedDefns: NamedDefns<T>,
    namesForIds: { [idName: string]: Array<string> },
) => {
    Object.keys(namedDefns.names).forEach((name) => {
        namedDefns.names[name].forEach((id) => {
            if (!namesForIds[idName(id)]) {
                namesForIds[idName(id)] = [name];
            } else {
                namesForIds[idName(id)].push(name);
            }
        });
    });
};

// const toplevelDefines = (lib: Library): Array<ToplevelDefine> => {
//     const namesForIds = getNamesForIds(lib.terms);
//     // hmm no metadata here ...
//     return Object.keys(lib.terms.defns).map((k) => ({
//         type: 'Define',
//         id: idFromName(k),
//         location: lib.terms.defns[k].defn.location,
//         name: namesForIds[k][0] || 'unnamed',
//         term: lib.terms.defns[k].defn,
//         tags: lib.terms.defns[k].meta.tags,
//     }));
// };

const topDefls = <T>(
    namedDefns: NamedDefns<T>,
    t: TopRef['type'],
): Array<TopRef> =>
    Object.keys(namedDefns.defns).map((k) => ({ type: t, id: idFromName(k) }));

const allTopLevels = (lib: Library): Array<TopRef> => {
    return [
        ...topDefls(lib.terms, 'Define'),
        ...topDefls(lib.types, 'Type'),
        ...topDefls(lib.decorators, 'Decorator'),
        ...topDefls(lib.effects, 'Effect'),
    ];
};

// Ok folks, builtin annotations that we need to support:
// @meta.altName(someName)
// @meta.supercedes(otherTerm) // also does basedOn
// @meta.basedOn(otherTerm)
// @meta.createdAt(timestamp)
// @meta.glslBuiltin I guess?
// yeah maybe I'll reserve the meta. prefix for myself?
// or I mean people can always specify hash, and these will be
// #builtin

export const parseMetaId = (env: GlobalEnv, args: Array<DecoratorArg>): Id => {
    if (args.length !== 1) {
        throw new Error(`expected 1 arg, got ${args.length}`);
    }
    const arg = args[0];
    if (arg.type === 'Type') {
        if (arg.contnets.type !== 'TypeRef') {
            throw new Error(`expected type ref`);
        }
    }
    if (arg.type !== 'Expr') {
        throw new Error(`expected expr`);
    }
    if (arg.expr.type !== 'id') {
        throw new Error(`expected id`);
    }
    if (!arg.expr.hash) {
        const found = env.names[arg.expr.text];
        if (!found) {
            throw new Error(`term by name ${arg.expr.text} not found`);
        }
        return found[0];
        // ok how to resolve
        // how do we know if this is a type or a whatsit.
        // oh I guess I have a thing for that.
        // throw new Error(`no hash`);
    }
    return idFromName(arg.expr.hash.slice(1));
};

export const parseMetaInt = (args: Array<DecoratorArg>): number => {
    if (args.length !== 1) {
        throw new Error(`expected 1 arg, got ${args.length}`);
    }
    const arg = args[0];
    if (arg.type !== 'Expr') {
        throw new Error(`expected expr`);
    }
    if (arg.expr.type !== 'int') {
        throw new Error(`expected int`);
    }
    return arg.expr.value;
};

export const stripMetaDecorators = (
    env: GlobalEnv,
    top: Toplevel,
): { meta: MetaData | null; inner: Toplevel } => {
    let inner = top;
    if (inner.type === 'Decorated') {
        const meta: MetaData = {
            created: 0,
            tags: [],
        };
        let { decorators } = inner;
        let modified = false;
        decorators = decorators.filter((dec) => {
            if (dec.id.hash === '#builtin') {
                switch (dec.id.text) {
                    case 'basedOn':
                        meta.basedOn = parseMetaId(env, dec.args);
                        modified = true;
                        break;
                    case 'supercedes':
                        meta.supercedes = parseMetaId(env, dec.args);
                        modified = true;
                        break;
                    case 'createdAt':
                        meta.created = parseMetaInt(dec.args);
                        modified = true;
                        break;
                    case 'deprecated':
                        // throw folks
                        meta.deprecated = parseMetaInt(dec.args);
                        modified = true;
                        break;
                }
                return false;
            }
            if (dec.id.hash === '#tag') {
                meta.tags!.push(dec.id.text);
                modified = true;
                return false;
            }
            return true;
        });
        if (decorators.length) {
            inner = { ...inner, decorators };
        } else {
            inner = inner.wrapped;
        }
        return { meta: modified ? meta : null, inner };
    }
    return { meta: null, inner };
};

export const metaDecorators = (
    env: Env,
    meta: MetaData,
    kind: string,
): Array<PP> => {
    const metas: Array<PP> = [];
    const dec = (name: string, contents: PP) =>
        metas.push(
            items([
                atom('@'),
                id(name, 'builtin', 'decorator'),
                args([contents]),
                atom('\n'),
            ]),
        );
    if (meta.tags) {
        meta.tags.forEach((tag) => {
            metas.push(atom(`@${tag}#tag\n`));
        });
    }
    dec('createdAt', atom(meta.created.toString()));
    if (meta.author) {
        dec('author', atom(meta.author));
    }
    if (meta.basedOn) {
        dec(
            'basedOn',
            refToPretty(env, { type: 'user', id: meta.basedOn }, kind),
        );
    }
    if (meta.supercedes) {
        if (!meta.basedOn) {
            dec(
                'basedOn',
                refToPretty(env, { type: 'user', id: meta.supercedes }, kind),
            );
        }
        dec(
            'supercedes',
            refToPretty(env, { type: 'user', id: meta.supercedes }, kind),
        );
    }
    if (meta.deprecated != null) {
        dec('deprecated', atom(meta.deprecated.toString()));
    }
    return metas;
};

const transformTypeDef = <T>(t: TypeDef, visitor: Visitor<T>, ctx: T) =>
    t.type === 'Record'
        ? transformRecordDef(t, visitor, ctx)
        : transformEnumDef(t, visitor, ctx);

const topDependencies = (lib: Library, top: TopRef) => {
    const collection: { [key: string]: [Ctx, Reference] } = {};
    const visitor = dependenciesVisitor(collection);
    switch (top.type) {
        case 'Define': {
            const found = lib.terms.defns[idName(top.id)];
            if (!found) {
                console.log('NOP', top);
                break;
            }
            transformTerm(found.defn, visitor, null);
            if (found.meta.supercedes) {
                const ref: UserReference = {
                    type: 'user',
                    id: found.meta.supercedes,
                };
                collection[idName(ref.id)] = [['Term', 'ref'], ref];
            }
            if (found.meta.basedOn) {
                const ref: UserReference = {
                    type: 'user',
                    id: found.meta.basedOn,
                };
                collection[idName(ref.id)] = [['Term', 'ref'], ref];
            }
            break;
        }
        case 'Type': {
            const found = lib.types.defns[idName(top.id)];
            const defn = found.defn;
            transformTypeDef(defn, visitor, null);
            if (defn.type === 'Record' || defn.type === 'Enum') {
                defn.extends.forEach(
                    (ref) =>
                        (collection[refName(ref.ref)] = [
                            ['Type', 'ref'],
                            ref.ref,
                        ]),
                );
            }
            if (found.meta.supercedes) {
                const ref: UserReference = {
                    type: 'user',
                    id: found.meta.supercedes,
                };
                collection[idName(ref.id)] = [['Type', 'ref'], ref];
            }
            if (found.meta.basedOn) {
                const ref: UserReference = {
                    type: 'user',
                    id: found.meta.basedOn,
                };
                collection[idName(ref.id)] = [['Type', 'ref'], ref];
            }
            break;
        }
        case 'Effect':
            transformEffectDef(
                lib.effects.defns[idName(top.id)].defn,
                visitor,
                null,
            );
            break;
        case 'Decorator':
            transformDecoratorDef(
                lib.decorators.defns[idName(top.id)].defn,
                visitor,
                null,
            );
            break;
    }
    return collection;
};

export const topToPretty = (
    ctx: Context,
    env: Env,
    namesForIds: { [key: string]: Array<string> },
    top: TopRef,
) => {
    const k = idName(top.id);
    const name = namesForIds[k] ? namesForIds[k][0] : 'unnamed';
    if (top.type === 'Define') {
        // if (!ctx.library.terms.defns)
        const term = ctx.library.terms.defns[k].defn;
        return items([
            ...metaDecorators(env, ctx.library.terms.defns[k].meta, 'term'),
            declarationToPretty(
                selfEnv(env, {
                    type: 'Term',
                    name: name,
                    ann: term.is,
                }),
                idFromName(k),
                term,
            ),
        ]);
    }
    if (top.type === 'Type') {
        const defn = ctx.library.types.defns[k].defn;
        const meta = metaDecorators(
            env,
            ctx.library.types.defns[k].meta,
            'term',
        );
        const self = selfEnv(env, {
            type: 'Type',
            name: name,
            vbls: defn.typeVbls,
        });
        if (defn.type === 'Record') {
            return items([...meta, recordToPretty(self, top.id, defn, false)]);
        } else {
            return items([...meta, enumToPretty(self, top.id, defn)]);
        }
    }
    if (top.type === 'Decorator') {
        return items([
            ...metaDecorators(
                env,
                ctx.library.decorators.defns[k].meta,
                'decorator',
            ),
            decoratorToPretty(
                false,
                {
                    type: 'Decorator',
                    defn: ctx.library.decorators.defns[k].defn,
                    id: top.id,
                    location: nullLocation,
                    name,
                },
                env,
            ),
        ]);
    }
    if (top.type === 'Effect') {
        return items([
            ...metaDecorators(env, ctx.library.effects.defns[k].meta, 'effect'),
            effectToPretty(env, top.id, ctx.library.effects.defns[k].defn),
        ]);
    }
    throw new Error('Unexpected top type');
};

const cmp = <T>(a: T, b: T, otherwise: number = 0) => {
    if (a == b) {
        return otherwise;
    }
    return a < b ? -1 : 1;
};

export const ctxToSyntax = (ctx: Context): string => {
    // Order of potential dependencies:
    // types before terms ... well except
    // for default values 🤦‍♂️
    // Ok, so types can depend on terms
    // and terms on types
    // and both on decorators
    // and decorators can depend on types,
    // and by extension terms

    const result: Array<PP> = [];

    const env = ctxToEnv(ctx);
    const namesForIds: { [idName: string]: Array<string> } = {};
    getNamesForIds(ctx.library.terms, namesForIds);
    getNamesForIds(ctx.library.types, namesForIds);
    getNamesForIds(ctx.library.decorators, namesForIds);
    getNamesForIds(ctx.library.effects, namesForIds);

    const allTops = allTopLevels(ctx.library).sort((a, b) =>
        cmp(a.type, b.type, cmp(a.id.hash, b.id.hash)),
    );
    // const allDeps: { [id: string]: string } = {};
    // NOW WE SORT
    // FIRST:
    // we need dependencies, from everything onto everything else.

    // ref,Attribute,Tuple,Switch,Enum
    // Those are the kinds of things we might get
    // tuple, enum: oh it's because we specify is: TypeReference
    // switch: the switchcase things, also a type
    // attribute: the 'ref' is a reference, maybe should just straight be a TypeReference?

    // So, anything that's not a `term:ref` means we're dealing with a type reference.
    // and type:ref obvs goes to type ref

    const termTypes: { [key: string]: true } = {};

    const allDeps: { [key: string]: Array<Id> } = {};
    const topDeps: { [key: string]: { [key: string]: [Ctx, Reference] } } = {};

    const idToTop: { [key: string]: TopRef } = {};

    allTops.forEach((top) => {
        idToTop[idName(top.id)] = top;
        const dependencies = topDependencies(ctx.library, top);
        topDeps[idName(top.id)] = dependencies;
        const ids: Array<Id> = (allDeps[idName(top.id)] = []);
        Object.keys(dependencies).forEach((k) => {
            const [c, r] = dependencies[k];
            if (r.type === 'user') {
                ids.push(r.id);
            }
            if (Array.isArray(c) && c[0] === 'Term') {
                termTypes[c[1]] = true;
            }
        });
    });

    const sorted = sortAllDeps(allDeps);

    const removed: { [key: string]: true } = {};

    sorted.forEach((k) => {
        const top = idToTop[k];
        if (
            top.type === 'Type' &&
            ['Some', 'As', 'None'].includes(top.id.hash)
        ) {
            return;
        }

        if (top.type === 'Define') {
            let found = false;
            const defn = ctx.library.terms.defns[k].defn;
            transformTerm(
                defn,
                containsErrorOrRemovedVisitor(() => (found = true), removed),
                null,
            );
            if (found) {
                removed[k] = true;
                console.log(
                    'Removing',
                    k,
                    printToString(termToPretty(env, defn), 100),
                );
                return;
            }
        }

        const deps = topDeps[k];

        result.push(
            items([
                items([
                    atom('// '),
                    ...Object.keys(deps).map((k) => atom(k + ' ')),
                    atom('\n'),
                ]),
                topToPretty(ctx, env, namesForIds, top),
            ]),
        );
    });

    console.log(Object.keys(termTypes).join(','));

    return result
        .map((pp) => printToString(pp, 200, { hideIds: false }))
        .join('\n\n');
};

export const containsErrorOrRemovedVisitor = (
    found: () => void,
    removed: { [key: string]: true },
): Visitor<null> => ({
    Reference: (r) => {
        if (r.type === 'user' && removed[idName(r.id)]) {
            found();
        }
        return null;
    },
    Term: (t) => {
        if (isErrorTerm(t)) {
            found();
        }
        return null;
    },
    Type: (t) => {
        if (isErrorType(t)) {
            found();
        }
        return null;
    },
});
