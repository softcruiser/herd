import { idName } from '../typing/env';
import { Id, idsEqual, Type } from '../typing/types';
import { Library } from './Library';
import { Context } from './Context';

export const hasSubType = (ctx: Context, type: Type, id: Id) => {
    if (type.type === 'var') {
        const found = ctx.bindings.types.find(
            (b) => b.sym.unique === type.sym.unique,
        );
        if (!found) {
            return false;
        }
        for (let sid of found.subTypes) {
            if (idsEqual(id, sid)) {
                return true;
            }
            const { defn: decl } = ctx.library.types.defns[idName(sid)];
            if (decl.type !== 'Record') {
                return false;
            }
            const allSubTypes = getAllSubTypes(
                ctx.library,
                decl.extends.map((t) => t.ref.id),
            );
            if (allSubTypes.find((x) => idsEqual(id, x)) != null) {
                return true;
            }
        }
    }
    if (type.type !== 'ref' || type.ref.type === 'builtin') {
        return false;
    }
    if (idsEqual(type.ref.id, id)) {
        return true;
    }
    const { defn: decl } = ctx.library.types.defns[idName(type.ref.id)];
    if (decl.type === 'Enum') {
        return false;
    }
    const allSubTypes = getAllSubTypes(
        ctx.library,
        decl.extends.map((t) => t.ref.id),
    );
    return allSubTypes.find((x) => idsEqual(id, x)) != null;
};

export const getAllSubTypes = (lib: Library, extend: Array<Id>): Array<Id> => {
    return ([] as Array<Id>).concat(
        ...extend.map((id) => {
            const { defn } = lib.types.defns[idName(id)];
            if (defn.type !== 'Record') {
                return [];
            }
            return [id].concat(
                getAllSubTypes(
                    lib,
                    defn.extends.map((t) => t.ref.id),
                ),
            );
        }),
    );
};
