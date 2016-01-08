'use strict';

var app = angular.module('app', [
    
]);

var lib = {};

/** Dossier dropbox fini par un séparateur de dossier */
lib.dropbox = 'D:\\Dropbox\\';
if (navigator.userAgent.toLowerCase().indexOf('macintosh') != -1) {
	lib.dropbox = '/Users/bludwarf/Dropbox/';
}

lib.findSection = function(secTime, sections) {
	for (var i = sections.length - 1; i >= 0; --i) {
		var section = sections[i];
		if (secTime >= section.secTime) {
			return section;
		}
	}
	return sections[sections.length - 1];
};

// Directives pour les attributs
/*app.directive("myDirective", function () {
    return {
        restrict: "A",
        scope: {
            text: "@ngText"
        }
    };
});*/

// Filtre pour accepter les URL
// @author http://stackoverflow.com/a/31313621/1655155
app.filter("trustUrl", ['$sce', function ($sce) {
	return function (recordingUrl) {
		return $sce.trustAsResourceUrl(recordingUrl);
	};
}]);

/**
 * Created by MLAVIGNE on 13/11/2015.
 */
app.controller('ctrl', ['$scope', '$rootScope', function ($scope, $rootScope) {

	// TODO : CONFIG vars

	/** latence des traitements en ms */
	$scope.latency = 50;

	var songs = [
		{
			title: "L'horloge biologique",
			/*drive: {
				id: '0B2bkDQNfrAz8WGVINHdlTWVsRXM'
			},*/
			structure : {
				secDuration: 215,
				beatDuration: 544,
				sections: [
					{
						secTime: 0,
						beatTime: 0,
						color: 32,
						name: 'Intro'
					},
					{
						secTime: 25.7,
						beatTime: 64,
						color: 16,
						name: 'Couplet 1'
					},
					{
						secTime: 69,
						beatTime: 160,
						color: 16,
						name: 'Couplet 2'
					},
					{
						secTime: 101,
						beatTime: 240,
						color: 0,
						name: 'Solo 1'
					},
					{
						secTime: 132,
						beatTime: 336,
						color: 16,
						name: 'Couplet 3'
					},
					{
						secTime: 176,
						beatTime: 448,
						color: 0,
						name: 'Solo 2'
					}/*,
					{
						secTime: 215,
						beatTime: 560,
						color: 32,
						name: '(fin)'
					}*/
				]
			}
		},
		{
			title: "She don't care",
			drive: {
				id: '0B2bkDQNfrAz8dzlNV0NIZHNHWDA'
			}
		},
		{
			title: "Stop fantasy",
			drive: {
				id: '0B2bkDQNfrAz8Q2dsQVhIUmt5Tmc'
			}
		},
		{
			title: "All I want",
			drive: {
				id: '0B2bkDQNfrAz8WEw5c25kbm91NnM'
			}
		},
		{
			title: "Guess who's back",
			drive: {
				id: '0B2bkDQNfrAz8U1IyZjVpVU5XaG8'
			}
		},
		{
			title: "Downtown",
			drive: {
				id: '0B2bkDQNfrAz8YjB6bXZQVmhZTDQ'
			}
		},
		{
			title: "Voyage",
			drive: {
				id: '0B2bkDQNfrAz8S2o3UG8ta0g2VGc'
			},
			dropbox: 'Musiques\\Funk Pierre\\Répètes\\Voyage - 20151022.mp3',
			structure: {
				beatDuration: 544,
				sections: [
					{
						secTime: 0,
						beatTime: 0,
						color: 16,
						name: 'vert 1'
					},
					{
						secTime: 110.95315192743764,
						beatTime: 124,
						color: 37,
						name: 'jaune 1'
					},
					{
						secTime: 151.1668798,
						beatTime: 172,
						color: 16,
						name: 'vert 2'
					},
					{
						secTime: 208.64650793650793,
						beatTime: 240,
						color: 36,
						name: 'jaune 2'
					},
					{
						secTime: 215.25283446712018,
						beatTime: 248,
						color: 12,
						name: 'Solo'
					},
					{
						secTime: 266.67287981859408,
						beatTime: 312,
						color: 16,
						name: 'vert 3'
					},
					{
						secTime: 300.271644,
						beatTime: 352,
						color: 37,
						name: 'jaune 3'
					},
					{
						secTime: 340.1483175,
						beatTime: 400,
						color: 48,
						name: 'jaune 4'
					},
					{
						secTime: 345.104943310657,
						beatTime: 406,
						color: 16,
						name: 'vert 4'
					},
					{
						secTime: 415.73129251700681,
						beatTime: 494,
						color: 19,
						name: 'bleu'
					},
					{
						secTime: 442.3513379,
						beatTime: 526,
						color: 16,
						name: 'vert 5'
					}
				]
			},
			live: {
				warpMarkers: warpMarkers['Voyage']
			}
		},
		{
			title: "Nickie's boogie",
			drive: {
				id: '0B2bkDQNfrAz8a2RJU09CR0xMNnc'
			}
		},
		{
			title: "Prends moi la main (ou dans l'os)",
			drive: {
				id: '0B2bkDQNfrAz8QUhGYVQ3UXQzYm8'
			}
		}
	];

	// Ajout properties
	songs.forEach(function(song) {
		Object.defineProperty(song, 'audio', {
			get: function() {

				// Fichier local ?
				if (this.dropbox) return lib.dropbox + this.dropbox;

				// exemple https://docs.google.com/uc?export=open&id=0B2bkDQNfrAz8dzlNV0NIZHNHWDA
				// @author https://www.portalzine.de/dev/html5/hosting-mp3-files-on-google-drive-html5-audio-player/
				if (!this.drive || !this.drive.id) return null;
				return "https://docs.google.com/uc?export=open&id="+this.drive.id;
			}
		});

		// Ajout parent + next
		if (song.structure && song.structure.sections) {
			var sections = song.structure.sections;
			for (var i = 0; i < sections.length; ++i) {
				var section  = sections[i];

				Object.defineProperty(section, 'parent', {
					get: function() {
						return song.structure;
					}
				});

				(function (i) {
					Object.defineProperty(section, 'index', {
						get: function() {
							return i;
						}
					});
				})(i);

				Object.defineProperty(section, 'next', {
					get: function() {
						var parent = this.parent;
						if (!parent || !parent.patterns || this.index >= parent.patterns.length) return null;
						return parent.patterns[this.index + 1];
					}
				});

				Object.defineProperty(section, 'beatDuration', {
					get: function() {
						var next = this.next;
						return (next ? next.beatTime : song.structure.beatDuration) - this.beatTime;
					}
				});

				(function(measures) {
					Object.defineProperty(section, 'measures', {
						get: function() {
							if (!measures) {
								if (this.beatDuration % 4 != 0) console.warn('Nombre de battement non multiple de 4 pour la section %s', this.name);

								var n = Math.ceil(this.beatDuration / 4);
								console.log(this.beatDuration);
								measures = new Array(n);
								for (var i = 0; i < measures.length; ++i) {
									var ratio = i/n;
									measures[i] = {
										style : {
											left: (ratio * 100) + '%',
											width: (1 / n * 100) + '%'
										}
										//secTime: ratio *
									};
								}
							}
							return measures;
						}
					});
				})();

				Object.defineProperty(section, 'prettyLength', {
					get: function() {
						var n = this.measures.length;
						if (n % 4 === 0) return (n / 4);
						return this.measures.length + ' m';
					}
				});

				section.play = function() {
					var section = this;
					$("#audio").each(function() {
						var audio = this;
						// TODO : revenir 4 battements en arrière
						audio.currentTime = section.secTime;
						audio.play();
					});
				}
			}
		}

		// Ajout Live
		if (song.live) {
			song.live.secTime = function(beatTime) {

				var warpMarkerBefore, warpMarkerAfter;
				for (var i = 0; i < this.warpMarkers.length; ++i) {
					var warpMarker = this.warpMarkers[i];

					if (warpMarker._BeatTime < beatTime) continue;

					// BeatTime supérieur
					if (warpMarker._BeatTime > beatTime) {
						warpMarkerAfter = warpMarker;
						if (warpMarker._BeatTime === beatTime) {
							warpMarkerBefore = warpMarker;
						}
						else {
							if (i == 0) throw new Error('secTime('+beatTime+') impossible sur le premier WarpMarker');
							warpMarkerBefore = this.warpMarkers[i - 1];
						}
					}

					// BeatTime connu
					else {
						return parseFloat(warpMarker._SecTime);
					}

					break;
				}

				throw new Error('Not implemented');
			};

			console.log('sec = '+song.live.secTime(64));
		}
	});
	
    $scope.songs = songs;



	// Suivi dans la structure ////////////////////////

	var audio = $("#audio");
	audio.each(function() {
		var that = this;

		// Structure
		//var structure = structures[...];

		var action = function() {
			// Sortir si le that.currentTime n'a pas changé depuis la dernière fois
			if ($scope.currentTime === that.currentTime) return;
			$scope.currentTime = that.currentTime;

			var song = $scope.song;
			var structure = song.structure;
			if (!structure) return;

			//console.log('action');
			var section = lib.findSection(that.currentTime, structure.sections);

			if ($scope.currentSection != section) {
				$scope.currentSection = section;

				var event = new CustomEvent('section', {
					detail: section
				});
				console.log(that.currentTime + "...");
				that.dispatchEvent(event);
			}

			$scope.$apply(); // sinon la variable currentSection n'est pas rafraichie dans l'IHM
		};

		// Méthode 1 : timeupdate
		this.addEventListener('timeupdate', action);

		// Méthode 2 : interval
		setInterval(action, $scope.latency);

		this.addEventListener('section', function(event) {
			var section = event.detail; // ou $scope.currentSection
			console.log(section);
		});
	});



	
	/**
	 * Changement de la chanson en cours de lecture
	 */
	$scope.selectSong = function(song) {
		$scope.song = song;
		$scope.currentSection = null;
		var audio = $("#audio");
		audio.each(function() {
			this.setAttribute('src', song.audio);
			this.play();

			if (!song.structure) console.warn("La structure du morceau \"%s\" est inconnue.", song.title);
		});
	};
	
	// Chargement par défaut de la 1ère chanson
	$scope.selectSong(songs[0]);

}]);
