const Promise = require('bluebird')
const coffee = require('coffee-script')

module.exports = class CoffeeCompiler {
  constructor () {
    this.outputType = 'js'
  }

  compile (input) {
    return Promise.resolve(coffee.compile(input))
  }
}
