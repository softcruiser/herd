/** @jsx jsx */
import { jsx } from '@emotion/react';
// Ok

import * as React from 'react';
import { idName, idFromName, hashObject } from '@jerd/language/src/typing/env';
import {
    Env,
    Id,
    newWithGlobal,
    nullLocation,
    Term,
    Type,
    typesEqual,
    Location,
    idsEqual,
    Decorator,
} from '@jerd/language/src/typing/types';
import {
    GLSLBuffer1_id,
    GLSLEnv_id,
    GLSLSceneOld_id,
    Vec2_id,
    Vec3_id,
    Vec4_id,
} from '@jerd/language/src/printing/prelude-types';

import { getTypeError } from '@jerd/language/src/typing/getTypeError';
import {
    Cell,
    Content,
    Display,
    EvalEnv,
    RenderPlugins,
    RenderPluginT,
} from '../State';
import { envWithTerm } from '../display/OpenGL';
import { sortAllDepsPlain } from '@jerd/language/src/typing/analyze';
import { transform } from '@jerd/language/src/typing/transform';
import { runTerm } from '../eval';
import { LocatedError } from '@jerd/language/src/typing/errors';
import { Action } from '../workspace/Cells';
import { findSliders } from '@jerd/language/src/typing/findSliders';
import { widgetForDecorator } from '../display/Decorators';
import {
    hsla_id,
    hsl_id,
    rgba_id,
    rgb_id,
    slider$1_id,
    slider$2_id,
    slider_id,
} from '@jerd/language/src/printing/prelude-types';

/*

What do I want here?
This is for terms and exprs (so, named an unnamed terms really)

Really we're talking about display plugins.
The default one is "json", right? Or something close to it, ideally.
That would also keep track of functions and stuff.

soo should I just auto-evaluate everything as the page loads? That might be a good idea honestly.
Like why would we ever have stuff not be evaluated.

Anyway, 

*/

const RenderResult_ = ({
    plugins,
    cell,
    id,
    env,
    evalEnv,
    // onRun,
    onSetPlugin,
    value,
    term,
    // onPin,
    dispatch,
    focused,
}: {
    focused: boolean;
    onSetPlugin?: (d: Display | null) => void;
    plugins: RenderPlugins;
    cell: Cell;
    id: Id | null;
    env: Env;
    evalEnv: EvalEnv;
    value: any;
    term: Term;
    // onRun: (id: Id) => void;
    // onPin: (display: Display, id: Id) => void;
    dispatch: (action: Action) => void;
}) => {
    // React.useEffect(() => {
    //     if (value == null) {
    //         dispatch({type: 'run', id});
    //     }
    // }, [value == null]);

    const [sliderState, setSliderState] = React.useState(
        {} as {
            [term: string]: {
                [idx: number]: { options: any; replacement: Term };
            };
        },
    );

    const sliderData = React.useMemo(() => {
        // const topId = idFromName(hashObject(term));
        const { found, termDeps } = findSliders(env, term);
        const widgets: {
            [key: string]: {
                [idx: number]: React.FunctionComponent<{
                    data: any;
                    onUpdate: (term: Term, data: any) => void;
                }>;
            };
        } = {};
        Object.keys(found).forEach((k) => {
            widgets[k] = {};
            Object.keys(found[k]).forEach((idx) => {
                const { decorator, term } = found[k][+idx];
                const widget = widgetForDecorator(decorator, term);
                if (widget) {
                    widgets[k][+idx] = widget;
                }
            });
        });
        // crawlTerm(term, topId);
        // console.log('found', found);
        return {
            sliders: found,
            widgets,
            termsInOrder: sortAllDepsPlain(termDeps),
        };
    }, [term]);

    const termAndEnvWithSliders = React.useMemo(() => {
        // Basic strategy:
        // - go through sliders ... maybe have sliders grouped by term, yeah that's a good idea
        // - anyway, for each term, make a replacement term
        // - then go through and substitute references to the unslid terms for references to the slid ones. Right?
        // uhhh hm but wait we need to do this in topological order
        // ok so we now have a mapping of dependencies.
        // if we can just go in reverse dependency order, remapping as we go, it should work just fine, right?
        const { sliders, termsInOrder } = sliderData;
        const slidEnv = envWithTerm(newWithGlobal(env.global), term);
        const mapping: { [hash: string]: Id } = {};
        const newTerms = termsInOrder.map((hash) => {
            const newTerm = transform(slidEnv.global.terms[hash], {
                term: (term) => {
                    if (
                        sliderState[hash] &&
                        sliderState[hash][term.location.idx!]
                    ) {
                        return sliderState[hash][term.location.idx!]
                            .replacement;
                    }
                    if (term.type === 'ref' && term.ref.type === 'user') {
                        const name = idName(term.ref.id);
                        if (mapping[name]) {
                            // console.log('MAPPED', name);
                            return {
                                ...term,
                                ref: { ...term.ref, id: mapping[name] },
                            };
                        }
                    }
                    return null;
                },
            });
            const newHash = hashObject(newTerm);
            if (newHash === hash) {
                return newTerm;
            }
            // if (newTerm === slidEnv.global.terms[hash]) {
            //     console.log('DIFF', hash, newHash);
            //     throw new Error(`hash is different?`);
            // }
            // console.log(
            //     'DIFFERENT',
            //     hash,
            //     newHash,
            //     newTerm,
            //     hashObject(slidEnv.global.terms[hash]),
            // );
            const newId = idFromName(newHash);
            mapping[hash] = newId;
            slidEnv.global.terms[newHash] = newTerm;
            slidEnv.global.idNames[newHash] = slidEnv.global.idNames[hash];
            return newTerm;
        });
        // console.log(mapping, newTerms);
        return {
            env: slidEnv,
            term: newTerms[newTerms.length - 1],
            id: idFromName(hashObject(newTerms[newTerms.length - 1])),
        };
    }, [term, sliderData, sliderState]);

    // value = evalEnv.terms[idName(termAndEnvWithSliders.id)];

    const evaled = React.useMemo(() => {
        if (id && idsEqual(termAndEnvWithSliders.id, id)) {
            console.log('NO CHANGE');
            return evalEnv;
        }

        const hash = idName(termAndEnvWithSliders.id);
        if (evalEnv.terms[hash] !== undefined) {
            console.log('Already there folks');
            return evalEnv;
        }

        let results: { [key: string]: any };
        try {
            const term = termAndEnvWithSliders.term;
            if (!term) {
                throw new Error(`No term ${id ? idName(id) : 'no id'}`);
            }

            results = runTerm(
                termAndEnvWithSliders.env,
                term,
                termAndEnvWithSliders.id,
                evalEnv,
            );
        } catch (err) {
            console.log(`Failed to run!`);
            console.log(err);
            if (err instanceof LocatedError) {
                console.log(err.toString());
            }
            return evalEnv;
        }

        // console.log('evaled thangs', results);
        return { ...evalEnv, terms: { ...evalEnv.terms, ...results } };
    }, [termAndEnvWithSliders, evalEnv]);

    value = evaled.terms[idName(termAndEnvWithSliders.id)];

    // Ohhh we want to share runs, right? like if we haven't slid why not do onRun?
    React.useEffect(() => {
        if (value == null && id) {
            dispatch({ type: 'run', id });
        }
    }, [value == null]);

    const hash = idName(termAndEnvWithSliders.id);
    // value = value == null && evaled ? evaled.terms[hash] : value;

    // if (evaled == null || evaled.terms[hash] === undefined) {
    //     return <span>Unevaluated</span>;
    // }
    if (value == null) {
        return <span>Unevaluated</span>;
    }

    const renderPlugin = getPlugin(
        plugins,
        termAndEnvWithSliders.env,
        cell.display,
        termAndEnvWithSliders.term,
        value,
        evalEnv,
        !focused,
    );
    let body;
    if (renderPlugin != null) {
        body = (
            <RenderPlugin
                display={cell.display}
                plugins={plugins}
                onSetPlugin={onSetPlugin}
                onPin={() => {
                    // TODO: What's the big id?
                    // Need to save it I think.
                    dispatch({ type: 'pin', display: cell.display!, id: id! });
                }}
            >
                {renderPlugin()}
            </RenderPlugin>
        );
    } else if (onSetPlugin) {
        const matching = getMatchingPlugins(
            plugins,
            env,
            cell.display,
            term.is,
        );

        body = (
            <div
                style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    position: 'relative',
                    padding: 8,
                }}
            >
                {matching && matching.length ? (
                    <div>
                        <h4>Available render plugins</h4>

                        {matching.map((k) => (
                            <button
                                key={k}
                                onClick={() => {
                                    onSetPlugin({ type: k, opts: {} });
                                }}
                            >
                                {plugins[k].name}
                            </button>
                        ))}
                    </div>
                ) : null}
                {showJsValue(value)}
            </div>
        );
    } else {
        body = <div>Unable to load plugin 😬</div>;
    }

    return (
        <div>
            {renderPlugin || typeof value !== 'function'
                ? renderSliders(
                      id?.hash,
                      sliderData,
                      termAndEnvWithSliders,
                      sliderState,
                      setSliderState,
                  )
                : null}
            {body}
        </div>
    );
};

const showJsValue = (value: unknown): string => {
    if (typeof value === 'function') {
        return `(function with ${value.length} arguments)`;
    }
    if (['number', 'string', 'boolean'].includes(typeof value)) {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return `[ ${value.slice(0, 10).map(showJsValue).join(', ')}${
            value.length > 10 ? ` ... (${value.length - 10} more items)` : ''
        }]`;
    }
    if (value === undefined) {
        return `undefined`;
    }
    if (typeof value !== 'object') {
        return JSON.stringify(value);
    }
    if (value == null) {
        return `null`;
    }
    return `{ ${Object.keys(value)
        .map((k) => `${k}: ${showJsValue((value as any)[k])}`)
        .join(', ')} }`;
};

export const getPlugin = (
    plugins: RenderPlugins,
    env: Env,
    display: Display | undefined | null,
    term: Term,
    value: any,
    // TODO: I only need the "control objects" here,
    // not the terms or builtins. It would be nice to
    // extract those out
    evalEnv: EvalEnv,
    startPaused: boolean = true,
): (() => JSX.Element) | null => {
    if (!display || !plugins[display.type]) {
        return null;
    }
    const plugin: RenderPluginT = plugins[display.type];
    const err = getTypeError(
        env,
        term.is,
        plugin.type,
        nullLocation,
        undefined,
        true,
    );
    if (err == null) {
        return () => plugin.render(value, evalEnv, env, term, startPaused);
    }
    return null;
};

export const RenderPlugin = ({
    children,
    display,
    plugins,
    onSetPlugin,
    onPin,
}: {
    children: React.ReactNode;
    display: Display | undefined | null;
    plugins: RenderPlugins;
    onSetPlugin?: (name: Display | null) => void;
    onPin: null | (() => void);
}) => {
    const [zoom, setZoom] = React.useState(false);
    return (
        <div
            style={{
                // padding: 8,
                border: '2px solid #2b2b2b',
                borderRadius: 4,
                position: 'relative',
                ...(zoom
                    ? {
                          position: 'fixed',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          zIndex: 1000,
                          background: 'black',
                      }
                    : null),
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    padding: 8,
                    paddingTop: 6,
                    backgroundColor: !zoom ? '#2b2b2b' : 'transparent',
                    fontSize: '80%',
                    borderRadius: 4,
                }}
            >
                <button
                    css={{
                        cursor: 'pointer',
                        fontSize: '50%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        padding: 0,
                        marginRight: zoom ? 0 : 8,
                    }}
                    onClick={() => setZoom(!zoom)}
                >
                    🔍
                </button>
                {!zoom ? (
                    <span>
                        {onPin ? (
                            <button
                                css={{
                                    cursor: 'pointer',
                                    fontSize: '50%',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: 'inherit',
                                    padding: 0,
                                    marginRight: 8,
                                }}
                                onClick={() => onPin()}
                            >
                                📌
                            </button>
                        ) : null}
                        {plugins[display!.type].name}
                        {onSetPlugin ? (
                            <button
                                css={{
                                    cursor: 'pointer',
                                    fontSize: '50%',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: 'inherit',
                                    padding: 0,
                                    marginLeft: 8,
                                }}
                                onClick={() => onSetPlugin(null)}
                            >
                                ╳
                            </button>
                        ) : null}
                    </span>
                ) : null}
            </div>

            <div style={{ padding: 8 }}>{children}</div>
        </div>
    );
};

const getMatchingPlugins = (
    plugins: RenderPlugins,
    env: Env,
    display: Display | null | undefined,
    type: Type,
): Array<string> | null => {
    if (
        !display ||
        !plugins[display.type] ||
        !typesEqual(plugins[display.type].type, type)
    ) {
        return Object.keys(plugins).filter((k) => {
            if (
                getTypeError(
                    env,
                    type,
                    plugins[k].type,
                    nullLocation,
                    undefined,
                    true,
                ) == null
            ) {
                return true;
            }
        });
    }
    return null;
};

export const RenderResult = React.memo(RenderResult_);

function renderSliders(
    mainHash: string | undefined,
    sliderData: {
        sliders: {
            [termId: string]: {
                [idx: number]: {
                    title: string | null;
                    term: Term;
                    decorator: Decorator;
                };
            };
        };
        widgets: {
            [termId: string]: {
                [idx: number]: React.FunctionComponent<{
                    data: any;
                    onUpdate: (term: Term, data: any) => void;
                }>;
            };
        };
        termsInOrder: string[];
    },
    termAndEnvWithSliders: {
        env: Env;
        term: Term;
        id: { hash: string; size: number; pos: number };
    },
    sliderState: {
        [term: string]: { [idx: number]: { options: any; replacement: Term } };
    },
    setSliderState: React.Dispatch<
        React.SetStateAction<{
            [term: string]: {
                [idx: number]: { options: any; replacement: Term };
            };
        }>
    >,
) {
    return (
        <div
            style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}
        >
            {Object.keys(sliderData.sliders).map((hash) => {
                const idxs = Object.keys(sliderData.sliders[hash]);
                if (!idxs.length) {
                    return;
                }
                return (
                    <div key={hash} style={{ padding: 4 }}>
                        <h4>
                            {termAndEnvWithSliders.env.global.idNames[hash] ||
                                (hash === mainHash ? '' : '#' + hash)}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {idxs.map((idx) => {
                                const config =
                                    sliderData.sliders[hash][parseInt(idx)];
                                if (!config) {
                                    console.warn(
                                        sliderData.sliders,
                                        hash,
                                        parseInt(idx),
                                    );
                                    return null;
                                }
                                const Widget =
                                    sliderData.widgets[hash][parseInt(idx)];
                                return (
                                    <div key={idx} style={{ padding: 4 }}>
                                        {config.title ? (
                                            <div
                                                style={{
                                                    marginBottom: 16,
                                                    textAlign: 'center',
                                                    padding: 4,
                                                    backgroundColor: '#555',
                                                }}
                                            >
                                                {config.title}
                                            </div>
                                        ) : null}
                                        {Widget ? (
                                            <Widget
                                                data={
                                                    sliderState[hash] &&
                                                    sliderState[hash][+idx]
                                                        ? sliderState[hash][
                                                              +idx
                                                          ].options
                                                        : null
                                                }
                                                onUpdate={(newTerm, data) => {
                                                    setSliderState((state) => ({
                                                        ...state,
                                                        [hash]: {
                                                            ...state[hash],
                                                            [idx]: {
                                                                options: data,
                                                                replacement: newTerm,
                                                            },
                                                        },
                                                    }));
                                                }}
                                            />
                                        ) : (
                                            'No widget yet defined for this decorator'
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
