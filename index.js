let classConstructorFieldName = '_SE-CLASS-CONSTRUCTOR'


/**
 * Interface providing support for custom serializable classes.
 * 
 * Static function *deserialize(key, value)* must be defined by the inheritor, otherwise the structure cannot be restored.
 */
class Serializable {
    /**
     * Do something before serialization.
     * @param {string} key key in the JSON structure.
     * @param {string} value
     * @returns {Serializable}
     */
    static serialize(key, value) {
        return Object.assign(value, { [classConstructorFieldName]: value.constructor.name })
    }
    /**
     * Restore the instance.
     * @param {string} key key in the JSON structure.
     * @param {object} value 
     * @returns {Serializable}
     */
    static deserialize(key, value) {
        throw new Error('Static function deserialize is not defined by the inheritor.')
    }
    /**
     * @param {string} key 
     * @param {any} value 
     * @returns {Serializable}
     */
    static _deserialize(key, value) {
        delete value[classConstructorFieldName]
        return this.deserialize(key, value)
    }
}


/**@type {Map<string, any>}*/
const serializables = new Map([
    ['Number', {
        deserialize: (key, value) => Number(value.source)
    }],
    ['Array', {
        stringify: value => stringifyArray(value)
    }],
    ['Map', {
        serialize: (key, value) => {
            const result = { source: [], [classConstructorFieldName]: value.constructor.name }
            value.forEach((mapValue, key) => result.source.push([key, mapValue]))
            return result
        },
        deserialize: (key, value) => new Map(value.source)
    }],
    ['Set', {
        serialize: (key, value) => {
            const result = { source: [], [classConstructorFieldName]: value.constructor.name }
            value.forEach(setValue => result.source.push(setValue))
            return result
        },
        deserialize: (key, value) => new Set(value.source)
    }],
    ['Date', {
        serialize: (key, value) => {
            return { source: value.toISOString(), [classConstructorFieldName]: value.constructor.name }
        },
        deserialize: (key, value) => new Date(value.source)
    }],
    ['RegExp', {
        serialize: (key, value) => {
            return { source: value.source, flags: value.flags, [classConstructorFieldName]: value.constructor.name }
        },
        deserialize: (key, value) => new RegExp(value.source, value.flags)
    }],
    ['BigInt', {
        deserialize: (key, value) => BigInt(value.source)
    }]
])


function defineSerializable(clss) {
    serializables.set(clss.name, clss)
}



/*
 * STRINGIFY
 */

let eol, spacer, nestingLvl, nesting, _space, _replacer
const updateNesting = delta =>
    nesting = _space.repeat(nestingLvl += delta)


/**
 * @param {any} obj 
 * @param {string} space 
 * @returns {string}
 */
function stringify(obj, replacer = (/**@type {string}*/key, value) => value, space = '') {
    eol = space ? '\n' : ''
    spacer = space ? ' ' : ''
    nestingLvl = 0
    nesting = ''
    _space = space
    _replacer = replacer
    return recursiveStringify('', obj)
}


function recursiveStringify(key, value) {
    value = _replacer(key, value)
    switch (typeof value) {
        case 'string': return `"${escapeBackSlashes(value)}"`
        case 'boolean': return String(value)
        case 'symbol': throw new Error('Symbols are not supported.')
        case 'undefined': return ''
        case 'bigint': return stringifyObject({ source: value.toString(), [classConstructorFieldName]: 'BigInt' })
        case 'number':
            return isFinite(value) && !isNaN(value)
                ? String(value)
                : stringifyObject({ source: String(value), [classConstructorFieldName]: 'Number' })
        case 'object':
            return value === null
                ? null
                : preserveClass(key, value)
        case 'function':
            // TODO: Function serialization and deserialization.
            return '"FunctionPlaceholder"'
        default: throw new Error('Unknown variable type:', typeof value, 'from (key, value):', key, ',', value)
    }
}


function preserveClass(key, value) {
    const clss = serializables.get(value.constructor.name)
    if (!clss) return stringifyObject(value)
    if ('serialize' in clss) value = clss.serialize(key, value)
    if ('stringify' in clss) return clss.stringify(value)
    return stringifyObject(value)
}


function stringifyArray(array) {
    let separator = ''
    let result = '['
    updateNesting(1)
    for (let element of array) {
        result += separator + eol + nesting + recursiveStringify('', element)
        separator = ','
    }
    updateNesting(-1)
    return result + eol + nesting + ']'
}


function stringifyObject(obj) {
    const fields = Object.keys(obj)
    if (fields.length <= 0) return ''
    let separator = ''
    let result = '{'
    updateNesting(1)
    for (let field of fields) {
        const fieldValue = recursiveStringify(field, obj[field])
        if (fieldValue === '') continue
        result += separator + eol + nesting + `"${field}":` + spacer + fieldValue
        separator = ','
    }
    updateNesting(-1)
    return result + eol + nesting + '}'
}


function escapeBackSlashes(str) {
    let i = str.length
    while (--i > -1)
        if (str.charAt(i) === '\\')
            str = str.slice(0, i) + '\\' + str.slice(i)
    return str
}



/*
 * PARSE
 */

let _reviver

/**
 * @param {string} str 
 */
function parse(str, reviver = (/**@type {string}*/key, value) => value) {
    _reviver = reviver
    return recursiveParse('', JSON.parse(str))
}


function recursiveParse(key, value) {
    const type = typeof value
    if (type !== 'object' || value === null) return _reviver(key, value)
    if (value.constructor.name === 'Array') {
        for (let i = 0; i < value.length; i++)
            value[i] = recursiveParse('', value[i])
        return _reviver(key, value)
    }
    if (!([classConstructorFieldName] in value)) return _reviver(key, recursiveParseObject(value))
    const clss = serializables.get(value[classConstructorFieldName])
    if (!clss) return _reviver(key, recursiveParseObject(value))

    let deserialized
    if ('_deserialize' in clss) deserialized = clss._deserialize(key, value)
    else if ('deserialize' in clss) deserialized = clss.deserialize(key, value)
    return _reviver(key, recursiveParseObject(deserialized))
}


function recursiveParseObject(value) {
    for (let field of Object.keys(value))
        value[field] = recursiveParse(field, value[field])
    return value
}


module.exports = {
    Serializable,
    defineSerializable,
    stringify,
    parse
}