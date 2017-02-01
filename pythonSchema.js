const yaml = require('js-yaml')
const types = [
  'aj.plugins.PluginDependency',
  'aj.plugins.OptionalPluginDependency',
  'aj.plugins.ModuleDependency',
  'aj.plugins.BinaryDependency',
  'aj.plugins.FileDependency',
].map((typeName) => new yaml.Type(`tag:yaml.org,2002:python/object:${typeName}`, {
  kind: 'mapping',
  resolve: (data) => true,
  construct: () => null,
}))

module.exports = yaml.Schema.create(types)
