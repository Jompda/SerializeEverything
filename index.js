// Try to overcome https://www.npmjs.com/package/serialize-javascript


class TestClass {
    constructor(obj) {
        for (let field of Object.getOwnPropertyNames(obj))
            this[field] = obj[field]
    }
    /*getProperties() {
        const properties = new Map()
        for (let field of Object.getOwnPropertyNames(this))
            properties.set(field, this[field])
        return properties
    }*/
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
    //set: new Set([123, 456]),
    date: new Date(),
    infinity: Infinity,
    regex: /([^\s]+)/g,
    //function: () => { return true },
    bigint: BigInt(10)
})
//console.log('properties:', a.getProperties())


const b = stringify(a, undefined, '  ')
console.log(b)


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
            case 'string':
                return '"' + value + '"'
            case 'number':
                if (isFinite(value)) return String(value)
                return stringifyObject({ value: 'Infinity', classConstructor: 'Number' })
            case 'bigint':
                return stringifyObject({ value: value.toString(), classConstructor: 'BigInt' })
            case 'boolean':
                return String(value)
            case 'symbol':
                throw new Error('Symbols are not supported.')
            case 'undefined':
                return ''
            case 'object':
                if (value === null) return '' + value
                return preserveClass()
            case 'function':
                console.log('Skipped function:', key, value)
                break
            default:
                throw new Error('Unknown variable type:', type, 'from (key, value):', key, ',', value)
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
            const fields = Object.getOwnPropertyNames(obj)
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


/*const c = JSON.parse(b, (key, value) => {
    if (value !== null && typeof value === 'object' && 'classConstructor' in value) {
        //const cls = classes.get(value.classConstructor)

    }
    return value
})*/


/*console.log(a)
console.log(b)
console.log(c)*/

