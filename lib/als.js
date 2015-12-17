var fs = require('fs');
var zlib = require('zlib');
var parseString = require('xml2js').parseString; // 0.4.15
var async = require('async'); // 1.5.0

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
			warpMarkers: writeFn(warpMarkers, '.warpMarkers.json')
		};
		
		
		
		// Dans certains projets on utilise la première piste midi pour indiquer la structure et éviter de découper le clip Audio (gain de place énorme)
		var firstMidiTrack = json.Ableton.LiveSet[0].Tracks[0].MidiTrack[0];
		if (firstMidiTrack) {
			mainSequencer = firstMidiTrack.DeviceChain[0].MainSequencer[0];
			events = mainSequencer.ClipTimeable[0].ArrangerAutomation[0].Events[0];
			var midiClips = events.MidiClip;
			if (midiClips) tasks.midiClips = writeFn(midiClips, '.midiClips.json');
		}
		
		async.parallel(tasks, function(err, results) {
			if (err) throw err;

			console.log('Fichiers générés');
			if (cb) cb(null, results); // TODO : liste des fichiers générés
		});
		
	});
	
};
