var fs = require('fs');
var async = require('async'); // 1.5.0

function replaceExt(file, ext, newExt) {
	var rx = new RegExp(ext + '$');
	return file.replace(rx, newExt);
}

var file = process.argv.length > 2 ? process.argv[2] : __dirname + '/resources/Bee In My Bee.events.json';
fs.readFile(file, function(err, data) {
	if (err) throw err;
	
	var json = JSON.parse(data);
	
	var audioClips = json.Events.AudioClip;
	if (!audioClips) throw new Error('JSON incorrect');
	
	
	// On garde que les WarpMarkers du premier AudioClip dans un fichier séparé
	var warpMarkers = audioClips[0].WarpMarkers;
	
	// On supprime tous les WarpMarkers (gain de place)
	audioClips.forEach(function(audioClip) {
		audioClip.WarpMarkers = null;
		audioClip.Onsets = null;
	});
	
	// Sauvegarde des résultats
	
	function writeFn(object, ext) {
		return function(cb) {
			var outFile = replaceExt(file, '.events.json', ext);
			fs.writeFile(outFile, JSON.stringify(object), cb);
		};
	}
	
	var tasks = {
		events: writeFn(json, '.small.events.json'),
		warpMarkers: writeFn(warpMarkers, '.warpMarkers.json')
	};
	
	async.parallel(tasks, function(err, results) {
		if (err) throw err;

		console.log('Fichiers générés');
	});
	
});