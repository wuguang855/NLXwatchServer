var path = require('path');
var hotMiddlewareScript = 'webpack-hot-middleware/client?reload=true';
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var Uglify = require('uglifyjs-webpack-plugin');
var CopyWebpackPlugin = require("copy-webpack-plugin");
var devConfig = {
    entry: {
        main: ['./client_src/main.js']
    },
    output: {
        filename: './main.js',
        path: path.join(__dirname, './view')
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: path.resolve(__dirname, "./node_modules"),
            options: {
                /* 'presets': ['latest']*/
            }
        }, {
            test: /\.(png|jpg)$/,
            loader: 'url-loader',
            options: {
                limit: 10000,
                name: 'img/[name].[hash:7].[ext]'
            }
        }, {
            test: /\.css$/,
            use: ExtractTextPlugin.extract({
                fallback: "style-loader",
                use: [{
                    loader: 'css-loader',
                    options: {
                        sourceMap: true,
                        modules: true,
                        localIdentName: '[local]'
                    }
                }, {
                    loader: 'postcss-loader',
                    options: {
                        sourceMap: true,
                        config: {
                            path: 'postcss.config.js' // 这个得在项目根目录创建此文件
                        }
                    }
                }]
            })
        }, {
            test: /\.sass$/,
            use: ExtractTextPlugin.extract({
                fallback: "style-loader",
                use: ['css-loader', 'resolve-url-loader', 'sass-loader?sourceMap', 'postcss-loader']
            })
        }]
    },
    plugins: [
        new CleanWebpackPlugin('./view'),
        new Uglify(),
        new ExtractTextPlugin("main.css"),
        new HtmlWebpackPlugin({
            title: '自动化测试实验室',
            template: './client_src/index.html',
            filename: 'index.html'
        }),
        new CopyWebpackPlugin([{
            from: __dirname + '/client_src/img/',
            to:__dirname+"/view/img/"
        }])
    ]
};



module.exports = devConfig;