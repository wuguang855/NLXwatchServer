/**
 *	主服务，启动 watch 、 webserver ,wss 服务 并处理各子进程之间的通信
 **/

console.log('main pid: (index.js) ' + process.pid);
const storageData = require('./server/utils/storageData.js');
const childProcess = require('child_process');

// 启动各服务
//web服务，用于展示和提供数据 合并的到watch中
const webServer = childProcess.fork('./server/web-server.js');
//ws服务， 用于实时推送更新消息到前端
const wsServer = childProcess.fork('./server/web-socket.js');
//watch服务，用于watch测试报告的改变，更新数据 
const watchServer = childProcess.fork('./server/floder-watch.js');

var currentData = null;
/**
 * 【CODE】 
 * 1000 : web-socket 发起主动请求数据的请求
 * 1001 ：floder-watch 发起，传输数据出来
 * 1002 ：主程序 发起，通知 web-socket传输数据
 */

// 1000 : web-socket 发起主动请求数据的请求
wsServer.on('message', function (msg_) {
	msg = JSON.parse(msg_);
	if (msg.code == "1000") {
		if (!currentData) {
			//currentData 不存在 初始化Data
			storageData().then((_currentData) => {
				currentData = _currentData;
				var _msg = {
					code: "1002",
					tag: msg.tag,
					data: currentData
				};
				wsServer.send(_msg);
			})

		} else {
			var _msg = {
				code: "1002",
				tag: msg.tag,
				data: currentData
			};
			wsServer.send(_msg);
		}
	}
});

//1001 ：floder-watch 发起，传输数据出来
watchServer.on('message', function (msg) {
	if (msg.code == "1001") {
		var msg = {
			code: "1002",
			tag: "BROADCAST",
			data: msg.data
		};
		currentData = msg.data;
		wsServer.send(msg);
	}
});