const _ = require("lodash")
const dashdash = require("dashdash")
const dotenv = require("dotenv")
const dotenvExpand = require("dotenv-expand")
const fs = require("fs")
const path = require("path")
const chalk = require("chalk")
const debug = require("debug")("octodash")
const forEach = require("lodash.foreach")
const ini = require("ini")
const untildify = require("untildify")

let execPath = path.dirname(process.argv[1])

if (process.pkg) execPath = path.dirname(process.execPath)

const DEFAULT_CLI_OPTIONS = [
  {
    names: ["version", "v"],
    type: "bool",
    help: "Print connector version and exit.",
  },
  {
    names: ["help", "h"],
    type: "bool",
    help: "Print this help and exit.",
  },
  {
    names: ["env-file"],
    type: "string",
    default: path.join(execPath, ".env"),
    env: "OCTODASH_ENV_FILE",
    help: "dotenv file",
    helpArg: "FILE",
    completionType: "file",
  },
  {
    names: ["env-ini-file"],
    type: "string",
    default: path.join(execPath, "env.ini"),
    env: "OCTODASH_ENV_INI_FILE",
    help: "env ini file",
    helpArg: "FILE",
    completionType: "file",
  },
]

class OctoDash {
  constructor(options = {}) {
    let { argv, cliOptions, name, version } = options
    if (!argv) return this.die(new Error("OctoDash requires options.argv"))
    if (!name) return this.die(new Error("OctoDash requires options.name"))
    if (!version) return this.die(new Error("OctoDash requires options.version"))
    debug("octodash constructor", { cliOptions, name, version })
    this.name = name
    this.version = version
    this.argv = argv
    this.cliOptions = this._mergeCliOptions(cliOptions)
    this.parser = dashdash.createParser({ options: this.cliOptions })
  }

  parseOptions() {
    this._parseDotEnv()
    this._parseEnvIni()
    const parsed = this._parseArgv()
    const errors = []
    const options = {}
    _.each(this.cliOptions, option => {
      const result = this._parseOption(option, parsed)
      if (_.isError(result)) {
        errors.push(result)
      } else if (result) {
        options[result.key] = result.value
      }
    })
    if (_.size(errors)) {
      console.log(`usage: ${this.name} [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true, includeDefault: true })}`)
      errors.forEach(error => {
        console.error(chalk.red(error.message))
      })
      process.exit(1)
    }
    debug("parsed options", options)
    return options
  }

  die(error) {
    if (!error) {
      debug("die")
      process.exit(0)
      return
    }
    debug("die with error", error.stack)
    console.error(`${this.name}:`, error.toString())
    process.exit(1)
  }

  _parseArgv() {
    try {
      var opts = this.parser.parse(this.argv)
    } catch (e) {
      return {}
    }
    if (opts.help) {
      console.log(`usage: ${this.name} [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true, includeDefault: true })}`)
      process.exit(0)
    }

    if (opts.version) {
      console.log(this.version)
      process.exit(0)
    }

    return opts
  }

  _parseDotEnv() {
    let envFile = this._parseArgv().env_file
    debug("parse dotenv", { envFile })
    try {
      fs.accessSync(envFile, fs.constants.R_OK)
    } catch (error) {
      debug("no access for envfile", error.stack)
      return
    }
    const parsedEnv = dotenv.config({ path: envFile })
    dotenvExpand(parsedEnv)
    debug("parsedEnv", parsedEnv)
    return
  }

  _parseEnvIni() {
    let envIniFile = this._parseArgv().env_ini_file
    debug("parse ini env", { envIniFile })
    try {
      fs.accessSync(envIniFile, fs.constants.R_OK)
    } catch (error) {
      debug("no access for envfile", error.stack)
      return
    }

    const parsedIni = ini.parse(fs.readFileSync(envIniFile, "utf-8"))
    debug("parsedIni", parsedIni)
    forEach(parsedIni.environment, (value, key) => {
      process.env[key] = value
    })
    return
  }

  _parseOption(option, parsed) {
    const names = this._getOptionNames(option)
    const args = _.map(names, arg => {
      if (_.startsWith("-")) return arg
      if (_.size(arg) === 1) return `-${arg}`
      return `--${arg}`
    })
    const possibleOptions = _.compact(_.union(args, _.castArray(option.env)))
    const key = _.first(names).replace(/-/g, "_")
    let value = parsed[key]
    if (option.required && !value) {
      return new Error(`${this.name} requires ${possibleOptions.join(", ")}`)
    }
    if (option.completionType === "file" && value) {
      value = path.resolve(untildify(value))
    }
    if (option.base64) {
      try {
        value = new Buffer(value, "base64").toString("utf8")
      } catch (error) {
        return new Error(`${this.name} requires ${possibleOptions} to be a base64 decodeable`)
      }
    }
    if (option.type === "bool") {
      value = value || false
    }
    if (_.includes(["version", "help"], key)) {
      return
    }
    return { key: _.camelCase(key), value }
  }

  _getOptionName(option) {
    return _.first(this._getOptionNames(option))
  }

  _getOptionNames(option) {
    return option.names || [option.name]
  }

  _mergeCliOptions(options = []) {
    const missing = _.filter(DEFAULT_CLI_OPTIONS, defaultOption => {
      const defaultName = this._getOptionName(defaultOption)
      return !_.some(options, option => {
        const name = this._getOptionName(option)
        return name === defaultName
      })
    })
    return _.union(missing, options)
  }
}

module.exports = OctoDash
