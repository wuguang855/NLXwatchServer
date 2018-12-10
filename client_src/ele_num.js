(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.EleNum = factory();
    }
}(this, function () {
    function EleNum(settings) {
        this.length = settings ? settings.length : 6;
        this.spaceMode = (settings && settings.space && settings.space.mode == "cn") ? 4 : 3;
        this.spaceCode = (settings && settings.space) ? settings.space.code : "";
        this.spaceWidth = (settings && settings.space) ? settings.space.width * 1 : "14";
        //创建dom
        this.dom = document.createElement('div');
        var spaceCount = this.length % this.spaceMode == 0 ? (this.length / this.spaceMode - 1) : Math.floor(this.length / this.spaceMode);
        this.dom.style.width = 47 * this.length + this.spaceWidth * spaceCount + "px";
        this.dom.style.height = "58px";
        this.numDoms = new Array();
        this.num = []
        for (let i = 0; i < this.length; i++) {
            //添加num节点
            var numdom = document.createElement('span');
            numdom.classList.add("e_num");
            this.numDoms.push(numdom);
            numdom.classList.add("_0");
            this.num.push("0");
            this.dom.appendChild(numdom);
            //添加空节点
            if ((i + 1) % this.spaceMode == this.length % this.spaceMode && (i + 1) != this.length) {
                var spaceDom = document.createElement('span');
                spaceDom.classList.add("e_space");
                spaceDom.style.width = this.spaceWidth + "px";
                spaceDom.innerHTML = this.spaceCode;
                this.dom.appendChild(spaceDom);
            }
        }
        this.setData = function (data) {
            var numString = (data * 1 || 0) + "";
            var numArray = numString.split("");
            //比较更新class
            for (let i = 0; i <= this.length - 1; i++) {
                if (this.num[i] != (numArray[i - this.length + numArray.length] || "0")) {
                    this.numDoms[i].classList.remove("_" + this.num[i]);
                    this.num[i] = (numArray[i - this.length + numArray.length] || "0");
                    this.numDoms[i].classList.add("_" + (numArray[i - this.length + numArray.length] || "0"));
                }
            }
        }
        this.mount = function (dom) {
            dom.appendChild(this.dom);
        }
    }
    return EleNum;
}));