/**
 * Created by mlavigne on 23/11/2015.
 */

function PathMatcher(mappings) {
    this.mappings = mappings;
    // TODO : � mettre dans les fils automatiquement
    this.sep = '\\'; // par d�faut s�parateur Windows
}

PathMatcher.prototype.replace = function(macPath) {
    var origMacPath = macPath;
    for (var i = 0; i < this.mappings.length; ++i) {
        var mapping = this.mappings[i];
        if (mapping.match(macPath)) {
            return mapping.replace(macPath);
        } // remplacement des s�parateurs
    }
    throw new Error('Aucune correspondance pour le chemin ' + origMacPath);
};

function PathMatching(macPath, path) {
    this.macPath = macPath;
    this.path = path;
    this.sep = '\\'; // par d�faut s�parateur Windows
}

PathMatching.prototype.match = function(macPath) {
    if (macPath.lastIndexOf('/') != macPath.length - 1) macPath += '/'; // pour matcher le dossier en entier
    return macPath.indexOf(this.macPath) === 0;
};

PathMatching.prototype.replace = function(macPath) {
    return macPath
        .replace(this.macPath, this.path)
        .replace(/\//g, this.sep);
};
