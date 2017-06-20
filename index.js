const _ = require("lodash")
const dashdash = require("dashdash")
const dotenv = require("dotenv")
const dotenvExpand = require("dotenv-expand")
const fs = require("fs")
const path = require("path")
const chalk = require("chalk")

const CLI_OPTIONS = [
  {
    name: "version",
    type: "bool",
    help: "Print connector version and exit.",
  },
  {
    names: ["help", "h"],
    type: "bool",
    help: "Print this help and exit.",
  },
]

class OctoDash {
  constructor(options) {
    if (!options) options = {}
    var { argv, cliOptions, name, version } = options
    if (!cliOptions) cliOptions = CLI_OPTIONS
    if (!argv) return this.die(new Error("OctoDash requires options.argv"))
    if (!name) return this.die(new Error("OctoDash requires options.name"))
    if (!version) return this.die(new Error("OctoDash requires options.version"))
    this.name = name
    this.version = version
    this.argv = argv
    this.cliOptions = cliOptions
    this.parser = dashdash.createParser({ options: this.cliOptions })
  }

  parseDotEnv() {
    const envFile = path.join(process.cwd(), ".env")
    try {
      fs.accessSync(envFile, fs.constants.R_OK)
    } catch (error) {
      return
    }
    const parsedEnv = dotenv.config({ path: envFile })
    dotenvExpand(parsedEnv)
    return
  }

  parseArgv({ argv }) {
    try {
      var opts = this.parser.parse(argv)
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

  parseOption(option, parsed) {
    const names = option.names || [option.name]
    const args = _.map(names, arg => {
      if (_.startsWith("-")) return arg
      if (_.size(arg) === 1) return `-${arg}`
      return `--${arg}`
    })
    const possibleOptions = _.compact(_.union(args, _.castArray(option.env)))
    const key = names[0].replace(/-/g, "_")
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

  parseOptions() {
    this.parseDotEnv()
    const parsed = this.parseArgv({ argv: this.argv })
    const errors = []
    const options = {}
    _.each(this.cliOptions, option => {
      const result = this.parseOption(option, parsed)
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
}

module.exports = OctoDash
