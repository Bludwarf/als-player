use als
var query = {
	byId: {_id: ObjectId("566004676f47d66efe5fffc5")}
};
var json = db.cafeine.find(query.byId)[0]; // #566004676f47d66efe5fffc5

// MongoDB ne semble pas conserver les variables modifiées

var firstAudioTrack = json.Ableton.LiveSet[0].Tracks[0].AudioTrack[0];
var mainSequencer = firstAudioTrack.DeviceChain[0].MainSequencer[0];
var events = mainSequencer.Sample[0].ArrangerAutomation[0].Events[0];

var audioClips = events.AudioClip;
if (!audioClips) throw new Error('JSON incorrect');

// On garde que les WarpMarkers du premier AudioClip dans un fichier séparé
var warpMarkers = audioClips[0].WarpMarkers[0].WarpMarker;


// Calcul du tempo moyen et instantané
if (!warpMarkers.tempo) {

	// On ignore le premier et le dernier marker
	var tempoMoyen = 0;
	var beatTime   = 0;
	for (var i = 1; i+1 < warpMarkers.length; ++i) {
		var m = warpMarkers[i];
		var next = warpMarkers[i+1];
		
		var dSecTime  = next.$.SecTime  - m.$.SecTime;
		var dBeatTime = next.$.BeatTime - m.$.BeatTime;
		var tempo     = dBeatTime / dSecTime * 60;
		
		m.tempo = tempo;
		print(i, tempo);
		
		// Tempo moyen (pondéré par le BeatTime)
		tempoMoyen += tempo * dBeatTime;
		beatTime   += dBeatTime;
	}

	// Tempo moyen (pondéré)
	warpMarkers.tempo = tempoMoyen / beatTime;
	
}

// Error: field names cannot start with $
// db.als.update(query.byId, json);
