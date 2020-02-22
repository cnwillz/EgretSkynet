// require modules
var fs = require('fs');
var archiver = require('archiver');
var path = require('path');

var options = process.argv;
if(options.length < 4)
{
	console.log("需要2个参数(src out)");
	process.exit();
}

var srcDir = options[2];
var outFile = options[3];
 
// create a file to stream archive data to.
var output = fs.createWriteStream(__dirname + '/' + outFile);
var archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});
 
// listen for all archive data to be written
// 'close' event is fired only when a file descriptor is involved
output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('archiver has been finalized and the output file descriptor has closed.');
});
 
// This event is fired when the data source is drained no matter what was the data source.
// It is not part of this library but rather from the NodeJS Stream API.
// @see: https://nodejs.org/api/stream.html#stream_event_end
output.on('end', function() {
  console.log('Data has been drained');
});
 
// good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    // log warning
  } else {
    // throw error
    throw err;
  }
});
 
// good practice to catch this error explicitly
archive.on('error', function(err) {
  throw err;
});
 
// pipe archive data to the file
archive.pipe(output);
 

// append files from a glob pattern
//archive.glob(srcDir+'/*.json');

function handleFile(fileDir, filename) {
	archive.file(fileDir, { name: filename });
}

function handleDir(filePath) {
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
		if(isFile && filedir.endsWith(".json")){
			//console.log(filedir);
			handleFile(filedir, filename);
		}
	});
}
 
handleDir(srcDir);
// finalize the archive (ie we are done appending files but streams have to finish yet)
// 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
archive.finalize();
