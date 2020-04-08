const path = require('path');
const webpack = require('webpack');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
	devtool: isProduction ? 'source-map' : 'eval-source-map',
	entry: ['./src/bootstrap.js'],
	stats: 'verbose',
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
			},
			{
				test: /\.(woff2|woff|ttf|png|svg|eot)$/,
				loader:"url-loader"
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


	resolve: {
		modules: [
			path.resolve(__dirname, 'src'),
			'node_modules',
		],
	},
	plugins: [
        new webpack.optimize.UglifyJsPlugin(),
		// new webpack.ProvidePlugin({
		// 	Box2D: 'Box2D'
        //   }),
          new webpack.ProvidePlugin({
			Key: 'Key'
		  }),
		  new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery'
		  })
	]
};
