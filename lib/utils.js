/**
 * Created by mlavigne on 30/12/2015.
 */
///<reference path='../typings/tsd.d.ts'/>
var fs = require("fs");
function readJsonFile(file, cb) {
    return fs.readFile(file, function (err, data) {
        if (err)
            return cb(err);
        var json = JSON.parse(data.toString());
        if (!json)
            return cb(new Error("Aucun JSON n'a été parsé après avoir lu le fichier " + file));
        return cb(null, json);
    });
}
exports.readJsonFile = readJsonFile;
//# sourceMappingURL=utils.js.map