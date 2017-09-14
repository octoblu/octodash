const _ = require("lodash")
const dashdash = require("dashdash")
const path = require("path")
const chalk = require("chalk")
const getPackageJSON = require("./lib/helpers/get-package-json")
const { parseEnvFile, parseEnvIniFile } = require("./lib/helpers/parse-env-file")
const debug = require("debug")("octodash")

require("./lib/option-types/base64")
require("./lib/option-types/bool")
require("./lib/option-types/env-file")
require("./lib/option-types/env-ini-file")
require("./lib/option-types/file")
require("./lib/option-types/string")

const fullExecPath = process.pkg ? process.execPath : process.argv[1]
const fileName = path.basename(fullExecPath, path.extname(path.basename(fullExecPath)))
const execPath = path.dirname(fullExecPath)
const packageJSON = getPackageJSON(execPath)

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
    type: "env-file",
    default: path.join(execPath, ".env"),
    env: "OCTODASH_ENV_FILE",
    completionType: "file",
  },
  {
    names: ["env-ini-file"],
    type: "env-ini-file",
    default: path.join(execPath, "env.ini"),
    env: "OCTODASH_ENV_INI_FILE",
    completionType: "file",
  },
]

class OctoDash {
  constructor(options = {}) {
    _.bindAll(this, Object.getOwnPropertyNames(OctoDash.prototype))
    const { argv, cliOptions, name, version } = options
    if (!argv) return this.die(new Error("OctoDash requires options.argv"))
    this.argv = argv
    this.name = name || _.get(packageJSON, "name", fileName)
    this.version = version || _.get(packageJSON, "version")
    this.cliOptions = this._mergeCliOptions(cliOptions)
    this.parser = dashdash.createParser({ options: this.cliOptions })
  }

  parseOptions() {
    this._setDefaultEnv()
    const parsed = this._parseArgv()
    const errors = []
    const options = {}
    _.each(this.cliOptions, option => {
      if (option.group) return
      const result = this._parseOption(option, parsed)
      if (_.isError(result)) {
        errors.push(result)
      } else if (result) {
        options[result.key] = result.value
      }
    })
    if (_.size(errors)) {
      console.log(
        `usage: ${this.name} [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true, includeDefault: true })}`,
      )
      errors.forEach(error => {
        console.error(chalk.red(error.message))
      })
      process.exit(1)
    }
    options._args = parsed._args
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
    if (error.stdout) debug("stdout", error.stdout)
    if (error.stderr) debug("stderr", error.stderr)
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
      console.log(
        `usage: ${this.name} [OPTIONS]\noptions:\n${this.parser.help({ includeEnv: true, includeDefault: true })}`,
      )
      process.exit(0)
    }

    if (opts.version) {
      if (!this.version) {
        console.error("OctoDash: unknown version")
        process.exit(1)
      }
      console.log(this.version)
      process.exit(0)
    }

    return opts
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
    if (_.includes(["version", "help"], key)) return
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

  _setDefaultEnv() {
    const options = this._parseArgv()
    const
    _.each(this.cliOptions, option => {
      if (option.type === "env-file") {
        if (!option.default) return
        parseEnvFile(option.default)
      }
      if (option.type === "env-ini-file") {
        if (!option.default) return
        parseEnvIniFile(option.default)
      }
    })
  }
}

module.exports = OctoDash
