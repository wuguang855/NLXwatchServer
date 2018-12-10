/**
*	展示层，暂时从文件读取数据。
**/
var  path =  require('path');
var express = require('express'),
	router = express.Router();
router.use(express.static(path.join(__dirname,"./view")));
module.exports = router;