var fs = require('fs');
var parseString = require('xml2js').parseString; // 0.4.15

//var xml = "<root><a attribute=\"value\">avalue</a><b>bvalue</b></root>"

function getJsonFile(file) {
	return file.replace(/\.xml$/, '.json');
}

var file = process.argv.length > 2 ? process.argv[2] : __dirname + '/resources/Bee In My Bee.events.xml';
fs.readFile(file, function(err, data) {
	if (err) throw err;
	
	parseString(data, function (err, object) {
		if (err) throw err;
		
		var jsonFile = getJsonFile(file);
		fs.writeFile(jsonFile, JSON.stringify(object), function(err) {
			if (err) throw err;
			console.log('Fichier JSON créé avec succès : %s', jsonFile);
		});
	});
});