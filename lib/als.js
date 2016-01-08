var fs = require('fs');
var zlib = require('zlib');
var parseString = require('xml2js').parseString; // 0.4.15
var async = require('async'); // 1.5.0

var utils = require('./utils');

// Surcharge tout le als-client
var als = require('./als-module');
for (var i in als) {
	exports[i] = als[i];
}



// Ajout des méthodes load

/**
 * Set Live à partir de fragments JSON du fichier .als d'origine converti par als-player/lib/als.js
 * @param jsonParts {{audioClips, midiClips, warpMarkers}} (cf als.split) ou syntaxe '.../MonFichier.*.json' pour chercher automatiquement tous les fichiers
 */
als.LiveSet.prototype.loadJsonParts = function(jsonParts) {
	// Syntax '.../Voyage-20151217.*.json' ?
	if (typeof jsonParts === 'string' && jsonParts.indexOf('*') != -1) {
		var jsonFiles = jsonParts;
		jsonParts = loadJsonParts(jsonFiles);
	}

	this.audioClips = jsonParts.audioClips;
	this.midiClips = jsonParts.midiClips;
	this.warpMarkers = new als.WarpMarkers(jsonParts.warpMarkers);
	this.locators = this.initElements(jsonParts.locators, function(json) {
		return new als.Locator(json);
	});
};

/**
 * Charge un fichier *.warpMarkers.json
 * @param file fichier JSON converti de XML vers JSON par als.js#xml2json() (via zlib et xml2js 0.4.15) à partir d'un fichier *.als
 * @param cb 2e arg = WarpMarkers
 */
//als.WarpMarkers.load = function(file:string, cb?: (err : Error, warpMarkers ?: WarpMarkers) => void) {
als.WarpMarkers.load = function(file, cb) {
	utils.readJsonFile(file, function (err, json) {
		if (err) return cb(err);
		if (json) return cb(null, new als.WarpMarkers(json));
		return cb(new Error("Aucun WarpMarkers chargés depuis " + file));
	});
};

/**
 * Charge un fichier *.warpMarkers.json
 * @param file fichier JSON converti de XML vers JSON par als.js#xml2json() (via zlib et xml2js 0.4.15) à partir d'un fichier *.als
 * @param cb
 */
//public static load(file:string, cb:Function) {
als.WarpMarker.load = function(file, cb) {
	utils.readJsonFile(file, function (err, warpMarkers) {
		if (err) throw err;
		if (warpMarkers) return cb(null, warpMarkers);
		throw new Error("Aucun warpMarkers chargés depuis " + file);
	});
};

var jsonStringify = {
	//replace: null,
	//space: 4 // si activé peut multiplier la taille du fichier JSON par 10 !
};

function replaceExt(file, ext, newExt) {
	var rx = new RegExp(ext + '$');
	var newFile = file.replace(rx, newExt);
	if (file == newFile) throw new Error('Extension du fichier ' + file + ' non remplacée');
	return newFile;
}



/**
 * Charge plusieurs fichiers JSON et renvoie le résultat de manière synchrone.
 *
 * Exemple :
 *
 * var voyageJsonParts = als.loadJsonParts({
            audioClips:  dir + "/Voyage-20151217.small.audioClips.json",
            midiClips:   dir + "/Voyage-20151217.midiClips.json",
            warpMarkers: dir + "/Voyage-20151217.warpMarkers.json"
        });

 Exemple avec syntaxe en motif :

 var voyageJsonParts = als.loadJsonParts(dir + "/Voyage-20151217.*.json");

 *
 * @param jsonFiles {{audioClips, midiClips, warpMarkers}} cf als.split ou syntaxe '.../MonFichier.*.json' pour chercher automatiquement tous les fichiers
 * @returns {{audioClips, midiClips, warpMarkers}}
 */
function loadJsonParts(jsonFiles) {

	// Syntax '.../Voyage-20151217.*.json' ?
	if (typeof jsonFiles === 'string' && jsonFiles.indexOf('*') != -1) {
		var partNames = [
			'audioClips',
			'midiClips',
			'warpMarkers',
			'locators'
		];
		var partFilenames = {
			audioClips:  "small.audioClips",
			midiClips:   "midiClips",
			warpMarkers: "warpMarkers",
			locators: "locators"
		};
		var pattern = jsonFiles;
		jsonFiles = {};
		partNames.forEach(function(partName) {
			jsonFiles[partName] = pattern.replace('*', partFilenames[partName]);
		});
	}

	// tasks
	var jsonParts;
	var tasks = {};

	for (var partName in jsonFiles) {
		(function(partName) {
			var file = jsonFiles[partName];
			if (fs.existsSync(file)) {
				tasks[partName] = function (cb) {
					utils.readJsonFile(file, cb);
				}
			}
			else {
				console.warn("On ne peut pas charger le fichier "+file+" car il n'existe pas");
			}
		})(partName);
	}

	// Async
	async.parallel(tasks,
		function(err, results) {
			if (err) throw err;
			jsonParts = results;
		});

	// Wait with deasync
	while(jsonParts === undefined) {
		require('deasync').runLoopOnce();
	}

	return jsonParts;
}

//var file = process.argv.length > 2 ? process.argv[2] : __dirname + '/resources/Bee In My Beer.als';

/**
 * Contenu XML
 * @param file
 * @param cb
 */
function readAls(file, cb) {
	return fs.readFile(file, function(err, data) {
		if (err) return cb(err);
		zlib.gunzip(data, cb);
	});
}

/**
 * Récup le contenu du fichier ALS (en XML) au format xml2js
 * @param file
 * @param cb
 */
module.exports.readFile = function(file, cb) {

	// TODO : tout faire

};

/**
 *
 */
module.exports.als2xml = function(file, cb) {

	readAls(file, function(err, data) {
		if (err) {
			cb(err);
			return;
		}

		var xmlFile = replaceExt(file, '.als', '.xml');
		fs.writeFile(xmlFile, data, function(err) {
			if (err) throw err;
			console.log('Fichier XML créé avec succès : %s', xmlFile);
			if (cb) cb(null, xmlFile);
		});
	});

};

/**
 *
 */
module.exports.xml2json = function(file, cb) {

	return fs.readFile(file, function(err, data) {
		if (err) throw err;
		
		parseString(data, function (err, object) {
			if (err) throw err;
			
			var jsonFile = replaceExt(file, '.xml', '.json');
			fs.writeFile(jsonFile, JSON.stringify(object, jsonStringify.replace, jsonStringify.space), function(err) {
				if (err) throw err;
				console.log('Fichier JSON créé avec succès : %s', jsonFile);
				if (cb) cb(null, jsonFile);
			});
		});
	});
	
};

/**
 *
 */
module.exports.split = function(file, cb) {

	return fs.readFile(file, function(err, data) {
		if (err) throw err;
		
		var json = JSON.parse(data);
		
		//var clipSlot = json.Ableton.LiveSet[0].Tracks[0].AudioTrack[0].DeviceChain[0].MainSequencer[0].ClipSlotList[0].ClipSlot[0].ClipSlot[0];
		var firstAudioTrack = json.Ableton.LiveSet[0].Tracks[0].AudioTrack[0];
		var mainSequencer = firstAudioTrack.DeviceChain[0].MainSequencer[0];
		var events = mainSequencer.Sample[0].ArrangerAutomation[0].Events[0];
		
		var audioClips = events.AudioClip;
		if (!audioClips) throw new Error('JSON incorrect');
		
		// On garde que les WarpMarkers du premier AudioClip dans un fichier séparé
		var warpMarkers = audioClips[0].WarpMarkers[0].WarpMarker;
		
		// On supprime tous les WarpMarkers (gain de place)
		audioClips.forEach(function(audioClip) {
			audioClip.WarpMarkers = null;
			audioClip.Onsets = null;
		});
		
		// Sauvegarde des résultats
		
		function writeFn(object, ext) {
			return function(cb) {
				var outFile = replaceExt(file, '.json', ext);
				fs.writeFile(outFile, JSON.stringify(object, jsonStringify.replace, jsonStringify.space), cb);
			};
		}
		
		var tasks = {
			audioClips: writeFn(audioClips, '.small.audioClips.json'),
			warpMarkers: writeFn(warpMarkers, '.warpMarkers.json'),
		};
		
		// Dans certains projets on utilise la première piste midi pour indiquer la structure et éviter de découper le clip Audio (gain de place énorme)
		var firstMidiTrack = json.Ableton.LiveSet[0].Tracks[0].MidiTrack[0];
		if (firstMidiTrack) {
			mainSequencer = firstMidiTrack.DeviceChain[0].MainSequencer[0];
			events = mainSequencer.ClipTimeable[0].ArrangerAutomation[0].Events[0];
			var midiClips = events.MidiClip;
			if (midiClips) tasks.midiClips = writeFn(midiClips, '.midiClips.json');
		}

		// Locators (repères en ligne noire dans le Set live du genre "Couplet 1" ou "Solo 1")
		// XPath : /Ableton/LiveSet/Locators/Locators/Locator
		var locators = json.Ableton.LiveSet[0].Locators;
		locators = locators && locators[0];
		locators = locators && locators.Locators && locators.Locators[0] && locators.Locators[0].Locator;
		if (locators) {
			tasks.locators = writeFn(locators, '.locators.json');
		}

		async.parallel(tasks, function(err, results) {
			if (err) throw err;

			console.log('Fichiers générés');
			console.dir(results);
			if (cb) cb(null, results); // TODO : liste des fichiers générés
		});
		
	});
	
};