const path = require('path');
const webpack = require('webpack');

module.exports = {
	entry: ['./src/bootstrap.js'],
	output: {
		path: path.resolve(__dirname, 'build'),
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
			}
		]
	},


	resolve: {
		modules: [
			path.resolve(__dirname, 'src'),
			'node_modules',
		],
	},
	plugins: [
        new webpack.optimize.UglifyJsPlugin(),
		new webpack.ProvidePlugin({
			Box2D: 'Box2D'
          }),
          new webpack.ProvidePlugin({
			Key: 'Key'
          })
    ],
    externals: {
        PIXI: 'PIXI',
        jquery: 'jQuery'
      }
};
