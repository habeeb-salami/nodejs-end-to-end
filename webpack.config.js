var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var BUILD_DIR = path.resolve(__dirname, 'app/dist');
var SRC_DIR = path.resolve(__dirname, 'src');

var config = {
    entry: [
        SRC_DIR + '/chat-app-css.js',
        SRC_DIR + '/chat-app.jsx'
    ],
    output: {
        path: BUILD_DIR,
        filename: '[name]bundle.js'
    },
    resolve: {
        modulesDirectories: ["web_modules", "node_modules", "bower_components"]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new ExtractTextPlugin("[name].css")
    ],
    module: {
        loaders: [
            {
                test: /\.jsx$/,
                loader: 'babel',
                include: SRC_DIR,
                query: {
                    presets: ['es2015', 'react']
                }
            },
            {
                test: /\.js$/,
                loader: 'babel',
                include: SRC_DIR
            },
            {
                test: /\.css$/,
                include: SRC_DIR,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader!autoprefixer-loader?{browsers:["Android 2.3", "Android >= 4", "Chrome >= 20", "Firefox >= 24", "Explorer >= 8", "iOS >= 6", "Opera >= 12", "Safari >= 6"]}')
            }
        ],
        loaders: [

            {
                test: /\.css$/,
                include: SRC_DIR,
                loader: "style-loader!css-loader"
            }
        ]
    }
};

module.exports = config;
