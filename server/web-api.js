/**
 *	Api  服务，暂时从文件读取数据。存储到cache中,暂时不走API，全部从ws服务走
 **/
console.log('child pid: (web-api.js) ' + process.pid);
var express = require('express'),
	router = express.Router();
router.use('/', function(req, res, next) {

});
module.exports = router;