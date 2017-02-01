const Promise = require('bluebird')

module.exports = class JSCompiler {
  constructor () {
    this.outputType = 'js'
  }

  compile (input) {
    return Promise.resolve(input)
  }
}
