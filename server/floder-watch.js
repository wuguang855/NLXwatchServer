/**
 *  watch  服务，watch测试报告所在文件夹，读取数据并存储到 data.nlxd 文件。  更新后 通知父进程 更新了数据
 **/
console.log('child pid: (floder-watch.js) ' + process.pid);
var config = require('../config.js');
var watch = require('node-watch');
var  readXml = require('./utils/readXml.js'); 
var  storageData = require('./utils/storageData.js'); 

let testReportFolder = config.testReportFolder;
var lastTime=0;
watch(testReportFolder, {
    recursive: true
}, function (evt, name) {
    //如果修改的是output.xml 这个文件，解析它,控制一下更新频率，如果20秒之内多次更新，只更新第一次
    if (name.match(/.*?output\.xml/) && (new Date().getTime()-lastTime) > 20000) {
        lastTime = new Date().getTime();
        readXml(name).then(tests => {
            storageData(tests).then((data)=>{
                //发送数据给到主程序
                var msg= {
                    code: "1001",
                    data: data
                };
                process.send(msg);
            })
        });
    }
});