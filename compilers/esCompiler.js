const Promise = require('bluebird')
const babel = require('babel-core')

module.exports = class ESCompiler {
  constructor (argv) {
    this.outputType = 'js'
    const defaultPresets = 'es2015,es2016,es2017,stage-1'
    const defaultPlugins = 'external-helpers'
    this.presets = (argv._.babelPresets || defaultPresets).split(',').filter((x) => !!x).map((x) => require.resolve(`babel-preset-${x}`))
    this.plugins = (argv._.babelPlugins || defaultPlugins).split(',').filter((x) => !!x).map((x) => require.resolve(`babel-plugin-${x}`))
  }

  compile (input) {
    let code = babel.transform(input, {
      plugins: this.plugins,
      presets: this.presets,
    }).code
    return Promise.resolve(code)
  }
}
