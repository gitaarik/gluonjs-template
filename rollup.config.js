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

function getConfig({ src, dest, format, uglified = true, transpiled = false, bundled = true }) {
  return {
    input: src,
    output: {
      exports: 'named',
      file: dest,
      format,
      name: 'GluonjsTemplate',
      banner: !bundled && transpiled ? 'var gluon_js = GluonJS;' : undefined
    },
    external: bundled ? [] : [path.resolve('./gluonjs/gluon.js')],
    plugins: [
      bundled && includePaths(includePathOptions),
      transpiled && resolve(),
      transpiled &&
      commonjs({
        include: 'node_modules/**'
      }),
      transpiled &&
      babel({
        presets: [['env', { modules: false }]],
        plugins: ['transform-runtime'],
        runtimeHelpers: true,
        exclude: ['node_modules/core-js/**', 'node_modules/babel-runtime/**']
      }),
      uglified &&
      uglify(
        {
          warnings: true,
          toplevel: !transpiled,
          sourceMap: true,
          compress: { passes: 2 },
          mangle: { properties: false }
        },
        uglifier
      ),
      filesize()
    ].filter(Boolean)
  };
}

const config = [
  getConfig({ src: './gluonjs-template.js', dest: 'build/app.es5.js', format: 'iife', transpiled: true, bundled: true, uglified: false }),
  getConfig({ src: './gluonjs-template.js', dest: 'build/app.js', format: 'iife', bundled: true, uglified: false }),
  getConfig({ src: './gluonjs-template.js', dest: 'build/app.es5.min.js', format: 'iife', transpiled: true, bundled: true, uglified: true }),
  getConfig({ src: './gluonjs-template.js', dest: 'build/app.min.js', format: 'iife', bundled: true, uglified: true })
];

export default config;
