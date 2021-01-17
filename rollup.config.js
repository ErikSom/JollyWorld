import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import conditional from 'rollup-plugin-conditional';
import stripCode from "rollup-plugin-strip-code"
import strip from '@rollup/plugin-strip';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import styles from 'rollup-plugin-styles';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
	input: 'src/bootstrap.js',
	output: {
		file: './build/awesome-game.js',
		format: 'iife',
		strict: false,
	},
	plugins: [
		globals(),
		builtins(),
		styles(),
	
		babel({
			exclude: 'node_modules/**'
		}),
		resolve(),
		commonjs(),

		conditional(isProduction, [
			stripCode({
				start_comment: 'DEV',
				end_comment: 'DEV-END'
			}),
			strip({
				debugger: true,
			  }),
			terser(),
			]
		),

		copy({
			targets: [
				{ src: 'static/*', dest: 'build/' },
			],
			verbose:true,
		}),
	],
};
