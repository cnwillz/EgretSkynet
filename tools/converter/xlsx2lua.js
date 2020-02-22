'use strict'
var XLSX = require('xlsx');
var fs = require('fs');
var path = require('path');

var options = process.argv;
if(options.length < 5)
{
	console.log("需要3个参数(side src out)");
	process.exit();
}
//console.log(options[2], options[3], options[4]);
var side = options[2];
var sideChar = '';
if(side == 'server')
	sideChar = 's';
else if(side == 'client')
	sideChar = 'c';
else {
	console.log("side should be server/client");
	process.exit();
}

var srcDir = options[3];
var outDir = options[4];

console.log("Xy导表脚本 XyExcelExporter");
console.log("作者: willz[qq3243309346]");

var keys = {};
//var values = [];
var attrExport = [];
var currentSheet = null;

function isJson(obj) {
	var isJson = typeof(obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
	return isJson;
}

function insertKey(list, line) {
	var obj = keys;
	for(var i = 0; i < list.length; i++) {
		if(!obj.hasOwnProperty(list[i])) {
			obj[list[i]] = {};
		}
		if(i == list.length - 1)
			obj[list[i]] = line;
		else
			obj = obj[list[i]];
	}
}

/* 给String原型链对象添加方法trim */
if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}

function getCell(sheet, row, col) {
	var ref = XLSX.utils.encode_cell({c:col,r:row});
	var cell = sheet[ref];
	return (cell ? cell.v : undefined);
}

function getMaxRow(sheet) {
	var range = XLSX.utils.decode_range(sheet['!ref']);
	//console.log(range);
	return range.e.r;
}

function getMaxCol(sheet) {
	var range = XLSX.utils.decode_range(sheet['!ref']);
	//console.log(range);
	return range.e.c;
}

function insertStr(soure, start, newStr){   
   return soure.slice(0, start) + newStr + soure.slice(start);
}

function encodeQuote(str) {
	if(str[0] != '"' || str[str.length-1] != '"')
		return str;
	var i = 1;
	var f;
	while((f = str.indexOf('"', i)) != -1 && f < str.length - 1) {
		str = insertStr(str, f, '\\');
		//console.log(f, str);
		i = f + 2;
	}
	return str;
}

function getCellContent(sheet, row, col) {
	var cell = getCell(sheet, row, col);
	if(cell == undefined)
		return '""';
	var str = ''+cell;
	str = str.replace(/\n/g, ' ');
	if(str.trim().length ==0)
		return '""';
	return str;
}

function getCellNonEmpty(sheet, row, col) {
	var cell = getCell(sheet, row, col);
	if(cell == undefined)
		return '';
	var str = ''+cell;
	str = str.replace(/\n/g, ' ');
	if(str.trim().length ==0)
		return '';
	return str;
}


function handleValues(obj, numAttr, prefix) {
	var str = '';
	for (var key in obj) {
		str += prefix + '[' + key + '] = {\n';
        var val = obj[key];
		if(isJson(val)) {
			str += handleValues(val, numAttr, prefix + '\t');
		} else {
			for(var ai = 0; ai < numAttr; ai++) {
				if(!attrExport[ai])
					continue;
				var value = getCellContent(currentSheet, 7 + val, 1 + ai);
				if(value != undefined)
					str += '\t' + prefix + getCell(currentSheet, 6, 1 + ai) + ' = ' + value + ',\n';
			}
		}
		str += prefix + '},\n';
    }
	return str;
}


function mkdirs(dirname, callback) {
    if(fs.existsSync(dirname)) { 
		if(callback != undefined)
			callback();
	} else {
		mkdirs(path.dirname(dirname), function() {
			fs.mkdirSync(dirname);
			if(callback != undefined)
				callback();
		});  
	}    
}

function removeDir(p){
	if(!fs.existsSync(p))
		return;
    let statObj = fs.statSync(p); // fs.statSync同步读取文件状态，判断是文件目录还是文件。
    if(statObj.isDirectory()){ //如果是目录
        let dirs = fs.readdirSync(p) //fs.readdirSync()同步的读取目标下的文件 返回一个不包括 '.' 和 '..' 的文件名的数组['b','a']
        dirs = dirs.map(dir => path.join(p, dir))  //拼上完整的路径
        for (let i = 0; i < dirs.length; i++) {
            // 深度 先将儿子移除掉 再删除掉自己
            removeDir(dirs[i]);
        }
        fs.rmdirSync(p); //删除目录
    }else{
        fs.unlinkSync(p); //删除文件
    }
}

var countExport = 0;
function handleFile(filePath){
	var workbook = XLSX.readFile(filePath);
	//console.log(workbook);
	console.log("handle file: "+ filePath + " with " + workbook.SheetNames.length + " sheets");
	for(var s = 0; s < workbook.SheetNames.length; s++) {
		var sname = workbook.SheetNames[s];
	 
		var sheet = workbook.Sheets[sname];
		//console.log(sheet);
	
		var exportType = getCell(sheet, 0, 1);
		if(exportType == 'base') {
			var exportFile = outDir + '/' + getCell(sheet, 1, 1);
			
			var fileHead = getCell(sheet, 0, 4);
			var fileTail = getCell(sheet, 1, 4);
			var numKeys = getCell(sheet, 2, 1);
			//console.log(exportFile, fileHead, fileTail, numKeys);
			
			if(sideChar=='c') {
				var clientHead = getCellNonEmpty(sheet, 0, 6);
				if(clientHead != '')
					fileHead = clientHead;
				
				var clientFile = getCellNonEmpty(sheet, 1, 6);
				if(clientFile != '')
					exportFile = outDir + '/' + clientFile;
			}
			console.log("exporting sheet '" + sname +
			"' with type " + exportType+
			" to '" + exportFile + "'"
			);
			
			exportFile = exportFile.toLowerCase();
			mkdirs(path.dirname(exportFile));
			var outLua = fileHead + '\n';
			
			
			try {
				var data = fs.readFileSync(exportFile, 'utf-8');
				var contents = data.split("\n");
				contents[contents.length-1] = '';
				outLua = contents.join("\n");
			} catch (err) {
				// 出错了
			}
			
			var lines = getMaxRow(sheet) - 6;
			//console.log("line:" + lines);
			//if(lines == 0)
			//	continue;
			
			keys = null;
			keys = {};
			var isBreak = false;
			for(var li = 0; li < lines; li++) {
				var list = [];
				for(var ki = 0; ki < numKeys; ki++) {
					var str = getCell(sheet, 7 + li, 1 + ki);
					str = str==undefined?'':''+str;
					if(str.trim().length ==0) {
						isBreak = true;
						break;
					}
					list[ki] = str;
				}
				if(!isBreak)
					insertKey(list, li);
				else
					isBreak = false;
			}
			//console.log(keys);
			
			attrExport = [];
			var numAttr = getMaxCol(sheet);
			var validAttr = 0;
			for(var ai = 0; ai < numAttr; ai++) {	
				var exportParam = getCell(sheet, 5, 1 + ai);
				if(exportParam != undefined && exportParam.includes(sideChar)) {
					attrExport[ai] = true;
					validAttr++;
				}
				else
					attrExport[ai] = false;
			}
			//console.log(attrExport);
			//console.log("attr:" + numAttr);
			
			currentSheet = sheet;
			
			if(validAttr > 0)
				outLua += handleValues(keys, numAttr, '');;
			
			outLua += fileTail;
			fs.writeFileSync(exportFile, outLua, 'utf-8');
			countExport++;
		}
		else if(exportType == 'tiny') {
			var exportFile = outDir + '/' + getCell(sheet, 1, 1);
			exportFile = exportFile.toLowerCase();
			console.log("exporting sheet '" + sname +
			"' with type " + exportType+
			" to '" + exportFile + "'"
			);
			
			var fileHead = getCell(sheet, 0, 4);
			var fileTail = getCell(sheet, 1, 4);
			mkdirs(path.dirname(exportFile));
			var outLua = fileHead + '\n';
			
			var lines = 0;
			for(var lines = 0; true;) {
				if(getCell(sheet, 5+ lines, 1) == undefined)
					break;
				lines++;
			}
			//console.log("line:" + lines);
			//if(lines == 0)
			//	continue;
			
			for(var li = 0; li < lines; li++) {
				var exportParam = getCell(sheet, 5 + li, 1);
				if(!exportParam.includes(sideChar))
					continue;
				var attr = getCell(sheet, 5 + li, 2);
				var value = getCellContent(sheet, 5 + li, 3);
				value = encodeQuote(value);
				if(value.startsWith('--#include'))
					outLua += value + '\n';
				else if(attr != undefined)
					outLua += '\t' + attr + ' = ' + value + ',\n';
			}
			
			
			outLua += fileTail;
			fs.writeFileSync(exportFile, outLua, 'utf-8');
			countExport++;
		}
	}
}

function handleDir(filePath){
    //根据文件路径读取文件，返回文件列表
    var files = fs.readdirSync(filePath);
	//遍历读取到的文件列表
	files.forEach(function(filename){
		//获取当前文件的绝对路径
		var filedir = path.join(filePath,filename);
		//根据文件路径获取文件信息，返回一个fs.Stats对象
		var stats = fs.statSync(filedir);
		var isFile = stats.isFile();//是文件
		var isDir = stats.isDirectory();//是文件夹
		if(isFile && filedir.endsWith(".xlsx")){
			//console.log(filedir);
			handleFile(filedir);
		}
		if(isDir){
			handleDir(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
		}
		
	});
}

removeDir(outDir);
handleDir(srcDir);
console.log("Total export: " + countExport);