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
	//section.measures[1].chord = 'B';
	//section.measures[2].chord = 'D';
	//section.measures[3].chord = 'A';
	//section.measures[4].chord = 'A';
	//section.measures[5].chord = 'E';
	//section.measures[6].chord = 'G';
	//section.measures[7].chord = 'D';
	//section.measures[8].chord = 'C';
	//section.measures[9].chord = 'G';
	//section.measures[10].chord = 'A';
	//section.measures[11].chord = 'A';

	$scope.liveSet = liveSet;
  
  // 25/01/2017
  var lines = [
    {
      sections: [
        liveSet.sections[0],
        liveSet.sections[1],
      ]
    },
    {
      sections: [
        liveSet.sections[2],
        liveSet.sections[3],
      ]
    },
    {
      sections: [
        liveSet.sections[4],
        liveSet.sections[5],
      ]
    },
    {
      sections: [
        liveSet.sections[6],
        liveSet.sections[7],
      ]
    },
    {
      sections: [
        liveSet.sections[8],
        liveSet.sections[9],
      ]
    },
    {
      sections: [
        liveSet.sections[10],
        liveSet.sections[11],
        liveSet.sections[12],
      ]
    }
  ];
  $scope.lines = lines;
  
  liveSet.sections.forEach(function(section) {
    Object.defineProperty(section, "measures", {
      get: function() {
        var measures = [];
        this.patterns.forEach(function(pattern) {
          console.log(pattern);
          measures = measures.concat(pattern.measures);
        });
        return measures;
      }
    });
  });
  
  lines.forEach(function(line) {
    Object.defineProperty(line, "measures", {
      get: function() {
        var measures = [];
        this.sections.forEach(function(section) {
          section.patterns.forEach(function(pattern) {
            measures = measures.concat(pattern.measures);
          });
        });
        return measures;
      }
    });
  });
  
  // Recherche la ligne la plus large (en nombre de mesures)
  var maxMeasuresPerLine = 0;
  var lineOfMaxMeasures = null;
  lines.forEach(function(line) {
    if (line.measures.length > maxMeasuresPerLine) {
      maxMeasuresPerLine = line.measures.length;
      lineOfMaxMeasures = line;
    }
  });
  console.log("lineOfMaxMeasures(length)", lineOfMaxMeasures, maxMeasuresPerLine);
  $scope.maxMeasuresPerLine = maxMeasuresPerLine;
  $scope.maxMeasureWidthInVw = 100/maxMeasuresPerLine;
  console.log("maxMeasureWidth", $scope.maxMeasureWidth);

}]);
