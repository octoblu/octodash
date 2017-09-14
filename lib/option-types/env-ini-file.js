const dashdash = require("dashdash")
const assert = require("assert-plus")
const { parseEnvIniFile } = require("../helpers/parse-env-file")

dashdash.addOptionType({
  name: "env-ini-file",
  parseArg: function(option, optstr, arg) {
    assert.string(arg, "arg")
    return parseEnvIniFile(arg)
  },
  takesArg: true,
  helpArg: "ENV_INI_FILE",
})
