'use strict'
var lua2json = require('lua-json')
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
var lang = {};
var compactMap = {
	'MonstersConfig': 'MonstersConfig_keys',
	'Monsters2sConfig': 'MonstersConfig_keys2',
	'InstanceConfig': 'InstanceConfig_keys',
	'EffectsConfig': 'EffectsConfig_keys',
	'SkillsConfig': 'SkillsConfig_keys',
	'SkillsExeConfig': 'SkillsExeConfig_keys'
};

function shouldBeArray(obj) {
	var cv = Object.values(obj);
	if(cv.length == 0)
		return false;
	var cv2 = Object.values(cv[0]);
	if(cv2.length == 0)
		return false;
	var innerObj = cv2[0];
	if(innerObj == undefined)
		return false;
	if(typeof innerObj != "object")
		return false;
	var max = -2;
	var count = 0;
	var firstNumber = -999;
	for (var key in innerObj) {
		var id = parseInt(key);
		//console.log(key, id);
		if(isNaN(id))
			return false;
		if(firstNumber == -999)
			firstNumber = id;
		if(id > max)
			max = id;
		count ++;
	}
	//console.log(count, max, count==(firstNumber==0?1+max:max));
	return count>1&&count==(firstNumber==0?1+max:max);
}

function runCompact(obj) {
	var objName = Object.keys(obj)[0];
	if(compactMap.hasOwnProperty(objName)) {
		var tagId = 0;
		var objKeysName = compactMap[objName];
		var tagMap = {};
		var objMap = {};
		
		var oldMap = obj[objName];
		for (var key in oldMap) {
			objMap[key] = [];
			for(var tagKey in oldMap[key]) {
				var id = tagId;
				if(tagMap.hasOwnProperty(tagKey)) {
					id = tagMap[tagKey];
				} else {
					tagMap[tagKey] = tagId;
					tagId++;
				}
				objMap[key][id] = oldMap[key][tagKey];
			}
		}
		
		var newObj = {};
		newObj[objKeysName] = tagMap;
		newObj[objName] = objMap;
		return newObj;
	}
	else if(shouldBeArray(obj)) {
		var oldMap = obj[objName];
		var objMap = {};
		
		for (var key in oldMap) {
			objMap[key] = [];
			for(var id in oldMap[key]) {
				objMap[key][id - 1] = oldMap[key][id];
			}
		}
		
		var newObj = {};
		newObj[objName] = objMap;
		return newObj;
	} else
		return obj;
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
	content = content.replace(/(LAN.\w+.\w+)/g, function ($0, $1){
		var str = $1;
		//console.log(str);
		str = `"${lang[str]}"`;
		str = encodeQuote(str);
		//console.log($1, str);
		return str;
	} );
	//return;
	//console.log(content);
	//var exportFile1 = 'out_test/' + countExport + '.lua';
	//mkdirs(path.dirname(exportFile1));
	//fs.writeFileSync(exportFile1, content, 'utf-8');
	
	var obj = lua2json.parse(`return {${content}}`);
	obj = runCompact(obj);
	
	var outStr = JSON.stringify(obj);
	countExport++;
	var exportFile = outDir + '/' + countExport + '.json';
	console.log(fileDir, '->', exportFile);
	mkdirs(path.dirname(exportFile));
	fs.writeFileSync(exportFile, outStr, 'utf-8');
}

function handleLanguage(fileDir) {
	console.log('lang:' + fileDir);
	var content = fs.readFileSync(fileDir, 'utf8');
	//console.log(content);
	var obj = lua2json.parse(`return {${content}}`);
	//console.log(obj);
	for (var key in obj) {
		//console.log(key);
		for (var key2 in obj[key]) {
			lang[`LAN.${key}.${key2}`] = obj[key][key2].replace(/\n/g, '\\n');
		}
	}
	//console.log(Object.keys(lang).length);
}

function handleDir(filePath, callback, except){
    //根据文件路径读取文件，返回文件列表
    var files = fs.readdirSync(filePath);
	//遍历读取到的文件列表
	files.forEach(function(filename){
		if(except != undefined && filename.includes(except))
			return;
		//获取当前文件的绝对路径
		var filedir = path.join(filePath,filename);
		//根据文件路径获取文件信息，返回一个fs.Stats对象
		var stats = fs.statSync(filedir);
		var isFile = stats.isFile();//是文件
		var isDir = stats.isDirectory();//是文件夹
		if(isFile){
			//console.log(filedir);
			callback(filedir);
		}
		if(isDir){
			handleDir(filedir, callback, except);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
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

console.log('importing language');
handleDir(`${srcDir}/language/lang`, handleLanguage);
console.log('imported language item:', Object.keys(lang).length);

handleDir(srcDir, handleFile, 'language');

