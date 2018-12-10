//引入css文件
require('./index.css');
require('./ele_num.css');

require('./jquery.min.1.7.js');
var Radar = require('./radar.js');
var EleNum = require('./ele_num.js');
var Bubble = require('./bubble.js');
//全局的变量
var inited = false,
    initedScope = [],
    myRadar,
    theta_1_chart,
    theta_2_chart,
    chart_dodge,
    theta_3_chart,
    theta_4_chart,
    chart_fold,
    pnum1,
    pnum2,
    pnum3,
    myBubble;
//全局的数据
var dataTotal;
var theta_1=[
    {
        label: '成功',
        count: 100,
        percent: 180
    },
    {
        label: '失败',
        count: 80,
        percent: 180
    }
],
dodgeData=[
    {
        count:80,
        type:"pass" ,
        name:'yhw'
    },
    {
        count:20,
        type:"fail" ,
        name:'yhw'
    },
    {
        count:100,
        type:"total" ,
        name:'yhw'
    },
    {
        count:100,
        type:"pass" ,
        name:'aa'
    },
    {
        count:35,
        type:"fail" ,
        name:'aa'
    },
    {
        count:135,
        type:"total" ,
        name:'aa'
    },
],
foldData=[
    {
        name:"成功",
        "第一天":10,
        "第二天":15,
        "第三天":15,
        "第四天":15,
        "第五天":20,
        "第六天":20,
        "第七天":15,
    },
    {
        name:"失败",
        "第一天":15,
        "第二天":25,
        "第三天":5,
        "第四天":5,
        "第五天":10,
        "第六天":15,
        "第七天":10,
    },{
        name:"新增",
        "第一天":3,
        "第二天":5,
        "第三天":5,
        "第四天":6,
        "第五天":4,
        "第六天":4,
        "第七天":2,
    }

]

//初始化页面
function initLeftTop() {
    myRadar = new Radar();
    myRadar.mount(document.querySelector("#rotate"));
}

function initLeftCenter() {
    theta_1_chart = new G2.Chart({
        container: 'mountPassAndFail',
        forceFit: false,
        width: 275,
        height: 265,
        animate: false
    });
    theta_2_chart = new G2.Chart({
        container: 'mountAllShell',
        forceFit: false,
        width: 275,
        height: 265,
        animate: false
    });
}

function initLeftBottom() {
    chart_dodge = new G2.Chart({
        container: 'GroupedColumnChart',
        forceFit: false,
        width:933,
        height: 329,
        padding:"auto"
    });
}

function SeamlessRolling(data) {

    data.forEach((res) => {
        var diveOne;
        if (res.status == "PASS") {
            diveOne = `<div class="divSwiper" ><span class="bg_span">${res.module}</span><p class="pSwiper"><span>${res.docPerent}</span><span>${res.docChild}</span></p><span class="timeS">${res.time}</span></div><div style="clear:both;"></div>`;
        } else {
            diveOne = `<div class="divSwiper"><span class="bg_span2">${res.module}</span><p class="pSwiper"><span>${res.docPerent}</span><span>${res.docChild}</span></p><span class="timeS">${res.time}</span></div>`;
        }
        $("#containerMy").append(diveOne);
    })

    var i = 0;
    setInterval(() => {
        i = !i;
        console.log(i, 777)
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
function initCenter() {
    pnum1 = new EleNum();
    pnum1.mount(document.querySelector("#pnum1"));
    pnum2 = new EleNum();
    pnum2.mount(document.querySelector("#pnum2"));
    pnum3 = new EleNum();
    pnum3.mount(document.querySelector("#pnum3"));
    myBubble = new Bubble();
    myBubble.mount(document.querySelector("#bubble"));
}
function initRightBottom() {
    chart_fold = new G2.Chart({
        container: 'StackedColumnChart',
        forceFit: true,
        height: 329,
    });
}

function initRightCenter() {
    theta_3_chart = new G2.Chart({
        container: 'mountPrivatePass',
        forceFit: false,
        width: 275,
        height: 265,
        animate: false
    });
    theta_4_chart = new G2.Chart({
        container: 'mountPrivateFail',
        forceFit: false,
        width: 275,
        height: 265,
        animate: false
    });
}
function init() {
    //综合数据监控
    initLeftTop();
    initLeftCenter();
    initLeftBottom();
    initCenter();
    initRightCenter();
    initRightBottom();
    pieCanvas(theta_1,theta_1_chart);
    pieCanvas(theta_1,theta_2_chart);
    pieCanvas(theta_1,theta_3_chart);
    pieCanvas(theta_1,theta_4_chart);
    dodgeFn(dodgeData)
    foldFn(foldData);
    // SeamlessRolling();
    inited = true;
    if (initedScope[0]) {
        initedScope[0]();
    }
}
init();
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
//更新数据
function updata(data) {
    console.log("updata", data)

    precentFirst(data.ProportionDetail);

    //SeamlessRolling()
}
//获取数据
var url = 'ws://' + location.hostname + ":8443";
var ws = new WebSocket(url);

ws.onopen = function () {
    setInterval(() => {
        ws.send("ping");
    }, 5000);
};

ws.onmessage = function (evt) {
    try {
        data = JSON.parse(evt.data);
        console.log(data)
    } catch (e) {
        data = {};
    }
    if (data && data.pieChart) {
        console.log(data)
        if (inited) {
            updata(data);
        } else {
            initedScope.push(function () {
                updata(data);
            });
        }
    }
};

ws.onclose = function () {
    console.log("连接已关闭...");
};



//这里是饼图
function pieCanvas(data, container) {
    container.clear();
    container.source(data, {
        percent: {
            formatter: function formatter(val) {
                val = val * 100 + '%';
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
            percent = percent * 100 + '%';
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
        itemWidth: 70 ,
    })
    container.render();
}
function dodgeFn(data) {
    chart_dodge.clear();
    chart_dodge.source(data);
    chart_dodge.legend({
        position: 'bottom', // 设置图例的显示位置
        itemGap: 20 // 图例项之间的间距
    });
    chart_dodge.intervalDodge().position(['name', 'count',]).color('type').adjust([{
        type: 'dodge',
        marginRatio: 1 / 32
    }]);
    chart_dodge.render();
}
//柱状图封装G2----> 叠状
function foldFn(data) {
    chart_fold.clear();
    var ds2 = new DataSet();
    var dv2 = ds2.createView().source(data);
    dv2.transform({
        type: 'fold',
        fields: ['第一天', '第二天', '第三天', '第四天', '第五天', '第六天', '第七天'], // 展开字段集
        key: 'day', // key字段
        value: 'count' // value字段
    });
    chart_fold.source(dv2);
    chart_fold.intervalStack().position('day*count').color('name');
        chart_fold.legend({
            position: 'bottom', // 设置图例的显示位置
            itemGap: 20 // 图例项之间的间距
        });
    chart_fold.render();
}




