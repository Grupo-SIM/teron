// Production components, without expensive export-only optimizations.
const configs = require('../prod/webpack.config.js')

for (const config of configs) {
  config.devtool = false
  config.optimization = { ...config.optimization, minimize: false }
  config.plugins = (config.plugins ?? []).filter(
    (plugin) => !['CompressionPlugin', 'ForkTsCheckerWebpackPlugin'].includes(plugin.constructor.name)
  )
}

module.exports = configs
