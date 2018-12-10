var express = require('express');
var http = require('http');
var WebSocket = require('ws');
var config = require('../config.js')
var app = express();

console.log('child pid:(web-socket) ' + process.pid);
var server = http.createServer(app);

var wss = new WebSocket.Server({
	server
});
//消息循环
var msgQueue = {
	broadcast: [],
	private: []
};
wss.on('connection', function connection(ws) {
	//开始心跳消息
	ws.on('message', function (data) {
		if (data == "ping") {
			ws.send('pong');
		}
	});
	var $$id = uuid();
	ws.$$id = $$id;
	console.log("wss.clients[0].$$id", $$id);
	//向数据调度中心发送一个请求新数据的msg
	var msg = {
		code: "1000",
		tag: $$id
	}
	process.send(JSON.stringify(msg));
});
process.on('message', function (msg) {
//	console.log("process.on('message')", msg);
	if (msg.code == "1002") {
		if (msg.tag == 'BROADCAST') {
			msgQueue.broadcast =[];
			//拆分消息
			var msg0 = {
				type: 'START',
				tag: msg.tag,
				data: {
					serverStartTime: msg.data.serverStartTime,
					today: msg.data.today,
					yesterday: msg.data.yesterday,
					thisMonth: msg.data.thisMonth,
					lastMonth: msg.data.lastMonth,
					lastMonthMoulds: msg.data.lastMoulds,
					newMoulds:msg.data.newMoulds
				}
			}
			msgQueue.broadcast.push(msg0);
			msg.data.tests.forEach((test) => {
				var msg1 = {
					type: 'TEST',
					tag: msg.tag,
					data: test
				}
				msgQueue.broadcast.push(msg1);
			})
			msgQueue.private=[];
		} else {
			var privateMsg=[];
			//拆分消息
			var msg0 = {
				type: 'START',
				tag: msg.tag,
				data: {
					serverStartTime: msg.data.serverStartTime,
					today: msg.data.today,
					yesterday: msg.data.yesterday,
					thisMonth: msg.data.thisMonth,
					lastMonth: msg.data.lastMonth,
					lastMonthMoulds: msg.data.lastMoulds,
					newMoulds:msg.data.newMoulds
				}
			}
			privateMsg.push(msg0);
			msg.data.tests.forEach((test) => {
				var msg1 = {
					type: 'TEST',
					tag: msg.tag,
					data: test
				}
				privateMsg.push(msg1);
			})
			msgQueue.private.push(privateMsg);
		}
	}
});
var timer = config.timeInterval;
setInterval(() => {
	var msgQ = [];
	if (msgQueue.broadcast.length > 0) {
		var msg = msgQueue.broadcast.shift();
		msgQ.push(msg);
	}
	if (msgQueue.private.length > 0) {
		msgQueue.private.forEach((msgs, index)=>{
			if (msgs.length > 0) {
				var msg = msgs.shift();
				msgQ.push(msg);
			} else {
				msgQueue.private.splice(index, 1);
			}
		});
	}
	wss.clients.forEach(function each(client) {
		msgQ.forEach(function each(msg) {
			if (client.$$id == msg.tag || msg.tag == 'BROADCAST') {
				client.send(JSON.stringify(msg));
			}
		});
	});
}, timer);


function uuid() {
	var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
	var uuid = [],
		i;
	radix = chars.length;
	var r;
	for (i = 0; i < 36; i++) {
		if (!uuid[i]) {
			r = 0 | Math.random() * 16;
			uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
		}
	}
	return uuid.join('');
}

var port = config.webSocketPort;
server.listen(port, function listening() {
	console.log('websocket启动成功！端口号：', port);
});