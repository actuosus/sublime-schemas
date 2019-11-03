/**
 * JSON Schema generator script.
 * 
 * Gets JSON file and generates JSON Schema based on values in JSON data file.
 * Under the hood it uses jsonc-parser to parse JSON files with comments.
 * 
 * Similar to https://jsonschema.net/
 */

const fs = require('fs')
const path = require('path');
const jsoncParser = require('jsonc-parser')

/**
 * Returns JS value type string using `typeof`.
 *
 * @param {*} value JS value to detect type from
 * 
 * @returns {string} JS value type
 */
function getNodeType(value) {
    switch (typeof value) {
        case 'boolean': return 'boolean';
        case 'number': return 'number';
        case 'string': return 'string';
        case 'object': {
            if (!value) {
                return 'null';
            } else if (Array.isArray(value)) {
                return 'array';
            }
            return 'object';
        }
        default: return 'null';
    }
}

function ensurePropertyComplete(currentParent, endOffset) {
    if (currentParent.type === 'property') {
        currentParent.length = endOffset - currentParent.offset;
        currentParent = currentParent.parent;
    }
}

/**
 * @typedef Node
 * @property {'boolean'|'number'|'string'|'object'|'null'} type Node type (JavaScript Value type)
 * @property {number} offset String offset of current node related to the file
 * @property {number} length String length of current node related to the file
 * @property {Node[]} children List of children of current node
 * @property {Node=} parent Reference to parent node
 * @property {string[]=} comment Comment for current node
 */

/**
 * Parse JSON file and returns tree representation.
 *
 * @param {string} json JSON strings
 * 
 * @returns {Node} Root node
 */
function visit(json) {
    /**
     * Root node
     * @type {Node}
     */
    let currentParent = { type: 'array', offset: -1, length: -1, children: [], parent: undefined }

    /**
     * Current comment buffer
     */
    let commentBuffer = []

    const errors = []

    /**
     * Strips comment characters and space from comment start.
     *
     * @param {string} string Comment string
     */
    function commentString(string) {
        return string.replace(/\/\/\s*/, '')
    }

    /**
     * @param {Node} valueNode Node value to add to children of current node
     */
    function onValue(valueNode) {
        currentParent.children.push(valueNode);
        return valueNode;
    }

    jsoncParser.visit(json, {
        onObjectBegin: (offset) => {
            currentParent = onValue({ type: 'object', offset, length: -1, parent: currentParent, children: [], comment: Array.from(commentBuffer) });

            // Reset comment buffer
            commentBuffer = []
        },
        onObjectProperty: (name, offset, length) => {
            currentParent = onValue({ type: 'property', name, offset, length: -1, parent: currentParent, children: [], comment: Array.from(commentBuffer) });
            currentParent.children.push({ type: 'string', value: name, offset, length, parent: currentParent });

            // Reset comment buffer
            commentBuffer = []
        },
        onObjectEnd: (offset, length) => {
            currentParent.length = offset + length - currentParent.offset;
            currentParent = currentParent.parent;
            ensurePropertyComplete(currentParent, offset + length);
        },
        onArrayBegin: (offset) => {
            currentParent = onValue({ type: 'array', offset, length: -1, parent: currentParent, children: [] });
        },
        onArrayEnd: (offset, length) => {
            currentParent.length = offset + length - currentParent.offset;
            currentParent = currentParent.parent;
            ensurePropertyComplete(currentParent, offset + length);
        },
        onLiteralValue: (value, offset, length) => {
            onValue({ type: getNodeType(value), offset, length, parent: currentParent, value });
            ensurePropertyComplete(currentParent, offset + length);
        },
        onSeparator: (sep, offset) => {
            if (currentParent.type === 'property') {
                if (sep === ':') {
                    currentParent.colonOffset = offset;
                } else if (sep === ',') {
                    ensurePropertyComplete(currentParent, offset);
                }
            }
        },
        onError: (error, offset, length) => {
            errors.push({ error, offset, length });
        },
        onComment: function (offset, length) {
            const comment = json.substr(offset, length)

            // Put more data to comment buffer
            commentBuffer.push(commentString(comment))
        }
    }, { allowTrailingComma: true })

    return currentParent
}

/**
 * Iterates over complex data and returns JS Object or JS Value
 *
 * @param {Object} item Item object to walk on
 * @param {Object=} ref Reference object to modify
 */
function walkValues(item, ref) {
    if (!item) {
        return
    }
    if (item.type === 'boolean') {
        ref = item.value
        return ref
    }
    if (item.type === 'string') {
        ref = item.value
        return ref
    }
    if (item.type === 'number') {
        ref = item.value
        return ref
    }
    if (item.type === 'property') {
        ref[item.children[0].value] = walkValues(item.children[1])
        return ref
    }

    if (item.type === 'array') {
        const acc = []
        for (var i = 0; i < item.children.length; i++) {
            const child = item.children[i]
            acc.push(walkValues(child))
        }
        return acc
    }

    if (item.type === 'object') {
        const acc = {}
        for (var i = 0; i < item.children.length; i++) {
            const child = item.children[i]
            walkValues(child, acc)
        }
        return acc
    }
}

const options = {
    global: {
        uriFormat: 'JSON Pointer Fragment',
        version: 'draft-07',
        absoluteUri: 'http://example.com/root.json',
    },
    annotations: {
        inferDefault: true,
        inferTitle: true,
        inferDescription: false,
        inferExamples: true,
        readOnly: undefined,
        writeOnly: undefined,
    },
    assertions: {
        any: {
            inferEnums: false,
            includeNullAsType: false
        },
        object: {
            minProperties: undefined,
            maxProperties: undefined,
            additionalProperties: undefined,
        },
        array: {
            uniqueItems: undefined,
            additionalItems: undefined,
            minItems: undefined,
            maxItems: undefined,
        },
        string: {
            minLength: undefined,
            maxLength: undefined,
            format: undefined,
        },
        number: {
            multipleOf: undefined,
            minimum: undefined,
            maximum: undefined,
            exclusiveMinimum: undefined,
            exclusiveMaximum: undefined,
            useNumberNotInteger: false,
        }
    },
    comments: {
        inferAsTitle: true,
        inferAsDescription: false,
        process: {
            removeNewLine: true
        }
    }
}

/**
 * @typedef Schema
 * @property {string=} $id
 * @property {string=} $schema
 * @property {string=} $vocabulary
 * @property {Object=} $defs
 * @property {string=} $ref
 * @property {string=} $recursiveRef
 * @property {string=} $recursiveAnchor
 * @property {string=} $comment
 * @property {'boolean'|'number'|'string'|'object'|'null'} type
 * @property {string=} title
 * @property {string=} description
 * @property {*=} default
 * @property {*[]=} examples
 * @property {boolean=} readOnly
 * @property {boolean=} writeOnly
 * @property {Object=} items
 * @property {Schema=} additionalItems
 * @property {Schema=} unevaluatedItems
 * @property {Schema=} contains
 * @property {Object=} properties
 * @property {Object=} patternProperties
 * @property {Object=} additionalProperties
 * @property {Schema=} unevaluatedProperties
 * @property {Schema=} propertyNames
 * @property {Schema[]=} allOf
 * @property {Schema[]=} anyOf
 * @property {Schema[]=} oneOf
 * @property {Schema=} not
 * @property {Schema=} if
 * @property {Schema=} then
 * @property {Schema=} else
 * @property {Schema=} dependentSchemas
 * 
 * @see {@link https://json-schema.org/draft/2019-09/json-schema-core.html}
 */

/**
 * Returns new schema
 *
 * @param {Node} item Parsed node item
 * 
 * @returns {Schema} Schema object
 */
function newSchema(item) {
    const schema = {
        type: item.children[1].type
    }

    return schema
}

/**
 * Walk through item object
 *
 * @param {Node} item Item to walk on
 * @param {Schema=} ref Reference object to update
 */
function walk(item, ref) {
    if (item.type === 'property') {
        const schema = newSchema(item)
        const comment = item.comment.join(' ')
        if (comment) {
            if (options.annotations.inferTitle) {
                schema.title = comment
            }
            if (options.annotations.inferDescription) {
                schema.description = comment
            }
        }
        if (options.annotations.inferDefault) {
            schema.default = walkValues(item.children[1])
        }
        if (options.annotations.inferExamples) {
            schema.examples = [walkValues(item.children[1])]
        }
        if (typeof options.annotations.readOnly === 'boolean') {
            schema.readOnly = options.annotations.writeOnly
        }
        if (typeof options.annotations.writeOnly === 'boolean') {
            schema.writeOnly = options.annotations.writeOnly
        }
        walk(item.children[1], schema)
        ref[item.children[0].value] = schema
    }
    if (item.type === 'object') {
        ref.type = item.type
        ref.properties = {}
        for (var i = 0; i < item.children.length; i++) {
            const child = item.children[i]
            walk(child, ref.properties)
        }
    }

    if (item.type === 'array') {
        ref.type = 'array'
        ref.items = {}
        for (var i = 0; i < item.children.length; i++) {
            const child = item.children[i]
            walk(child, ref.items)
        }
    }
}

/**
 * Returns JSON file string.
 *
 * @param {string} filePath Path to input JSON file
 * 
 * @returns {string}
 */
function readJsonFile(filePath) {
    const file = fs.readFileSync(filePath, { flag: 'r' })

    return file.toString()
}

/**
 * Write down generated files on disk.
 * 
 * @param {string} fileName File name to write
 * @param {string} json JSON string to write
 */
function writeGeneratedFile(fileName, json) {
    const outputDir = './build/'
    const outputFile = fileName + '.schema.json'
    fs.mkdirSync(outputDir)
    fs.writeFileSync(path.join(outputDir, outputFile), json)
}

/**
 * Main script function.
 */
function main() {
    const filePath = process.argv[2]
    const fileName = path.extname(filePath).replace('.', '')
    const json = readJsonFile(filePath)
    const tree = visit(json)

    const doc = {
        $schema: "http://json-schema.org/draft-07/schema",
        $id: fileName,
        title: path.basename(filePath, path.extname(filePath)),
        type: 'object',
    }

    walk(tree.children[0], doc)

    const schemaJson = JSON.stringify(doc, null, 4)

    writeGeneratedFile(fileName, schemaJson)
}

main()
