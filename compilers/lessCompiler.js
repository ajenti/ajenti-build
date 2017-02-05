const Promise = require('bluebird')
const less = require('less')
const path = require('path')

module.exports = class LESSCompiler {
  constructor () {
    this.outputType = 'css'
  }

  compile (input, resource, fullPath) {
    return new Promise((resolve, reject) => {
      let savedCwd = process.cwd()
      process.chdir(path.dirname(fullPath))
      less.render(input, (error, output) => {
        process.chdir(savedCwd)
        if (error) {
          reject(error)
        } else {
          resolve(output.css)
        }
      })
    })
  }
}
