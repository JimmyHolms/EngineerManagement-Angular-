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
	module : {
		loaders : [
			{
				test : /\.js$/,
				exclude : /node_modules/,
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
	resolve : {
		extensions : [ '', '.js' ],
		moduleDirectories: ['./node_modules']
	},
		plugins: [
			new webpack.DefinePlugin({
				'process.env': {
					'NODE_ENV': JSON.stringify('production')
				}
			}),
			new webpack.optimize.UglifyJsPlugin({
				drop_console: true,
				compress: {
					warnings: false
				},
				minimize: true
			}),
			new webpack.optimize.DedupePlugin(),
			new webpack.optimize.OccurenceOrderPlugin()
		]
};
