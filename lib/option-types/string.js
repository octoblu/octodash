const dashdash = require("dashdash")
const parseFilePath = require("../helpers/parse-file-path")
const base64Decode = require("../helpers/base64-decode")
const assert = require("assert-plus")

dashdash.addOptionType({
  name: "string",
  parseArg: function(option, optstr, arg) {
    assert.string(arg, "arg")
    if (option.completionType === "file" && arg) {
      arg = parseFilePath(arg)
    }
    if (option.base64) {
      arg = base64Decode(arg)
    }
    return arg
  },
  helpArg: "ARG",
  takesArg: true,
})
