const _ = require("lodash")
const dashdash = require("dashdash")
const dotenv = require("dotenv")
const dotenvExpand = require("dotenv-expand")
const fs = require("fs")
const path = require("path")
const chalk = require("chalk")

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
    default: path.join(process.cwd(), ".env"),
    env: "OCTODASH_ENV_FILE",
    help: "dotenv file",
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
    this.name = name
    this.version = version
    this.argv = argv
    this.cliOptions = this._mergeCliOptions(cliOptions)
    this.parser = dashdash.createParser({ options: this.cliOptions })
  }

  parseOptions() {
    const { env_file } = this._parseArgv()
    if (env_file) this.envFile = this.env_file
    this._parseDotEnv()
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
    return options
  }

  die(error) {
    if (!error) {
      process.exit(0)
      return
    }
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
    try {
      fs.accessSync(this.envFile, fs.constants.R_OK)
    } catch (error) {
      return
    }
    const parsedEnv = dotenv.config({ path: this.envFile })
    dotenvExpand(parsedEnv)
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
    const missing = _.filter(options, option => {
      const name = this._getOptionName(option)
      return _.find(DEFAULT_CLI_OPTIONS, defaultOption => {
        const defaultName = this._getOptionName(defaultOption)
        return name === defaultName
      })
    })
    return _.union(missing, options)
  }
}

module.exports = OctoDash
