var fs = require('fs');
var yargs = require('yargs');
var excelbuilder = require('msexcel-builder-colorfix-intfix');

var als = require('../lib/als-module');

var dir = '../resources/Excel/';

var argv = {
    file: '../resources/Voyage-20151217.warpMarkers.json'
};

var liveSet = new als.LiveSet("Voyage-20151217", __dirname + "/../resources/Voyage-20151217.*.json");

// Create a new workbook file in current working-path
var workbook = excelbuilder.createWorkbook(dir, 'sample-sections.xlsx');

// Create a new worksheet with 10 columns and 12 rows
var sheet1 = workbook.createSheet('sheet1', 10, liveSet.sections.length + 1);

// Fill some data
/*
 sheet1.set(1, 1, 'I am title');
 for (var i = 2; i < 5; i++)
 sheet1.set(i, 1, 'test'+i);
 */

// Titres
sheet1.set(1, 1, "BeatTime");
sheet1.set(2, 1, "WarpMarker");
sheet1.set(3, 1, "SecTime");
sheet1.set(4, 1, "BeatDuration");
sheet1.set(5, 1, "Tempo");
sheet1.set(6, 1, "Accélération");
sheet1.set(7, 1, "Section");

// Test Excel
var i0 = 2;
var i = i0;
var iSection = 0;
liveSet.sections.forEach(function(section) {

    // On ne prend pas en compte avant le 1er beat
    if (section.beatTime < 0) return;

    sheet1.set(1, i, section.beatTime); // TODO msexcel-fix : les 0 sont stockés comme cellule vide
    sheet1.set(2, i, section.beatTimeRelative);
    //sheet1.set(3, i, section.secTime);
    sheet1.set(4, i, section.beatDuration);
    sheet1.set(5, i, section.tempo);
    //if (i > i0) sheet1.set(6, i, section.acceleration);
    sheet1.set(7, i, section.name);

    ++i;
});

// Save it
workbook.save(function(err){
    if (err)
        throw err;
    else
        console.log('congratulations, your workbook created');
});