var yargs = require('yargs');
var excelbuilder = require('msexcel-builder-colorfix-intfix');

var als = require('../lib/als-module');

var dir = '../resources/Excel/';

var argv = {
    file: '../resources/Voyage-20151217.warpMarkers.json'
};

var liveSet = new als.LiveSet("Voyage-20151217", __dirname + "/../resources/Voyage-20151217.*.json");

als.WarpMarkers.load(argv.file, function(err, warpMarkers) {
    if (err) throw err;

    // Create a new workbook file in current working-path
    var workbook = excelbuilder.createWorkbook(dir, 'sample.xlsx');

    // Create a new worksheet with 10 columns and 12 rows
    var sheet1 = workbook.createSheet('sheet1', 10, warpMarkers.length + 1);

    // Fill some data
    /*
     sheet1.set(1, 1, 'I am title');
     for (var i = 2; i < 5; i++)
     sheet1.set(i, 1, 'test'+i);
     */

    // Titres
    sheet1.set(1, 1, "BeatTime");
    sheet1.set(2, 1, "SecTime");
    sheet1.set(3, 1, "BeatDuration");
    sheet1.set(4, 1, "Tempo");
    sheet1.set(5, 1, "Accélération");
    sheet1.set(6, 1, "Pattern");
    sheet1.set(7, 1, "BeatTime"); // BeatTime dans le Pattern

    // Test Excel
    var i0 = 2;
    var i = i0;
    var iSection = 0;
    warpMarkers.forEach(function(m) {

        // On ne prend pas en compte avant le 1er beat
        if (m.beatTime < 0) return;

        var absBeatTime = m.beatTime + liveSet.currentStart;

        sheet1.set(1, i, absBeatTime ? absBeatTime : "0"); // TODO msexcel-fix : les 0 sont stockés comme cellule vide
        sheet1.set(2, i, m.secTime);
        if (m.next) {
            sheet1.set(3, i, m.beatDuration);
            sheet1.set(4, i, m.tempo);
            if (i > i0) sheet1.set(5, i, m.acceleration);

            // Pattern
            console.log(absBeatTime);
            var section = liveSet.patternAt(absBeatTime);
            if (section) {
                sheet1.set(6, i, section.name ? section.name : '?');
                sheet1.set(7, i, absBeatTime - section.beatTime);
            }
        }

        ++i;
    });

    // Save it
    workbook.save(function(err){
        if (err)
            throw err;
        else
            console.log('congratulations, your workbook created');
    });
});