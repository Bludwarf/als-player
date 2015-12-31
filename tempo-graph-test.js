var fs = require('fs');
var yargs = require('yargs');
var mongodb =  require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID; // https://azure.microsoft.com/fr-fr/blog/exposing-mongodb-collections-on-the-node-js-backend/
var als = require('./lib/als-module');

var plotals = require('./lib/plotals');

var argv = require('yargs')
	.usage('Usage: *.warpMarkers.json [options]')
	.demand(1)
	.example('resources/Voyage.warpMarkers.json', 'Graphe pour Voyage')
	.option('n', {
		alias: 'name',
		nargs: 1,
		describe: 'Nom du morceau',
		default: 'Voyage'
	})
	.option('v', {
		alias: 'version',
		nargs: 1,
		describe: 'Version du morceau (aaaammjj)',
		default: '20151022'
	})

	.help('h')
	.alias('h', 'help')
	.epilog('copyright 2015')
	.argv;
argv.file = argv._[0];

//var url = 'mongodb://localhost:27017/myproject';
/*getSet("566004676f47d66efe5fffc5", function(err, json) {
	if (err) throw err;
	plotals.plot(json, function(err, msg) {
		console.log("Plotly terminé. Message : ");
		console.log(msg);
	});
});*/

als.WarpMarkers.load(argv.file, function(err, warpMarkers) {
	if (err) throw err;

	// Test Excel
	warpMarkers.forEach(function(m) {
		m.beatTime;
	});

	// Attendre le 01/01/2015 avant de retester
	return;
	plotals.plotWarpMarkers({
		name: argv.name,
		version: argv.version,
		warpMarkers: warpMarkers
	}, function(err, msg) {
		if (err) throw err;
		console.log("Plotly WarpMarkers terminé. Message : ");
		console.log(msg);
	})
});

// fichier en local
/*readWarpMarkersFile('./resources/Voyage.warpMarkers.json', function(err, warpMarkers) {
	if (err) throw err;
	plotals.plotWarpMarkers({
		name: "Voyage",
		version: "20151022",
		warpMarkers: warpMarkers
	}, function(err, msg) {
		console.log("Plotly WarpMarkers terminé. Message : ");
		console.log(msg);
	})
});*/

function getSet(id, cb) {
	//var url = 'mongodb://localhost:27017/myproject';
	var url = 'mongodb://localhost:27017/als'; // MONGO : use als

	// Use connect method to connect to the Server 
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		
		// Get the documents collection. MONGO : db.cafeine...
		var collection = db.collection('cafeine');

		var query = {
			byId: {_id: ObjectID(id)}
		};
		collection.find(query.byId).toArray(function(err, docs) {
			if (err) throw err;
			var doc = docs[0];
			
			cb(null, doc);
			db.close();
		});
	});
}

function readWarpMarkersFile(file, cb) {
	return fs.readFile(file, function(err, data) {
		if (err) return cb(err);
		var warpMarkers = JSON.parse(data);
		return cb(null, warpMarkers);
	});
}
