import { Location } from '../parsing/parser-new';
import { idName } from '../typing/env';
import * as preset from '../typing/preset';
import { nullLocation, Symbol } from '../typing/types';
import { addTerm } from './Library';
import {
    customMatchers,
    errorSerilaizer,
    newContext,
    parseExpression,
    rawSnapshotSerializer,
    showTermErrors,
    termToString,
    warningsSerializer,
} from './test-utils';

expect.extend(customMatchers);
expect.addSnapshotSerializer(rawSnapshotSerializer);
expect.addSnapshotSerializer(errorSerilaizer);
expect.addSnapshotSerializer(warningsSerializer);

describe('typeBlock', () => {
    it('should work', () => {
        const ctx = newContext();

        const res = parseExpression(ctx, `{ const x = 10; x }`);
        expect(res).toNotHaveErrors(ctx);
        expect(res.is).toEqualType(preset.int, ctx);
        expect(ctx.warnings).toHaveLength(0);
        expect(termToString(ctx, res)).toMatchInlineSnapshot(`
            {
                const x#:1 = 10;
                x#:1;
            }
        `);
    });

    it('should work with explicit sym specified', () => {
        const ctx = newContext();

        const res = parseExpression(ctx, `{ const x#:2 = 10; x }`);
        expect(res).toNotHaveErrors(ctx);
        expect(res.is).toEqualType(preset.int, ctx);
        expect(ctx.warnings).toHaveLength(0);
        expect(termToString(ctx, res)).toMatchInlineSnapshot(`
            {
                const x#:2 = 10;
                x#:2;
            }
        `);
    });

    it('should recover from mismatched explicit sym hashes', () => {
        const ctx = newContext();

        const res = parseExpression(ctx, `{ const x#:2 = 10; x#:3 }`);
        expect(res).toNotHaveErrors(ctx);
        expect(res.is).toEqualType(preset.int, ctx);
        expect(ctx.warnings).toMatchInlineSnapshot(
            `1:20-1:24: Unable to resolve term hash #:3`,
        );
        expect(termToString(ctx, res)).toMatchInlineSnapshot(`
            {
                const x#:2 = 10;
                x#:2;
            }
        `);
    });

    it('should recover from bad symbol hash', () => {
        const ctx = newContext();

        const res = parseExpression(ctx, `{ const x#bad = 10; x }`);
        expect(res).toNotHaveErrors(ctx);
        expect(res.is).toEqualType(preset.int, ctx);
        expect(ctx.warnings).toMatchInlineSnapshot(
            `1:9-1:14: Invalid symbol hash #bad`,
        );
        expect(termToString(ctx, res)).toMatchInlineSnapshot(`
            {
                const x#:1 = 10;
                x#:1;
            }
        `);
    });

    it('should work empty', () => {
        const ctx = newContext();

        const res = parseExpression(ctx, `{}`);
        expect(res).toNotHaveErrors(ctx);
        expect(res.is).toEqualType(preset.void_, ctx);
        expect(ctx.warnings).toHaveLength(0);
        expect(termToString(ctx, res)).toMatchInlineSnapshot(`{}`);
    });

    it('should override', () => {
        const ctx = newContext();

        const res = parseExpression(ctx, `{ const x = 10; const x = 1.1; x }`);
        expect(res).toNotHaveErrors(ctx);
        expect(res.is).toEqualType(preset.float, ctx);
        expect(ctx.warnings).toHaveLength(0);
        expect(termToString(ctx, res)).toMatchInlineSnapshot(`
            {
                const x#:1 = 10;
                const x#:2 = 1.1;
                x#:2;
            }
        `);
    });

    it('should do annotations', () => {
        const ctx = newContext();
        ctx.builtins.types.float = 0;
        const res = parseExpression(ctx, `{ const x: float = 10; 5; x }`);
        expect(res).toNotHaveErrors(ctx);
        expect(res.is).toEqualType(preset.float, ctx);
        expect(ctx.warnings).toHaveLength(0);
        expect(termToString(ctx, res)).toMatchInlineSnapshot(`
            {
                const x#:1 = 10.0;
                5;
                x#:1;
            }
        `);
    });

    it('should do explicit hashes', () => {
        const ctx = newContext();
        ctx.builtins.types.float = 0;
        const res = parseExpression(ctx, `{ const x#:100: float = 10; x }`);
        expect(res).toNotHaveErrors(ctx);
        expect(res.is).toEqualType(preset.float, ctx);
        expect(ctx.warnings).toHaveLength(0);
        expect(termToString(ctx, res)).toMatchInlineSnapshot(`
            {
                const x#:100 = 10.0;
                x#:100;
            }
        `);
    });

    it('should fallback annotations', () => {
        const ctx = newContext();
        ctx.builtins.types.float = 0;
        const res = parseExpression(
            ctx,
            `{ const a: int = 10; const x: float = a; x }`,
        );
        expect(showTermErrors(ctx, res)).toMatchInlineSnapshot(`
Expected [Not Found: int], found int#builtin : 10 at 1:18-1:20
Expected float#builtin, found [Not Found: int] : a#:1 at 1:39-1:40
`);
        expect(res.is).toEqualType(preset.float, ctx);
        expect(ctx.warnings).toHaveLength(0);
        expect(termToString(ctx, res)).toMatchInlineSnapshot(`
            {
                const a#:1 = 10;
                const x#:2 = a#:1;
                x#:2;
            }
        `);
    });
});
