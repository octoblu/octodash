const dashdash = require("dashdash")
const _ = require("lodash")

dashdash.addOptionType({
  name: "boolarg",
  parseArg: function(option, optstr, arg) {
    if (_.isBoolean(arg)) return arg
    if (_.isString(arg)) {
      const argstr = _.toLower(arg)
      return argstr === "true"
    }
    return Boolean(arg)
  },
  helpArg: "BOOL",
  takesArg: true,
})
