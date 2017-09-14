const path = require("path")
const _ = require("lodash")
const untildify = require("untildify")

module.exports = file => {
  if (_.startsWith(file, "~")) {
    try {
      file = untildify(file)
    } catch (error) {
      console.error(error.stack)
    }
  }
  return path.resolve(file)
}
