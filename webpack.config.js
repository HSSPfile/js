/* eslint-disable node/no-unpublished-require */
const path = require('path');

module.exports = {
  resolve: {
    fallback: {
      buffer: require.resolve('buffer'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
    },
  },

  optimization: {
    minimize: false,
  },

  entry: './src/web.js',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'hssp-web.js',
  },

  mode: 'production',
};
