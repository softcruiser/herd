import { Env, Location, Symbol } from '../../../typing/types';
import { debugExpr } from '../../irDebugPrinter';
import { printToString } from '../../printer';
import { collectSymDeclarations } from '../analyze';
import { defaultVisitor, transformExpr } from '../transform';
import { Apply, Expr } from '../types';
import { builtin, callExpression, int, pureFunction } from '../utils';
import { symName } from './optimize';

/**
 * Turn
 * const a = [1,2,3,4]
 * const b = a[2:]
 * const c = b[1]
 *
 * into
 *
 * const a = [1,2,3,4]
 * c = a[3]
 */

export const plus = (env: Env, one: Expr, two: Expr, loc: Location): Apply => {
    return callExpression(
        env,
        builtin('+', loc, pureFunction([int, int], int)),
        [one, two],
        loc,
    );
};

export const minus = (env: Env, one: Expr, two: Expr, loc: Location): Apply => {
    return callExpression(
        env,
        builtin('-', loc, pureFunction([int, int], int)),
        [one, two],
        loc,
    );
};

export const arraySlices = (env: Env, expr: Expr): Expr => {
    const arrayInfos: {
        [key: string]: {
            start: Symbol;
            src: Symbol;
        };
    } = {};
    const resolve = (
        sym: Symbol,
        loc: Location,
    ): { src: Symbol; start: Expr } | null => {
        const n = symName(sym);
        if (!arrayInfos[n]) {
            return null;
        }
        // let {start, src} = arrayInfos[n]
        let start: Expr = {
            type: 'var',
            loc,
            sym: arrayInfos[n].start,
            is: int,
        };
        let src = arrayInfos[n].src;
        const nxt = resolve(arrayInfos[n].src, loc);
        if (nxt != null) {
            src = nxt.src;
            start = plus(env, start, nxt.start, expr.loc);
        }
        return { src, start };
    };

    return transformExpr(expr, {
        ...defaultVisitor,
        expr: (expr) => {
            switch (expr.type) {
                case 'slice':
                    if (expr.value.type === 'var' && expr.end == null) {
                        const res = resolve(expr.value.sym, expr.loc);
                        if (res == null) {
                            return null;
                        }
                        return {
                            ...expr,
                            value: { ...expr.value, sym: res.src },
                            start: plus(env, expr.start, res.start, expr.loc),
                        };
                    }
                    return null;
                case 'arrayIndex':
                    if (expr.value.type === 'var') {
                        const res = resolve(expr.value.sym, expr.loc);
                        if (res == null) {
                            return null;
                        }
                        return {
                            ...expr,
                            value: { ...expr.value, sym: res.src },
                            idx: plus(env, expr.idx, res.start, expr.loc),
                        };
                    }
                    return null;
                case 'arrayLen':
                    if (expr.value.type === 'var') {
                        const res = resolve(expr.value.sym, expr.loc);
                        if (res == null) {
                            return null;
                        }
                        return minus(
                            env,
                            {
                                ...expr,
                                value: { ...expr.value, sym: res.src },
                            },
                            res.start,
                            expr.loc,
                        );
                    }
                    return null;
            }
            return null;
        },
        stmt: (stmt) => {
            // TODO assign as well
            if (
                stmt.type === 'Define' &&
                stmt.value != null &&
                stmt.value.type === 'slice' &&
                stmt.value.end == null &&
                stmt.value.value.type === 'var'
            ) {
                const unique = env.local.unique.current++;
                const sym = {
                    name: stmt.sym.name + '_i',
                    unique: unique,
                };
                arrayInfos[symName(stmt.sym)] = {
                    start: sym,
                    src: stmt.value.value.sym,
                };
                return [
                    stmt,
                    {
                        type: 'Define',
                        is: int,
                        loc: stmt.loc,
                        sym,
                        value: stmt.value.start,
                    },
                ];
            }
            return null;
        },
    });
};
