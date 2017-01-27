var path = require( 'path' );
var webpack = require( 'webpack' );

module.exports = {

	context : path.join(__dirname, 'src'),
	entry : ['babel-polyfill','./app.js'],
	output : {
		path: path.resolve(__dirname, 'lib'),
		filename: 'app.bundle.js',
		publicPath: 'lib'
	},
	watch : true,
	devtool : 'inline-sourcemap',
	module : {
		loaders : [
			{
				test : /\.js$/,
				include : __dirname,
				loader : 'babel-loader',
				query : {
					presets : [ 'es2015' ],
					compact : true
				}
			},
			{
				test : /\.css$/,
				loader : 'style!css!autoprefixer-loader'
			},
			{
				test: /\.scss$/,
				loader: 'style!css!sass'
			},
			{
				test: /\.html$/,
				loader: "html-loader"
			}
		]
	},
	devServer: {
		historyApiFallback: {
		index: 'index.html'
		}
	},
	resolve : {
		extensions : [ '', '.js' ],
		moduleDirectories: ['./node_modules']
	}
};
