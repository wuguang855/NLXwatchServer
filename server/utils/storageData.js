/**
 * 作为一个轻量级的应用，这里暂时不用数据库，我们用文本文件读写和缓存来处理数据的存储工作
 *  */

const fs = require('fs');
const _ = require('lodash');
const initData = require('./initData.js');
const path = require('path');

function get0ClockTime(str) {
    var timeString = str.substr(0, 4) + "/" + str.substr(4, 2) + "/" + str.substr(6)
    return new Date(timeString).setHours(0, 0, 0, 0)
}

var lastData;


function storageData(data) {
    //获取上次归档的数据
    if (!lastData) {
        lastData = initData();
    }
    //更新数据
    var thisData = JSON.parse(JSON.stringify(lastData));
    if (data && data[0] && data[0].endTime) {
        //备份一份数据
        var fileName = path.resolve(__dirname, '../../database/' + data[0].endTime.replace(/[\s|\.|\:]/g, "_") + '.json');
        fs.writeFile(fileName, JSON.stringify(data), {}, function (err) {
            if (!err) {
                console.log(">>>", fileName, "保存成功~~");
            } else {
                console.log(err);
            }
        });


        //更新今日的日期
        var lastDate = lastData.todayTime;
        var today = get0ClockTime(data[0].endTime);
        thisData.todayTime = today;

        //判断是不是需要调整本月和本日数据
        if (thisData.todayTime != lastDate) { //不同天，今天调整到昨天
            thisData.today = {
                pass: 0,
                fail: 0
            };
            thisData.yesterday = lastData.today;
            thisData.newMoulds.push({
                fail:0,
                pass:0
            });
            thisData.newMoulds = thisData.newMoulds.slice(0,7);
        }
        if (new Date(thisData.todayTime).getMonth() != new Date(lastDate).getMonth()) {
            thisData.thisMonth = {
                pass: 0,
                fail: 0
            };
            thisData.lastMonth = lastData.thisMonth;
            this.thisMoulds = [];
            thisData.lastMoulds = lastData.thisMoulds;
        }

        //把上次的数据合并到所在天和月
        thisData.today.pass += thisData.thisTime.pass;
        thisData.today.fail += thisData.thisTime.fail;
        thisData.thisMonth.pass += thisData.thisTime.pass;
        thisData.thisMonth.fail += thisData.thisTime.fail;
        thisData.newMoulds[0].pass += thisData.thisTimeNewMoulds.pass;
        thisData.newMoulds[0].fail += thisData.thisTimeNewMoulds.fail;
        //把测试用例全部写入tests；
        thisData.tests = JSON.parse(JSON.stringify(data));

        //更新thisMoulds thisTime
        thisData.thisTime.pass = 0;
        thisData.thisTime.fail = 0;
        data.forEach(test => {
            thisData.thisMoulds.push(test.step4);
            if(test.status=="PASS"){
                thisData.thisTime.pass += 1;
                if(thisData.lastMoulds.indexOf(test.step4)<=-1){
                    thisData.thisTimeNewMoulds.pass +=1;
                }
            }else{
                thisData.thisTime.fail += 1;
                if(thisData.lastMoulds.indexOf(test.step4)<=-1){
                    thisData.thisTimeNewMoulds.fail +=1;
                }
            }
        });
        thisData.thisMoulds = _.uniq(thisData.thisMoulds);

        fs.writeFile(path.resolve(__dirname, '../../database/currentData.json'), JSON.stringify(thisData), {}, function (err) {
            if (!err) {
                console.log(">>> './database/currentData.json',保存成功~~");
                lastData = thisData;
            } else {
                console.log(err);
            }
        });
    }  
    return new Promise((reslove) => {
        reslove(thisData);
    })
}
module.exports = storageData;