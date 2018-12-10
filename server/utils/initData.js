/**
 * 初始化数据结构
 *  */

const fs = require('fs');
const path = require('path');

function _init(serverStartTime) {
    var tag = new Date().getTime();
    var data = {
        tag: tag,
        serverStartTime: serverStartTime,
        todayTime: new Date().setHours(0, 0, 0, 0),
        thisTime: {
            pass: 0,
            fail: 0
        },
        thisTimeNewMoulds:{
            pass: 0,
            fail: 0
        },
        today: {
            pass: 0,
            fail: 0
        },
        yesterday: {
            pass: 0,
            fail: 0
        },
        thisMonth: {
            pass: 0,
            fail: 0
        },
        lastMonth: {
            pass: 0,
            fail: 0
        },
        newMoulds: [{
            fail: 0,
            pass: 0
        }],
        thisMoulds: [],
        lastMoulds: [],
        tests: []
    };
    return data;
}

function initServerStartTime() {
    var serverStartTime;
    try {
        serverStartTime = fs.readFileSync(path.resolve(__dirname, '../../database/serverStartTime.ndb'), 'utf-8');
    } catch (e) {

    }
    if (!serverStartTime) {
        serverStartTime = new Date().getTime();
        fs.writeFile(path.resolve(__dirname, '../../database/serverStartTime.ndb'), serverStartTime, {}, function (err) {
            if (!err) {
                console.log(">>> 服务器启动时间 初始化成功~~");
            } else {
                console.log(err);
            }
        });
    }
    return serverStartTime;
}
const initData = function () {
    //读取数据，如果数据存在返回数据，如果数据不存在初始化数据并返回
    var data;
    try {
        var dataStr = fs.readFileSync(path.resolve(__dirname, '../../database/currentData.json'), 'utf-8');
        if (dataStr) {
            data = JSON.parse(dataStr);
        }
    } catch (e) {

    }
    if (!data) {
        var serverStartTime = initServerStartTime();
        data = _init(serverStartTime);
        fs.writeFile(path.resolve(__dirname, '../../database/currentData.json'), JSON.stringify(data), {}, function (err) {
            if (!err) {
                console.log(">>> 服务器初始数据 初始化成功~~");
            } else {
                console.log(err);
            }
        });
    }
    return data;
}
module.exports = initData;