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

	var liveSet = new als.LiveSet('Voyage-20151217');
	liveSet.loadLocalJsonParts();

	// Pattern Refrain 1
	var section = liveSet.patterns[10];

	// Bouchon pour les chords
	section.measures[0].chord = 'A';
	section.measures[1].chord = 'B';
	section.measures[2].chord = 'D';
	section.measures[3].chord = 'A';
	section.measures[4].chord = 'A';
	section.measures[5].chord = 'E';
	section.measures[6].chord = 'G';
	section.measures[7].chord = 'D';
	section.measures[8].chord = 'C';
	section.measures[9].chord = 'G';
	section.measures[10].chord = 'A';
	section.measures[11].chord = 'A';

	$scope.liveSet = liveSet;

}]);
