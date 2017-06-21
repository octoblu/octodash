# octodash
An opinionated version of dashdash

# Example Usage

```js
const OctoDash = require("./index.js")
const packageJSON = require("./package.json")

const CLI_OPTIONS = [
  {
    names: ["first-thing", "f"],
    type: "string",
    env: "FIRST_THING",
    required: true,
    help: "first thing to specify",
    helpArg: "REQUIRED_THING",
  },
  {
    names: ["second-thing", "s"],
    type: "string",
    env: "SECOND_THING",
    help: "second thing to specify",
    helpArg: "OPTIONAL_THING",
  },
  {
    names: ["third-thing", "t"],
    type: "string",
    env: "THIRD_THING",
    base64: true,
    help: "third thing to specify",
    helpArg: "BASE64_THING",
  },
]

const octoDash = new OctoDash({
  argv: process.argv,
  cliOptions: CLI_OPTIONS,
  name: packageJSON.name,
  version: packageJSON.version,
})
const options = octoDash.parseOptions()
console.log('Parsed Options', options)
octoDash.die() // exits with status 0
octoDash.die(new Error('oh no')) // prints error and exists with status code 1
```
