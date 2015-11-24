var fs = require('fs');
var async = require('async');

function replaceExt(file, ext, newExt) {
	var rx = new RegExp(ext + '$');
	var newFile = file.replace(rx, newExt);
	if (file == newFile) throw new Error('Extension du fichier ' + file + ' non remplacée');
	return newFile;
}

var file = process.argv.length > 2 ? process.argv[2] : __dirname + '/resources/Bee In My Bee.json';
fs.readFile(file, function(err, data) {
	if (err) throw err;
	
	var json = JSON.parse(data);
	
	//var clipSlot = json.Ableton.LiveSet[0].Tracks[0].AudioTrack[0].DeviceChain[0].MainSequencer[0].ClipSlotList[0].ClipSlot[0].ClipSlot[0];
	var mainSequencer = json.Ableton.LiveSet[0].Tracks[0].AudioTrack[0].DeviceChain[0].MainSequencer[0];
	var events = mainSequencer.Sample[0].ArrangerAutomation[0].Events[0];
	
	var audioClips = events.AudioClip;
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
			var outFile = replaceExt(file, '.json', ext);
			fs.writeFile(outFile, JSON.stringify(object), cb);
		};
	}
	
	var tasks = {
		audioClips: writeFn(audioClips, '.small.audioClips.json'),
		warpMarkers: writeFn(warpMarkers, '.warpMarkers.json')
	};
	
	async.parallel(tasks, function(err, results) {
		if (err) throw err;

		console.log('Fichiers générés');
	});
	
});