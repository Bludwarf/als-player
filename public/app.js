'use strict';

var app = angular.module('app', [

]);

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

	// Ajout properties
	songs.forEach(function(song) {
		Object.defineProperty(song, 'audio', {
			get: function() {

				// Fichier local ?
				//if (this.dropbox) return lib.dropbox + this.dropbox;
				if (this.als) {
					var file = this.als.file;
					if (file) return file;
				}

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
				};

				// Measures
				for (var m = 0; m < section.measures.length; ++m) {
					var measure = section.measures[m];

					measure.play = function() {
						var measure = this;
						$("#audio").each(function() {
							var audio = this;
							audio.currentTime = measure.secTime;
							audio.play();
						});
					}
				}
			}
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
			var section = song.als.sectionAtSecTime(that.currentTime);

			if ($scope.currentSection != section) {
				$scope.currentSection = section;

				var event = new CustomEvent('section', {
					detail: section
				});
				//console.log(that.currentTime + "...");
				that.dispatchEvent(event);
			}

			if (section) {
				var measure = section.measureAt({secTime: that.currentTime});
				if ($scope.currentMeasure != measure) {
					$scope.currentMeasure = measure;

					// TODO : on active la mesure avec Angular

					var event = new CustomEvent('measure', {
						detail: measure
					});
					//console.log(measure.index);
					that.dispatchEvent(event);
				}
			}

			$scope.$apply(); // sinon la variable currentSection n'est pas rafraichie dans l'IHM
		};

		// Méthode 1 : timeupdate
		this.addEventListener('timeupdate', action);

		// Méthode 2 : interval
		setInterval(action, $scope.latency);

		this.addEventListener('section', function(event) {
			var section = event.detail; // ou $scope.currentSection
			//console.log(section);
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
