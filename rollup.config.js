import filesize from 'rollup-plugin-filesize';
import uglify from 'rollup-plugin-uglify';
import { uglifier } from 'uglify-es';
import babel from 'rollup-plugin-babel';
import includePaths from 'rollup-plugin-includepaths';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import * as path from 'path';

const includePathOptions = {
  paths: ['node_modules/gluonjs'],
  extensions: ['.js']
};

function getGluonJSConfig({
  dest,
  format,
  uglified = true,
  transpiled = false,
  bundled = true
}) {
  return {
    input: 'node_modules/gluonjs/gluon.js',
    output: {
      exports: 'named',
      file: dest,
      format,
      name: 'GluonJS',
      sourcemap: true
    },
    external: bundled ? [] : [
      path.resolve('./lit-html/lib/lit-extended.js'),
      path.resolve('./lit-html/lib/shady-render.js')
    ],
    plugins: [
      bundled && includePaths(includePathOptions),
      transpiled && resolve(),
      transpiled && commonjs({
        include: 'node_modules/**'
      }),
      transpiled && babel({
        presets: [['env', { modules: false }]],
        plugins: ['transform-runtime'],
        runtimeHelpers: true,
        exclude: 'node_modules/**'
      }),
      uglified && uglify({
        warnings: true,
        toplevel: !transpiled,
        sourceMap: true,
        compress: { passes: 2 },
        mangle: { properties: false }
      }, uglifier),
      filesize()
    ].filter(Boolean)
  };
}

const bundled = {
  input: 'gluonjs-template.js',
  output: {
    file: 'build/bundled.js',
    format: 'iife',
    banner: 'var gluon_js = GluonJS;',
    sourcemap: false
  },
  external: [path.resolve('/node_modules/gluonjs/gluon.js')],
  plugins: [
    babel({
      presets: [['env', { modules: false }]]
    })
  ]
};

const config = [
  getGluonJSConfig({ dest: 'build/gluon.es5.js', format: 'iife', transpiled: true }),
  getGluonJSConfig({ dest: 'build/gluon.umd.js', format: 'umd' }),
  getGluonJSConfig({ dest: 'build/gluon.js', format: 'es', bundled: false }),
  bundled
];

export default config;
