/** @jsx jsx */
import { jsx } from '@emotion/react';
// The app

import * as React from 'react';
import {
    hashObject,
    idName,
    typeToplevelT,
} from '@jerd/language/src/typing/env';
import {
    acceptProposed,
    CellProps,
    MovePosition,
    rejectProposed,
    Selection,
    updatePending,
    updateProposed,
    ViewSource,
} from './Cell';
import {
    Cell,
    Content,
    Display,
    EvalEnv,
    RawContent,
    RenderPlugins,
    TopContent,
} from '../State';
import { runTerm } from '../eval';
import { HistoryUpdate, Workspace } from '../State';
import {
    Env,
    GlobalEnv,
    Id,
    newWithGlobal,
    ToplevelT,
    nullLocation,
} from '../../../language/src/typing/types';
import { WorkspacePicker } from '../workspace/WorkspacePicker';
import { sortCells } from '../workspace/Workspace';
import { Action as TopAction } from '../workspace/Cells';
import { parse, Toplevel } from '../../../language/src/parsing/parser';
import { addLocationIndices } from '../../../language/src/typing/analyze';
import { getToplevel, updateToplevel } from '../toplevels';
import { CellWrapper } from './CellWrapper';
import { cellTitle } from './cellTitle';
import { getMenuItems } from '../actions/getMenuItems';
import ColorTextarea from './ColorTextarea';
import { RenderItem } from './RenderItem';
import { printToString } from '../../../language/src/printing/printer';
import { toplevelToPretty } from '../../../language/src/printing/printTsLike';
import { RenderResult } from './RenderResult';
import { showLocation } from '@jerd/language/src/typing/typeExpr';
import { LocatedError } from '@jerd/language/src/typing/errors';

// hrmmmm can I move the selection dealio up a level? Should I? hmm I do like each cell managing its own cursor, tbh.

export type SelectionPos = 'start' | 'end' | 'change';
export type State =
    | {
          type: 'text';
          idx: number | null;
          selectionPos: SelectionPos;
          raw: string;
          node: HTMLElement | null;
          // May or may not have worked
          //   toplevel: ToplevelT | null;
      }
    | {
          type: 'normal';
          idx: number;
          marks: Array<number>;
          // TODO: "active"?
          // like, what?
      };

type Action =
    | { type: 'raw'; text: string; selectionPos?: SelectionPos }
    | { type: 'raw:close'; idx: number }
    | { type: 'selection'; idx: number; marks?: Array<number> }
    // | {type: 'edit-raw'}
    | {
          type: 'raw:selection';
          newSel: { idx: number; node: HTMLElement } | null;
      };

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'raw:close': {
            return {
                type: 'normal',
                idx: action.idx,
                marks: [],
            };
        }
        case 'raw': {
            return {
                type: 'text',
                raw: action.text,
                selectionPos: action.selectionPos ?? 'change',
                idx: state.idx,
                node: null,
            };
        }
        case 'raw:selection':
            return state.type === 'normal'
                ? state
                : {
                      ...state,
                      idx: action.newSel ? action.newSel.idx : state.idx,
                      node: action.newSel ? action.newSel.node : null,
                  };
        case 'selection':
            return state.type !== 'normal'
                ? state
                : {
                      ...state,
                      idx: action.idx,
                      marks: action.marks ?? state.marks,
                  };
    }
};

export const termForToplevel = (t: ToplevelT | null) =>
    t && (t.type === 'Expression' || t.type === 'Define') ? t.term : null;

const parseRaw = (raw: string, global: GlobalEnv): TypeResult => {
    try {
        const parsed: Array<Toplevel> = parse(raw);
        if (parsed.length > 1) {
            return { type: 'multiple' };
        }
        return {
            type: 'success',
            toplevel: addLocationIndices(
                typeToplevelT(newWithGlobal(global), parsed[0], null),
            ),
        };
    } catch (err) {
        if (!(err instanceof Error)) {
            return { type: 'error', err: new Error(`Unknown error`) };
        }
        return { type: 'error', err };
    }
};

type TypeResult =
    | { type: 'error'; err: Error }
    | { type: 'success'; toplevel: ToplevelT }
    | { type: 'multiple' };

const CellView_ = ({
    cell,
    env,
    maxWidth,
    focused,
    evalEnv,
    dispatch,
    plugins,
    getHistory,
}: CellProps) => {
    const [showSource, setShowSource] = React.useState(false);
    const [state, updateLocal] = React.useReducer(
        reducer,
        {},
        (_): State =>
            cell.content.type === 'raw'
                ? {
                      type: 'text',
                      raw: cell.content.text,
                      selectionPos: 'change',
                      idx: null,
                      node: null,
                      //   toplevel: parseRaw(cell.content.text, env.global),
                  }
                : {
                      type: 'normal',
                      idx: 0,
                      marks: [],
                  },
    );

    const evalCache = React.useRef({} as { [key: string]: any });

    const typeResult = React.useMemo((): TypeResult => {
        return state.type === 'text'
            ? parseRaw(state.raw, env.global)
            : cell.content.type === 'raw'
            ? parseRaw(cell.content.text, env.global)
            : { type: 'success', toplevel: getToplevel(env, cell.content) };
    }, [state.type === 'text' ? state.raw : cell.content]);
    const toplevel = typeResult.type === 'success' ? typeResult.toplevel : null;

    const evaled = React.useMemo(() => {
        if (
            toplevel &&
            (toplevel.type === 'Expression' || toplevel.type === 'Define')
        ) {
            const id =
                toplevel.type === 'Expression'
                    ? { hash: hashObject(toplevel.term), size: 1, pos: 0 }
                    : toplevel.id;
            const already = evalEnv.terms[idName(id)];

            if (already) {
                return already;
            } else if (evalCache.current[idName(id)] != null) {
                return evalCache.current[idName(id)];
            } else {
                try {
                    const v = runTerm(env, toplevel.term, id, evalEnv)[
                        idName(id)
                    ];
                    evalCache.current[idName(id)] = v;
                    return v;
                } catch (err) {
                    console.log('Failure while evaling', err);
                }
            }
        }
        return null;
    }, [toplevel]);

    const onSetToplevel = React.useCallback(
        (toplevel: ToplevelT) => {
            const { env: nenv, content } = updateToplevel(
                env,
                toplevel,
                cell.content,
            );
            dispatch({ type: 'change', env: nenv, cell: { ...cell, content } });
        },
        [env, cell],
    );

    const setCollapsed = (collapsed: boolean) =>
        dispatch({ type: 'change', cell: { ...cell, collapsed } });

    const onSetPlugin = React.useCallback(
        (display) => {
            dispatch({ type: 'change', cell: { ...cell, display } });
        },
        [cell],
    );

    const body =
        state.type === 'text' && focused?.active ? (
            <ColorTextarea
                value={state.raw}
                env={env}
                maxWidth={maxWidth}
                unique={
                    toplevel && toplevel.type === 'RecordDef'
                        ? toplevel.def.unique
                        : null
                }
                selection={
                    state.idx != null
                        ? {
                              idx: state.idx,
                              node: state.node,
                              pos: state.selectionPos,
                          }
                        : null
                }
                updateSelection={(newSel) =>
                    updateLocal({ type: 'raw:selection', newSel })
                }
                onChange={(text: string) => updateLocal({ type: 'raw', text })}
                onKeyDown={(evt: any) => {
                    // TODO: /should/ I allow 'raw's anymore?
                    // I mean with this setup, you can't really save a raw.
                    if (evt.key === 'Escape') {
                        if (toplevel) {
                            if (
                                (toplevel.type === 'Define' ||
                                    toplevel.type === 'Expression') &&
                                cell.content.type === 'term'
                            ) {
                                updateProposed(cell, dispatch, toplevel);
                            } else {
                                const { env: nenv, content } = updateToplevel(
                                    env,
                                    toplevel,
                                    cell.content,
                                );
                                dispatch({
                                    type: 'change',
                                    env: nenv,
                                    cell: {
                                        ...cell,
                                        content,
                                    },
                                });
                            }
                            updateLocal({
                                type: 'raw:close',
                                // TODO: Come up with a better default "selected idx" if there isn't one
                                idx: state.idx || 0,
                            });
                        } else {
                            dispatch({
                                type: 'change',
                                cell: {
                                    ...cell,
                                    content: { type: 'raw', text: state.raw },
                                },
                            });
                            // Relinquish active focus, there's no normal mode for raw content.
                            dispatch({
                                type: 'focus',
                                active: false,
                                id: cell.id,
                            });
                        }

                        // // onClose(typed);
                        // updateProposed(cell, dispatch, toplevel);
                    }
                }}
            />
        ) : state.type === 'text' || cell.content.type === 'raw' ? (
            <div
                onClick={() => {
                    // setEditing(true);
                    if (cell.content.type === 'raw') {
                        updateLocal({
                            type: 'raw',
                            text: cell.content.text,
                        });
                    }
                }}
                style={{
                    fontFamily: '"Source Code Pro", monospace',
                    whiteSpace: 'pre-wrap',
                    position: 'relative',
                    cursor: 'pointer',
                    padding: 8,
                }}
            >
                {state.type === 'text'
                    ? state.raw
                    : (cell.content as RawContent).text.trim() === ''
                    ? '[empty]'
                    : (cell.content as RawContent).text}
            </div>
        ) : (
            <RenderItem
                maxWidth={maxWidth}
                onSetPlugin={onSetPlugin}
                onChange={onSetToplevel}
                selection={{
                    idx: state.idx,
                    marks: state.marks,
                    active: focused ? focused.active : false,
                }}
                setSelection={(idx, marks) => {
                    updateLocal({ type: 'selection', idx, marks });
                    // setSelection((sel) => ({
                    //     idx,
                    //     marks: marks != null ? marks : sel.marks,
                    //     level: 'normal',
                    //     node: null,
                    // }));
                    if (!focused || !focused.active) {
                        dispatch({ type: 'focus', id: cell.id, active: true });
                    }
                }}
                focused={focused != null ? focused.active : null}
                onFocus={(active: boolean, direction?: 'up' | 'down') => {
                    dispatch({
                        type: 'focus',
                        id: cell.id,
                        direction,
                        active,
                    });
                }}
                onClick={() => {
                    // setSelection((s) => ({ ...s, level: 'outer' }));
                    dispatch({ type: 'focus', id: cell.id, active: false });
                }}
                onPending={updatePending(cell, dispatch)}
                dispatch={dispatch}
                cell={cell}
                plugins={plugins}
                content={cell.content}
                onEdit={(selectionPos?: SelectionPos) =>
                    updateLocal({
                        type: 'raw',
                        selectionPos,
                        // So.... it's weird to me that we're dealing with
                        // raw text here ... but maybe it's fine? yeah I guess
                        // this is fine.
                        text: printToString(
                            toplevelToPretty(
                                env,
                                getToplevel(env, cell.content as TopContent),
                                true,
                            ),
                            50,
                        ),
                    })
                }
                env={env}
                evalEnv={evalEnv}
            />
            // <div>No toplevel?</div>
        );

    const termAndValue = getTermAndValue(toplevel, evalEnv, evaled);
    // const term =
    //     toplevel &&
    //     (toplevel.type === 'Define' || toplevel.type === 'Expression')
    //         ? toplevel.term
    //         : null;
    // const id = cell.content.type === 'term' ? cell.content.id : null;
    // const value = id ? evalEnv.terms[idName(id)] : null;

    // const memoTerm = React.useMemo(() => term, [
    //     term ? hashObject(term) : null,
    // ]);

    return (
        <CellWrapper
            getHistory={() => ({
                env,
                items: getHistory(cell.id),
            })}
            title={cellTitle(
                env,
                cell,
                maxWidth,
                cell.collapsed,
                rejectProposed(cell, dispatch, env),
                acceptProposed(cell, env, onSetToplevel),
            )}
            onRevertToTerm={(id: Id) => {
                dispatch({
                    type: 'change',
                    cell: { ...cell, content: { type: 'term', id } },
                });
            }}
            onRemove={() => dispatch({ type: 'remove', id: cell.id })}
            focused={focused}
            onFocus={() =>
                dispatch({ type: 'focus', id: cell.id, active: true })
            }
            collapsed={cell.collapsed || false}
            setCollapsed={setCollapsed}
            onToggleSource={() => 'todo'}
            menuItems={getMenuItems({
                dispatch,
                setCollapsed,
                setShowSource: () => setShowSource(!showSource),
                term: termForToplevel(toplevel),
                showSource: false,
                showGLSL: false,
                cell,
                env,
                setShowGLSL: () => 'todo',
            })}
        >
            {body}
            {typeResult.type === 'error' ? (
                <div>{showError(typeResult.err)}</div>
            ) : null}
            {termAndValue ? (
                <RenderResult
                    onSetPlugin={onSetPlugin}
                    focused={focused != null}
                    // onPin={onPin}
                    cell={cell}
                    term={termAndValue[0][0]}
                    value={termAndValue[1]}
                    plugins={plugins}
                    id={(cell.content as any).id}
                    env={env}
                    evalEnv={evalEnv}
                    dispatch={dispatch}
                />
            ) : null}
            {termAndValue && showSource && cell.content.type === 'term' ? (
                <ViewSource
                    hash={idName(cell.content.id)}
                    env={env}
                    term={termAndValue[0][0]}
                />
            ) : null}
        </CellWrapper>
    );
};

const showError = (err: Error) => {
    if (err instanceof LocatedError) {
        return (
            <span>
                ERR
                {err.message} {showLocation(err.loc)}
            </span>
        );
    }
    return <span>Non-located error {err.message}</span>;
};

// const contentId =

const getTermAndValue = (
    toplevel: ToplevelT | null,
    evalEnv: EvalEnv,
    evaled: any,
) => {
    const top =
        toplevel &&
        (toplevel.type === 'Expression' || toplevel.type === 'Define')
            ? toplevel
            : null;
    // const memoed =
    const tid = React.useMemo(() => {
        return top ? [top.term, top.id] : null;
    }, [top ? idName(top.id) : null]);
    return top ? [tid!, evaled] : null;
};

export const Cell2 = React.memo(CellView_);
