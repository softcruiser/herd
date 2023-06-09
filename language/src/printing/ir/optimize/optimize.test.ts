import { hasInvalidGLSL } from '../../glslPrinter';
import { flattenImmediateAssigns } from './flattenImmediateAssigns';
import { flattenImmediateCalls2 } from './flattenImmediateCalls2';
import { foldConstantAssignments } from './foldConstantAssignments';
import { foldSingleUseAssignments } from './foldSingleUseAssignments';
import { inlineCallsThatReturnFunctions } from './inlineCallsThatReturnFunctions';
import { specializeFunctionsCalledWithLambdas } from './monoconstant';
import { combineOpts, optimizeRepeatedly } from './optimize';
import {
    expectValidGlsl,
    runFixture,
    runOpt,
    snapshotSerializer,
} from './optimizeTestUtils';
import { removeUnusedVariables } from './removeUnusedVariables';
import { optimizeTailCalls, tailCallRecursion } from './tailCall';

expect.addSnapshotSerializer(snapshotSerializer);

const combinedOptimize = optimizeRepeatedly([
    specializeFunctionsCalledWithLambdas,
    inlineCallsThatReturnFunctions,
    flattenImmediateCalls2,
    foldConstantAssignments(true),
    foldSingleUseAssignments,
    flattenImmediateAssigns,
    removeUnusedVariables,
]);

describe('removeUnusedVariable', () => {
    it('should work', () => {
        expect(
            runFixture(
                `{
                    const x = 10;
                    const y = 5;
                    y + 2
                }`,
                removeUnusedVariables,
            ),
        ).toMatchInlineSnapshot(`
            const expr0#👩‍❤️‍💋‍👩🤭🍾: int = ((): int => {
                const y#:1: int = 5;
                return y#:1 + 2;
            })()
        `);
    });

    it('should work', () => {
        expect(
            runFixture(
                `{
                    const x = 10;
                    const y = 11;
                    (y: int) => {
                        const z = x;
                        x + 2 + y
                    }
                }`,
                removeUnusedVariables,
            ),
        ).toMatchInlineSnapshot(`
            const expr0#🏊‍♂️🙇‍♂️🌃😃: (int) => int = ((): (
                int,
            ) => int => {
                const x#:0: int = 10;
                return (y#:2: int): int => x#:0 + 2 + y#:2;
            })()
        `);
    });

    // TODO figure out how to test an ineffectual assignment...
    // where something is Defined, and then /updated/, but never
    // accessed...
});

describe('glsl in concert', () => {
    it('wont work yet', () => {
        const result = runFixture(
            `const getIt = (v: int) => if v > 10 {
                () => 20
            } else {
                () => 30
            }
    
            () => {
                const m = getIt(10);
                m() + 10
            }`,
            combinedOptimize,
        );
        expect(result).toMatchInlineSnapshot(`
            const expr0#🧖‍♀️: () => int = (): int => {
                const m#:0: () => int;
                if 10 > 10 {
                    m#:0 = (): int => 20;
                } else {
                    m#:0 = (): int => 30;
                };
                m#:0 = m#:0;
                return m#:0() + 10;
            }
        `);

        // so
        /*
              const expr0#💟: () => int = () => ((v#:1: int) => {

                // This is recognized as "it returns divergent .. uh .. hm"
                // nope maybe not yet actually.
                // Because the return value isn't used.
                // Maybe we only process the first one
                // and /then/ the return value is used. Right?

                // Hm no the inner one needs to be flattened first 🤔

                // Yeah, so if we're flattening a thing ... that returns
                // a function
                // and it's applied ...
                // hmm so we're looking two-deep, right?

                return (() => {
                    if v#:1 > 10{
                        return (() => () => 20)();
                    } else {
                        return (() => () => 30)();
                    };
                })()

            })(10)() + 10



        */

        // OK so the way to deal with this, I think, is:
        // flattenImmediateCalls should ... maybe test for divergent
        // logic & refuse? hm no that's not it. hm because some targets
        // will be able to handle lambdas, but flattening immediates will
        // still be nice.

        // *before* we flatten immediate calls
        // we need to to a transform that ...
        // finds functions that have divergent "return a function" dealios
        // and ... ugh ok I think this is getting pretty awkward very fast.
        // because I would need to know if a lambda function ... that's not
        // oh wait, we'll always have functions be determined. Good story.
        //
        // ok yeah, so if we have a function that's divergent
        // then we convert it ... and all callers (ooh that's not great)
        // so that it's CPS. hmm. hm hmmm.
        // Ok, so what if:
        // *when we inline a function* ... and we determine that it's CPS
        // OR wait actually yeah, flattenImmediateCalls /could/ do this work.
        // If it sees that we're returning divergent functions (uh maybe have
        // a flag or something to determine if we care, and if we do), then
        // switch to CPS mode folks
        // Now CPS mode has to be done /at the function level/ right?
        // well
        // hm
        // can I get away with block?
        // what would it be that we're CPSing?
        // well let's maybe try function first, and see how we like it

        // expectValidGlsl(result);
    });

    it('should work', () => {
        const result = runFixture(
            `
            const estimateNormal = (sceneSDF: (float) ={}> float): float ={}> sceneSDF(1.23)
            
            const callIt = (
                sceneSDF: (float) ={}> float,
                eye: float,
            ): float ={}> {
                sceneSDF(eye);
            }
            
            const marchNormals = (sceneSDF: (float) ={}> float) ={}> (coord: float) ={}> {
                estimateNormal(sceneSDF) + coord
            }
            
            const superSample = (sdf: (float) ={}> float) ={}> (coord: float) ={}> {
                sdf(coord) + 23.0
            }
            
            {
                const x = marchNormals(
                    sceneSDF: (pos: float): float ={}> 23.0 + pos
                );

            superSample(
                sdf: x,
            )
            }
            `,
            optimizeRepeatedly([
                // optimizeRepeatedly([
                specializeFunctionsCalledWithLambdas,
                inlineCallsThatReturnFunctions,
                flattenImmediateCalls2,
                foldConstantAssignments(true),
                flattenImmediateAssigns,
                foldSingleUseAssignments,
                // ]),
                removeUnusedVariables,
                // foldConstantAssignments(true),
                // flattenImmediateAssigns,
                // foldSingleUseAssignments,
                // removeUnusedVariables,
            ]),
        );

        expect(result).toMatchInlineSnapshot(`
            const expr0_lambda#🦑👨‍👧‍👦🙍‍♂️: (float) => float = (
                pos#:0: float,
            ): float => 23 + pos#:0

            const estimateNormal_specialization#🦢🦦🧘😃: () => float = (): float => expr0_lambda#🦑👨‍👧‍👦🙍‍♂️(
                1.23,
            )

            const expr0#🏌️🌤️🏬😃: (float) => float = (
                coord#:4: float,
            ): float => estimateNormal_specialization#🦢🦦🧘😃() + coord#:4 + 23
        `);

        expectValidGlsl(result);
    });

    it('should work', () => {
        const result = runFixture(
            `
            const estimateNormal = (sceneSDF: (int) ={}> float): float ={}> sceneSDF(1)
            
            const callIt = (
                sceneSDF: (int) ={}> float,
                eye: int,
            ): float ={}> {
                sceneSDF(eye);
            }
            
            const marchNormals = (sceneSDF: (int) ={}> float) ={}> (coord: float) ={}> {
                const dist = callIt(sceneSDF, 1000);
                estimateNormal(sceneSDF) + dist + coord
            }
            
            const superSample = (sdf: (float) ={}> float) ={}> (coord: float) ={}> {
                sdf(coord)
            }
            
            superSample(
                sdf: marchNormals(
                    sceneSDF: (pos: int): float ={}> 23.0
                ),
            )
            `,
            optimizeRepeatedly([
                specializeFunctionsCalledWithLambdas,
                inlineCallsThatReturnFunctions,
                flattenImmediateCalls2,
                foldConstantAssignments(true),
                flattenImmediateAssigns,
                foldSingleUseAssignments,
                removeUnusedVariables,
            ]),
        );

        expect(result).toMatchInlineSnapshot(`
            const expr0_lambda#🍽️👩‍👧💐: (int) => float = (
                pos#:0: int,
            ): float => 23

            const callIt_specialization#🧑‍🦽: (int) => float = (
                eye#:1: int,
            ): float => expr0_lambda#🍽️👩‍👧💐(eye#:1)

            const estimateNormal_specialization#🧜‍♂️🧩😵😃: () => float = (): float => expr0_lambda#🍽️👩‍👧💐(
                1,
            )

            const expr0#⛺😘🙎: (float) => float = (
                coord#:2: float,
            ): float => estimateNormal_specialization#🧜‍♂️🧩😵😃() + callIt_specialization#🧑‍🦽(
                1000,
            ) + coord#:2
        `);

        result.inOrder.forEach((k) => {
            result.irTerms[k].expr = runOpt(
                result.env,
                result.irTerms[k].expr,
                optimizeRepeatedly([
                    removeUnusedVariables,
                    flattenImmediateCalls2,
                ]),
            );
        });

        // const last = result.inOrder[result.inOrder.length - 1];
        // result.irTerms[last].expr = runOpt(
        //     result.env,
        //     result.irTerms[last].expr,
        //     optimizeRepeatedly([removeUnusedVariables, flattenImmediateCalls2]),
        // );
        expect(result).toMatchInlineSnapshot(`
            const expr0_lambda#🍽️👩‍👧💐: (int) => float = (
                pos#:0: int,
            ): float => 23

            const callIt_specialization#🧑‍🦽: (int) => float = (
                eye#:1: int,
            ): float => expr0_lambda#🍽️👩‍👧💐(eye#:1)

            const estimateNormal_specialization#🧜‍♂️🧩😵😃: () => float = (): float => expr0_lambda#🍽️👩‍👧💐(
                1,
            )

            const expr0#⛺😘🙎: (float) => float = (
                coord#:2: float,
            ): float => estimateNormal_specialization#🧜‍♂️🧩😵😃() + callIt_specialization#🧑‍🦽(
                1000,
            ) + coord#:2
        `);

        expectValidGlsl(result);
    });

    it('more lambda', () => {
        const result = runFixture(
            `const estimateNormal = (sceneSDF: (float) ={}> float): float ={}> sceneSDF(2.3 + 1.0) + 1.2

            const callIt = (
                sceneSDF: (float) ={}> float,
                eye: float,
            ): float ={}> {
                sceneSDF(eye);
            }
            
            const marchNormals = (sceneSDF: (float) ={}> float) ={}> (coord: float) ={}> {
                const dist = callIt(sceneSDF, 0.1 + 2.3);
                estimateNormal(sceneSDF) - dist
            }
            
            const superSample = (sdf: (float) ={}> float) ={}> (coord: float) ={}> {
                sdf(coord)
            }
            
            superSample(
                sdf: marchNormals(
                    sceneSDF: (pos: float): float ={}> pos + 2.3 
                ),
            )
            `,
            combinedOptimize,
        );

        expect(result).toMatchInlineSnapshot(`
            const expr0_lambda#💦: (float) => float = (
                pos#:0: float,
            ): float => pos#:0 + 2.3

            const estimateNormal_specialization#🏬🏥😣: () => float = (): float => expr0_lambda#💦(
                2.3 + 1,
            ) + 1.2

            const callIt_specialization#🎠✌️🧑‍🎨😃: (float) => float = (
                eye#:1: float,
            ): float => expr0_lambda#💦(eye#:1)

            const expr0#🚒🏌️🧗😃: (float) => float = (
                coord#:2: float,
            ): float => estimateNormal_specialization#🏬🏥😣() - callIt_specialization#🎠✌️🧑‍🎨😃(
                0.1 + 2.3,
            )
        `);

        expectValidGlsl(result);
    });

    it('multi-use lambda', () => {
        const result = runFixture(
            `() => {
                const doThings = (x: int) => {
                    const z = x + 2;
                    z * z
                };
                doThings(2) + doThings(4)
            }`,
            optimizeRepeatedly([
                specializeFunctionsCalledWithLambdas,
                inlineCallsThatReturnFunctions,
                flattenImmediateCalls2,
                foldConstantAssignments(true),
                foldSingleUseAssignments,
                flattenImmediateAssigns,
                removeUnusedVariables,
            ]),
        );
        expect(result).toMatchInlineSnapshot(`
            const expr0#👽: () => int = (): int => {
                const z#:4: int = 2 + 2;
                const z#:6: int = 4 + 2;
                return z#:4 * z#:4 + z#:6 * z#:6;
            }
        `);
        expectValidGlsl(result);
    });

    it('recursion and such', () => {
        const result = runFixture(
            `const rec tailMe = (max: int, collect: int, most: int): int => {
				if max <= most {
					collect
				} else {
					tailMe(max - 2, collect + 10, most)
				}
			}

			tailMe(20, 0, 1)

			tailMe(1, 0, 2)
			`,
            optimizeRepeatedly([
                specializeFunctionsCalledWithLambdas,
                inlineCallsThatReturnFunctions,
                flattenImmediateCalls2,
                foldConstantAssignments(true),
                foldSingleUseAssignments,
                flattenImmediateAssigns,
                removeUnusedVariables,
                optimizeTailCalls,
            ]),
        );
        expect(result).toMatchInlineSnapshot(`
            const tailMe#🦷😸⛽: (int, int, int) => int = (
                max#:0: int,
                collect#:1: int,
                most#:2: int,
            ): int => {
                for (; max#:0 > most#:2; max#:0 = max#:0 - 2) {
                    collect#:1 = collect#:1 + 10;
                    continue;
                };
                return collect#:1;
            }

            const expr1#💒: int = tailMe#🦷😸⛽(1, 0, 2)

            const expr0#🌝🐌🤣: int = tailMe#🦷😸⛽(20, 0, 1)
        `);
        expectValidGlsl(result);
    });
});
