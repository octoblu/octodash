const path = require("path")
const fs = require("fs")

module.exports = execPath => {
  const packageFilePath = path.join(execPath, "package.json")
  try {
    fs.accessSync(packageFilePath, fs.constants.R_OK)
  } catch (error) {
    return
  }
  const contents = fs.readFileSync(packageFilePath, "utf8")
  try {
    return JSON.parse(contents)
  } catch (error) {
    return
  }
}
