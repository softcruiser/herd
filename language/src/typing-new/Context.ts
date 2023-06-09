import { Identifier, Location } from '../parsing/parser-new';
import * as typed from '../typing/types';
import { parseSym } from './hashes';
import { Library } from './Library';

/*
Ok, clean slate. How does this database work?

Let's lean into `toplevel`s.

types: {
    nameToId: {[key: string]: Array<Id>},
    idToType: {
        [key: string]: TypeDefn,
    }
}


*/

export const idToSym = (ctx: Context, id: Identifier) => {
    let unique;
    if (id.hash) {
        unique = parseSym(id.hash!.slice(1));
        if (unique == null) {
            unique = nextUnique(ctx);
            ctx.warnings.push({
                location: id.location,
                text: `Invalid symbol hash ${id.hash}`,
            });
        } else {
            advanceUnique(ctx, unique);
        }
    } else {
        unique = nextUnique(ctx);
    }
    return { unique, name: id.text };
};

export const nextUnique = (ctx: Context) => ++ctx.bindings.unique.current;
export const advanceUnique = (
    { bindings: { unique } }: Context,
    newOne: number,
) => {
    // ok, so what if we come across a unique .... and it's been used already?
    // how do we know which was which?
    if (newOne > unique.current) {
        unique.current = newOne;
    }
};

export type Builtins = {
    terms: {
        [key: string]: typed.Type;
    };
    types: {
        [key: string]: number; // number of type variables accepted.
    };
    ops: {
        unary: {
            [key: string]: Array<{ input: typed.Type; output: typed.Type }>;
        };
        binary: {
            [key: string]: Array<{
                left: typed.Type;
                right: typed.Type;
                output: typed.Type;
            }>;
        };
    };
    decorators: {
        // name, args, target type if applicable. Do I need type arguments?
        // maybe.
        [key: string]: {
            args: Array<typed.Type>;
            target: null | typed.Type;
        };
    };
};

export type Context = {
    rng: () => number;
    library: Library;
    idRemap: { [key: string]: typed.Id };
    builtins: Builtins;
    bindings: Bindings;
    warnings: Array<{ location: Location; text: string }>;
};

export const emptyBindings = (): Bindings => ({
    unique: { current: 0 },
    self: null,
    values: [],
    types: [],
    effects: [],
});

export type TypeBinding = {
    location: Location;
    sym: typed.Symbol;
    subTypes: Array<typed.Id>;
};

export type ValueBinding = {
    location: Location;
    sym: typed.Symbol;
    type: typed.Type | null; // TODO: allow type | null here, for more inference
};

export type Bindings = {
    unique: { current: number };
    self: null | { type: typed.Type; name: string };
    values: Array<ValueBinding>;
    types: Array<TypeBinding>;
    effects: Array<{ location: Location; sym: typed.Symbol }>;
};

export type ConstructorNames = {
    names: { [key: string]: Array<{ id: typed.Id; idx: number }> };
    idToNames: { [key: string]: Array<string> };
};

export type MetaData = {
    created: number;
    author?: string;
    basedOn?: typed.Id;
    // supercededBy?: typed.Id;
    deprecated?: number;
    /** @deprecated this is just while we're transitioning folks */
    tags?: Array<string>;
    // /** @deprecated let's normalize this */
    supercedes?: typed.Id;
};

export type Upgrade<Payload> = {
    author?: string;
    created: number;
    message?: string;
    target: typed.Id;
    payload: Payload;
};

export type NamedDefns<Defn> = {
    // this is a cache of the other?
    // let's just keep one around. we can reconstruct the other.
    names: { [key: string]: Array<typed.Id> };
    defns: {
        [key: string]: {
            defn: Defn;
            meta: MetaData;
        };
    };
    // Ok, so let's actually think about the upgrade story.
    // I'm thinking that when I say that something "uspercedes" another,
    // I'll make you provide a conversion function.
    // Right?
    // Like, if you change a type from {name: string} to {firstName: string, lastNames: string}
    // you'll need to provide a name(newType): string
    // or maybe just a generial backwards(newType): oldType? that's a fair start
    // And if you change the signature of a function, and it doesn't have defaults,
    // then .. you provide some defaults? or some way to construct the new arguments from
    // the old arguments, more like.
    // Yeah, a (...oldArgs) => newFn(etc)
    //
    // And if you don't provide that, then there's no automatic upgrade?
    // or maybe there is ... but ... it'll result in errors that you'll have
    // to fix progressively.
    // So I think that upgrade info ... gets stored separately ...
    // Hmm, maybe like an "upgrades" um dealio
    // ok but where does information about unit tests,
    // oh and also documentation, live?
};

// START HERE: RESOLVE the type errors I just introduced by redefining NamedDefns.

// Ok, how do we do documentation?
// and tests?
// Maybe that's just derived data?
// Like, you do `@documents(Other) SomeDocLiteral`, and we collect those
// somewhere, so you can view the various doc literals that document a given thing
// And you do `@tests(Other) someTestSomeHow` and we collect those?
// We should probably have a concept of "retired" values, separate from
// upgrades ... right? like, deprecated. "don't use this"
//
// hmm does "deprecated" really capture it?
// because I really need a way to ~retire things that have been redefined.
// I mean maybe once I redefine something, if it's not in use at all,
// I just cull it? Move it to an archive library or something?
// I dunno.
// I guess it's fine to just check if the upgrades[] map has an entry for
// the given thing.
