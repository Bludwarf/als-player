/*globals describe, it */
var assert = require('assert');
/*var async = require('async');
var deasync = require('deasync');
var utils = require('../lib/utils.js');*/
var als = require('../lib/als.js');

var res = __dirname + '/../resources';

/*var voyageJsonParts = als.loadJsonParts({
    audioClips:  res + "/Voyage-20151217.small.audioClips.json",
    midiClips:   res + "/Voyage-20151217.midiClips.json",
    warpMarkers: res + "/Voyage-20151217.warpMarkers.json"
});*/

// TODO : charger les JSON puis lancer les tests

describe('als', function() {

    describe('#toMBX()', function() {

        it('should get measure and beats', function() {
            assert.equal(als.toMBX(0), '1.1.1');
            assert.equal(als.toMBX(1), '1.2.1');
            assert.equal(als.toMBX(2), '1.3.1');
            assert.equal(als.toMBX(3), '1.4.1');
            assert.equal(als.toMBX(4), '2.1.1');
        });

        it('should get sixteenth', function() {
            assert.equal(als.toMBX(0),    '1.1.1');
            assert.equal(als.toMBX(0.25), '1.1.2');
            assert.equal(als.toMBX(0.5),  '1.1.3');
            assert.equal(als.toMBX(0.75), '1.1.4');
            assert.equal(als.toMBX(1),    '1.2.1');
            assert.equal(als.toMBX(1.5),  '1.2.3');
        });

    });

});

describe('LiveSet', function() {

    describe('#constructor()', function () {

        it('empty', function () {
            var liveSet = new als.LiveSet("Empty");
            assert.notEqual(liveSet, null);
        });

        it('load with JSON files', function () {
            var liveSet = new als.LiveSet("Voyage-20151217", res + "/Voyage-20151217.*.json");
            assert.notEqual(liveSet, null);
        });
    });

    describe('#patterns', function () {

        it('Voyage', function () {
            var liveSet = new als.LiveSet("Voyage-20151217", res + "/Voyage-20151217.*.json");
            assert.notEqual(liveSet.patterns, null);
            assert.equal(liveSet.patterns.length, 27);
            assert.notEqual(liveSet.patterns[0], null);
            assert.notEqual(liveSet.patterns[liveSet.patterns.length - 1], null);
        });
    });

    describe('#patternAt', function () {

        it('Mini Refrain', function () {
            var liveSet = new als.LiveSet("Voyage-20151217", res + "/Voyage-20151217.*.json");
            var pattern = liveSet.patternAt(96); // 80 en relatif mais 96 en absolu on trouve le début de "Mini Refrain"
            assert.equal(pattern.name, "Mini Refrain");

            // idem en 96.1 jusqu'à 99.9
            assert.equal(liveSet.patternAt(96.1), pattern);
            assert.equal(liveSet.patternAt(97), pattern);
            assert.equal(liveSet.patternAt(98), pattern);
            assert.equal(liveSet.patternAt(99), pattern);
            assert.equal(liveSet.patternAt(99.9), pattern);

            // juste avant : "Couplet" et après
            assert.equal(liveSet.patternAt(95).name, "Couplet");
            assert.equal(liveSet.patternAt(108).name, "Couplet");

            // TODO : tester répétition => même nom mais objet différent

            // Renvoyait une erreur
            assert.notEqual(liveSet.patternAt(512), null);
        });
    });

    describe('#indexOfWarpMarkerAt', function () {

        /*
         Le 1 de l'AudioClip commence au beat 16

         <AudioClip Time="14.268227345571095">
         <LoopStart Value="-1.7317726544289045" />

         <WarpMarker SecTime="0" BeatTime="-1.7317726544289045" />
         <WarpMarker SecTime="1.4676190476190476" BeatTime="0" />
         <WarpMarker SecTime="4.9623129251700684" BeatTime="4" />
         */

        it('should get 2nd WarpMarker', function () {
            var liveSet = new als.LiveSet("Voyage-20151217", res + "/Voyage-20151217.*.json");
            var i = liveSet.indexOfWarpMarkerAt(16); // <WarpMarker SecTime="1.4676190476190476" BeatTime="0" />
            assert.equal(i, 1);
        });
    });

    describe('#secTime', function () {

        /*
         Le 1 de l'AudioClip commence au beat 16

         <AudioClip Time="14.268227345571095">
         <LoopStart Value="-1.7317726544289045" />

         <WarpMarker SecTime="0" BeatTime="-1.7317726544289045" />
         <WarpMarker SecTime="1.4676190476190476" BeatTime="0" />
         <WarpMarker SecTime="4.9623129251700684" BeatTime="4" />
         */

        it('correct AudioClip offset', function () {
            var liveSet = new als.LiveSet("Voyage-20151217", res + "/Voyage-20151217.*.json");
            assert.equal(liveSet.secTime(16), 1.4676190476190476); // <WarpMarker SecTime="1.4676190476190476" BeatTime="0" />
        });
    });

    describe('#locators', function () {

        it('should get the only one locator', function () {
            var liveSet = new als.LiveSet("Voyage-20151217", res + "/Voyage-20151217.*.json");
            assert.notEqual(liveSet.locators, null);
            assert.equal(liveSet.locators.length, 1);
            var locator = liveSet.locators[0];
            assert.equal(locator.name, "Tchouchou");
        });
    });

    describe('#locators', function () {

        it('should get the only one locator', function () {
            var liveSet = new als.LiveSet("Voyage-20151217", res + "/Voyage-20151217.*.json");
            var locator = liveSet.locatorAt(16);
            assert.equal(locator, liveSet.locators[0]);
        });
    });

});

describe('Pattern', function() {

    var liveSet = new als.LiveSet("Voyage-20151217", res + "/Voyage-20151217.*.json");
    var patterns = liveSet.patterns;
    var first = patterns[0];
    var second = patterns[1];
    var prevLast = patterns[patterns.length - 2];
    var last = patterns[patterns.length - 1];

    describe('#name', function () {

        it('should be good', function () {
            assert.equal(first.name, "Couplet");
            assert.equal(last.name, "Couplet mineur");
        });

    });

    describe('#currentStart', function () {

        it('should be good', function () {
            assert.equal(first.currentStart, 16);
            assert.equal(last.currentStart, 524);
        });

    });

    describe('#beatTime', function () {

        it('should equals currentStart', function () {
            assert.equal(first.beatTime, first.currentStart);
            assert.equal(last.beatTime, last.currentStart);
        });

    });

    describe('#currentEnd', function () {

        it('should be good', function () {
            assert.equal(first.currentEnd, 32);
            assert.equal(last.currentEnd, 536);
        });

    });

    describe('#beatDuration', function () {

        it('should be good', function () {
            assert.equal(first.beatDuration, 16);
            assert.equal(last.beatDuration, 12);
        });

    });

    describe('#colorIndex', function () {

        it('should be good', function () {
            assert.equal(first.colorIndex, 16);
            assert.equal(last.colorIndex, 4);
        });

    });

    describe('#next', function () {

        it('should be good', function () {
            assert.equal(first.next, second);
            assert.equal(prevLast.next, last);
            assert.equal(last.next, null);
        });

    });

    describe('#next', function () {

        it('should be good', function () {
            assert.equal(first.prev, null);
            assert.equal(second.prev, first);
            assert.equal(last.prev, prevLast);
        });

    });

    describe('#tempo', function () {

        it('should be good when exact fit with WarpMarkers', function () {
            assert.equal(first.tempo.toFixed(8), 68.45213072);
        });

        it('should be good when starts between WarpMarkers ', function () {
            console.log("end:"+prevLast.currentEnd);
            assert.equal(prevLast.tempo.toFixed(8), 69.43856714);
        });

    });

    describe('#measures', function () {

        it('should be good', function () {
            assert.notEqual(first.measures, null);
            assert.equal(first.measures.length, 4);
            assert.notEqual(last.measures, null);
            assert.equal(last.measures.length, 3);
        });

    });

});

describe('Locator', function() {

    var liveSet = new als.LiveSet("Voyage-20151217", res + "/Voyage-20151217.*.json");
    var locators = liveSet.locators;
    var first = locators[0];

    describe('#time', function() {

        it('should be good', function() {
            assert.equal(first.time, 16);
        });

    });

});
