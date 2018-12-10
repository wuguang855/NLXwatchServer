var xml2obj = require('xml2obj-stream');
var fs = require('fs');
//删除不需要的父元素的引用
var transformation = function (_proto) {
	var obj = {};
	mapper(_proto);
	function mapper(o) {
		Object.keys(o).forEach((key) => {
			if (key == "$parent") {
				return;
			} else {
				obj[key] = o[key];
			}
		});
	}
	return obj;
}

//解析xml
function readXml(fileName) {
	return new Promise((resolve, reject) => {
		getKVT(fileName).then((KVT) => {
			getTest(fileName, KVT).then((tests) => {
				resolve(tests);
			})
		})
	});
}
//解析获取id字典表
function getKVT(fileName) {
	return new Promise((resolve, reject) => {
		var KVT = {}
		var readStream = fs.createReadStream(fileName);
		var parseStream = new xml2obj.Parser(readStream);
		parseStream.setTransformation(transformation);
		parseStream.each('statistics', function (data) {
			var kvtArr = data.$children[2].$children;
			kvtArr.forEach((v, i) => {
				KVT[v.$attrs.id] = v.$attrs.name;
			})
		});
		parseStream.on('end', function () {
			resolve(KVT);
		});
	});
}
//解析获取Test列表
/**
 * @param id 
 * @param name
 * @param status
 * @param module
 * @param operator
 * @param endTime
 */
function getTest(fileName, KVT) {
	return new Promise((resolve, reject) => {
		var readStream = fs.createReadStream(fileName);
		var parseStream = new xml2obj.Parser(readStream);
		parseStream.setTransformation(transformation);
		var tests = [];
		parseStream.each('test', function (data) {
			var test = {};
			test.id = data.$attrs.id;
			var idArr = data.$attrs.id.split("-");
			var id0 = [idArr.shift(0)];
			test.step0 = KVT[id0.join("-")];
			var id1 = id0.concat([idArr.shift(0)]);
			test.step1 = KVT[id1.join("-")];
			var id2 = id1.concat([idArr.shift(0)]);
			test.step2 = KVT[id2.join("-")];
			var id3 = id2.concat([idArr.shift(0)]);
			test.step3 = KVT[id3.join("-")];
			test.step4 = data.$attrs.name;
			var l = data.$children.length;
			test.status = data.$children[l - 1].$attrs.status;
			test.endTime = data.$children[l - 1].$attrs.endtime;
			test.operator = data.$children[l - 2].$children[0].$text;
			test.module = data.$children[l - 2].$children[1].$text;
			test.project = data.$children[l - 2].$children[2].$text;
			test.description = data.$children[l - 3].$text;
			tests.push(test);
		});
		parseStream.on('end', function () {
			resolve(tests);
		});
	});
}
module.exports = readXml;