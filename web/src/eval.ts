// For running the code

import * as t from '@babel/types';
import {
    optimizeAST,
    removeTypescriptTypes,
} from '@jerd/language/src/printing/typeScriptOptimize';

import * as ir from '@jerd/language/src/printing/ir/term';
import { getSortedTermDependencies } from '@jerd/language/src/typing/analyze';
import generate from '@babel/generator';
import { idFromName, idName } from '@jerd/language/src/typing/env';
import { Env, Id, Self, selfEnv, Term } from '@jerd/language/src/typing/types';
import {
    maxUnique,
    termToTs,
} from '@jerd/language/src/printing/typeScriptPrinterSimple';
import { EvalEnv } from './State';
import {
    optimizeDefine,
    optimizeDefineNew,
} from '@jerd/language/src/printing/ir/optimize/optimize';
import { liftEffects } from '@jerd/language/src/printing/pre-ir/lift-effectful';
import { uniquesReallyAreUnique } from '@jerd/language/src/printing/ir/analyze';
import { Expr } from '@jerd/language/src/printing/ir/types';

export class TimeoutError extends Error {}

export const termToJS = (
    env: Env,
    term: Term,
    id: Id,
    irTerms: { [key: string]: { expr: Expr; inline: boolean } },
    asReturn?: boolean,
    withExecutionLimit: boolean = true,
) => {
    term = liftEffects(env, term);
    let irTerm = ir.printTerm(
        env,
        { limitExecutionTime: withExecutionLimit },
        term,
    );
    irTerm = optimizeDefineNew(env, irTerm, id, null);
    // then pop over to glslPrinter and start making things work.
    // try {
    //     uniquesReallyAreUnique(irTerm);
    // } catch (err) {
    //     console.log(err);
    //     console.log(err.toString());
    //     console.log(err.loc, err.location);
    //     throw err;
    // }
    irTerms[idName(id)] = { expr: irTerm, inline: false };
    let termAst: any = termToTs(
        env,
        {
            scope: 'jdScope',
            limitExecutionTime: withExecutionLimit,
            enableTraces: true,
        },
        irTerm,
    );
    let ast = t.file(
        t.program(
            [
                asReturn
                    ? t.returnStatement(termAst)
                    : t.expressionStatement(termAst),
            ],
            [],
            'script',
        ),
    );
    optimizeAST(ast);
    removeTypescriptTypes(ast);
    const { code, map } = generate(ast, {
        sourceMaps: true,
        sourceFileName: idName(id),
    });

    return code;
};

const runWithExecutionLimit = (
    code: string,
    evalEnv: EvalEnv,
    idName: string,
    executionLimit: { ticks: number; maxTime: number; enabled: boolean },
    traceFn: TraceFn,
): any => {
    const jdScope = {
        ...evalEnv,
        builtins: {
            ...evalEnv.builtins,
            checkExecutionLimit: () => {
                if (!executionLimit.enabled) {
                    return;
                }
                executionLimit.ticks += 1;
                // Checking the time is probably a little expensive
                if (executionLimit.ticks % 100 === 0) {
                    if (Date.now() > executionLimit.maxTime) {
                        throw new TimeoutError('Execution took too long');
                    }
                }
            },
        },
        trace: traceFn,
        terms: {
            ...evalEnv.terms,
        },
    };
    console.log('code', code);
    // yay now it's safe from weird scoping things.
    const result = new Function('jdScope', code)(jdScope);
    // This is so recursive calls work
    jdScope.terms[idName] = result;
    return result;
};

export type TraceFn = <T>(
    hash: string,
    idx: number,
    main: T,
    ...args: Array<any>
) => T;

export const runTerm = (
    env: Env,
    term: Term,
    id: Id,
    evalEnv: EvalEnv,
    traceFn: TraceFn,
    withExecutionLimit: boolean = true,
) => {
    const results: { [key: string]: any } = {};

    const deps = getSortedTermDependencies(env, term, id);
    console.log(deps);
    const idn = idName(id);
    const irTerms = {};
    deps.forEach((dep) => {
        if (evalEnv.terms[dep] == null) {
            if (dep !== idn) {
                console.log('Evaluating dependency', dep);
            }
            const depTerm = idn === dep ? term : env.global.terms[dep];
            const self: Self = { type: 'Term', name: dep, ann: term.is };
            const senv = selfEnv(env, self);
            senv.local.unique.current = maxUnique(depTerm) + 1;
            const code = termToJS(
                senv,
                depTerm,
                idFromName(dep),
                irTerms,
                true,
                withExecutionLimit,
            );
            const innerEnv = {
                ...evalEnv,
                terms: { ...evalEnv.terms, ...results },
            };
            // @ts-ignore
            evalEnv.source = evalEnv.source || {};
            // @ts-ignore
            evalEnv.source[dep] = code;
            evalEnv.executionLimit.enabled = true;
            evalEnv.executionLimit.maxTime = Date.now() + 200;
            evalEnv.executionLimit.ticks = 0;
            try {
                const result = runWithExecutionLimit(
                    code,
                    innerEnv,
                    dep,
                    evalEnv.executionLimit,
                    traceFn,
                );
                results[dep] = result;
                console.log('result', dep, result);
            } catch (err) {
                evalEnv.executionLimit.enabled = false;
                throw err;
            }
            evalEnv.executionLimit.enabled = false;
        } else {
            console.log('already evaluated', dep, evalEnv.terms[dep]);
        }
    });
    return results;
};
