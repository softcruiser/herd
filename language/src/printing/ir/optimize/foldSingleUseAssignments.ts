import { Env, symbolsEqual } from '../../../typing/types';
import {
    collectSymDeclarations,
    collectSymDeclarationsVisitor,
} from '../analyze';
import {
    defaultVisitor,
    transformBlock,
    transformExpr,
    transformStmt,
} from '../transform';
import { Expr, Stmt } from '../types';
import { Context, symName } from './optimize';

// We need to ensure that
/*
let y = 1
let x = y
y = 3
z = x
*/
// doesn't end up with z being equal to 3.
// So we need to ensure that ... "nothing that is used by
// this thing gets reassigned"?
export const foldSingleUseAssignments = (ctx: Context, expr: Expr): Expr => {
    // console.log('#======[fold]======#');
    let usages: { [v: string]: number } = {};
    let subUses: { [v: string]: { [key: string]: boolean } } = {};
    transformExpr(expr, {
        ...defaultVisitor,
        expr: (expr) => {
            if (expr.type === 'var') {
                const n = symName(expr.sym);
                // console.log('hi', expr.sym, usages[n]);
                // console.log(`[use] ${n}`, expr.loc, usages);
                usages[n] = (usages[n] || 0) + 1;
            }
            return null;
        },
        stmt: (stmt) => {
            if (stmt.type === 'Loop' && stmt.bounds != null) {
                usages[symName(stmt.bounds.sym)] = 2;
            }
            if (stmt.type === 'Loop') {
                // const defined = collectSymDeclarations()
                const {
                    // decls,
                    // undefinedUses,
                    defined,
                    visitor,
                } = collectSymDeclarationsVisitor();
                transformStmt(stmt, visitor);

                // Invalidate anything accessed in here
                transformBlock(stmt.body, {
                    ...defaultVisitor,
                    expr: (expr) => {
                        if (expr.type === 'var' && !defined[expr.sym.unique]) {
                            usages[symName(expr.sym)] = 2;
                        }
                        return null;
                    },
                });
                // Don't go into the loop
                // return false;
            }
            if (stmt.type === 'ArraySet') {
                usages[symName(stmt.sym)] = 2;
            }
            if (stmt.type === 'Assign') {
                const en = symName(stmt.sym);
                // hm ok, assign isnt strictly a use...
                usages[en] = (usages[en] || 0) + 1;
                // console.log('assign', usages, en);

                // We're reassigning something! Anything that uses
                // this variable, but that hasn't yet seen its first use,
                // should be "poisoned".
                Object.keys(subUses[en] || {}).forEach((k) => {
                    // Special case: if the value we're assigning to is the
                    // single-use variable itself, we're fine
                    if (
                        stmt.value.type === 'var' &&
                        symName(stmt.value.sym) === k
                    ) {
                        return;
                    }
                    if (usages[k] !== 1) {
                        usages[k] = 2; // disqualify from single-use
                    }
                });
            } else if (stmt.type === 'Define' && stmt.value != null) {
                const top = symName(stmt.sym);
                // const subs: {[key: string]: boolean} = {}
                transformExpr(stmt.value, {
                    ...defaultVisitor,
                    expr: (expr) => {
                        if (expr.type === 'var') {
                            const en = symName(expr.sym);
                            if (!subUses[en]) {
                                subUses[en] = {};
                            }
                            subUses[en][top] = true;
                        }
                        return null;
                    },
                });
                // subUses[symName(stmt.sym)] = subs
                // return false;
            }
            return null;
        },
    });
    const singles: { [key: string]: boolean } = {};
    let found = false;
    Object.keys(usages).forEach((k) => {
        if (usages[k] === 1) {
            found = true;
            singles[k] = true;
        }
    });
    // console.log(usages, singles);
    if (!found) {
        return expr;
    }
    const defns: { [key: string]: Expr } = {};
    // console.log('FOLSING SINGLE');
    // console.log(singles, usages, subUses);
    return transformExpr(expr, {
        ...defaultVisitor,
        stmt: (stmt) => {
            if (stmt.type === 'Define' && singles[symName(stmt.sym)]) {
                if (stmt.value != null) {
                    defns[symName(stmt.sym)] = stmt.value;
                }
                // console.log('Removing', stmt.sym, stmt.value);
                return [];
            }
            // if(stmt.type === 'Assign' && stmt.value.type === 'var')
            if (
                stmt.type === 'Assign' &&
                stmt.value.type === 'var' &&
                // TODO: assigns shouldn't increase usage I dont think
                // singles[symName(stmt.sym)] &&
                symbolsEqual(stmt.sym, stmt.value.sym)
            ) {
                // defns[symName(stmt.sym)] = stmt.value;
                return [];
            }
            return null;
        },
        expr: (value) => {
            if (value.type === 'var') {
                let v = defns[symName(value.sym)];
                if (v != null) {
                    /// ooooooooooooooooooooh
                    /// hrm ok here's the bug, and I don't like it
                    // The problem is, I return this value,
                    // and the visitor doesn't re-visit it.
                    // And in a lot of cases, if the thing has been
                    // modified, then I don't care about re-visiting.
                    // But in this case I do.
                    // I wonder if there are subtle bugs hiding here.
                    // BUT also, I wonder why I wasn't able to make a
                    // test case that would trigger this issue.
                    while (v.type === 'var' && defns[symName(v.sym)]) {
                        v = defns[symName(v.sym)];
                    }
                    return v;
                }
            }
            return null;
        },
    });
};
