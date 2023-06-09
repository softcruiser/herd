// FUTURE WORK
// - recognize that `is`, `location`, and `decorators` are common to all `Term`s,
//   and so they can be done at the top level of `transformTerm`, instead of in every branch.

import * as t from '@babel/types';
import babel, { traverse } from '@babel/core';
import fs from 'fs';
import generate from '@babel/generator';

const [_, __, inFile, outFile, visitorTypesRaw] = process.argv;
const ast = babel.parse(fs.readFileSync(inFile, 'utf8'), {
    filename: inFile,
    presets: ['@babel/preset-typescript'],
});
if (!ast) {
    throw new Error(`unable to parse`);
}
const body = ast.type === 'File' ? ast.program.body : ast.body;

const types: {
    [key: string]: {
        type: t.TSType;
        params: t.TSTypeParameterDeclaration | null;
    };
} = {};

body.forEach((stmt) => {
    if (
        stmt.type === 'ExportNamedDeclaration' &&
        stmt.declaration &&
        stmt.declaration.type === 'TSTypeAliasDeclaration'
    ) {
        // console.log(stmt.declaration.id.name);
        types[stmt.declaration.id.name] = {
            type: stmt.declaration.typeAnnotation,
            params: stmt.declaration.typeParameters || null,
        };
    }
});

const visitorTypes = visitorTypesRaw.split(',');
/*
Ok, so general plan:
make a `transform{X}` function, that does `(value: X, visitor: Visitor<Ctx>, ctx: Ctx) => X`
I'll deal with X => Array<X> later.
Interally, this does
{
    const transformed = visitor.${x}(value, ctx)
    if (transformed === false) {
        return value
    }
    if (transformed != null) {
        if (Array.isArray(transformed)) {
            ctx = transformed[1]
            if (transformed[0] != null) {
                value = transformed[0]
            }
        } else {
            value = transformed
        }
    }
}
yeah I should just do string concat
*/

const getTypeName = (t: t.TSTypeElement) =>
    t.type === 'TSPropertySignature' &&
    t.key.type === 'Identifier' &&
    t.key.name === 'type' &&
    t.typeAnnotation &&
    t.typeAnnotation.typeAnnotation.type === 'TSLiteralType' &&
    t.typeAnnotation.typeAnnotation.literal.type === 'StringLiteral'
        ? t.typeAnnotation.typeAnnotation.literal.value
        : null;

const makeIndividualTransformer = (
    vbl: string,
    newName: string,
    level: number,
    type: t.TSType,
    nullable?: 'null' | 'undefined',
): string | null => {
    if (level > 20) {
        throw new Error('nope');
    }
    if (nullable != null) {
        const inner = makeIndividualTransformer(
            `${newName}$current`,
            newName + `$${level}$`,
            level,
            type,
        );
        if (!inner) {
            return null;
        }
        return `
        let ${newName} = ${nullable};
        const ${newName}$current = ${vbl};
        if (${newName}$current != null) {
            ${inner}
            ${newName} = ${newName}$${level}$;
        }
        `;
    }
    if (type.type === 'TSTypeReference') {
        if (type.typeName.type !== 'Identifier') {
            throw new Error(`qualified?`);
        }
        if (type.typeName.name === 'Array') {
            const inner = makeIndividualTransformer(
                `${newName}$item${level}`,
                'result',
                level + 1,
                type.typeParameters!.params[0],
            );
            if (inner) {
                return `
                let ${newName} = ${vbl};
                {
                    let changed${level + 1} = false;
                    const arr${level} = ${vbl}.map((${newName}$item${level}) => {
                        ${inner}
                        return result
                    })
                    if (changed${level + 1}) {
                        ${newName} = arr${level};
                        changed${level} = true;
                    }
                }
                `;
            }
        }
        if (type.typeParameters) {
            // console.log('Generics not handled', type.loc);
            // return null;
        }
        // if (visitorTypes.includes(type.typeName.name)) {
        // console.log(type.typeName.name, level);
        if (transformerStatus[type.typeName.name] === undefined) {
            transformers[type.typeName.name] = makeTransformer(
                type.typeName.name,
            );
            // transformerStatus[type.typeName.name] = true;
        }
        if (transformerStatus[type.typeName.name] === null) {
            return null;
        }
        return `
                const ${newName} = transform${type.typeName.name}(${vbl}, visitor, ctx);
                changed${level} = changed${level} || ${newName} !== ${vbl};`;
        // }
        // if (types[type.typeName.name]) {
        //     console.log(type.typeName.name);
        //     return makeIndividualTransformer(
        //         vbl,
        //         newName,
        //         level,
        //         types[type.typeName.name],
        //     );
        // }
        // OTHERWISE: if this type eventually includes a thing that needs changing,
        // it'll be quite a hassle.
    }
    if (type.type === 'TSTypeLiteral') {
        return objectTransformer(vbl, newName, level, type);
    }
    if (type.type === 'TSUnionType') {
        if (type.types.length === 2) {
            if (type.types[0].type === 'TSNullKeyword') {
                return makeIndividualTransformer(
                    vbl,
                    newName,
                    level,
                    type.types[1],
                    'null',
                );
            }
            if (type.types[1].type === 'TSNullKeyword') {
                return makeIndividualTransformer(
                    vbl,
                    newName,
                    level,
                    type.types[0],
                    'null',
                );
            }
        }
        return unionTransformer(vbl, newName, level, type);
    }
    if (type.type === 'TSArrayType') {
        throw new Error(`expected Array<X>, not X[]`);
    }
    return null;
};

const objectTransformer = (
    vbl: string,
    newName: string,
    level: number,
    type: t.TSTypeLiteral,
) => {
    const transformers: Array<string> = [];
    const sliders: Array<string> = [];
    type.members.forEach((member) => {
        if (member.type === 'TSIndexSignature') {
            const newNameInner = `${newName}$value`;
            const individual = makeIndividualTransformer(
                `${vbl}[key]`,
                newNameInner,
                level + 1,
                member.typeAnnotation!.typeAnnotation,
            );
            if (individual) {
                transformers.push(`
                const spread: {[key: string]: ${
                    generate(member.typeAnnotation!.typeAnnotation).code
                }} = {};
                Object.keys(${vbl}).forEach(key => {
                    ${individual}
                    spread[key] = ${newNameInner}
                })
                `);
                sliders.push(`...spread`);
                return;
            } else {
                return;
            }
        }
        if (member.type !== 'TSPropertySignature') {
            throw new Error(`Can't process a ${member.type}`);
        }
        if (member.key.type !== 'Identifier') {
            throw new Error(`unexpected key ${member.key.type}`);
        }
        if (!member.typeAnnotation) {
            throw new Error(`No annotation`);
        }
        const newNameInner = `${newName}$${member.key.name}`;
        const individual = makeIndividualTransformer(
            `${vbl}.${member.key.name}`,
            newNameInner,
            level + 1,
            member.typeAnnotation.typeAnnotation,
            member.optional ? 'undefined' : undefined,
        );
        if (individual) {
            transformers.push(individual);
            sliders.push(`${member.key.name}: ${newNameInner}`);
        }
    });
    if (!transformers.length) {
        return null;
    }
    return `
            let ${newName} = ${vbl};
            {
                let changed${level + 1} = false;
                ${transformers.join('\n\n                ')}
                if (changed${level + 1}) {
                    ${newName} =  {...${newName}, ${sliders.join(', ')}};
                    changed${level} = true;
                }
            }
            `;
};

const unionTransformer = (
    vbl: string,
    newName: string,
    level: number,
    type: t.TSUnionType,
) => {
    const allTypes: Array<[string, t.TSTypeLiteral]> = [];
    // console.log('---> getting');
    let hasCases = false;
    const cases: Array<string> = [];
    const processType = (type: t.TSType, last: boolean) => {
        if (type.type === 'TSUnionType') {
            const sorted = type.types.slice().sort((a, b) => {
                const au =
                    a.type === 'TSTypeReference' &&
                    a.typeName.type === 'Identifier' &&
                    types[a.typeName.name] &&
                    types[a.typeName.name].type.type === 'TSUnionType';
                const bu =
                    b.type === 'TSTypeReference' &&
                    b.typeName.type === 'Identifier' &&
                    types[b.typeName.name] &&
                    types[b.typeName.name].type.type === 'TSUnionType';
                return (au ? 1 : 0) - (bu ? 1 : 0);
            });
            sorted.forEach((inner, i) => {
                processType(inner, last && i === sorted.length - 1);
            });
        } else if (
            type.type === 'TSTypeReference' &&
            type.typeName.type === 'Identifier'
        ) {
            if (last) {
                const transformer = makeIndividualTransformer(
                    vbl,
                    `${newName}$${level}node`,
                    level + 1,
                    type,
                );
                if (transformer) {
                    cases.push(`default: {
                        let changed${level + 1} = false;
                        ${transformer}
                        ${newName} = ${newName}$${level}node;
                    }`);
                }
            } else if (types[type.typeName.name]) {
                let inner = types[type.typeName.name].type;
                if (type.typeParameters) {
                    inner = subsituteTypeArgs(
                        types[type.typeName.name].type,
                        types[type.typeName.name].params,
                        type.typeParameters,
                    );
                    // throw new Error('vbl in union, must fix');
                }
                processType(inner, false);
            }
        } else if (type.type === 'TSTypeLiteral') {
            const tname = type.members
                .map(getTypeName)
                .filter(Boolean) as Array<string>;
            if (!tname.length) {
                throw new Error(`No 'type' member`);
            }
            const specified = `${newName}$${level}specified`;
            const transformer = objectTransformer(
                specified,
                `${newName}$${level}node`,
                level + 1,
                type,
            );
            const name = tname[0];
            if (transformer) {
                cases.push(`case '${name}': {
                    const ${specified} = ${vbl};
                    let changed${level + 1} = false;
                    ${transformer}
                    ${newName} = ${newName}$${level}node;
                    break;
                }`);
                hasCases = true;
            } else {
                cases.push(`case '${name}': break;`);
            }
        }
    };
    processType(type, true);
    // getAllUnionTypeMembers(allTypes, type, {});
    // console.log('<--- got');
    // const individualCases = allTypes.map(([name, defn]) => {
    //     const transformer = objectTransformer(
    //         vbl,
    //         `${newName}$${level}node`,
    //         level + 1,
    //         defn,
    //     );
    //     if (!transformer) {
    //         return `case '${name}': break;`;
    //     }
    //     return `case '${name}': {
    //             let changed${level + 1} = false;
    //             ${transformer}
    //             ${newName} = ${newName}$${level}node;
    //             break;
    //         }`;
    // });
    if (!hasCases) {
        return null; // `const ${newName} = ${vbl};`;
    }
    return `
        let ${newName} = ${vbl};
        switch (${vbl}.type) {
            ${cases.join('\n\n            ')}
        }`;
};

// TODO: Let | Term should break out to --- switch let, and then just delegate to 'Term'

const subsituteTypeArgs = (
    type: t.TSType,
    params: t.TSTypeParameterDeclaration | null,
    args: t.TSTypeParameterInstantiation,
) => {
    if (!params) {
        console.error(type.loc);
        throw new Error(`params provided, bt not declared`);
    }

    const names = params.params.map((param) => param.name);

    const cloned = t.cloneNode(type, true);
    traverse(cloned, {
        noScope: true,
        enter: (path) => {
            if (
                path.node.type === 'TSTypeReference' &&
                path.node.typeName.type === 'Identifier'
            ) {
                const idx = names.indexOf(path.node.typeName.name);
                if (idx !== -1) {
                    path.replaceWith(args.params[idx]);
                }
            }
        },
    });
    return cloned;
};

const makeTransformer = (
    name: string,
    args?: t.TSTypeParameterInstantiation,
) => {
    // console.log(name);
    transformerStatus[name] = false;
    const defn = types[name];
    if (!defn) {
        transformerStatus[name] = null;
        return `// not a type ${name}`;
        // throw new Error(`Not a type ${name}`);
    }
    let t: t.TSType = defn.type;
    if (args) {
        t = subsituteTypeArgs(t, defn.params, args);
    }
    const transformer = makeIndividualTransformer(
        `node`,
        `updatedNode`,
        0,
        defn.type,
    );
    if (transformer == null && !visitorTypes.includes(name)) {
        transformerStatus[name] = null;
        return `// no transformer for ${name}`;
    }
    return `export const transform${name} = <Ctx>(node: ${name}, visitor: Visitor<Ctx>, ctx: Ctx): ${name} => {
        if (!node) {
            throw new Error('No ${name} provided');
        }
        ${
            visitorTypes.includes(name)
                ? `
        const transformed = visitor.${name} ? visitor.${name}(node, ctx) : null;
        if (transformed === false) {
            return node;
        }
        if (transformed != null) {
            if (Array.isArray(transformed)) {
                ctx = transformed[1];
                if (transformed[0] != null) {
                    node = transformed[0];
                }
            } else {
                node = transformed;
            }
        }
        `
                : ''
        }
        let changed0 = false;
        ${transformer ? transformer : 'const updatedNode = node;'}
        ${
            visitorTypes.includes(name)
                ? `
        node = updatedNode;
        if (visitor.${name}Post) {
            const transformed = visitor.${name}Post(node, ctx);
            if (transformed != null) {
                node = transformed;
            }
        }
        return node;
        `
                : 'return updatedNode;'
        }
    }`;
};

const transformerStatus: { [key: string]: boolean | null } = {};

const transformers: { [key: string]: string } = {};
visitorTypes.forEach((name) => (transformers[name] = makeTransformer(name)));
// let tick = true;
// while (tick) {
//     tick = false;
//     Object.keys(transformerStatus).forEach((k) => {
//         if (transformerStatus[k] === true) {
//             if (types[k] == null) {
//                 console.log(`Missing ${k}`);
//                 transformerStatus[k] = null;
//                 return;
//             }
//             tick = true;
//             transformers[k] = (makeTransformer(k));
//         }
//     });
// }

const prelude = `import {${Object.keys(transformerStatus)
    .filter((k) => k !== 'Array')
    .join(', ')}} from './types';

export type Visitor<Ctx> = {
    ${visitorTypes
        .map(
            (name) =>
                `${name}?: (node: ${name}, ctx: Ctx) => null | false | ${name} | [${name} | null, Ctx]
                ${name}Post?: (node: ${name}, ctx: Ctx) => null | ${name}`,
        )
        .join(',\n    ')}
}
`;

fs.writeFileSync(
    outFile,
    prelude +
        Object.keys(transformers)
            .map((k) => transformers[k])
            .join('\n\n'),
);
