/**
 * 配置文件
 * 这里添加一个优化， 把已经跑完的测试用例模拟成每过一段时间执行一个timeInterval 是模拟的执行间隔
 */
var path = require('path');
module.exports = {
	testReportFolder:path.resolve(__dirname,'./Observer/'),//测试报告所在目录，需要有读权限
	webSocketPort:8843,//webSocket 的端口号，不能被占用
	webServerPort:8844, //web服务 所有的端口号，不能被占用
	timeInterval:1000//每个测试用例push到间隔
}