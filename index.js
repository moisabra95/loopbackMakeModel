const MySql = require('mysql');

let cnn = MySql.createConnection({
    host: "127.0.0.1",
    database: "relations",
    user: "root",
    password: "root"
});

const dic = {
    int: "number",
    varchar: "string",
    text: "string",
    char: "string",
    date: "string"
};

const fs = require("fs");

getTables().then(async (tables) => {
    tables.forEach(table => {
        getFields(table).then(fields => {
            let rawfield = '';
            let indexTs = '';

            fields.forEach(field => {
                let if_id = "";
                if (field.key == "PRI") {
                    if_id = `,
        id: true,
        generated: true`;
                }

                rawfield += `
    @property({
        type: '${field.type == 'date' ? 'date' : dic[field.type]}'${if_id}
    })
    ${field.name}?: ${dic[field.type]};
                `;

            });
            console.log(`export {${single(capitalize2(table))},${single(capitalize2(table))}Relations,${single(capitalize2(table))}WithRelations} from './${single(table.replace(/_/g, "-"))}.model'`);
            const writeStream = fs.createWriteStream(`./models/${single(table.replace(/_/g, "-"))}.model.ts`);
            writeStream.write(`import { Entity,  model, property} from '@loopback/repository';
@model({
    name: "${table}",
})
export class ${single(capitalize2(table))} extends Entity {
    ${rawfield}
    constructor(data?: Partial<${single(capitalize2(table))}>) {
        super(data);
    }

}
export interface ${single(capitalize2(table))}Relations {
}
export type ${single(capitalize2(table))}WithRelations = ${single(capitalize2(table))} & ${single(capitalize2(table))}Relations;
            `);
            writeStream.end();
            //console.log(`${table.replace(/_/g, "-")}.model.ts Generado`);
        });
    });
});


function getFields(table) {
    return new Promise((res) => {
        cnn.query(`describe ${table}`, (_, res2) => {
            let fields = [];
            res2.forEach(({ Field, Type, Key, Default }) => {
                fields.push({
                    name: Field,
                    type: Type.split("(")[0],
                    key: Key,
                    default: Default
                })
            })
            res(fields);
        })
    });
}




function getTables() {
    return new Promise((res) => {
        cnn.query("show tables", (_, res2) => {
            let tables = [];
            res2.forEach(({ Tables_in_relations }) => tables.push(Tables_in_relations));
            res(tables);
        })
    });
}

const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}

const capitalize2 = (s) => {
    if (typeof s !== 'string') return ''
    let frase = s.charAt(0).toUpperCase() + s.slice(1);
    let newFrase = '';
    frase.split("_").forEach(st => { newFrase += capitalize(st) })
    return newFrase
}

const single = (frase) => frase.substring(0, frase.length - 1)