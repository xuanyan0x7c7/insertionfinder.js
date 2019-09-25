const path = require('path')

module.exports = [
  {
    output: {
      filename: '[name].js',
      library: 'insertionfinder',
      libraryTarget: 'commonjs2'
    },
    entry: {insertionfinder: './lib/index.js'},
    target: 'node',
    mode: 'production',
    optimization: {minimize: false}
  },
  {
    output: {
      filename: '[name].min.js',
      library: 'insertionfinder',
      libraryTarget: 'commonjs2'
    },
    entry: {insertionfinder: './lib/index.js'},
    target: 'node',
    mode: 'production'
  }
]
