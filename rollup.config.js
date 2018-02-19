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

function getConfig({ dest, format, uglified = true, transpiled = false, bundled = true }) {
  return {
    input: 'gluonjs-template.js',
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
          exclude: 'node_modules/**'
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
  getConfig({ dest: 'build/gluonjs-template.es5.js', format: 'iife', transpiled: true, bundled: false, uglified: false }),
  getConfig({ dest: 'build/gluonjs-template.js', format: 'es', bundled: false, uglified: false }),
  getConfig({ dest: 'build/gluonjs-template.bundle.js', format: 'iife', transpiled: true, uglified: false })
];

export default config;
