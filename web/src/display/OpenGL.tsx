// This is the fake one?

import * as React from 'react';
import { Env, Id, Term } from '@jerd/language/src/typing/types';
import {
    builtinType,
    int,
    pureFunction,
    refType,
} from '@jerd/language/src/typing/preset';
import { EvalEnv, Plugins } from '../State';
import { hashObject, idName } from '@jerd/language/src/typing/env';
import { wrapWithExecutaionLimit } from './Drawable';
import {
    generateShader,
    generateSingleShader,
} from '@jerd/language/src/printing/glslPrinter';
import { setup } from '../setupGLSL';
import { Traces } from '../eval';
import { Trace } from '../Editor';
import { hashStyle } from '../Cell';

type GLSLEnv = {
    type: 'GLSLEnv';
    time: number;
    resolution: Vec2;
    camera: Vec3;
    mouse: Vec2;
};
type Vec2 = { type: 'Vec2'; x: number; y: number };
type Vec3 = { type: 'Vec3'; x: number; y: number; z: number };
type Vec4 = { type: 'Vec4'; x: number; y: number; z: number; w: number };

type OpenGLFn = (glslEnv: GLSLEnv, fragCoord: Vec2) => any;

const drawToCanvas = (
    ctx: CanvasRenderingContext2D,
    fn: OpenGLFn,
    env: GLSLEnv,
) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const w = 20;
    const h = 20;

    const dx = ctx.canvas.width / w;
    const dy = ctx.canvas.height / h;
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const color = fn(env, {
                type: 'Vec2',
                x: x * dx,
                y: ctx.canvas.height - y * dy,
            });
            ctx.fillStyle = `rgba(${color.x * 255},${color.y * 255},${
                color.z * 255
            },${color.w})`;
            ctx.fillRect(x * dx, y * dy, dx, dy);
        }
    }
};

const newGLSLEnv = (canvas: HTMLCanvasElement): GLSLEnv => ({
    type: 'GLSLEnv',
    time: 0,
    resolution: {
        type: 'Vec2',
        x: canvas.width,
        y: canvas.height,
    },
    camera: { type: 'Vec3', x: 0.0, y: 0.0, z: -5.0 },
    mouse: {
        type: 'Vec2',
        x: canvas.width / 2,
        y: canvas.height / 2,
    },
});

const ShaderCPU = ({ fn, evalEnv }: { fn: OpenGLFn; evalEnv: EvalEnv }) => {
    const canvasRef = React.useRef(null as null | HTMLCanvasElement);
    const [paused, setPaused] = React.useState(false);
    // const [data, setData] = React.useState([]);
    const [error, setError] = React.useState(null as any | null);

    const wrapped = React.useMemo(() => wrapWithExecutaionLimit(evalEnv, fn), [
        fn,
    ]);
    const fc = React.useRef(wrapped);
    fc.current = wrapped;

    const timer = React.useRef(0);

    React.useEffect(() => {
        if (paused) {
            return;
        }
        let env: GLSLEnv;

        let start = Date.now();
        const tid = setInterval(() => {
            if (!canvasRef.current) {
                return;
            }
            const ctx = canvasRef.current.getContext('2d')!;
            if (!env) {
                env = newGLSLEnv(ctx.canvas);
                canvasRef.current.addEventListener('mousemove', (evt) => {
                    const box = (evt.target as HTMLCanvasElement).getBoundingClientRect();
                    env.mouse.x = evt.clientX - box.left;
                    env.mouse.y = evt.clientY - box.top;
                });
            }
            timer.current += (Date.now() - start) / 1000;
            start = Date.now();
            env.time = timer.current;
            try {
                drawToCanvas(ctx, fc.current, env);
            } catch (err) {
                clearInterval(tid);
                setError(err);
            }
        }, 40);
        return () => clearInterval(tid);
    }, [paused]);

    if (error != null) {
        return (
            <div
                style={{
                    whiteSpace: 'pre-wrap',
                }}
            >
                {error.message}
            </div>
        );
    }

    return (
        <canvas
            onClick={() => setPaused(!paused)}
            ref={canvasRef}
            width="200"
            height="200"
        />
    );
};

export const compileGLSL = (
    term: Term,
    env: Env,
    buffers: number = 0,
    includeComments = true,
) => {
    const termId =
        term.type === 'ref' && term.ref.type === 'user'
            ? term.ref.id
            : { hash: hashObject(term), size: 1, pos: 0 };
    return generateSingleShader(
        env,
        { includeCanonicalNames: true, showAllUniques: true },
        {},
        termId,
        buffers,
        includeComments,
    );
};

export const envWithTerm = (env: Env, term: Term) => {
    const id = { hash: hashObject(term), size: 1, pos: 0 };
    return {
        ...env,
        global: {
            ...env.global,
            terms: {
                ...env.global.terms,
                [idName(id)]: term,
            },
        },
    };
};

const ShaderGLSLBuffers = ({
    fn,
    term,
    env,
    evalEnv,
    startPaused,
}: {
    fn: OpenGLFn;
    term: Term;
    env: Env;
    evalEnv: EvalEnv;
    startPaused: boolean;
}) => {
    const [width, setWidth] = React.useState(200);
    const [canvas, setCanvas] = React.useState(
        null as null | HTMLCanvasElement,
    );
    const [restartCount, setRestartCount] = React.useState(0);
    const [paused, setPaused] = React.useState(startPaused);
    const [error, setError] = React.useState(null as any | null);

    const [tracing, setTracing] = React.useState(false);

    const shaders = React.useMemo(() => {
        if (term.is.type === 'lambda') {
            return [compileGLSL(term, envWithTerm(env, term), 0)];
        }
        if (term.type !== 'Tuple') {
            throw new Error(`Expression must be a tuple literal`);
        }
        try {
            return term.items.map((item) =>
                compileGLSL(
                    item,
                    envWithTerm(env, item),
                    term.items.length - 1,
                ),
            );
        } catch (err) {
            setError(err);
            return null;
        }
    }, [term]);

    const timer = React.useRef(0);

    const [mousePos, setMousePos] = React.useState({ x: 0, y: 0, button: -1 });
    const currentMousePos = React.useRef(mousePos);
    currentMousePos.current = mousePos;

    const traceValue = React.useMemo(() => {
        if (!tracing || !canvas) {
            return null;
        }
        const hash = hashObject(term);
        const id: Id = { hash, size: 1, pos: 0 };
        // const fn = evalEnv.terms[idName(id)];
        if (typeof fn !== 'function') {
            console.log('not a function', fn);
            return null;
        }

        const glEnv = newGLSLEnv(canvas);
        glEnv.time = timer.current;

        const old = evalEnv.traceObj.traces;
        const traces = (evalEnv.traceObj.traces = {});
        const color = fn(glEnv, {
            type: 'Vec2',
            x: mousePos.x,
            y: mousePos.y,
        });
        evalEnv.traceObj.traces = old;
        return { color, traces };
    }, [tracing, mousePos, term]);

    const updateFn = React.useMemo(() => {
        if (!canvas || !shaders) {
            return null;
        }
        const ctx = canvas.getContext('webgl2');
        if (!ctx) {
            return;
        }
        try {
            const update = setup(
                ctx,
                shaders[0].text,
                timer.current,
                currentMousePos.current,
                shaders.slice(1).map((shader) => shader.text),
            );
            return update;
        } catch (err) {
            console.log(err);
            setError(err);
        }
    }, [canvas, shaders, restartCount]);

    React.useEffect(() => {
        if (!updateFn || paused) {
            return;
        }
        let tid: any;
        let last = Date.now();
        const fn = () => {
            const now = Date.now();
            timer.current += (now - last) / 1000;
            last = now;
            updateFn(timer.current, currentMousePos.current);
            tid = requestAnimationFrame(fn);
        };
        tid = requestAnimationFrame(fn);
        return () => cancelAnimationFrame(tid);
    }, [updateFn, paused, restartCount]);

    if (error != null) {
        return (
            <div>
                <div
                    style={{
                        padding: 4,
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        backgroundColor: '#300',
                    }}
                >
                    {error.message + '\n' + error.stack}
                </div>
                {shaders != null ? (
                    <pre
                        style={{
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {error.shader ? error.shader : shaders[0].text}
                    </pre>
                ) : null}
            </div>
        );
    }

    return (
        <div>
            <canvas
                onClick={() => setPaused(!paused)}
                onMouseMove={(evt) => {
                    const box = (evt.target as HTMLCanvasElement).getBoundingClientRect();
                    setMousePos({
                        x: (evt.clientX - box.left) * 2,
                        y: (box.height - (evt.clientY - box.top)) * 2,
                        button: evt.button != null ? evt.button : -1,
                    });
                }}
                ref={(node) => {
                    if (node && !canvas) {
                        setCanvas(node);
                    }
                }}
                style={{
                    width: width,
                    height: width,
                }}
                // Double size for retina
                width={width * 2 + ''}
                height={width * 2 + ''}
            />
            <button
                onClick={() => {
                    timer.current = 0;
                    if (paused) {
                        setPaused(false);
                    }
                    setRestartCount(restartCount + 1);
                }}
            >
                Restart
            </button>
            <input
                value={width + ''}
                onChange={(evt) => {
                    const value = +evt.target.value;
                    if (!isNaN(value)) {
                        setWidth(value);
                    }
                }}
            />
            {tracing && traceValue ? (
                <ShowTrace trace={traceValue} env={env} pos={mousePos} />
            ) : (
                <button onClick={() => setTracing(true)}>Trace</button>
            )}
        </div>
    );
};

const ShowTrace = ({
    trace: { color, traces },
    env,
    pos,
}: {
    trace: { color: Vec4; traces: { [key: string]: Array<Array<Trace>> } };
    env: Env;
    pos: { x: number; y: number };
}) => {
    return (
        <div
            style={{
                fontFamily: '"Source Code Pro", monospace',
                whiteSpace: 'pre-wrap',
            }}
        >
            <div style={{ display: 'flex', padding: '8px 0' }}>
                Output color at ({pos.x}, {pos.y}):
                <div
                    style={{
                        width: 20,
                        height: 20,
                        marginLeft: 8,
                        border: '1px solid black',
                        backgroundColor: `rgba(${color.x * 255},${
                            color.y * 255
                        },${color.z * 255}, ${color.w})`,
                    }}
                ></div>
            </div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                }}
            >
                {Object.keys(traces).map((hash) =>
                    traces[hash].map((items, i) => (
                        <div key={`${hash}:${i}`}>
                            <div>
                                <span style={hashStyle}>
                                    {env.global.idNames[hash]
                                        ? env.global.idNames[hash] + '#' + hash
                                        : '#' + hash}
                                </span>
                                trace {i}
                            </div>
                            {items.length > 10 ? (
                                <div>
                                    {items.slice(0, 5).map((item, j) => (
                                        <TraceItem i={j} item={item} key={j} />
                                    ))}
                                    ...
                                    {items.slice(-5).map((item, j) => (
                                        <TraceItem
                                            i={items.length - 5 + j}
                                            item={item}
                                            key={items.length - 5 + j}
                                        />
                                    ))}
                                </div>
                            ) : (
                                items.map((item, j) => (
                                    <TraceItem i={j} item={item} key={j} />
                                ))
                            )}
                        </div>
                    )),
                )}
            </div>
        </div>
    );
};

const TraceItem = ({ i, item }: { i: number; item: Trace }) => {
    return (
        <div>
            {i}: {showItem(item.arg)}{' '}
            {item.others.length
                ? item.others.map((v, i) => (
                      <span key={i} style={{ marginRight: 8 }}>
                          {showItem(v)}
                      </span>
                  ))
                : null}
        </div>
    );
};

const showItem = (value: any) => {
    if (!value || typeof value === 'string') {
        return JSON.stringify(value);
    }
    if (typeof value === 'function') {
        return `Function with ${value.length} arguments`;
    }
    if (typeof value === 'number') {
        if (Math.floor(value) === value) {
            return value.toString();
        } else {
            return value.toFixed(4);
        }
    }
    if (typeof value === 'object') {
        if (value.type === 'Vec2') {
            return `(${value.x.toFixed(4)}, ${value.y.toFixed(4)})`;
        }
        if (value.type === 'Vec3') {
            return `(${value.x.toFixed(4)}, ${value.y.toFixed(
                2,
            )}, ${value.z.toFixed(4)})`;
        }
        if (value.type === 'Vec4') {
            return `(${value.x.toFixed(4)}, ${value.y.toFixed(
                2,
            )}, ${value.z.toFixed(4)}, ${value.w.toFixed(4)})`;
        }
    }
    return JSON.stringify(value);
};

const shaderFunction = (buffers: number) => {
    const args = [refType('451d5252'), refType('43802a16')];
    for (let i = 0; i < buffers; i++) {
        args.push(builtinType('sampler2D'));
    }
    return pureFunction(args, refType('3b941378'));
};

const plugins: Plugins = {
    openglBuffer1: {
        id: 'opengl1',
        name: 'Shader GLSL',
        type: builtinType('Tuple2', [shaderFunction(1), shaderFunction(1)]),
        render: (
            fn: OpenGLFn,
            evalEnv: EvalEnv,
            env: Env,
            term: Term,
            startPaused: boolean,
        ) => {
            return (
                <ShaderGLSLBuffers
                    fn={fn}
                    env={env}
                    evalEnv={evalEnv}
                    term={term}
                    startPaused={startPaused}
                />
            );
        },
    },
    openglBuffer2: {
        id: 'opengl2',
        name: 'Shader GLSL',
        type: builtinType('Tuple3', [
            shaderFunction(2),
            shaderFunction(2),
            shaderFunction(2),
        ]),
        render: (
            fn: OpenGLFn,
            evalEnv: EvalEnv,
            env: Env,
            term: Term,
            startPaused: boolean,
        ) => {
            return (
                <ShaderGLSLBuffers
                    fn={fn}
                    env={env}
                    evalEnv={evalEnv}
                    term={term}
                    startPaused={startPaused}
                />
            );
        },
    },
    opengl: {
        id: 'opengl',
        name: 'Shader GLSL',
        type: pureFunction(
            [refType('451d5252'), refType('43802a16')],
            refType('3b941378'),
        ),
        render: (
            fn: OpenGLFn,
            evalEnv: EvalEnv,
            env: Env,
            term: Term,
            startPaused: boolean,
        ) => {
            // return <div>Ok folks</div>;
            return (
                <ShaderGLSLBuffers
                    fn={fn}
                    env={env}
                    evalEnv={evalEnv}
                    term={term}
                    startPaused={startPaused}
                />
            );
        },
    },
    'opengl-fake': {
        id: 'opengl-fake',
        name: 'Shader CPU',
        type: pureFunction(
            [refType('451d5252'), refType('43802a16')],
            refType('3b941378'),
        ),
        render: (fn: OpenGLFn, evalEnv: EvalEnv) => {
            // return <div>Hello fokls</div>;
            return <ShaderCPU fn={fn} evalEnv={evalEnv} />;
        },
    },
};
export default plugins;
