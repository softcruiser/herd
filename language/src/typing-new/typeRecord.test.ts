import { idName } from '../typing/env';
import * as preset from '../typing/preset';
import { LambdaType, nullLocation } from '../typing/types';
import { addEffect, addRecord, addTerm } from './Library';
import {
    customMatchers,
    errorSerilaizer,
    fakeOp,
    newContext,
    parseExpression,
    parseToplevels,
    rawSnapshotSerializer,
    showTermErrors,
    showTypeErrors,
    termToString,
    warningsSerializer,
} from './test-utils';
import { findErrors } from './typeRecord';

expect.extend(customMatchers);
expect.addSnapshotSerializer(rawSnapshotSerializer);
expect.addSnapshotSerializer(errorSerilaizer);
expect.addSnapshotSerializer(warningsSerializer);

describe('typeRecord', () => {
    it(`let's try something simple`, () => {
        const ctx = newContext();

        let id;
        [ctx.library, id] = addRecord(
            ctx.library,
            preset.recordDefn([preset.int]),
            'Hello',
            ['hello'],
        );

        const res = parseExpression(ctx, `Hello{hello: 10}`);
        expect(ctx.warnings).toHaveLength(0);
        expect(termToString(ctx, res)).toEqual(
            `Hello#${idName(id)}{hello#${idName(id)}#0: 10}`,
        );
        expect(res.is).toEqualType(preset.refType(id), ctx);
        expect(res).toNotHaveErrors(ctx);
    });

    it(`record without items!`, () => {
        const ctx = newContext();

        let id;
        [ctx.library, id] = addRecord(
            ctx.library,
            preset.recordDefn([]),
            'Hello',
            [],
        );

        const res = parseExpression(ctx, `Hello`);
        expect(ctx.warnings).toHaveLength(0);
        expect(termToString(ctx, res)).toEqual(`Hello#${idName(id)}`);
        expect(res.is).toEqualType(preset.refType(id), ctx);
        expect(res).toNotHaveErrors(ctx);
    });

    it(`record all defaults!`, () => {
        const ctx = newContext();

        let id;
        [ctx.library, id] = addRecord(
            ctx.library,
            {
                ...preset.recordDefn([preset.int]),
                defaults: {
                    '0': {
                        id: null,
                        idx: 0,
                        value: preset.intLiteral(10, nullLocation),
                    },
                },
            },
            'Hello',
            ['ten'],
        );

        const res = parseExpression(ctx, `Hello`);
        expect(ctx.warnings).toHaveLength(0);
        expect(termToString(ctx, res)).toEqual(`Hello#${idName(id)}`);
        expect(res.is).toEqualType(preset.refType(id), ctx);
        expect(res).toNotHaveErrors(ctx);
    });

    it(`record some defaults!`, () => {
        const ctx = newContext();

        let id;
        [ctx.library, id] = addRecord(
            ctx.library,
            {
                ...preset.recordDefn([preset.int, preset.float]),
                defaults: {
                    '0': {
                        id: null,
                        idx: 0,
                        value: preset.intLiteral(10, nullLocation),
                    },
                },
            },
            'Hello',
            ['ten', 'what'],
        );

        const res = parseExpression(ctx, `Hello`);
        expect(ctx.warnings).toHaveLength(0);
        expect(termToString(ctx, res)).toEqual(
            `Hello#${idName(id)}{what#${idName(id)}#1: _}`,
        );
        expect(res.is).toEqualType(preset.refType(id), ctx);
        expect(showTermErrors(ctx, res)).toMatchInlineSnapshot(
            `[Hole] at 1:1-1:6`,
        );
    });

    it(`more recent record gets precedence`, () => {
        const ctx = newContext();

        let id2;
        [ctx.library, id2] = addRecord(
            ctx.library,
            preset.recordDefn([preset.float]),
            'Hello',
            ['hello'],
        );

        let id;
        [ctx.library, id] = addRecord(
            ctx.library,
            preset.recordDefn([preset.int]),
            'Hello',
            ['hello'],
        );

        const res = parseExpression(ctx, `Hello{hello: 10}`);
        expect(ctx.warnings).toHaveLength(0);
        expect(res.is).toEqualType(preset.refType(id), ctx);
        expect(res).toNotHaveErrors(ctx);
        expect(termToString(ctx, res)).toEqual(
            `Hello#${idName(id)}{hello#${idName(id)}#0: 10}`,
        );
    });

    it(`record that doesn't have type errors gets precedence`, () => {
        const ctx = newContext();

        let id;
        [ctx.library, id] = addRecord(
            ctx.library,
            preset.recordDefn([preset.int]),
            'Hello',
            ['hello'],
        );

        let id2;
        [ctx.library, id2] = addRecord(
            ctx.library,
            preset.recordDefn([preset.string]),
            'Hello',
            ['hello'],
        );

        const res = parseExpression(ctx, `Hello{hello: 10}`);
        expect(ctx.warnings).toHaveLength(0);
        expect(res.is).toEqualType(preset.refType(id), ctx);
        expect(res).toNotHaveErrors(ctx);
        expect(termToString(ctx, res)).toEqual(
            `Hello#${idName(id)}{hello#${idName(id)}#0: 10}`,
        );
    });

    it(`record with the right name wins`, () => {
        const ctx = newContext();

        let id;
        [ctx.library, id] = addRecord(
            ctx.library,
            preset.recordDefn([preset.int]),
            'Hello',
            ['hello'],
        );

        let id2;
        [ctx.library, id2] = addRecord(
            ctx.library,
            preset.recordDefn([preset.float]),
            'Hello',
            ['what'],
        );

        const res = parseExpression(ctx, `Hello{hello: 10}`);
        expect(ctx.warnings).toHaveLength(0);
        expect(res.is).toEqualType(preset.refType(id), ctx);
        expect(res).toNotHaveErrors(ctx);
        expect(termToString(ctx, res)).toEqual(
            `Hello#${idName(id)}{hello#${idName(id)}#0: 10}`,
        );
    });
});
