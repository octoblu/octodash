const dashdash = require("dashdash")
const base64Decode = require("../helpers/base64-decode")
const assert = require("assert-plus")

dashdash.addOptionType({
  name: "base64",
  parseArg: function(option, optstr, arg) {
    assert.string(arg, "arg")
    return base64Decode(arg)
  },
  takesArg: true,
  helpArg: "BASE64_ENCODED_ARG",
})
