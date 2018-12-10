//引入css文件
require('./index.css');
require('./ele_num.css');

//引入依赖的js文件
require('./jquery.min.1.7.js');
const _ = require('lodash');
const Radar = require('./radar.js');
const EleNum = require('./ele_num.js');
const Bubble = require('./bubble.js');

//页面自由缩放
//缩放屏幕
function scaleScreen() {
    //获得屏幕高度
    var _w = window.screen.width;
    var _scale = _w / 1920;
    $('body').css("transform", "scale(" + _scale + "," + _scale + ")");
}
scaleScreen();
window.onresize = function () {
    scaleScreen();
}
// 自定义 shape, 支持图片形式的气泡
G2.Shape.registerShape('interval', 'borderRadius', {
    draw: function draw(cfg, container) {
        var points = cfg.points;
        var path = [];
        path.push(['M', points[0].x, points[0].y]);
        path.push(['L', points[1].x, points[1].y]);
        path.push(['L', points[2].x, points[2].y]);
        path.push(['L', points[3].x, points[3].y]);
        path.push('Z');
        path = this.parsePath(path); // 将 0 - 1 转化为画布坐标
        return container.addShape('rect', {
            attrs: {
                x: path[1][1], // 矩形起始点为左上角
                y: path[1][2],
                width: path[2][1] - path[1][1],
                height: path[0][2] - path[1][2],
                fill: cfg.color,
                radius: (path[2][1] - path[1][1]) / 2
            }
        });
    }
});

//获取数据渲染页面
const config = require('../config.js');
var url = 'ws://' + location.hostname + ":" + config.webSocketPort;
var ws = new WebSocket(url);



ws.onopen = function () {
    setInterval(() => {
        ws.send("ping");
    }, 5000);
};
ws.onmessage = function (evt) {
    try {
        data = JSON.parse(evt.data);
    } catch (e) {
        data = {};
    }
    if (data && data.type) {
        //console.log(data);
        updataData(data);
    }
};

ws.onclose = function () {
    console.log("连接已关闭...");
};

//全局变量
 //渲染标识
//全局的变量
var G = {};
G.tag;
G.inited = false;
G.initedScope = [];
G.myRadar;
G.pnum1;
G.pnum2;
G.pnum3;
G.myBubble;
G.theta_1_chart;
G.theta_2_chart;
G.chart_dodge;
G.theta_3_chart;
G.theta_4_chart;
G.chart_fold;

//运算中需要储存的中间变量
G.thisMoudles = [];
G.thisApis = [];
//全局的数据
G.statistics = {
    lastMonth: {
        pass: 0,
        fail: 0
    },
    thisMonth: {
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
    }
};
G.lastMonthMoulds = [];
G.serverStartTime = new Date().getTime();
G.dataCenter = [
    ["新立讯", 0]
];
G.pnum1Data = 0;
G.pnum2Data = 0;
G.pnum3Data = 0;
/**
 * theta_1,theta_2
 * {
        label: "1",
        pass:0,
        fail:0,
        percent: 0
    }
*/
G.theta_1 = [];
G.theta_2 = [];
G.theta_3 = [];
G.theta_4 = [];

/** 
 * {
 * fail,
 * pass,
 * }
 */
G.foldData = [];
/**
 * {
        name:"张1",
        type:"All",
        value:100

    },
    {
        name:"张1",
        type:"失败",
        value:12

    }
 *  */

G.dodgeData = [];

function updataData(data) {
    if (data.type == "TEST") {
        updata(data);
    } else if (data.type == "START") {
        init(data);
    }
}

function updata(data) {
    if (data.tag == G.tag) {
        //更新中间变量
        G.thisMoudles.push(data.data.module);
        G.thisMoudles = _.uniq(G.thisMoudles);
        G.thisApis.push(data.data.step4);
        G.thisApis = _.uniq(G.thisApis);

        //改变雷达颜色
        if (data.data.status != "PASS") {
            G.myRadar.changeColor(true);
            setTimeout(() => {
                G.myRadar.changeColor(false);
            }, 500)
        }
        //改变综合监控数据
        if (data.data.status == "PASS") {
            G.statistics.today.pass++;
            G.statistics.thisMonth.pass++;
        } else {
            G.statistics.today.fail++;
            G.statistics.thisMonth.fail++;
        }
        updataZHSJ();
        //项目综合统计
        var index = _.findIndex(G.theta_1, function (o) {
            return o.label == data.data.project;
        });
        if (index == -1) {
            G.theta_1.push({
                label: data.data.project,
                pass: 0,
                fail: 0,
                percent: 0
            })
            index = G.theta_1.length-1;
        }
        if (data.data.status == "PASS") {
            G.theta_1[index].pass++;
            G.theta_2[0].percent++
        } else {
            G.theta_1[index].fail++;
            G.theta_2[1].percent++
        }
        G.theta_1[index].percent = G.theta_1[index].pass+G.theta_1[index].fail;
        //更新项目综合统计
        pieCanvas(G.theta_1, G.theta_1_chart);
        pieCanvas(G.theta_2, G.theta_2_chart);

        //更新当前模块数
        if(G.pnum2Data != G.thisMoudles.length){
            G.pnum2Data = G.thisMoudles.length
            updataPnumData(2);
        }
         //更新当前接口数
        if(G.pnum3Data != G.thisApis.length){
            G.pnum3Data = G.thisApis.length
            updataPnumData(3);
        }
        //更新中间区域
        var j = _.findIndex(G.dataCenter,function(o){
            return o[0]==data.data.project;
        })
        var l =  G.dataCenter.length-1;
        G.dataCenter[l][1]++;
       
        if(j!=-1){
            G.dataCenter[j][1]++;
        }else{
            G.dataCenter.unshift([data.data.project,1]);
        }  
        G.myBubble.bindData(G.dataCenter);

        if(G.foldData.lengh=0){
            G.foldData = [{pass: 0, fail: 0}];
        }
        var j = G.lastMonthMoulds.indexOf(data.data.step4);
        if(j==-1){
            if (data.data.status == "PASS") {
                G.foldData[0].pass++;
            } else {
                G.foldData[0].fail++;
            }
        }
        //更新综合效率分析
        foldFn();

        var index = _.findIndex(G.theta_3, function (o) {
            return o.label == data.data.project;
        });
        if (index == -1) {
            G.theta_3.push({
                label: data.data.project,
                pass: 0,
                fail: 0,
                percent: 0
            })
            G.theta_4.push({
                label: data.data.project,
                pass: 0,
                fail: 0,
                percent: 0
            })
            index = G.theta_3.length-1;
        }
        if (data.data.status == "PASS") {
            G.theta_3[index].percent++;
        } else {
            G.theta_4[index].percent++;
        }
        //更新实时运行情况
        pieCanvas(G.theta_3, G.theta_3_chart);
        pieCanvas(G.theta_4, G.theta_4_chart);


        var index = _.findIndex(G.dodgeData, function (o) {
            return o.name == data.data.operator;
        });
        if (index == -1) {
            G.dodgeData.push({
                name: data.data.operator,
                type: "All",
                value: 0
            })
            G.dodgeData.push({
                name: data.data.operator,
                type: "失败",
                value: 0
            })
            index = G.dodgeData.length-2;
        }
        G.dodgeData[index].value++;
        if(data.data.status != "PASS"){
            G.dodgeData[index+1].value++;
        }
        //日增长统计分析
        dodgeFn();
        addTest(data.data);
    }
}

function init(data) {
    G.tag = data.tag;
    data = data.data;
    G.lastMonthMoulds = data.lastMonthMoulds;
    G.serverStartTime = data.serverStartTime;

    G.statistics.lastMonth = data.lastMonth;
    G.statistics.thisMonth = data.thisMonth;
    G.statistics.today = data.today;
    G.statistics.yesterday = data.yesterday;

    G.theta_1 = []
    G.theta_2 = [{
        label: "成功",
        percent: 0
    }, {
        label: "失败",
        percent: 0
    }];
    G.pnum2Data = 0;
    G.pnum3Data = 0;
    G.dataCenter = [
        ["新立讯", 0]
    ];
    $("#containerMy").html("");
    G.lastMonthMoulds = data.lastMonthMoulds;
    G.foldData = data.newMoulds;

    G.theta_3 = [];
    G.theta_4 = [];




    //更新综合数据监控区域
    updataZHSJ();
    //更新项目综合统计
    pieCanvas(G.theta_1, G.theta_1_chart);
    pieCanvas(G.theta_2, G.theta_2_chart);
    //更新综合效率分析
    G.dodgeData =[];
    foldFn();
    //更新当前模块数
    updataPnumData(2);
    //更新当前接口数
    updataPnumData(3);
    //更新中间区域
    G.myBubble.clearData();
    G.myBubble.bindData(G.dataCenter);
    //更新实时运行情况
    pieCanvas(G.theta_3, G.theta_3_chart);
    pieCanvas(G.theta_4, G.theta_4_chart);
    //日增长统计分析
    dodgeFn();
}



//初始化页面
function initLeftTop() {
    G.myRadar = new Radar();
    G.myRadar.mount(document.querySelector("#rotate"));
}

function initLeftCenter() {
    G.theta_1_chart = new G2.Chart({
        container: 'mountPassAndFail',
        forceFit: false,
        width: 275,
        height: 265,
        animate: false
    });
    G.theta_2_chart = new G2.Chart({
        container: 'mountAllShell',
        forceFit: false,
        width: 275,
        height: 265,
        animate: false
    });
}

function initLeftBottom() {
    G.chart_fold = new G2.Chart({
        container: 'StackedColumnChart',
        forceFit: false,
        animate:false,
        width: 933,
        height: 329,
        padding: "auto"
    });
}

function initCenter() {
    G.pnum1 = new EleNum();
    G.pnum1.mount(document.querySelector("#pnum1"));
    setInterval(() => {
        G.pnum1Data = Math.floor((new Date().getTime() - G.serverStartTime) / 1000);
        updataPnumData(1);
    }, 1000);

    G.pnum2 = new EleNum();
    G.pnum2.mount(document.querySelector("#pnum2"));
    G.pnum3 = new EleNum();
    G.pnum3.mount(document.querySelector("#pnum3"));
    G.myBubble = new Bubble();

    G.myBubble.mount(document.querySelector("#bubble"));
    G.myBubble.clear();
    G.myBubble.bindData(G.dataCenter);
}

function initRightTop() {
    var i = 0;
    setInterval(() => {
        i = !i;
        if (!i) {
            $("#containerMy").addClass("active");
            $("#containerMy").css("top", "-55px");

        } else {
            $("#containerMy").removeClass("active");
            $("#containerMy").css("top", "0");
            $("#containerMy").append($("#containerMy  :eq(0)").detach());
        }
    }, 2000)
}

function initRightBottom() {
    G.chart_dodge = new G2.Chart({
        container: 'GroupedColumnChart',
        forceFit: true,
        animate: false,
        height: 329,
    });
}

function initRightCenter() {
    G.theta_3_chart = new G2.Chart({
        container: 'mountPrivatePass',
        forceFit: false,
        width: 275,
        height: 265,
        animate: false
    });
    G.theta_4_chart = new G2.Chart({
        container: 'mountPrivateFail',
        forceFit: false,
        width: 275,
        height: 265,
        animate: false
    });
}
initLeftTop();
initLeftCenter();
initLeftBottom();
initCenter();
initRightCenter();
initRightBottom();
initRightTop();
inited = true;

function getPercent(pass, fail) {
    var sum = pass + fail;
    return (sum ? (pass / sum).toFixed(2) * 100 : 0) + "%";
}

function updataZHSJ() {
    var statistics = G.statistics;
    document.querySelector('.today').innerHTML = getPercent(statistics.today.pass, statistics.today.fail);
    document.querySelector('.yesterday').innerHTML = getPercent(statistics.yesterday.pass, statistics.yesterday.fail);
    document.querySelector('.lastMonths').innerHTML = getPercent(statistics.lastMonth.pass, statistics.lastMonth.fail);
    document.querySelector('.sameMonths').innerHTML = getPercent(statistics.thisMonth.pass, statistics.thisMonth.fail);
}

function updataPnumData(type) {
    G["pnum" + type].setData(G["pnum" + type + "Data"])
}

//这里是饼图
function pieCanvas(data, container) {
    container.clear();
    container.source(data, {
        percent: {
            formatter: function formatter(val) {
              //  val = val * 100 + '%';
                return val;
            }
        }
    });
    container.coord('theta', {
        radius: 0.75,
        innerRadius: 0.6
    });
    container.tooltip({
        showTitle: false,
        itemTpl: '<li><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</li>'
    });

    container.intervalStack().position('percent').color('label')//.label('percent', {
        .tooltip('label*percent', function (label, percent) {
          //  percent = percent * 100 + '%';
            return {
                name: label,
                value: percent
            };
        }).style({
            lineWidth: 0,
            stroke: '#fff'
        });
    container.legend({
        position: 'bottom-right',
        itemWidth: 70,
    })
    container.render();
}
//叠状柱状图 ----> 
function dodgeFn() {
    var data = G.dodgeData;
    //console.log("data",data);
    G.chart_dodge.clear();
    G.chart_dodge.source(data);
    G.chart_dodge.legend({
        position: 'bottom', // 设置图例的显示位置
        itemGap: 20 // 图例项之间的间距
    });
    G.chart_dodge.interval().position('name*value').color('type', ['#00ff00', '#ff0000', '#096dd9', '#0050b3']).opacity(.8);
    G.chart_dodge.render();
}

function foldFn() {
    G.chart_fold.clear();
    var _data = [];
    var fields = ['今天', '昨天', '三天前', '四天前', '五天前', '六天前', '七天前']
    G.foldData.forEach((res, index) => {
        var sum = res.pass + res.fail;
        var fail = res.fail; // sum ? (res.fail / sum).toFixed(4) * 100 : 0;
        var pass = res.pass; // sum ? (res.pass / sum).toFixed(4) * 100 : 0;
        _data.push({
            day: fields[index],
            name: "成功",
            value: pass
        });
        _data.push({
            day: fields[index],
            name: "失败",
            value: fail
        });
    });

    G.chart_fold.source(_data);
    G.chart_fold.interval().position('day*value').shape('borderRadius').size(8).color('name', ["#22ff55", "#ff2222"]).opacity(.9).adjust([{
        type: 'dodge',
        marginRatio: 1 / 32
    }]);
    G.chart_fold.render();
}

function addTest(data) {
    if (data.step1 != "NLX moduleTest") {
        return;
    }
    var diveOne;
    if (data.status == "PASS") {
        diveOne = `<div class="divSwiper" ><span class="bg_span">${data.module}</span><p class="pSwiper"><span>${data.description}</span><span>${data.step4}</span></p><span class="timeS">${data.endTime}</span></div><div style="clear:both;"></div>`;
    } else {
        diveOne = `<div class="divSwiper"><span class="bg_span2">${data.module}</span><p class="pSwiper"><span>${data.description}</span><span>${data.step4}</span></p><span class="timeS">${data.endTime}</span></div>`;
    }
    $("#containerMy").append(diveOne);
}