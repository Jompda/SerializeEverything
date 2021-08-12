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
    //array: ['sure', 'sure2'],
    //object: { testField: true },
    //map: new Map([['a', 1]]),
    //set: new Set([123, 456]),
    //date: new Date(),
    infinity: Infinity,
    //regex: /([^\s]+)/g,
    //function: () => { return true },
    //bigInt: BigInt(10)
})
//console.log('properties:', a.getProperties())


const b = stringify(Infinity)
console.log(b)


/**
 * @param {*} obj 
 * @param {function(string, any)} replacer 
 * @param {string | number} space 
 * @returns {string}
 */
function stringify(obj, replacer, space) {
    // "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function"
    let nesting = 0
    return recursive('', obj)
    function recursive(key, value) {
        if (replacer) value = replacer(key, value)
        const type = typeof obj
        switch (type) {
            case 'string':
                return '"' + value + '"'
            case 'number':
                if (isFinite(value)) return String(value)
                // TODO: Forward to preserveClass.
                break
            case 'bigint':
                // TODO: Forward to preserveClass.
                console.log('Skipped BigInt:', key, value)
                break
            case 'boolean':
                return String(value)
            case 'symbol':
                throw new Error('Symbols are not supported.')
            case 'undefined':
                return ''
            case 'object':
                if (obj === null) return '' + obj
                return preserveClass()
            case 'function':
                console.log('Skipped function:', key, value)
                break
            default:
                console.log('Default case, how?:', key, value)
                break
        }
        function preserveClass() {
            let newValue = {}
            switch (value.constructor.name) {
                case 'Map': // Bug: doesn't stringify these objects
                    for (let [key, val] of value)
                        newValue[key] = val
                    break
                case 'Date': // JSON.stringify skips date objects. TODO: Self-made stringify method
                    newValue = { value: value.toString() }
                    break
                case 'RegExp':
                    newValue = { source: value.source, flags: value.flags }
                    break
                case 'Infinity':
                    break
                case 'BigInt':
                    newValue = { value: value.toString() }
                    break
                default:
                    return value
            }
            Object.assign(newValue, value, { classConstructor: value.constructor.name })
            return newValue
        }
        function stringifyArray() {

        }
        function stringifyObject(obj) {
            const eol = space ? '\n' : '', spacer = space ? ' ' : ''
            let separator = ''
            let result = '{' + eol
            const fields = Object.getOwnPropertyNames(obj)
            ++nesting
            for (let field of fields) {
                result += space.repeat(nesting) + `"${field}"` + spacer + recursive(field, obj[field]) + separator + eol
                separator = ','
            }
            --nesting
            return result + space.repeat(nesting) + '}'
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

