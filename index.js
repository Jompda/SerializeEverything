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
     * @returns {Serializable}
     */
    serialize(key) {
        return this
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
const serializables = new Map()


/**
 * @param {Serializable} clss 
 */
function defineSerializable(clss) {
    serializables.set(clss.name, clss)
}


/**
 * @param {any} obj 
 * @param {string} space 
 * @returns {string}
 */
function stringify(obj, replacer = (/**@type {string}*/key, value) => value, space = '') {
    const eol = space ? '\n' : '', spacer = space ? ' ' : ''
    let nestingLvl = 0, nesting = ''
    function updateNesting(delta) {
        nestingLvl += delta
        nesting = space.repeat(nestingLvl)
    }
    return recursive('', obj)
    function recursive(key, value) {
        value = replacer(key, value)
        const type = typeof value
        switch (type) {
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
                    : preserveClass()
            case 'function':
                return stringifyObject({ source: value.toString(), [classConstructorFieldName]: 'Function' })
            default: throw new Error('Unknown variable type:', type, 'from (key, value):', key, ',', value)
        }
        function preserveClass() {
            let result = {}
            switch (value.constructor.name) {
                case 'Object': return stringifyObject(value)
                case 'Array': return stringifyArray(value)
                case 'Map':
                    result.source = []
                    value.forEach((mapValue, key) => result.source.push([key, mapValue]))
                    break
                case 'Set':
                    result.source = []
                    value.forEach(setValue => result.source.push(setValue))
                    break
                case 'Date':
                    result.source = value.toISOString()
                    break
                case 'RegExp':
                    result.source = value.source
                    result.flags = value.flags
                    break
                default:
                    const clss = serializables.get(value.constructor.name)
                    if (!clss) return stringifyObject(value)
                    result = value.serialize(key)
                    break
            }
            Object.assign(result, value, { [classConstructorFieldName]: value.constructor.name })
            return stringifyObject(result)
        }
        function stringifyArray(array) {
            let separator = ''
            let result = '['
            updateNesting(1)
            for (let element of array) {
                result += separator + eol + nesting + recursive('', element)
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
                const fieldValue = recursive(field, obj[field])
                if (fieldValue === '') continue
                result += separator + eol + nesting + `"${field}":` + spacer + fieldValue
                separator = ','
            }
            updateNesting(-1)
            return result + eol + nesting + '}'
        }
    }
    function escapeBackSlashes(str) {
        let i = str.length
        while (--i > -1)
            if (str.charAt(i) === '\\')
                str = str.slice(0, i) + '\\' + str.slice(i)
        return str
    }
}


/**
 * @param {string} str 
 * @returns {any}
 */
function parse(str, reviver = (/**@type {string}*/key, value) => value) {
    const parsed = JSON.parse(str)
    return recursive('', parsed)
    function recursive(key, value) {
        const type = typeof value
        if (type !== 'object' || value === null) return reviver(key, value)
        if (value.constructor.name === 'Array') {
            for (let i = 0; i < value.length; i++)
                value[i] = recursive('', value[i])
            return reviver(key, value)
        }
        if (!(classConstructorFieldName in value)) return reviver(key, recursiveObject(value))
        switch (value[classConstructorFieldName]) {
            case 'Number': return reviver(key, Number(value.source))
            case 'Map': return reviver(key, new Map(value.source))
            case 'Set': return reviver(key, new Set(value.source))
            case 'Date': return reviver(key, new Date(value.source))
            case 'RegExp': return reviver(key, new RegExp(value.source, value.flags))
            case 'BigInt': return reviver(key, BigInt(value.source))
            case 'Function': return reviver(key, eval(value.source))
            default:
                const clss = serializables.get(value[classConstructorFieldName])
                if (clss) {
                    value = clss._deserialize(key, value)
                    if (typeof value !== 'object') throw new Error('Serializable object should not change variable type.')
                }
                return reviver(key, recursiveObject(value))
        }
    }
    function recursiveObject(value) {
        for (let field of Object.keys(value))
            value[field] = recursive(field, value[field])
        return value
    }
}


module.exports = {
    Serializable,
    defineSerializable,
    stringify,
    parse
}