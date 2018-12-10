(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Bubble = factory();
    }
}(this, function () {

    const formatColor = (colorStr) => {
        var colorArr = [];
        colorArr[0] = parseInt(colorStr.substr(1, 2), 16);
        colorArr[1] = parseInt(colorStr.substr(3, 2), 16);
        colorArr[2] = parseInt(colorStr.substr(5, 2), 16);
        return colorArr;
    };
    const getYFromRGB = (color1) => {
        var colorArr = color1;
        var R = colorArr[0],
            G = colorArr[1],
            B = colorArr[2];
        return (77 * R + 150 * G + 29 * B + 128) >> 8;
    };
    const getUVFromRGB = (color) => {
        var colorArr = formatColor(color);
        var R = colorArr[0],
            G = colorArr[1],
            B = colorArr[2],
            U = ((-43 * R - 84 * G + 127 * B + 128) >> 8) + 128,
            V = ((127 * R - 106 * G - 21 * B + 128) >> 8) + 128;
        return [U, V];
    };
    const clamp = (value, min, max) => {
        return value > max ? max : (value < min ? min : value);
    }
    const getRGBFromYUV = (yuvArr) => {
        var Y = yuvArr[0],
            U = yuvArr[1],
            V = yuvArr[2],
            C = Y - 16,
            D = U - 128,
            E = V - 128,
            R = clamp((298 * C + 409 * E + 128) >> 8, 0, 255),
            G = clamp((298 * C - 100 * D - 208 * E + 128) >> 8, 0, 255),
            B = clamp((298 * C + 516 * D - 128) >> 8, 0, 255);
        return [R, G, B];
    }
    const mixColor = function (original, color) {
        var Y = getYFromRGB(original);
        var U = getUVFromRGB(color)[0];
        var V = getUVFromRGB(color)[1];
        return getRGBFromYUV([Y, U, V]);
    }
    const mixColors = function (_byteArray, color) {
        var byteArray = new ImageData(_byteArray.data, _byteArray.width, _byteArray.height);
        // 反转颜色
        for (var i = 0; i < byteArray.data.length; i += 4) {
            if (byteArray.data[i + 3]) {
                var originalColor = [byteArray.data[i], byteArray.data[i + 1], byteArray.data[i + 2]];
                var finalColor = mixColor(originalColor, color);
                byteArray.data[i] = finalColor[0];
                byteArray.data[i + 1] = finalColor[1];
                byteArray.data[i + 2] = finalColor[2];
            }
        }
        return byteArray;
    }
    //  byteArray转image

    function byteArrayToImage(byteArray) {
        var id = "assistCanvas" + new Date().getTime()
        return new Promise(function (resolve, reject) {
            assistCanvas = document.createElement('canvas');
            assistCanvas.id = id;
            assistCanvas.style.position = 'fixed';
            assistCanvas.style.top = '10000px';
            assistCanvas.style.left = '10000px';
            assistCanvas.width = byteArray.width;
            assistCanvas.height = byteArray.height;
            document.body.appendChild(assistCanvas);
            assistCanvas.width = byteArray.width;
            assistCanvas.height = byteArray.height;
            var assistCtx = assistCanvas.getContext("2d");
            assistCtx.putImageData(byteArray, 0, 0);
            var img = new Image();
            img.src = assistCanvas.toDataURL('image/png', 1.0);
            img.onload = function () {
                document.getElementById(id).remove(0);
                resolve(img);
            }
            img.onerror = function (e) {
                document.getElementById(id).remove(0);
                reject(e);
            }
        })
    }
    // image 转 byteArray

    const imageToByteArray = function (src, posx, posy, width, height) {

        var id = "assistCanvas" + new Date().getTime()
        var assistCanvas = document.createElement('canvas');
        assistCanvas.id = id;
        assistCanvas.style.position = 'fixed';
        assistCanvas.style.top = '10000px';
        assistCanvas.style.left = '10000px';
        assistCanvas.width = '2000';
        assistCanvas.height = '2000';
        document.body.appendChild(assistCanvas);
        assistCanvas.width = '2000';
        assistCanvas.height = '2000';
        var assistCtx = assistCanvas.getContext("2d");
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.src = src;
            img.onload = function () {
                assistCtx.drawImage(img, 0, 0);
                var byteArray = assistCtx.getImageData(posx || 0, posy || 0, width || img.width, height || img.width);
                document.getElementById(id).remove(0);
                resolve(byteArray);
            }
            img.onerror = function (e) {
                document.getElementById(id).remove(0);
                reject(e);
            }
        })
    }
    const randomColor = function () {
        return '#' + Math.floor(Math.random() * 0xffffff).toString(16);
    }

    function Enum(num, ctx) {
        var numInt = num ? (num + "") : "";
        var resultInt = '';
        var j = 0;
        for (var i = numInt.length - 1; i >= 0; i--) {
            j++;
            j = j % 3;
            if (j == 1) {
                //  resultInt=','+resultInt;
            }
            resultInt = numInt[i] + resultInt;
        }
        this.num = resultInt || "0";
        this.ctx = ctx;
        this.numImOnloaded = [];
        //加载数字图片
        this.numImg = new Image();
        this.numImg.src = "./img/e_num.png";
        this.numImg.onload = () => {
            this.numImgReady = true;
            if (this.numImOnloaded[0]) {
                var drawImg = this.numImOnloaded.shift();
                drawImg();
            }
        }

        this._draw = function (ox, oy) {
            var s = .3;
            //总宽度
            var w = this.num.length * s * 47;
            var sx = ox - w / 2;
            var sy = oy;
            this.num.split("").forEach((value, index) => {
                if (value != ",") {
                    this.ctx.drawImage(this.numImg, 2, value * 58 + 3, 45, 55, sx + index * 45 * s, sy, 45 * s, 55 * s);
                }
            });
        }
        this.draw = function (ox, oy) {
            if (!!this.numImgReady) {
                this._draw(ox, oy);
            } else {
                this.numImOnloaded.push(this._draw.bind(this, ox, oy));
            }
        };
    }

    function Box(seetings) {
        this.ctx = seetings.ctx;
        this.boxBgImgOnloaded = [];
        this.posx = seetings.pos[0] || 0;
        this.posy = seetings.pos[1] || 0;
        this.center = [];
        this.n_px = this.posx;
        this.n_py = this.posy;
        this.text = seetings.text;
        this.value = seetings.value * 1;
        this.width = 120 + 30 * Math.random();
        this.height = this.width;
        this.center[0] = this.n_px + this.width / 2;
        this.center[1] = this.n_py + this.height / 2;
        this.eNum = new Enum(this.value, this.ctx);
        //画一个球
        imageToByteArray("./img/box.png").then((bg) => {
            boxbgByteArray = bg;
            boxbgByteArray = mixColors(boxbgByteArray, randomColor());
            byteArrayToImage(boxbgByteArray).then((boxbgImg) => {
                this.boxBgImg = boxbgImg;
                this.boxbgImgReady = true;
                if (this.boxBgImgOnloaded[0]) {
                    var drawImg = this.boxBgImgOnloaded.shift();
                    drawImg();
                }
            })
        })
        this.drawTime = 0;
        this.add1 = 0;
        this.add2 = 0;
        this._draw = function () {
            this.drawTime++;
            this.drawTime %= 20;
            if (this.drawTime == 0 && Math.random() > .5) {
                this.add1 = !this.add1;
            }
            if (this.drawTime == 5 && Math.random() > .5) {
                this.add2 = !this.add2;
            }
            if (this.n_px < this.posx - 50) {
                this.add1 = true;
            }
            if (this.n_px > this.posx + 50) {
                this.add1 = false;
            }
            if (this.add1) {
                this.n_px += Math.random() * .5;

            } else {
                this.n_px -= Math.random() * .5;
            }
            if (this.n_py < this.posy - 50) {
                this.add2 = true;
            }
            if (this.n_py > this.posy + 50) {
                this.add2 = false;
            }
            if (this.add2) {
                this.n_py += Math.random() * .5;
            } else {
                this.n_py -= Math.random() * .5;
            }
            this.center[0] = this.n_px + this.width / 2;
            this.center[1] = this.n_py + this.height / 2;
            this.ctx.drawImage(this.boxBgImg, this.n_px, this.n_py, this.width, this.height);
            //写文字
            this.ctx.font = "bold 16px '微软雅黑'";
            this.ctx.fillStyle = "#ffffff";
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.text, this.n_px + this.width / 2, this.n_py + this.height * 2 / 5, this.width);
            //写数字
            var ox = this.n_px + this.width / 2;
            var oy = this.n_py + this.height / 2;
            this.eNum.draw(ox, oy);
        }
        this.changeData = function (value) {
            this.value = value;
            this.eNum = new Enum(this.value, this.ctx);
        };
        this.draw = function () {
            if (!!this.boxbgImgReady) {
                this._draw();
            } else {
                this.boxBgImgOnloaded.push(this._draw.bind(this));
            }

        }
    }

    function Box2(seetings) {
        this.ctx = seetings.ctx;
        this.boxBgImgOnloaded = [];
        this.center = [];
        this.width = 252 * .5;
        this.height = this.width;
        this.posx = 386 - this.width / 2;
        this.posy = 206 - this.width / 2;
        this.center[0] = this.posx + this.width / 2;
        this.center[1] = this.posy + this.height / 2;
        this.value = seetings.value * 1;
        this.text = seetings.text;
        this.eNum = new Enum(this.value, this.ctx);
        //画一个球
        imageToByteArray("./img/box2.png").then((bg) => {
            boxbgByteArray = bg;
            byteArrayToImage(boxbgByteArray).then((boxbgImg) => {
                this.boxBgImg = boxbgImg;
                this.boxbgImgReady = true;
                if (this.boxBgImgOnloaded[0]) {
                    var drawImg = this.boxBgImgOnloaded.shift();
                    drawImg();
                }
            })
        });
        this.changeData = function (value) {
            this.value = value;
            this.eNum = new Enum(this.value, this.ctx);
        };
        this._draw = function () {
            this.ctx.drawImage(this.boxBgImg, this.posx, this.posy, this.width, this.height);
            //写文字
            this.ctx.font = "bold 16px '微软雅黑'";
            this.ctx.fillStyle = "#ffffff";
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.text, this.posx + this.width / 2, this.posy + this.height * 2 / 5, this.width);
            //写数字
            var ox = this.posx + this.width / 2;
            var oy = this.posy + this.height * 3 / 5;
            this.eNum.draw(ox, oy);
        }
        this.draw = function () {
            if (!!this.boxbgImgReady) {
                this._draw();
            } else {
                this.boxBgImgOnloaded.push(this._draw.bind(this));
            }

        }
    }

    function Bubble(settings) {
        var mainCanvas = document.createElement('canvas');
        mainCanvas.id = 'bubbleChatCanvas';
        mainCanvas.width = settings ? settings.width : '770';
        mainCanvas.height = settings ? settings.height : '500';
        this.dom = mainCanvas;
        this.ctx = mainCanvas.getContext("2d");
        this.boundStatus = false;
        this.boxs = [];
        this.data = [];
        this.centerBox = new Box2({
            ctx: this.ctx,
            value: 1,
            text: "新立讯"
        });
        this.clear = function () {
            this.ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        }
        this.darw = function () {
            //this.dom.width = settings ? settings.width : '770';
            this.ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
            this.boxs.forEach((box) => {
                //划线
                this.ctx.lineWidth = 3;
                this.ctx.strokeStyle = "#01e2f3";
                this.ctx.beginPath();
                //原点坐标    
                var p_o = [385, 200];
                //点坐标
                var p_t = box.center;
                //斜率
                var len = Math.sqrt((p_o[0] - p_t[0]) * (p_o[0] - p_t[0]) + (p_o[1] - p_t[1]) * (p_o[1] - p_t[1]));
                var sin0 = (p_t[0] - p_o[0]) / len;
                var cos0 = (p_t[1] - p_o[1]) / len;
                //控制点
                var p_c = [(p_t[0] - len / 10 * sin0), (p_t[1] - len / 10 * cos0 * 10)];
                this.ctx.moveTo(...p_o);
                this.ctx.quadraticCurveTo(...p_c, ...p_t);
                this.ctx.stroke();
            });
            this.centerBox && this.centerBox.draw();
            this.boxs.forEach((box) => {
                box.draw();
            });
        }
        this.timer;
        this.mount = function (dom) {
            dom.appendChild(this.dom);
            this.timer = setInterval(() => {
                this.darw();
            }, 17)
        }
        this.clearData = function () {
            this.data = [];
            this.boxs = [];
        }
        this.binding = false;
        this.bindData = function (data) {

            if (!this.binding) {
                this.binding = true;
                var allPos = [
                    [150, 75],
                    [610, 0],
                    [150, 225],
                    [500, 225],
                    [325, 0],
                    [20, 145],
                    [500, 75],
                    [40, 0],
                    [610, 330],
                    [40, 330],
                    [630, 145],
                    [325, 340]
                ];
                var _data = JSON.parse(JSON.stringify(this.data));
                this.data = JSON.parse(JSON.stringify(data));
                data.forEach((value, index) => {
                    var k = -1;
                    for (var i = 0; i < _data.length; i++) {
                        if (_data[i][0] == value[0]) {
                            k = i;
                        }
                    }
                    if (k == -1) {
                        if (index == data.length - 1) {
                            this.centerBox = new Box2({
                                ctx: this.ctx,
                                value: value[1],
                                text: value[0]
                            });
                        } else {
                            var box = new Box({
                                ctx: this.ctx,
                                pos: allPos[data.length - 1],
                                value: value[1],
                                text: value[0]
                            });
                            this.boxs.unshift(box);
                        }
                    } else {
                        if (k == _data.length - 1) {
                            this.centerBox.changeData(this.data[k][1]);
                        } else {
                            this.boxs[k].changeData(this.data[k][1]);
                        }
                    }
                });
                this.binding = false;
            }
        }
    }
    return Bubble;
}));;