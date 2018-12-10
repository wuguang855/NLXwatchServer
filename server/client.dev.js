var http = require('http');
var reload = require('reload');
var app = require('./src/main');
var webpack = require('webpack');
var opn = require('opn');
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');
var webpackDevConfig = require('./webpack.config.js');
var config = require('./config/index.config.json');

var hotMiddlewareScript = 'webpack-hot-middleware/client?reload=true';
// 所有views 可以获取的全局变量
app.locals.globWebBasePath = config.webBasePath;
new HtmlWebpackPlugin({
    title: 'My App',
    filename: 'assets/admin.html'
})
app.locals.env = process.env.NODE_ENV || 'dev';
app.locals.reload = true;

//按照 热更新dev模式配置 webpack
for (var key in webpackDevConfig.entry) {
    webpackDevConfig.entry[key].push(hotMiddlewareScript);
};
webpackDevConfig.devtool = 'source-map';
webpackDevConfig.plugins.push(new webpack.optimize.OccurrenceOrderPlugin());
webpackDevConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
webpackDevConfig.plugins.push(new webpack.NoEmitOnErrorsPlugin());

var cssLoader = {
    test: /\.css$/,
    use: [
        'style-loader',
        'css-loader?sourceMap',
        'resolve-url-loader'
    ]
};
var sassLoader = {
    test: /\.sass$/,
    use: [
        'style-loader',
        'css-loader?sourceMap',
        'resolve-url-loader',
        'sass-loader?sourceMap'
    ]
};
webpackDevConfig.module.rules.push(cssLoader);
webpackDevConfig.module.rules.push(sassLoader);
var compiler = webpack(webpackDevConfig);
var port = 8095;
app.use(webpackDevMiddleware(compiler, {
    publicPath: webpackDevConfig.output.publicPath,
    noInfo: true,
    stats: {
        colors: true
    }
}));
app.use(webpackHotMiddleware(compiler));

var server = http.createServer(app);
reload(server, app)
server.listen(port, function () {
    console.log('App (dev) is now running on port ' + (port) + '!');
});