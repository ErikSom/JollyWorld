const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');


const isProduction = process.env.NODE_ENV === 'production';


const obfuscateConfig = {
	"compact": true,
	"controlFlowFlattening": false,
	"deadCodeInjection": false,
	"debugProtection": false,
	"debugProtectionInterval": false,
	"disableConsoleOutput": true,
	"identifierNamesGenerator": "hexadecimal",
	"log": false,
	"numbersToExpressions": false,
	"renameGlobals": false,
	"rotateStringArray": true,
	"selfDefending": true,
	"shuffleStringArray": true,
	"simplify": true,
	"splitStrings": true,
	"splitStringsChunkLength": 10,
	"stringArray": true,
	"stringArrayEncoding": [],
	"stringArrayIndexShift": true,
	"stringArrayWrappersCount": 1,
	"stringArrayWrappersChainedCalls": true,
	"stringArrayWrappersParametersMaxCount": 2,
	"stringArrayWrappersType": "variable",
	"stringArrayThreshold": 0.75,
	"unicodeEscapeSequence": false,
	"transformObjectKeys": false,
	"renameProperties": false,
}

module.exports = {
	devtool: isProduction ? 'source-map' : 'eval-source-map',
	entry: ['./src/bootstrap.js'],
	// stats: 'verbose',
	mode: isProduction ? 'production' : 'development',
	output: {
		path: path.resolve(__dirname, 'build/assets/'),
		filename: 'awesome-game.js',
	},
	module: {
		rules: [{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
				}
			},
			{
				test: /\.(woff2|woff|ttf|png|svg|eot)$/,
				use: [{
					loader: 'url-loader',
					options: {
						limit: 8192,
						esModule: false,
						publicPath: './assets'
					},
				}, ],
			},
			{
				test: /\.css$/,
				use: [{
						loader: "style-loader"
					},
					{
						loader: "css-loader"
					}
				]
			}
		]
	},
	optimization: {
		minimize: true,
		minimizer: [new WebpackObfuscator (obfuscateConfig)],
	},

	resolve: {
		modules: [
			path.resolve(__dirname, 'src'),
			'node_modules',
		],
	},
	plugins: [
		new CopyPlugin({
			patterns: [{
				from: 'static',
				to: '../'
			}, ],
		}),
		new webpack.DefinePlugin({
			__VERSION__: JSON.stringify(require("./package.json").version),
		}),
	]
};
