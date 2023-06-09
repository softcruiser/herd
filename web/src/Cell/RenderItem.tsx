/** @jsx jsx */
import { Interpolation, jsx, Theme } from '@emotion/react';
import {
    Extra,
    ExtraId,
    printToAttributedText,
    SourceItem,
    SourceMap,
} from '@jerd/language/src/printing/printer';
import {
    toplevelToPretty,
    typeToPretty,
} from '@jerd/language/src/printing/printTsLike';
import {
    addExpr,
    hashObject,
    idFromName,
    idName,
} from '@jerd/language/src/typing/env';
import {
    Env,
    Id,
    Location,
    Term,
    ToplevelRecord,
    ToplevelT,
} from '@jerd/language/src/typing/types';
import * as React from 'react';
// import { Location } from '../../language/src/parsing/parser';
import {
    addLocationIndices,
    getTermByIdx,
    isAtomic,
    makeIdxTree,
} from '@jerd/language/src/typing/analyze';
import { showType } from '@jerd/language/src/typing/unify';
import { Selection } from './Cell';
import { SelectionPos } from './Cell2';
import { Action, Position } from '../workspace/Cells';
import { MenuItem } from './CellWrapper';
import { runTerm } from '../eval';
import { FilterMenu } from '../FilterMenu';
import { bindKeys } from './KeyBindings';
import { renderAttributedText } from './Render';
import { RenderResult } from './RenderResult';
import { onClick, renderScrub, Scrub, ScrubItem } from '../Scrubbers/Scrub';
import {
    Cell,
    Content,
    Display,
    EvalEnv,
    RenderPlugins,
    TopContent,
} from '../State';
import { getToplevel } from '../toplevels';
import { useUpdated } from '../workspace/Workspace';

export type Props = {
    env: Env;
    cell: Cell;
    maxWidth: number;
    plugins: RenderPlugins;
    content: TopContent;
    evalEnv: EvalEnv;
    focused: null | boolean;
    selection: { idx: number; marks: Array<number>; active: boolean };
    dispatch: (action: Action) => void;
    setSelection: (idx: number, marks?: Array<number>) => void;
    onFocus: (active: boolean, direction?: 'up' | 'down') => void;
    // onRun: (id: Id) => void;
    // addCell: (
    //     content: Content,
    //     position: Position,
    //     updateEnv?: (e: Env) => Env,
    // ) => void;
    onEdit: (selectionPos?: SelectionPos) => void;
    onSetPlugin: (display: Display | null) => void;
    // onPin: (display: Display, id: Id) => void;
    onChange: (toplevel: ToplevelT) => void;
    onPending: (term: Term) => void;
    onClick: () => void;
};

// const;

const RenderItem_ = ({
    env,
    cell,
    content,
    evalEnv,
    // onRun,
    onEdit,
    // addCell,
    plugins,
    focused,
    onFocus,
    maxWidth,
    selection,
    setSelection,
    onClick: onClick_,

    onSetPlugin,
    onChange,
    onPending,
    dispatch,
}: // onPin,
Props) => {
    let [top, term, idxTree, attributedText, sourceMap] = React.useMemo(() => {
        let top = getToplevel(env, content);
        top = addLocationIndices(top);
        const term =
            top.type === 'Define' || top.type === 'Expression'
                ? top.term
                : null;
        const sourceMap: SourceMap = {};
        const attributedText = printToAttributedText(
            toplevelToPretty(env, top, true),
            maxWidth,
            undefined,
            sourceMap,
        );
        let idxTree = null;
        if (term) {
            try {
                idxTree = makeIdxTree(term);
            } catch (err) {
                console.error(err);
            }
        }
        return [top, term, term ? idxTree : null, attributedText, sourceMap];
    }, [env, content, maxWidth]);

    const [scrub, setScrub] = React.useState(null as null | Scrub);
    const value = evalEnv.terms[idName(content.id)];
    const [hover, setHover] = React.useState(
        null as null | [Extra, HTMLDivElement],
    );
    const update = React.useCallback(
        (term: Term, item: ScrubItem) => {
            if (!scrub) {
                return;
            }
            const id = idFromName(hashObject(term));
            const value = runTerm(env, term, id, evalEnv);
            setScrub({ ...scrub, term, item, returnValue: value[idName(id)] });
        },
        [setScrub, scrub],
    );

    const selection$ = useUpdated(selection);

    // If we end up at a selection that's not rendered, reset to the start of things
    React.useEffect(() => {
        if (sourceMap[selection.idx]) {
            return;
        }
        // ookf how did we get an undefined here folks
        const ordered = Object.keys(sourceMap)
            .map((k) => +k)
            .filter((k) => !isNaN(k))
            .sort((a: number, b: number) => {
                const sa = sourceMap[a];
                const sb = sourceMap[b];
                const dl = sa.start.line - sb.start.line;
                const ln =
                    sa.end.line - sa.start.line - (sb.end.line - sb.start.line);
                if (ln == 0) {
                    if (dl === 0) {
                        const cl = sa.start.column - sb.start.column;
                        if (cl === 0) {
                            if (sa.end.line - sa.start.line === 0) {
                                return (
                                    sa.end.column -
                                    sa.start.column -
                                    (sb.end.column - sb.start.column)
                                );
                            }
                            return ln;
                        }
                        return cl;
                    }
                    return dl;
                }
                return ln;
            });
        if (ordered.length) {
            setSelection(ordered[0]);
        }
    }, [sourceMap, selection]);

    // const setIdx: (
    //     fn: number | ((idx: number) => number),
    // ) => void = React.useCallback(
    //     (idx) => {
    //         setSelection(typeof idx === 'number' ? idx : idx(selection$.current.idx))
    //         if (!focused) {
    //             onFocus();
    //         }
    //     },
    //     [setSelection, onFocus, focused],
    // );

    const [menu, setMenu] = React.useState(null as null | Array<MenuItem>);
    const [getString, setGetString] = React.useState(
        null as null | { prompt: string; action: (v: string) => void },
    );

    const cidxTree = React.useRef(idxTree);
    cidxTree.current = idxTree;

    const active$ = useUpdated(focused === true);

    React.useEffect(() => {
        if (focused == null || !idxTree || !term) {
            return;
        }

        const addTerm = (newTerm: Term, newName: string) =>
            dispatch({
                type: 'add',
                content: {
                    type: 'term',
                    id: idFromName(hashObject(newTerm)),
                },
                position: { type: 'after', id: cell.id },
                updateEnv: (env) => {
                    const res = addExpr(env, newTerm, null);
                    return {
                        ...res.env,
                        global: {
                            ...res.env.global,
                            idNames: {
                                ...res.env.global.idNames,
                                [idName(res.id)]: newName,
                            },
                        },
                    };
                },
            });

        const fn = bindKeys(
            idxTree,
            sourceMap,
            env,
            term,
            active$,
            selection$,
            // setIdx,
            setSelection,
            setMenu,
            addTerm,
            onPending,
            onFocus,
            onEdit,
        );
        window.addEventListener('keydown', fn, true);
        return () => window.removeEventListener('keydown', fn, true);
    }, [focused, idxTree, term]);

    const selectedTerm = term ? getTermByIdx(term, selection.idx) : null;

    return (
        <div css={{ position: 'relative' }} onClick={() => onClick_()}>
            <div
                style={{
                    fontFamily: '"Source Code Pro", monospace',
                    whiteSpace: 'pre-wrap',
                    position: 'relative',
                    cursor: 'pointer',
                    padding: 8,
                }}
                onClick={(evt) => {
                    evt.stopPropagation();
                    onEdit();
                }}
            >
                {renderAttributedText(
                    env.global,
                    attributedText,
                    (evt, id, kind, loc) => {
                        if (!evt.metaKey) {
                            if (loc && loc.idx) {
                                setSelection(loc.idx, selection$.current.marks);
                                onFocus(true);
                                // setIdx(loc.idx);
                            }
                            // Just selection
                            return true;
                        }

                        return onClick(
                            env,
                            cell,
                            (c: Content, p: Position) =>
                                dispatch({
                                    type: 'add',
                                    content: c,
                                    position: p,
                                }),
                            setScrub,
                            term,
                            value,
                            // setIdx,
                        )(evt, id, kind, loc);
                    },
                    undefined,
                    undefined,
                    (id, kind) =>
                        [
                            'term',
                            'type',
                            'as',
                            'record',
                            'custom-binop',
                            'float',
                        ].includes(kind),
                    (extra: Extra, target: HTMLDivElement | null) => {
                        console.log('SETTING HOVER', extra, target);
                        if (target) {
                            setHover([extra, target]);
                        } else if (hover) {
                            setHover(null);
                        }
                    },
                    selection,
                )}
                {scrub
                    ? renderScrub(
                          env,
                          top,
                          scrub,
                          update,
                          setScrub,
                          onPending,
                          evalEnv,
                      )
                    : null}
                {hover ? renderHover(env, hover) : null}
            </div>
            {/* {term ? (
                <RenderResult
                    onSetPlugin={onSetPlugin}
                    focused={focused != null}
                    // onPin={onPin}
                    cell={cell}
                    term={scrub ? scrub.term : term}
                    value={scrub ? scrub.returnValue : value}
                    plugins={plugins}
                    id={content.id}
                    env={env}
                    evalEnv={evalEnv}
                    dispatch={dispatch}
                />
            ) : null} */}
            {getString ? (
                <div css={menuOverlay}>
                    <GetString
                        getString={getString}
                        onClose={() => setGetString(null)}
                    />
                </div>
            ) : null}
            {menu ? (
                <div css={menuOverlay}>
                    <FilterMenu
                        items={menu}
                        setGetString={setGetString}
                        onClose={() => setMenu(null)}
                    />
                </div>
            ) : null}
            {selectedTerm ? (
                <div>
                    {renderAttributedText(
                        env.global,
                        printToAttributedText(
                            typeToPretty(env, selectedTerm.is),
                            maxWidth,
                        ),
                    )}
                </div>
            ) : null}
        </div>
    );
};

export const GetString = ({
    getString: { prompt, action },
    onClose,
}: {
    getString: { prompt: string; action: (v: string) => void };
    onClose: () => void;
}) => {
    const [text, setText] = React.useState('');
    return (
        <input
            placeholder={prompt}
            autoFocus
            value={text}
            onChange={(evt) => setText(evt.target.value)}
            onKeyDown={(evt) => {
                evt.stopPropagation();
                if (evt.key === 'Enter') {
                    if (text !== '') {
                        action(text);
                    }
                    return onClose();
                }
                if (evt.key === 'Escape') {
                    onClose();
                }
            }}
            css={{
                padding: 4,
                backgroundColor: '#555',
                color: '#fff',
            }}
        />
    );
};

const menuOverlay: Interpolation<Theme> = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
};

const getTopLevel = (
    env: Env,
    hash: string,
    isType: boolean,
): [React.ReactNode, ToplevelT] | null => {
    const [idRaw, second] = hash.split('#');
    if (second === 'builtin') {
        if (!isType) {
            // return [null, {}];
        }
        return null;
    }
    const id = idFromName(idRaw);
    const name = env.global.idNames[idRaw];
    if (!isType) {
        const term = env.global.terms[idRaw];
        if (!term) {
            return null;
        }
        if (name) {
            return [
                <div>#{hash}</div>,
                { type: 'Define', name, term, id, location: term.location },
            ];
        } else {
            return [
                <div>#{hash}</div>,
                { type: 'Expression', term, id, location: term.location },
            ];
        }
    }
    const defn = env.global.types[idRaw];
    if (!defn) {
        return null;
    }
    if (defn.type === 'Enum') {
        return [
            <div>#{hash}</div>,
            {
                type: 'EnumDef',
                id,
                name: name || 'unknown',
                def: defn,
                inner: [],
                location: defn.location,
            },
        ];
    }
    const prefix = second ? (
        <div css={{ marginBottom: 8 }}>
            Attribute #{second}:{' '}
            <span style={{ color: 'orange' }}>
                {env.global.recordGroups[idRaw][+second]}
            </span>
        </div>
    ) : (
        <div>#{hash}</div>
    );

    return [
        prefix,
        {
            type: 'RecordDef',
            id,
            name: name || 'unknown',
            def: defn,
            attrNames: env.global.recordGroups[idRaw],
            location: defn.location,
        },
    ];
};

const renderHover = (env: Env, hover: [Extra, HTMLDivElement]) => {
    const box = hover[1].getBoundingClientRect();
    const pbox = hover[1].offsetParent!.getBoundingClientRect();
    const pos = {
        top: box.bottom - pbox.top + 4,
        left: box.left - pbox.left,
    };
    if (hover[0].type === 'Error') {
        const pretty = (
            <div>
                <div>Found:</div>
                <div
                    style={{
                        fontFamily: '"Source Code Pro", monospace',
                        whiteSpace: 'pre-wrap',
                        fontSize: '80%',
                        padding: '2px 4px',
                    }}
                >
                    {renderAttributedText(
                        env.global,
                        printToAttributedText(
                            typeToPretty(env, hover[0].found),
                            100,
                        ),
                        null,
                        true,
                    )}
                </div>
                <div>Expected:</div>
                <div
                    style={{
                        fontFamily: '"Source Code Pro", monospace',
                        whiteSpace: 'pre-wrap',
                        fontSize: '80%',
                        padding: '2px 4px',
                    }}
                >
                    {renderAttributedText(
                        env.global,
                        printToAttributedText(
                            typeToPretty(env, hover[0].expected),
                            100,
                        ),
                        null,
                        true,
                    )}
                </div>
            </div>
        );
        return (
            <div
                css={{
                    zIndex: 1000,
                    position: 'absolute',
                    backgroundColor: 'black',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    color: 'white',
                    padding: 8,
                    pointerEvents: 'none',
                }}
                style={pos}
            >
                {pretty}
            </div>
        );
    }
    if (hover[0].type === 'id') {
        const pretty = renderHoverId(env, hover[0]);
        if (!pretty) {
            return;
        }
        return (
            <div
                css={{
                    zIndex: 1000,
                    position: 'absolute',
                    backgroundColor: 'black',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    color: 'white',
                    padding: 8,
                    pointerEvents: 'none',
                }}
                style={pos}
            >
                {pretty}
            </div>
        );
    }
};

export const renderHoverId = (env: Env, extra: ExtraId) => {
    const id = extra.id;
    if (id.startsWith(':')) {
        return;
    }
    if (id.endsWith('#builtin')) {
        const name = id.slice(0, -'#builtin'.length);
        const t = env.global.builtins[name];
        if (!t) {
            return <div>No builtin {name}</div>;
        }
        return (
            <div>
                {name} :{' '}
                {renderAttributedText(
                    env.global,
                    printToAttributedText(typeToPretty(env, t), 100),
                    null,
                    true,
                )}
            </div>
        );
    }
    const top = getTopLevel(env, id, extra.isType);
    return top ? (
        <div>
            {top[0]}
            {renderAttributedText(
                env.global,
                printToAttributedText(toplevelToPretty(env, top[1], true), 100),
                null,
                false,
            )}
        </div>
    ) : (
        <strong>Unable to find definition for {id}</strong>
    );
};

export const RenderItem = React.memo(RenderItem_);

const styles = {
    hash: {
        position: 'absolute',
        top: 8,
        right: 8,
        fontSize: '80%',
        color: 'rgba(255,255,255,0.5)',
    },
};
