// Try to overcome https://www.npmjs.com/package/serialize-javascript
// Get everything related to a object: https://stackoverflow.com/questions/31054910/get-functions-methods-of-a-class


class TestClass {
    constructor(obj) {
        for (let field of Object.keys(obj))
            this[field] = obj[field]
    }
    getProperties() {
        const properties = new Map()
        for (let field of Object.keys(this))
            properties.set(field, this[field])
        return properties
    }
}


const a = new TestClass({
    null: null,
    undefined: undefined,
    number: 1,
    string: 'yes',
    boolean: false,
    array: ['sure', 'sure2'],
    object: { testField: true, anotherField: 41 },
    map: new Map([['a', 1]]),
    set: new Set([123, 456]),
    date: new Date(),
    infinity: Infinity,
    //regex: /([^\s]+)/g, // TODO: Escape every escape character
    function: () => { return true },
    bigint: BigInt(10)
})
console.log('properties:', a.getProperties())
console.log(Object.keys(a.constructor.prototype))


const b = stringify(a, undefined, '  ')


/**
 * @param {*} obj 
 * @param {function(string, any)} replacer 
 * @param {string} space 
 * @returns {string}
 */
function stringify(obj, replacer, space = '') {
    const eol = space ? '\n' : '', spacer = space ? ' ' : ''
    let nesting = 0
    return recursive('', obj)
    function recursive(key, value) {
        if (replacer) value = replacer(key, value)
        // "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function"
        const type = typeof value
        switch (type) {
            case 'string': return `"${value}"`
            case 'boolean': return String(value)
            case 'symbol': throw new Error('Symbols are not supported.')
            case 'undefined': return ''
            case 'bigint': return stringifyObject({ value: value.toString(), classConstructor: 'BigInt' })
            case 'number':
                return isFinite(value)
                    ? String(value)
                    : stringifyObject({ value: 'Infinity', classConstructor: 'Number' })
            case 'object':
                return value === null
                    ? null
                    : preserveClass()
            case 'function':
                // TODO: Function serialization and deserialization.
                return '"FunctionPlaceholder"'
                break
            default: throw new Error('Unknown variable type:', type, 'from (key, value):', key, ',', value)
        }
        function preserveClass() {
            let newValue = {}
            switch (value.constructor.name) {
                case 'Object': return stringifyObject(value)
                case 'Array': return stringifyArray(value)
                case 'Map':
                    newValue = { source: [] }
                    value.forEach((value, key) => newValue.source.push([key, value]))
                    break
                case 'Set':
                    newValue = { source: [] }
                    value.forEach((value) => newValue.source.push(value))
                    break
                case 'Date':
                    newValue = { value: value.toISOString() }
                    break
                case 'RegExp':
                    newValue = { source: value.source, flags: value.flags }
                    break
                case 'BigInt':
                    newValue = { value: value.toString() }
                    break
                default:
                    // check custom classes
                    break
            }
            Object.assign(newValue, value, { classConstructor: value.constructor.name })
            return stringifyObject(newValue)
        }
        function stringifyArray(array) {
            let separator = ''
            let result = '['
            ++nesting
            for (let element of array) {
                result += separator + eol + space.repeat(nesting) + recursive('', element)
                separator = ','
            }
            --nesting
            return result + eol + space.repeat(nesting) + ']'
        }
        function stringifyObject(obj) {
            let separator = ''
            let result = '{'
            const fields = Object.keys(obj)
            ++nesting
            for (let field of fields) {
                const fieldValue = recursive(field, obj[field])
                if (fieldValue === '') continue
                result += separator + eol + space.repeat(nesting) + `"${field}":` + spacer + fieldValue
                separator = ','
            }
            --nesting
            return result + eol + space.repeat(nesting) + '}'
        }
    }
}


const c = JSON.parse(b, (key, value) => {
    /*if (value !== null && typeof value === 'object' && 'classConstructor' in value) {
        //const cls = classes.get(value.classConstructor)

    }*/
    return value
})


console.log(a)
console.log(b)
console.log(c)

