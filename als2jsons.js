var als = require('./lib/als');
var async = require('async');

var file = process.argv.length > 2 ? process.argv[2] : __dirname + '/resources/Bee In My Beer.als';

async.waterfall([
    function(cb) {
        als.als2xml(file, cb);
    },
    function(xmlFile, cb) {
        als.xml2json(xmlFile, cb);
    },
    function(jsonFile, cb) {
        als.split(jsonFile, cb);
    }
], function (err, result) {
    // result now equals 'done'
});