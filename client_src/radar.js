(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Radar = factory();
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
    const addAlpha = function (byteArray, percent) {
        // 改变透明度
        for (var i = 0; i < byteArray.data.length; i += 4) {
            byteArray.data[i + 3] = Math.floor(byteArray.data[i + 3] * percent);
        }
        return new ImageData(byteArray.data, byteArray.width, byteArray.height);
    }
    const rotate = function (byteArray, degree, posx, posy) {
        var _byteArray = new Uint8ClampedArray(byteArray.data);
        var byteArray_ = new Uint8ClampedArray(byteArray.data);
        var posx = posx || (byteArray.width + 1) >> 1;
        var posy = posy || (byteArray.height + 1) >> 1;
        for (var i = 0; i < byteArray.height; i++) {
            for (var j = 0; j < byteArray.width; j++) {
                //第i行j列
                x0 = Math.floor(Math.cos(degree) * (i - posx) + Math.sin(degree) * (j - posy) + posy);
                y0 = Math.floor(Math.sin(degree) * (i - posx) - Math.cos(degree) * (j - posy) + posx);
                if (x0 >= 0 && x0 < byteArray.width && y0 >= 0 && y0 < byteArray.height) {
                    byteArray_[(i * byteArray.width + j) * 4] = _byteArray[(x0 * byteArray.width + y0) * 4];
                    byteArray_[(i * byteArray.width + j) * 4 + 1] = _byteArray[(x0 * byteArray.width + y0) * 4 + 1];
                    byteArray_[(i * byteArray.width + j) * 4 + 2] = _byteArray[(x0 * byteArray.width + y0) * 4 + 2];
                    byteArray_[(i * byteArray.width + j) * 4 + 3] = _byteArray[(x0 * byteArray.width + y0) * 4 + 3] * .4;
                }
            }
        }
        return new ImageData(byteArray_, byteArray.width, byteArray.height);
    }

    const mixImage = function (originalImg, mixImg, posx, posy) {
        var pos_x = posx || 0;
        var pos_y = posy || 0;
        var width = Math.max(originalImg.width, mixImg.width + pos_x);
        var height = Math.max(originalImg.height, mixImg.height + pos_y);
        var array = new Uint8ClampedArray(width * height * 4);
        for (var i = 1; i < height; i++) {
            for (var j = 0; j < width; j++) {
                //第i行j列
                //新图  array[(i*width +j)*4] 
                //原始图  originalImg.data[(originalImg.width*i+j)*4]
                //混合图    mixImg.data[(mixImg.width*(i-pox_x)+j-pos_y)*4]
                if (i <= originalImg.width - 1 && j <= originalImg.height - 1) {
                    if (i < mixImg.width - 1 + pos_x && i >= pos_x && j < mixImg.height - 1 + pos_y && j >= pos_y) {
                        //两张图都有像素 
                        var o0 = originalImg.data[(originalImg.width * i + j) * 4],
                            o1 = originalImg.data[(originalImg.width * i + j) * 4 + 1],
                            o2 = originalImg.data[(originalImg.width * i + j) * 4 + 2],
                            o3 = originalImg.data[(originalImg.width * i + j) * 4 + 3],
                            m0 = mixImg.data[(mixImg.width * (i - pos_x) + j - pos_y) * 4],
                            m1 = mixImg.data[(mixImg.width * (i - pos_x) + j - pos_y) * 4 + 1],
                            m2 = mixImg.data[(mixImg.width * (i - pos_x) + j - pos_y) * 4 + 2],
                            m3 = mixImg.data[(mixImg.width * (i - pos_x) + j - pos_y) * 4 + 3];
                        array[(i * width + j) * 4] = (o0 * (255 - m3) + m0 * m3) >> 8; // Math.floor(o0 * (255 - m3) / 255 + m0 * m3 / 255);
                        array[(i * width + j) * 4 + 1] = (o1 * (255 - m3) + m1 * m3) >> 8; //Math.floor(o1 * (255 - m3) / 255 + m1 * m3 / 255);
                        array[(i * width + j) * 4 + 2] = (o2 * (255 - m3) + m2 * m3) >> 8; // Math.floor(o2 * (255 - m3) / 255 + m2 * m3 / 255);
                        array[(i * width + j) * 4 + 3] = o3 + m3 - ((o3 * m3) >> 8) - 1; //Math.floor(o3 + m3 - o3 * m3 / 255);
                    } else {
                        //原始图有像素
                        var o0 = originalImg.data[(originalImg.width * i + j) * 4],
                            o1 = originalImg.data[(originalImg.width * i + j) * 4 + 1],
                            o2 = originalImg.data[(originalImg.width * i + j) * 4 + 2],
                            o3 = originalImg.data[(originalImg.width * i + j) * 4 + 3];
                        array[(i * width + j) * 4] = o0;
                        array[(i * width + j) * 4 + 1] = o1;
                        array[(i * width + j) * 4 + 2] = o2;
                        array[(i * width + j) * 4 + 3] = o3;
                    }
                } else {
                    if (i < mixImg.width - 1 + pos_x && i >= pos_x && j < mixImg.height - 1 + pos_y && j >= pos_y) {
                        //混合图有像素
                        var m0 = mixImg.data[(mixImg.width * (i - pos_x) + j - pos_y) * 4],
                            m1 = mixImg.data[(mixImg.width * (i - pos_x) + j - pos_y) * 4 + 1],
                            m2 = mixImg.data[(mixImg.width * (i - pos_x) + j - pos_y) * 4 + 2],
                            m3 = mixImg.data[(mixImg.width * (i - pos_x) + j - pos_y) * 4 + 3];
                        array[(i * width + j) * 4] = m0;
                        array[(i * width + j) * 4 + 1] = m1;
                        array[(i * width + j) * 4 + 2] = m2;
                        array[(i * width + j) * 4 + 3] = m3;
                    }
                }
            }
        }
        return new ImageData(array, width, height);
    }

    var byteArray, assistCanvasDom;
    const loadImage = function (src) {
        var assistCanvas;
        // if (!assistCanvas) {
        assistCanvas = document.createElement('canvas');
        assistCanvas.id = 'assistCanvas';
        assistCanvas.style.position = 'fixed';
        assistCanvas.style.top = '10000px';
        assistCanvas.style.left = '10000px';
        assistCanvas.width = '2000';
        assistCanvas.height = '2000';
        document.body.appendChild(assistCanvas);
        assistCanvasDom = document.getElementById("assistCanvas");
        //  }
        assistCanvas.width = '2000';

        var assistCtx = assistCanvasDom.getContext("2d");
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.src = src;
            img.onload = function () {
                assistCtx.drawImage(img, 0, 0);
                var byteArray = assistCtx.getImageData(0, 0, img.width, img.height);
                assistCanvasDom.remove(0);
                resolve(byteArray);
            }
            img.onerror = function (e) {
                assistCanvasDom.remove(0);
                reject(e);
            }
        })
    }
    var Star = function (posx, posy) {
        this.posx = posx;
        this.posy = posy;
        this.birthTime = new Date().getTime();
        this.duration = 2000;
        this.die = false;
        this.star0 = new Image();
        this.star0.src = './img/r_point_0.png';
        this.star1 = new Image();
        this.star1.src = './img/r_point_1.png';
        this.star2 = new Image();
        this.star2.src = './img/r_point_2.png';
        this.draw = function (ctx) {
            if (new Date().getTime() - this.birthTime < this.duration / 4) {
                ctx.drawImage(this.star0, this.posx, this.posy);
            } else if (new Date().getTime() - this.birthTime < this.duration / 4 * 2) {
                ctx.drawImage(this.star1, this.posx, this.posy);
            } else if (new Date().getTime() - this.birthTime < this.duration / 4 * 3) {
                ctx.drawImage(this.star2, this.posx, this.posy);
            } else {
                this.die = true;
            }
        }
    }

    function Radar(settings) {
        var mainCanvas = document.createElement('canvas');
        mainCanvas.id = 'radarChatCanvas';
        mainCanvas.width = settings ? settings.width : '360';
        mainCanvas.height = settings ? settings.height : '360';

        this.dom = mainCanvas;
        this.ctx = mainCanvas.getContext("2d");
        this.boundStatus = false;
        this.stars = [];
        this.mount = function (dom) {
            dom.appendChild(this.dom);
            this.boundStatus = true;
            this.loadAllSourse();
            this.render();
        }

        this.clear = function () {
            this.ctx.clearRect(0, 0, 600, 600);
        }
        this.changeColor = function (status) {
            console.log("status", status);
            this.colorStatus = !!status;
        }
        this.loadAllSourse = function () {
            //添加最底部图片
            loadImage('./img/r_bg_0.png').then((bg0) => {
                loadImage('./img/r_bg_1.png').then((bg1) => {
                    //添加地球
                    this.imgWithOutAngleBlue = mixImage(bg0, bg1, 15, 15);
                    var bg2 = mixColors(bg1, "#FA5E50");
                    this.imgWithOutAngleRed = mixImage(bg0, bg2, 15, 15);
                    //添加扫描件
                    loadImage('./img/r_angle_1.png').then((angle1) => {
                        this.angle = angle1;
                    });
                });
            });
        }
        this.deg = .1;
        this.starSwitch = 0;
        this.draw = function () {
            if (this.boundStatus && this.imgWithOutAngleBlue && this.imgWithOutAngleRed && this.angle) {
                //清空画布
                this.clear();
                this.deg -= 0.1
                var angle = rotate(this.angle, this.deg);

                this.starSwitch += 1;
                this.starSwitch = this.starSwitch % 4;

                if (this.starSwitch == 0 && Math.random() > .5) {
                    var ox = (this.angle.width + 1) >> 1;
                    var oy = (this.angle.height + 1) >> 1;
                    var r = 10 + (ox - 20) * Math.random();
                    var posx = r * Math.sin(this.deg + Math.PI / 6 * 7) + ox;
                    var posy = r * Math.cos(this.deg + Math.PI / 6 * 7) + oy;
                    var star = new Star(posx, posy);
                    this.stars.push(star);
                }
                var img;
                if (this.colorStatus) {
                    img = mixImage(this.imgWithOutAngleRed, angle, 20, 20);
                } else {
                    img = mixImage(this.imgWithOutAngleBlue, angle, 20, 20);
                }
                var imgData = mixImage(img, angle, 20, 20);

                //添加扫描件
                this.ctx.putImageData(imgData, 0, 0);
                //添加星星
                this.stars.forEach((star, index) => {
                    if (star.die) {
                        this.stars.splice(index, 1);
                    } else {
                        star.draw(this.ctx);
                    }
                })
            }
        }
        this.render = function () {
            setInterval(() => {
                this.draw();  
            }, 1000 / 60);

        }
    }
    return Radar;
}));