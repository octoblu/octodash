const dashdash = require("dashdash")
const assert = require("assert-plus")
const { parseEnvFile } = require("../helpers/parse-env-file")

dashdash.addOptionType({
  name: "env-file",
  parseArg: function(option, optstr, arg) {
    assert.string(arg, "arg")
    return parseEnvFile(arg)
  },
  takesArg: true,
  helpArg: "ENV_FILE",
})
