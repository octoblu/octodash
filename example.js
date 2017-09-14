const OctoDash = require("./index.js")

const CLI_OPTIONS = [
  {
    names: ["first-thing", "f"],
    type: "string",
    env: "FIRST_THING",
    required: true,
    help: "first thing to specify",
  },
  {
    names: ["second-thing", "s"],
    type: "string",
    env: "SECOND_THING",
    help: "second thing to specify",
  },
  {
    names: ["third-thing", "t"],
    type: "base64",
    env: "THIRD_THING",
    default: "Y29vbAo=",
    help: "third thing to specify",
  },
]

const octoDash = new OctoDash({
  argv: process.argv,
  cliOptions: CLI_OPTIONS,
})
const options = octoDash.parseOptions()
console.log("Parsed Options", options)
octoDash.die() // exits with status 0
octoDash.die(new Error("oh no")) // prints error and exists with status code 1
