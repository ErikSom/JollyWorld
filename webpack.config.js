const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
	devtool: isProduction ? 'source-map' : 'eval-source-map',
	entry: ['./src/bootstrap.js'],
	// stats: 'verbose',
	mode: isProduction ? 'production' : 'development',
	output: {
		path: path.resolve(__dirname, 'build/scripts/'),
		filename: 'awesome-game.js',
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
				}
			},
			{
				test: /\.(woff2|woff|ttf|png|svg|eot)$/,
				use: [
					{
					  loader: 'url-loader',
					  options: {
						limit: 8192,
						esModule: false,
					  },
					},
				  ],
			},
			{
				test:/\.css$/,
				use:[
					{loader: "style-loader"},
					{
						loader: "css-loader"
					}
				]
			}
		]
	},
	optimization: {
		minimize: true,
		minimizer: [new TerserPlugin()],
	},

	resolve: {
		modules: [
			path.resolve(__dirname, 'src'),
			'node_modules',
		],
	},
	plugins: [
		new CopyPlugin({
			patterns: [
			  { from: 'static', to: '../' },
			],
		  }),
		  new webpack.DefinePlugin({
			__VERSION__: JSON.stringify(require("./package.json").version),
		 })
	]
};
