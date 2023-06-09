// yo this is a fine though

import * as React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Cell2 } from './Cell2';
import {
    addDefine,
    addExpr,
    idFromName,
    typeToplevelT,
} from '@jerd/language/src/typing/env';
import { newEnv } from '@jerd/language/src/typing/types';
import { parse } from '@jerd/language/src/parsing/grammar';
import { newEvalEnv } from '../persistence';
import { presetEnv } from '@jerd/language/src/typing/preset';

const renderCell = (raw: string) => {
    let env = presetEnv({});
    const parsed = parse(raw);
    const top = typeToplevelT(env, parsed[0]);
    if (top.type !== 'Define') {
        throw new Error(`not a define`);
    }
    const { env: nenv, id } = addDefine(env, top.name, top.term);
    env = nenv;

    render(
        <Cell2
            maxWidth={1000}
            cell={{
                id: 'cid',
                order: 0,
                content: {
                    type: 'term',
                    id: id,
                },
            }}
            env={env}
            getHistory={() => []}
            focused={{ tick: 1, active: false }}
            evalEnv={newEvalEnv({})}
            plugins={{}}
            dispatch={(_) => {}}
        />,
    );
};

describe('Cell', () => {
    it('clicking should work', async () => {
        // const id = idFromName('somehash');
        renderCell(`const hello = (arg: int) => 10`);

        // Arrange
        const node = screen.getByText('arg');
        expect(window.getComputedStyle(node).outline).toBeFalsy();

        // Act
        userEvent.click(node);

        // It should have an outline
        expect(window.getComputedStyle(node).outline).toBeTruthy();
    });

    it('key nav should work', () => {
        // const id = idFromName('somehash');
        renderCell(`const hello = (arg: int) => 10.0`);

        // Arrange
        const node = screen.getByText('arg');
        expect(window.getComputedStyle(node).outline).toBeFalsy();

        // Act
        userEvent.click(node);
        // It should have an outline
        expect(window.getComputedStyle(node).outline).toBeTruthy();
        // Now move right
        userEvent.keyboard('{arrowright}');

        // It shouldn't have an outline
        expect(window.getComputedStyle(node).outline).toBeFalsy();
        // The type dealio should have an outline
        expect(
            window.getComputedStyle(screen.getAllByText('int')[1]).outline,
        ).toBeTruthy();
    });
});
