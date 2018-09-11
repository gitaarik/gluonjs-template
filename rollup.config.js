import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import babelMinify from 'rollup-plugin-babel-minify';
import filesize from 'rollup-plugin-filesize';

const files = ['gluonjs-template'];

function getConfig({ name = '', suffix = '', transpile = false, minify = true }) {

  return {

    input: 'src/' + name + '.js',

    output: {

      file: 'build/' + name + suffix + '.js',

      // Make the output a immediately-invoked function expression, which is
      // suitable for <script> tags.
      format: 'iife',

      // Create sourcemap (.js.map) files, this makes debugging easier.
      sourcemap: true

    },

    plugins: [

      // Enable rollup to find NPM modules in the node_modules/ directory.
      nodeResolve(),

      // Convert CommonJS modules to ES modules, so these modules work in
      // browsers.
      commonjs({
        include: 'node_modules/**'
      }),

      // Transpile ES6 syntax to ES5 syntax, for compatibility with older
      // browsers.
      transpile && babel({

        exclude: [
          // Node modules should be transpiled by default, so don't bother
          // transpiling them.
          'node_modules/**'
        ],

        presets: [
          [
            '@babel/preset-env',
            {
              // We already convert CommonJS to ES modules with the `commonjs`
              // plugin, so Babel doesn't have to do it anymore.
              modules: false
            }
          ]
        ]

      }),

      // Minify the code so the filesize becomes smaller.
      minify && babelMinify(),

      // Show the filesize in the rollup console output.
			filesize()

    ]

  };

}

function getFileConfigs({ name = '' }) {
  return [
    getConfig({ name: name, suffix: '.es5', transpile: true, minify: false }),
    getConfig({ name: name, suffix: '.es5.min', transpile: true, minify: true }),
    getConfig({ name: name, transpile: false, minify: false }),
    getConfig({ name: name, suffix: '.min', transpile: false, minify: true }),
  ];
}

let configs = [];

for (const file of files) {
  configs = configs.concat(getFileConfigs({ name: file }));
}

export default configs;
