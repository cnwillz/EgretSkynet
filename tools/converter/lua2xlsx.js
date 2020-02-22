'use strict'
var XLSX = require('xlsx');
var fs = require('fs')
var path = require('path')

var options = process.argv;
if(options.length < 4)
{
	console.log("需要2个参数(src out)");
	process.exit();
}

var srcDir = options[2];
var outDir = options[3];


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

var countExport = 0;
function handleFile(fileDir) {
	var content = fs.readFileSync(fileDir, 'utf8');
	var contents = content.split("\n");
	
	var exportHead = contents[0];
	var exportTail = contents[contents.length-1];
	
	
	var i = 1;
	
	var numKeys = 0;
	while(true) {
		var re = contents[i+numKeys].match(/\[\d+\] *= *\{/g);
		if(re == null)
			break;
		numKeys++;
		//console.log(re);
	}
	console.log("keys", numKeys);
	var exportType = (numKeys>0?'base':'tiny');
	
	var fileName = fileDir.replace(/^.*[\\\/]/, '');
	var exportFile = outDir + '/' + fileName + '.xlsx';
	mkdirs(path.dirname(exportFile));
	var data = [];
	data[0] = ['导出类型', exportType, '', '导出文件头', exportHead];
	data[1] = ['导出文件', fileDir, '', '导出文件尾', exportTail];
	data[2] = ['key数量', numKeys];
	data[3] = [];
	if(numKeys > 0) {
		var numAttr = 0;
		while(true) {
			var re = contents[i+numKeys+numAttr].match(/	\}\,/g);
			//console.log(re);
			if(re != null)
				break;
			numAttr++;
		}
		console.log("attr", numAttr);
		
		data[4] = ['配置备注'];
		data[5] = ['导出参数'];
		data[6] = ['备注'];
		
		for(var ai = 0; ai < numAttr; ai++) {
			data[5][1+ai] = 'sc';
			var re = contents[i+numKeys+ai].match(/\t(\w+) *=/);
			if(re != null) {
				//console.log(re[1]);
				var attrName = re[1];
				data[6][1+ai] = attrName;
			}
		}
		
		for(var row = 7; i+numKeys+numAttr<contents.length; i+=2*numKeys+numAttr) {
			//console.log(i);
			data[row] = [];
			for(var ai = 0; ai < numAttr; ai++) {
				var re = contents[i+numKeys+ai].match(/ *= *([^\n]+),/);
				if(re != null) {
					//console.log(re[1]);
					data[row][1+ai] = re[1];
				}
			}
			row++;
		}
	} else {
		data[4] = ['配置备注', '导出参数', '字段名', '值', '备注'];
		for(var row = 5; row-4 < contents.length-1; row++) {
			var re = contents[row-4].match(/\t(\w+) *= *([^\n]+),/);
			if(re != null) {
				//console.log(re);
				data[row] = ['', 'sc', re[1], re[2]];
			}
		}
	}

	var ws = XLSX.utils.aoa_to_sheet(data);
	var wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, fileName);
	
	console.log(fileDir, '->', exportFile);
	XLSX.writeFile(wb, exportFile);
	countExport++;
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
		if(isFile){
			//console.log(filedir);
			handleFile(filedir);
		}
		if(isDir){
			handleDir(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
		}
		
	});
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

removeDir(outDir);
handleDir(srcDir);

