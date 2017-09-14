const dashdash = require("dashdash")
const _ = require("lodash")

dashdash.addOptionType({
  name: "bool",
  parseArg: function(option, optstr, arg) {
    if (_.isBoolean(arg)) return arg
    if (_.isString(arg)) {
      const argstr = _.toLower(arg)
      if (argstr === "true") {
        return true
      }
    }
    return Boolean(arg)
  },
  takesArg: false,
})
