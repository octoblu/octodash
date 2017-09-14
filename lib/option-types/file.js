const dashdash = require("dashdash")
const parseFilePath = require("../helpers/parse-file-path")
const assert = require("assert-plus")

dashdash.addOptionType({
  name: "file",
  parseArg: function(option, optstr, arg) {
    assert.string(arg, "arg")
    return parseFilePath(arg)
  },
  takesArg: true,
  helpArg: "FILE_PATH",
})
