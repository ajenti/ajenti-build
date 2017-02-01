const Promise = require('bluebird')

module.exports = class CSSCompiler {
  constructor () {
    this.outputType = 'css'
  }

  compile (input) {
    return Promise.resolve(input)
  }
}
