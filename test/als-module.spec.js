/*globals describe, it */
var assert = require('assert');
/*var async = require('async');
var deasync = require('deasync');
var utils = require('../lib/utils.js');*/
var als = require('../lib/als-module.js');

var res = __dirname + '/../resources';

/*var voyageJsonParts = als.loadJsonParts({
    audioClips:  res + "/Voyage-20151217.small.audioClips.json",
    midiClips:   res + "/Voyage-20151217.midiClips.json",
    warpMarkers: res + "/Voyage-20151217.warpMarkers.json"
});*/
var voyageJsonParts = als.loadJsonParts(res + "/Voyage-20151217.*.json");

// TODO : charger les JSON puis lancer les tests

describe('LiveSet', function() {

    describe('#constructor()', function () {

        it('empty', function () {
            var liveSet = new als.LiveSet("Empty");
            assert.notEqual(liveSet, null);
        });

        it('init with JSON files', function () {
            var liveSet = new als.LiveSet("Voyage-20151217", voyageJsonParts);
            assert.notEqual(liveSet, null);
        });
    });

    describe('#sections', function () {

        it('Voyage', function () {
            var liveSet = new als.LiveSet("Voyage-20151217", voyageJsonParts);
            assert.notEqual(liveSet.sections, null);
            assert.equal(liveSet.sections.length, 27);
            assert.notEqual(liveSet.sections[0], null);
            assert.notEqual(liveSet.sections[liveSet.sections.length - 1], null);
        });
    });

});

describe('Section', function() {

    var liveSet = new als.LiveSet("Voyage-20151217", voyageJsonParts);
    var sections = liveSet.sections;
    var first = sections[0];
    var second = sections[1];
    var prevLast = sections[sections.length - 2];
    var last = sections[sections.length - 1];

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

    describe('#measures', function () {

        it('should be good', function () {
            assert.notEqual(first.measures, null);
            assert.equal(first.measures.length, 4);
            assert.notEqual(last.measures, null);
            assert.equal(last.measures.length, 3);
        });

    });

});