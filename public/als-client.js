/**
 * Created by mlavigne on 20/11/2015.
 *
 * @require underscore.js
 */

navigator.isMac = navigator.userAgent.toLowerCase().indexOf('macintosh') != -1;

var als = {};
window.als = als;

als.RELATIVE_PATH_ROOT = '/Users/bludwarf/Dropbox/Musiques/Funk Pierre/Sets Live';

/**
 *
 * @param pathMatcher {PathMatcher}
 */
als.setPathMatcher = function(pathMatcher) {
    this.pathMatcher = pathMatcher;
};

/**
 * Set Live à partir de fragments JSON du fichier .als d'origine converti par als-player/lib/als.js
 * @param name {String} nom unique du Set
 * @param jsonParts {{audioClips, midiClips, warpMarkers}} cf als.split
 * @constructor
 */
als.Set = function(name, jsonParts) {
    this.name = name;
    this.audioClips = jsonParts.audioClips;
    this.midiClips = jsonParts.midiClips;
    this.warpMarkers = jsonParts.warpMarkers;

    // Création des sections à partir des audioClips (ou des midiClips si présents)
    this.sections = [];
    var clips = this.midiClips || this.audioClips;
    for (var i = 0; i < clips.length; ++i) {
        var section = new als.Section(this, i);
        section.parent = this;
        section.index = i;
        this.sections.push(section);
    }
};

/**
 *
 * @param beatTime
 * @returns {*} le dernier marker si on a dépassé le dernier beat
 */
als.Set.prototype.indexOfWarpMarkerAt = function(beatTime) {
    for (var i = 0; i < this.warpMarkers.length - 1; ++i) { // jusqu'à l'avant dernier
        var warpMarker = this.warpMarkers[i];

        if (warpMarker.$.BeatTime < beatTime) continue;

        // BeatTime supérieur
        if (warpMarker.$.BeatTime > beatTime) {
            if (i == 0) throw new Error('warpMarkerAt('+beatTime+') impossible avant le premier WarpMarker');
            return i - 1;
        }

        // BeatTime connu
        else {
            return i;
        }
    }

    // On a dépassé le dernier beat
    return this.warpMarkers.length - 2;
};

als.Set.prototype.secTime = function(beatTime) {

    var i = this.indexOfWarpMarkerAt(beatTime);
    var warpMarkerBefore = this.warpMarkers[i];
    var secTime = parseFloat(warpMarkerBefore.$.SecTime);

    if (parseFloat(warpMarkerBefore.$.BeatTime) === beatTime) return secTime;

    // Interpolation
    var warpMarkerAfter = this.warpMarkers[i + 1];
    if (!warpMarkerBefore.beatValue) {
        var secDiff = warpMarkerAfter.$.SecTime - warpMarkerBefore.$.SecTime;
        var beatDiff = warpMarkerAfter.$.BeatTime - warpMarkerBefore.$.BeatTime;
        warpMarkerBefore.beatValue = secDiff / beatDiff;
    }
    return parseFloat(warpMarkerBefore.$.SecTime) + (beatTime - warpMarkerBefore.$.BeatTime) * warpMarkerBefore.beatValue;
};

Object.defineProperties(als.Set.prototype, {

    /**
     * @returns {Number} Diff entre le début de la 1ère section et la fin de la dernière (en beat)
     */
    beatDuration: {
        get: function() {
            var first = this.sections[0];
            var last  = this.sections[this.sections.length - 1];
            return last.currentEnd - first.currentStart;
        }
    },

    /**
     * @returns {Number} Diff entre le début de la 1ère section et la fin de la dernière (en secondes)
     */
    secDuration: {
        get: function() {
            var first = this.sections[0];
            var last  = this.sections[this.sections.length - 1];
            return last.secTimeAt(last.currentEnd) - first.secTimeAt(first.currentStart);
        }
    },

    /**
     * @returns {String} le chemin vers le fichier audio (du premier clip) pour cet ordinateur
     */
    file : {
        get: function() {

            if (!this._file) {

                var fileRef = this.audioClips[0].SampleRef[0].FileRef[0];
                var filename = fileRef.Name[0].$.Value;
                var dirs;

                var pathElements = fileRef.SearchHint[0].PathHint[0].RelativePathElement;
                if (pathElements) {
                    dirs = _.map(pathElements, function(pathElement) {
                        return pathElement.$.Dir;
                    });
                }

                else {
                    // Chemin relatif ?
                    pathElements = fileRef.RelativePath[0].RelativePathElement;
                    if (pathElements) {
                        dirs = als.RELATIVE_PATH_ROOT.split('/');
                        if (als.RELATIVE_PATH_ROOT.indexOf('/') === 0) dirs.splice(0, 1); // on n'a pas de dossier avant la racine (split)
                        if (pathElements.length === 0) throw new Error('not implemented : RelativePathElement vide');
                        for (var i = 0; i < pathElements.length; ++i) {
                            var pathElement = pathElements[i];
                            var dir = pathElement.$.Dir;
                            if (dir) {
                                dirs.push(dir);
                            }
                            else {
                                // <RelativePathElement Dir="" /> => ".." (dossier parent)
                                dirs.pop();
                            }
                        }
                    }
                }

                if (!dirs) throw new Error('Impossible trouver le chemin vers le fichier dans le projet Live');
                var path = '/' + dirs.join('/') + '/' + filename;

                // Si on est sur le mac dans ce cas ne pas faire attention aux équivalences
                if (navigator.isMac) {
                    this._file = path;
                    return path;
                }

                else if (als.pathMatcher) {
                    path = als.pathMatcher.replace(path);
                    this._file = path;
                    return path;
                }

                throw new Error('not implemented for path : ' + path);
            }

            return this._file;
        }
    }

});

/**
 *
 * @param beatTime
 * @returns {als.Section}
 */
als.Set.prototype.sectionAt = function(beatTime) {
    var sections = this.sections;

    // Supérieur au début de la dernière section ?
    var last = sections[sections.length - 1];
    if (beatTime >= last.currentEnd) throw new Error('Supérieur ou égal à la fin de la dernière section de ' + this.name);
    if (beatTime >= last.currentStart) return last;

    var sectionBefore, sectionAfter;
    for (var i = 0; i < sections.length - 1; ++i) { // jusqu'à avant dernière
        var section = sections[i];

        if (section.beatTime < beatTime) continue;

        // BeatTime supérieur
        if (section.beatTime > beatTime) {
            sectionAfter = section;
            if (section.beatTime === beatTime) {
                sectionBefore = section;
            }
            else {
                if (i == 0) throw new Error('Impossible de trouver getSectionAt('+beatTime+') avant la première section');
                sectionBefore = sections[i - 1];
            }

            return sectionBefore;
        }

        // BeatTime connu
        else {
            return section;
        }
    }

    throw new Error('sectionAt('+beatTime+') non implémenté pour le morceau '+this.name);
};

/**
 *
 * @param beatTime
 * @returns {als.Section}
 */
als.Set.prototype.sectionAtSecTime = function(secTime) { // TODO : répété ce comportement de recherche à toutes les méthodes similaires
    var sections = this.sections;

    var first = sections[0];
    if (secTime < first.secTime) return null;
    var last = sections[sections.length - 1];
    if (first != last && secTime > last.secTimeAt(last.currentEnd)) return null;

    for (var i = sections.length - 1; i >= 0; --i) {
        var section = sections[i];
        if (secTime >= section.secTime) {
            return section;
        }
    }
    //return sections[sections.length - 1];
    return null; // idem avant first
};

// TODO : faire un méthode set.findSection({beatTime: 60}) ou set.findSection({secTime: 159.65984})

/**
 *
 * @param beatTime
 * @returns {Number}
 */
als.secTime = function(beatTime) {
    var section = als.sectionAt(beatTime);
    return section.secTimeAt(beatTime);
};

als.Section = function(set, index) {
    this.set = set;
    if (typeof index === 'undefined') throw new Error('Impossible de créer une section sans index');
    this.json = this.set.midiClips ? this.set.midiClips[index] : this.set.audioClips[index];
};

Object.defineProperties(als.Section.prototype, {
    secTime: {
        get: function() {
            return this.parent.secTime(this.beatTime); // TODO : cache
        }
    },

    beatTime: {
        get: function() {
            return parseFloat(this.currentStart); // on pourrait prendre aussi <AudioClip Time="96">
        }
    },

    /**
     * <CurrentStart Value="96" />
     */
    currentStart: {
        get: function() {
            return parseFloat(this.json.CurrentStart[0].$.Value);
        }
    },

    /**
     * <CurrentEnd Value="128" />
     */
    currentEnd: {
        get: function() {
            return parseFloat(this.json.CurrentEnd[0].$.Value);
        }
    },

    /**
     * <Name Value="Refrain" />
     */
    name: {
        get: function() {
            return this.json.Name[0].$.Value;
        }
    },

    /**
     * <Name Value="Refrain" />
     */
    colorIndex: {
        get: function() {
            return parseInt(this.json.ColorIndex[0].$.Value);
        }
    },

    next: {
        get: function() {
            var parent = this.parent;
            if (!parent || !parent.sections || this.index >= parent.sections.length) return null;
            return parent.sections[this.index + 1];
        }
    },

    beatDuration: {
        get: function() {
            return this.currentEnd - this.currentStart;
        }
    },

    measures: {
        get: function() {
            var measures = this._measures;
            if (!measures) {
                if (this.beatDuration % 4 != 0) console.warn('Nombre de battement non multiple de 4 pour la section %s', this.name);

                var n = Math.ceil(this.beatDuration / 4);
                measures = new Array(n);
                for (var i = 0; i < measures.length; ++i) {
                    var ratio = i / n;
                    measures[i] = {
                        style: {
                            left: (ratio * 100) + '%',
                            width: (1 / n * 100) + '%'
                        }
                        //secTime: ratio *
                    };
                }

                this._measures = measures;
            }
            return measures;
        }
    }
});

als.Section.prototype.secTimeAt = function(beatTime) {
    if (beatTime === this.beatTime) return this.secTime;
    return this.parent.secTime(beatTime);

    /*if (!this.beatValue) {
        var secDiff, beatDiff;
        var next = this.next;
        if (next) {
            secDiff = next.secTime - this.secTime;
            beatDiff = next.beatTime - this.beatTime;
        }
        else {
            beatDiff = this.currentEnd - this.currentStart;
            //if (this.currentEnd === beatTime) throw new Error('not implemented : dernier beatTime pour le morceau : '+this.parent.name);
            //var nextSecTime = this.secTimeAt(this.currentEnd);
            var nextSecTime = this.parent.secTime(this.currentEnd);
            secDiff = nextSecTime - this.secTime;
            console.log(beatDiff);
            console.log(nextSecTime);
            console.log(secDiff);
        }
        this.beatValue = secDiff / beatDiff;
    }
    return this.secTime + (beatTime - this.beatTime) * this.beatValue;*/
};
