// The app

import * as React from 'react';
import parse, { Toplevel } from '@jerd/language/src/parsing/parser';

import {
    Env,
    newWithGlobal,
    Type,
    ToplevelT,
} from '@jerd/language/src/typing/types';
import { Content } from './State';

import { printToAttributedText } from '@jerd/language/src/printing/printer';
import { toplevelToPretty } from '@jerd/language/src/printing/printTsLike';
import { idName, typeToplevelT } from '@jerd/language/src/typing/env';
import { renderAttributedText } from './Cell/Render';
import AutoresizeTextarea from 'react-textarea-autosize';
import { loadPrelude } from '@jerd/language/src/printing/loadPrelude';
import { loadBuiltins } from '@jerd/language/src/printing/loadBuiltins';
import { updateToplevel } from './toplevels';

const key = 'jd-ast-debug';

const colorsRaw =
    '1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf';
const colors: Array<string> = [];
for (let i = 0; i < colorsRaw.length; i += 6) {
    colors.push('#' + colorsRaw.slice(i, i + 6));
}

export default () => {
    const [text, setText] = React.useState(
        () => window.localStorage.getItem(key) || 'const x = 10',
    );
    React.useEffect(() => {
        window.localStorage.setItem(key, text);
    }, [text]);
    const [env, typed, err]: [
        Env,
        Array<{ top: ToplevelT; content: Content }>,
        any,
    ] = React.useMemo(() => {
        const builtinsMap = loadBuiltins();
        const typedBuiltins: { [key: string]: Type } = {};
        Object.keys(builtinsMap).forEach((b) => {
            const v = builtinsMap[b];
            if (v != null) {
                typedBuiltins[b] = v;
            }
        });
        const global = loadPrelude(typedBuiltins);

        let env = newWithGlobal(global);
        if (text.trim().length === 0) {
            return [env, [], null];
        }
        let toplevels = [];
        try {
            const parsed: Array<Toplevel> = parse(text);
            for (let item of parsed) {
                const top = typeToplevelT(env, item);
                const res = updateToplevel(env, top);
                env = res.env;
                toplevels.push({ top, content: res.content });
            }

            return [env, toplevels, null];
        } catch (err) {
            return [
                env,
                toplevels,
                {
                    type: 'error',
                    message: (err as any).message,
                    location: (err as any).location,
                },
            ];
        }
    }, [text]);
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                padding: 16,
                width: 600,
                margin: '0 auto',
                backgroundColor: '#1E1E1E',
                color: '#D4D4D4',
            }}
        >
            <AutoresizeTextarea
                value={text}
                onChange={(evt) => setText(evt.target.value)}
                style={{ width: 600 }}
                autoFocus
            />
            <div
                style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: '"Source Code Pro", monospace',
                    padding: 8,
                    position: 'relative',
                }}
            >
                {typed.map((item, i) => (
                    <div
                        key={i}
                        style={{ paddingTop: 16, position: 'relative' }}
                    >
                        {renderAttributedText(
                            env.global,
                            printToAttributedText(
                                toplevelToPretty(env, item.top),
                                50,
                            ),
                            null,
                            false,
                            colors,
                        )}
                        {/* @ts-ignore */}
                        <div style={styles.hash}>
                            {/*
                            @ts-ignore */}#
                            {idName(item.content.id)}
                        </div>
                    </div>
                ))}
            </div>
            {err != null ? (
                <div
                    style={{
                        backgroundColor: 'red',
                        // width: 600,
                        marginTop: 16,
                        padding: 8,
                    }}
                >
                    {err.message}
                </div>
            ) : null}
        </div>
    );
};

const styles = {
    hash: {
        position: 'absolute',
        top: 8,
        right: 8,
        fontSize: '80%',
        color: 'rgba(255,255,255,0.5)',
    },
};
