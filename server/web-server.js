/**
*	api 与web服务的 合并服务
**/
const express = require('express');
const middleware = require('webpack-dev-middleware');
const webpack = require('webpack');
const webpackConfig = require('../webpack.config.js');
const opn = require('opn');
var config = require('../config.js')
console.log('child pid:(web-server.js)' + process.pid);

var app = express();
var isPro = (process.env.NODE_ENV == "production");
if(isPro){
    app.use('/web',require('./web-view.js'));
}else{
    var compiler = webpack(webpackConfig);
    app.use(middleware(compiler, {
    // webpack-dev-middleware options
    }));
}

//app.use('/api',require('./web-api.js'));

var port = config.webServerPort;
app.listen(port, function listening() {
    console.log('web服务启动成功！端口号',port);
});
if(!isPro){
    var uri = "http://localhost:"+port;
    opn(uri,{
        app:'chrome'
    });
}