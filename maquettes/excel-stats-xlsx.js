/**
 * Created by mlavigne on 31/12/2015.
 */
var fs = require('fs');
var yargs = require('yargs');
var XLSX = require('xlsx');

var als = require('./lib/als-module');

var dir = './resources/Excel/';
var workbook = XLSX.readFile(dir + 'test.xlsx');

// Feuille 1
var first_sheet_name = workbook.SheetNames[0];
var worksheet = workbook.Sheets[first_sheet_name];

/* Find desired cell */
var desired_cell = worksheet['A1'];

/* Get the value */
var desired_value = desired_cell.v;

console.log(XLSX.utils.sheet_to_json(worksheet));

for (var c = 0; c < 3; ++c) {
    for (var r = 0; r < 4; ++r) {
        var cell_address = {r: r, c: c};
        var encoded_c_a  = XLSX.utils.encode_cell(cell_address);
        var cell = worksheet[encoded_c_a];
        if (!cell) {
            cell = {};
            worksheet[encoded_c_a] = cell;
        }
        cell.v = "x"+c+";y"+r;
    }
}

console.log(XLSX.utils.sheet_to_json(worksheet));

XLSX.writeFile(workbook, dir + 'out.xlsx');




var writeStream = fs.createWriteStream(dir + "simple.xls");

var header="Sl No"+"\t"+" Age"+"\t"+"Name"+"\n";
var row1 = "0"+"\t"+" 21"+"\t"+"Rob"+"\n";
var row2 = "1"+"\t"+" 22"+"\t"+"bob"+"\n";

writeStream.write(header);
writeStream.write(row1);
writeStream.write(row2);

writeStream.close();