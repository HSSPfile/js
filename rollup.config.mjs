/* eslint-disable import/no-extraneous-dependencies, node/no-unpublished-import */
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/hssp.js',
    format: 'cjs',
  },
  plugins: [commonjs()],
};
