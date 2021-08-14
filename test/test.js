const { Serializable, defineSerializable, stringify, parse } = require('../index')


class TestClass extends Serializable {
    constructor(obj) {
        super()
        for (let field of Object.keys(obj))
            this[field] = obj[field]
    }
    getProperties() {
        const properties = new Map()
        for (let field of Object.keys(this))
            properties.set(field, this[field])
        return properties
    }
    static deserialize(key, value) {
        return new TestClass(value)
    }
}
defineSerializable(TestClass)


const a = new TestClass({
    null: null,
    undefined: undefined,
    number: 1,
    string: 'yes',
    boolean: false,
    array: ['sure', 'sure2', new TestClass({
        testValue: 'very'
    })],
    object: { testField: true, anotherField: 41 },
    map: new Map([['a', 1]]),
    set: new Set([123, 456]),
    date: new Date(),
    nan: NaN,
    infinity: Infinity,
    neginfinity: -Infinity,
    regex: /([^\s]+)/g,
    function: () => { return true }, // Currently gets replaced by a placeholder string.
    bigint: BigInt(10)
})
console.log(a)

const b = stringify(a, (key, value) => value, '    ')
console.log(b)

const c = parse(b)
console.log(c)

