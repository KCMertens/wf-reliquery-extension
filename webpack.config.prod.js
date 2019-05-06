const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
	entry: {
		// Output multiple files, one for each main page - important!: also include the polyfills in the output bundle
		index: [
			'./src/utils/enable-polyfills.ts',
			'./src/index.ts'
		],
	},
	output: {
		filename: '[name].js',
		// Path on disk for output file
		path: path.resolve(__dirname, 'dist'),
		// Path in webpack-dev-server for compiled files (has priority over disk files in case both exist)
		publicPath: '/dist/',
	},
	resolve: {
		extensions: ['.js', '.ts'], // enable autocompleting .ts and .js extensions when using import '...'
		alias: {
			// Enable importing source files by their absolute path by prefixing with "@/"
			// Note: this also requires typescript to be able to find the imports (though it doesn't use them other than for type checking), see tsconfig.json
			"@": path.join(__dirname, "src"),
		}
	},
	module: {
		// import/exports
		rules: [{
			test: /\.css$/,
			use: ['css-loader'],
		}, {
			test: /\.scss$/,
			use: [
				'css-loader',
				'sass-loader'
			]
		}, {
			test: /\.ts$/,
			use: [{
				loader: 'babel-loader',
			}, {
				loader: 'ts-loader',
				options: {
					/*
					Required for webpack-dev-server to support HMR (hot module reloading) from typescript files
					This however disables all type checking errors/warnings
					These are then re-enabled through ForkTsCheckerWebpackPlugin
					NOTE: the default behavior is to refresh the entire page on changes in a module
					this can be prevented by adding the following code (essentially manually replacing your imported functions with the updated version):
					But it needs to be done everywhere the module is used, and for every import that you want to update without refreshing the page...
					if (module.hot) {
						module.hot.accept('./exports-string', () => {
							const { valueToLog } = require('./exports-string'); // original imported value doesn't update, so you need to import it again
							document.write(`HMR valueToLog: ${valueToLog}`);
						});
					}
					*/
					transpileOnly: true,
					appendTsSuffixTo: [/\.vue$/],
				}
			}]
		}, {
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel-loader',
		}]
	},
	plugins: [
		new ForkTsCheckerWebpackPlugin({
			vue: true
		}),
		// new BundleAnalyzerPlugin(),
		new CleanWebpackPlugin(['dist'], {
			verbose: false,
		}),
		new webpack.BannerPlugin(
`// ==UserScript==
// @name        Warframe reliquary  helper
// @namespace   https://github.com/kcmertens/
// @description Adds some extra checkboxes and features
// @match       https://wf.xuerian.net/*
// @version     0.0.1
// @license     MIT
// @grant       GM.getValue
// @grant       GM.setValue
// ==/UserScript==`)
	],
	devtool: 'source-map'
};