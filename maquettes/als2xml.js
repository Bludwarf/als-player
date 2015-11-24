var fs = require('fs');
//var unzip = require('unzip'); // 0.1.11
var zlib = require('zlib');

//var xml = "<root><a attribute=\"value\">avalue</a><b>bvalue</b></root>"

function replaceExt(file, ext, newExt) {
	var rx = new RegExp(ext + '$');
	var newFile = file.replace(rx, newExt);
	if (file == newFile) throw new Error('Extension du fichier ' + file + ' non remplacée');
	return newFile;
}

var file = process.argv.length > 2 ? process.argv[2] : __dirname + '/resources/Bee In My Bee.als';

var buffer = fs.readFile(file, function(err, data) {
	if (err) throw err;
	zlib.gunzip(data, function(err, data) {
		if (err) throw err;
		
		var xmlFile = replaceExt(file, '.als', '.xml');
		fs.writeFile(xmlFile, data, function(err) {
			if (err) throw err;
			console.log('Fichier XML créé avec succès : %s', xmlFile);
		});
	});
});


// unzip
/*fs.createReadStream(file)
  .pipe(unzip.Parse())
  .on('entry', function (entry) {
    var fileName = entry.path;
    var type = entry.type; // 'Directory' or 'File'
    var size = entry.size;
    if (fileName === "this IS the file I'm looking for") {
      entry.pipe(fs.createWriteStream('output/path'));
    } else {
      entry.autodrain();
    }
  });*/