#!/usr/bin/env node
const Promise = require('bluebird')
const mkdirp = require('mkdirp')
const fs = require('fs')
const yaml = require('js-yaml')
const nodePath = require('path')
const glob = require('glob')
const util = require('util')
const log = require('npmlog')
const argv = require('yargs')
  .usage('Usage: $0 [parameters] paths')
  .describe('f', 'Force rebuild')
  .describe('babel-presets', 'Babel preset list')
  .describe('babel-plugins', 'Babel plugin list')
  .help('h')
  .epilog('GitHub: https://github.com/ajenti/ajenti-build')
  .boolean('force')
  .alias('f', 'force')
  .alias('h', 'help')
  .demandCommand(1)
  .argv

const pythonSchema = require('./pythonSchema')
const IGNORED_EXTENSIONS = ['.html']
const SUPPORTED_EXTENSIONS = ['.coffee', '.es', '.js', '.less', '.css']

const buildPlugin = (path) => {
  const compilers = {}
  const getCompiler = (extension) => {
    if (!compilers[extension]) {
      let Compiler = require(`./compilers/${extension.substring(1)}Compiler`)
      compilers[extension] = new Compiler(argv)
    }
    return compilers[extension]
  }

  let manifest
  try {
    manifest = yaml.load(fs.readFileSync(nodePath.join(path, 'plugin.yml'), 'utf-8'), {
      schema: pythonSchema, onWarning: () => null,
    })
  } catch (error) {
    log.error('parse', 'Invalid plugin manifest: %s', error.message)
    return
  }
  log.info('build', `Building ${manifest.name}`)
  const progress = log.newItem(`build`, manifest.resources.length)

  return Promise.mapSeries(manifest.resources, (resource) => {
    if (util.isString(resource)) {
      resource = { path: resource }
    }

    if (resource.path.startsWith('ng:')) {
      progress.completeWork(1)
      return
    }

    if (resource.vendor === undefined) {
      resource.vendor = resource.path.indexOf('/vendor/') !== -1
    }

    let fullPath = nodePath.join(path, resource.path)
    let extension = nodePath.extname(resource.path)
    progress.info('build', 'Compiling %s', fullPath)

    if (IGNORED_EXTENSIONS.includes(extension)) {
      progress.completeWork(1)
      return null
    }

    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      log.error('build', 'Unsupported extension:', extension)
      progress.completeWork(1)
      return Promise.reject(new Error(`Unsupported extension: ${extension}`))
    }

    let compiler = getCompiler(extension)
    let input = fs.readFileSync(fullPath, 'utf8')
    return compiler.compile(input, resource, fullPath).then((output) => {
      progress.completeWork(1)
      return { resource, type: compiler.outputType, output }
    }).catch((error) => {
      progress.error('build', error)
      return Promise.reject(error)
    })
  }).then((results) => {
    progress.finish();

    ['js', 'css'].forEach((type) => {
      let content = results
        .filter((x) => !!x && x.type === type && !x.resource.vendor)
        .map((x) => x.output)
        .join('\n')
      let vendorContent = results
        .filter((x) => !!x && x.type === type && x.resource.vendor)
        .map((x) => x.output)
        .join('\n')

      let builtPath = nodePath.join(path, 'resources', 'build')
      mkdirp.sync(builtPath)
      fs.writeFileSync(nodePath.join(builtPath, `all.${type}`), content, 'utf8')
      fs.writeFileSync(nodePath.join(builtPath, `all.vendor.${type}`), vendorContent, 'utf8')
    })
  }).catch((error) => {
    progress.finish()
    log.warn('Not all files were built:', error.message)
  })
}

log.enableProgress()
log.showProgress()
Promise.each(argv._, (buildPath) => {
  buildPath = buildPath.trimRight('/')
  log.info('search', 'Searching in %s', buildPath)

  const g = new glob.Glob(buildPath + '/**/plugin.yml', { sync: true })
  if (g.found.length === 0) {
    log.warn('search', 'No plugins found in %s', buildPath)
    return
  }

  return Promise.each(g.found, (path) => buildPlugin(nodePath.dirname(path)))
}).then(() => {
  log.disableProgress()
})
