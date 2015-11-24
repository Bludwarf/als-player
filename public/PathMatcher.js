/**
 * Created by mlavigne on 23/11/2015.
 */

function PathMatcher(mappings) {
    this.mappings = mappings;
    // TODO : à mettre dans les fils automatiquement
    this.sep = '\\'; // par défaut séparateur Windows
}

PathMatcher.prototype.replace = function(macPath) {
    var origMacPath = macPath;
    for (var i = 0; i < this.mappings.length; ++i) {
        var mapping = this.mappings[i];
        if (mapping.match(macPath)) {
            return mapping.replace(macPath);
        } // remplacement des séparateurs
    }
    throw new Error('Aucune correspondance pour le chemin ' + origMacPath);
};

function PathMatching(macPath, path) {
    this.macPath = macPath;
    this.path = path;
    this.sep = '\\'; // par défaut séparateur Windows
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
