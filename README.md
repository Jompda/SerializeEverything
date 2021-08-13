# SerializeEverything
Serialize and deserialize all javascript objects, no matter what.


## Usage
Usage is quite similar to JSON stringify / parse, except for the serializing part.

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
    function: () => { return true }, // Currently gets replaced by a placeholder string.
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
            "classConstructor": "TestClass"
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
        "classConstructor": "Map"
    },
    "set": {
        "source": [
            123,
            456
        ],
        "classConstructor": "Set"
    },
    "date": {
        "source": "2021-08-13T22:09:22.804Z",
        "classConstructor": "Date"
    },
    "nan": {
        "source": "NaN",
        "classConstructor": "Number"
    },
    "infinity": {
        "source": "Infinity",
        "classConstructor": "Number"
    },
    "neginfinity": {
        "source": "-Infinity",
        "classConstructor": "Number"
    },
    "regex": {
        "source": "([^\\s]+)",
        "flags": "g",
        "classConstructor": "RegExp"
    },
    "function": "FunctionPlaceholder",
    "bigint": {
        "source": "10",
        "classConstructor": "BigInt"
    },
    "classConstructor": "TestClass"
}
```

After which parsing is as easy this:
```javascript
parse(<THE_STRINGIFIED_OUTPUT>)
```
Producing the following structure:
```
TestClass {
  null: null,
  number: 1,
  string: 'yes',
  boolean: false,
  array: [ 'sure', 'sure2', TestClass { testValue: 'very' } ],
  object: { testField: true, anotherField: 41 },
  map: Map(1) { 'a' => 1 },
  set: Set(2) { 123, 456 },
  date: 2021-08-13T22:09:22.804Z,
  nan: NaN,
  infinity: Infinity,
  neginfinity: -Infinity,
  regex: /([^\s]+)/g,
  function: 'FunctionPlaceholder',
  bigint: 10n
}
```

