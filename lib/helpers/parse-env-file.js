const _ = require("lodash")
const dotenv = require("dotenv")
const dotenvExpand = require("dotenv-expand")
const fs = require("fs")
const ini = require("ini")
const parseFilePath = require("../helpers/parse-file-path")
const debug = require("debug")("octodash:parse-env-file")

const parseEnvFile = arg => {
  const envFile = parseFilePath(arg)
  try {
    fs.accessSync(envFile, fs.constants.R_OK)
  } catch (error) {
    debug(`no access to env file ${envFile}`)
    return
  }
  debug(`using env file ${envFile}`)
  dotenvExpand(dotenv.config({ path: envFile }))
}

const parseEnvIniFile = arg => {
  const envIniFile = parseFilePath(arg)
  try {
    fs.accessSync(envIniFile, fs.constants.R_OK)
  } catch (error) {
    debug(`no access to ini file ${envIniFile}`)
    return
  }
  debug(`using ini file ${envIniFile}`)
  const parsedIni = ini.parse(fs.readFileSync(envIniFile, "utf-8"))
  const parsedEnv = { parsed: {} }
  _.each(parsedIni.environment, (value, key) => {
    if (process.env[key]) return
    parsedEnv.parsed[key] = value
    process.env[key] = value
  })
  dotenvExpand(parsedEnv)
}

module.exports = {
  parseEnvFile,
  parseEnvIniFile,
}
