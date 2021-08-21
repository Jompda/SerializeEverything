# SerializeEverything
Serialize and deserialize all javascript objects, no matter what.


## Usage
Usage is quite similar to JSON stringify / parse, except custom Serializables.

```javascript
const { Serializable, defineSerializable, stringify, parse } = require('serialize-everything')

// Custom serializable class
class TestClass extends Serializable {
    constructor(obj) {
        super()
        for (let field of Object.keys(obj))
            this[field] = obj[field]
    }
    static deserialize(key, value) {
        return new TestClass(value)
    }
}
defineSerializable(TestClass)

stringify(new TestClass({
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
    function: (variable) => { return variable + variable },
    bigint: BigInt(10)
}), undefined, '    ')
```

The above produces the following output:
```json
{
    "null": null,
    "number": 1,
    "string": "yes",
    "boolean": false,
    "array": [
        "sure",
        "sure2",
        {
            "testValue": "very",
            "_SE-CLASS-CONSTRUCTOR": "TestClass"
        }
    ],
    "object": {
        "testField": true,
        "anotherField": 41
    },
    "map": {
        "source": [
            [
                "a",
                1
            ]
        ],
        "_SE-CLASS-CONSTRUCTOR": "Map"
    },
    "set": {
        "source": [
            123,
            456
        ],
        "_SE-CLASS-CONSTRUCTOR": "Set"
    },
    "date": {
        "source": "2021-08-21T16:37:27.611Z",
        "_SE-CLASS-CONSTRUCTOR": "Date"
    },
    "nan": {
        "source": "NaN",
        "_SE-CLASS-CONSTRUCTOR": "Number"
    },
    "infinity": {
        "source": "Infinity",
        "_SE-CLASS-CONSTRUCTOR": "Number"
    },
    "neginfinity": {
        "source": "-Infinity",
        "_SE-CLASS-CONSTRUCTOR": "Number"
    },
    "regex": {
        "source": "([^\\s]+)",
        "flags": "g",
        "_SE-CLASS-CONSTRUCTOR": "RegExp"
    },
    "function": {
        "source": "(variable) => { return variable + variable }",
        "_SE-CLASS-CONSTRUCTOR": "Function"
    },
    "bigint": {
        "source": "10",
        "_SE-CLASS-CONSTRUCTOR": "BigInt"
    },
    "_SE-CLASS-CONSTRUCTOR": "TestClass"
}
```

After which parsing is as easy this:
```javascript
parse(<THE_STRINGIFIED_OUTPUT>)
```
Producing the following structure:
```javascript
TestClass {
  null: null,
  number: 1,
  string: 'yes',
  boolean: false,
  array: [ 'sure', 'sure2', TestClass { testValue: 'very' } ],
  object: { testField: true, anotherField: 41 },
  map: Map(1) { 'a' => 1 },
  set: Set(2) { 123, 456 },
  date: 2021-08-21T16:37:27.611Z,
  nan: NaN,
  infinity: Infinity,
  neginfinity: -Infinity,
  regex: /([^\s]+)/g,
  function: [Function (anonymous)],
  bigint: 10n
}
```

