/**
 * Created by mlavigne on 30/12/2015.
 */
///<reference path='../typings/tsd.d.ts'/>
import fs = require("fs");

export function readJsonFile(file, cb : (err : Error, data? : any) => void) {
    return fs.readFile(file, function(err, data) {
        if (err) return cb(err);
        var warpMarkers = JSON.parse(data.toString());
        return cb(null, warpMarkers);
    });
}
