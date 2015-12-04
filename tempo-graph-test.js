var mongodb =  require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID; // https://azure.microsoft.com/fr-fr/blog/exposing-mongodb-collections-on-the-node-js-backend/

//var url = 'mongodb://localhost:27017/myproject';
getSet("566004676f47d66efe5fffc5", function(err, json) {
	if (err) throw err;
	
	getData(json, function(err, data) {
		if (err) throw err;
		
		var api = {
			username: 'Bludwarf',
			api_key : 'r2410fgm1d'
		};
		var plotly = require('plotly')(api.username, api.api_key); // 1.0.5
	
		var graphOptions = {filename: "All I Want 20151119", fileopt: "overwrite"};
		plotly.plot(data, graphOptions, function (err, msg) {
			console.log(msg);
		});
	});
});

function getSet(id, cb) {
	//var url = 'mongodb://localhost:27017/myproject';
	var url = 'mongodb://localhost:27017/als';

	// Use connect method to connect to the Server 
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		
		// Get the documents collection
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

function getData(json, cb) {

	var firstAudioTrack = json.Ableton.LiveSet[0].Tracks[0].AudioTrack[0];
	var mainSequencer = firstAudioTrack.DeviceChain[0].MainSequencer[0];
	var events = mainSequencer.Sample[0].ArrangerAutomation[0].Events[0];

	var audioClips = events.AudioClip;
	if (!audioClips) throw new Error('JSON incorrect');

	// On garde que les WarpMarkers du premier AudioClip dans un fichier séparé
	var warpMarkers = audioClips[0].WarpMarkers[0].WarpMarker;


	// Calcul du tempo moyen et instantané
	var data = [
	  {
		x: [], //["2013-10-04 22:23:00", "2013-11-04 22:23:00", "2013-12-04 22:23:00"],
		y: [], //[1, 3, 6],
		type: "scatter"
	  }
	];
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
			console.log('%s: %s', i, tempo);
			
			// Tempo moyen (pondéré par le BeatTime)
			tempoMoyen += tempo * dBeatTime;
			beatTime   += dBeatTime;
			
			// data
			data[0].x.push(m.$.BeatTime);
			data[0].y.push(tempo);
		}

		// Tempo moyen (pondéré)
		tempoMoyen = tempoMoyen / beatTime;
		warpMarkers.tempo = tempoMoyen;
		console.log('Tempo moyen: %s', tempoMoyen);
		
	}
	
	cb(null, data);

}