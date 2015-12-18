/**
 * Created by mlavigne on 17/12/2015.
 *
 * @require underscore.js
 */

var navigator_isMac = navigator.userAgent.toLowerCase().indexOf('macintosh') != -1;

/*var als = {};
window.als = als;*/

var RELATIVE_PATH_ROOT = '/Users/bludwarf/Dropbox/Musiques/Funk Pierre/Sets Live';
var pathMatcher = {};

/**
 *
 * @param pathMatcher {PathMatcher}
 */
function setPathMatcher(newPathMatcher) {
    pathMatcher = newPathMatcher;
}

/**
 * Valeur d'une propriété
 * @param element
 * @param prop en miniscule. par exemple beatTime ou secTime
 * @returns {*}
 */
function prop(element, prop) {
    if (element.$) {
        // JSON Ableton Live
        var xmlProp = prop[0].toUpperCase() + prop.substring(1);
        return parseFloat(element.$[xmlProp]);
    }
    else return element[prop];
}

function beatTime(element) : number {
    return prop(element, 'beatTime');
}

/**
 *
 * @param element
 * @returns {number}
 */
function secTime(element) : number {
    return prop(element, 'secTime');
}

/**
 * Exemple : als.elementAt(set.warpMarkers, {secTime: 0})
 * @param elements {*[]}
 * @param filter {{[beatTime]: float, [secTime]: float}}
 * @returns {*} l'élément qui commence avant (ou pile) le beatTime/secTime indiqué
 */
function elementAt(elements, filter) {
    var prop = _.keys(filter)[0];
    var value = filter[prop];

    var first = elements[0];
    if (value < prop(first, prop)) return null;
    //var last = elements[elements.length - 1];
    //if (first != last && beatTime > last.currentEnd) return null;

    for (var i = elements.length - 1; i >= 0; --i) {
        var element = elements[i];
        if (value >= prop(element, prop)) {
            return element;
        }
    }

    // par défaut on renvoie le dernier élément
    return elements[elements.length - 1];
}



/**
 * Set Live à partir de fragments JSON du fichier .als d'origine converti par als-player/lib/als.js
 * @param name {String} nom unique du Set
 * @param jsonParts {{audioClips, midiClips, warpMarkers}} cf als.split
 * @constructor
 */
class LiveSet {

    public name : string;
    public audioClips; // JSON
    public midiClips; // JSON
    public warpMarkers; // JSON

    public sections : Array<Section>;

    private _file : string;

    /**
     * Set Live à partir de fragments JSON du fichier .als d'origine converti par als-player/lib/als.js
     * @param name {String} nom unique du Set
     * @param jsonParts {{audioClips, midiClips, warpMarkers}} cf als.split
     * @constructor
     */
    constructor(name, jsonParts) {
        this.name = name;
        this.audioClips = jsonParts.audioClips;
        this.midiClips = jsonParts.midiClips;
        this.warpMarkers = jsonParts.warpMarkers;

        // Création des sections à partir des audioClips (ou des midiClips si présents)
        this.sections = [];
        var clips = this.midiClips || this.audioClips;
        for (var i = 0; i < clips.length; ++i) {
            var section = new Section(this, i);
            this.sections.push(section);
        }
    }

    /**
     * @returns {Number} Diff entre le début de la 1ère section et la fin de la dernière (en beat)
     */
    get beatDuration() : number {
        var first = this.sections[0];
        var last  = this.sections[this.sections.length - 1];
        return last.currentEnd - first.currentStart;
    }

    /**
     * @returns {Number} Diff entre le début de la 1ère section et la fin de la dernière (en secondes)
     */
    get secDuration() : number {
        var first = this.sections[0];
        var last  = this.sections[this.sections.length - 1];
        return last.secTimeAt(last.currentEnd) - first.secTimeAt(first.currentStart);
    }

    warpMarkerAt(beatTime) {
        return elementAt(warpMarkers, beatTime); // TODO : défini en dur dans un .js
    }

    measureAt(query) : Measure {
        var section = (typeof query.beatTime != 'undefined') ? this.sectionAt(query.beatTime) : this.sectionAtSecTime(query.secTime);
        return section.measureAt(query);
    }

    /**
     *
     * @param secTime (float)
     * @returns {Section}
     */
    sectionAtSecTime(secTime : number) : Section {
        return elementAt(this.sections, {secTime: secTime});
    }


    /**
     *
     * @param beatTime
     * @returns {*} le dernier marker si on a dépassé le dernier beat
     */
    indexOfWarpMarkerAt(beatTime) {
        // TODO : utiliser als.elementAt
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
    }

    secTime(beatTime) {
        // TODO : utiliser als.elementAt
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
    }

    /**
     *
     * @param beatTime
     * @returns {Section}
     */
    sectionAt(beatTime) : Section {
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
                    if (i == 0) throw new Error('Impossible de trouver getSectionAt(' + beatTime + ') avant la première section');
                    sectionBefore = sections[i - 1];
                }

                return sectionBefore;
            }

            // BeatTime connu
            else {
                return section;
            }
        }

        throw new Error('sectionAt(' + beatTime + ') non implémenté pour le morceau ' + this.name);
    }

    /**
     * @returns {String} le chemin vers le fichier audio (du premier clip) pour cet ordinateur
     */
    get file() : string {
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
                    dirs = RELATIVE_PATH_ROOT.split('/');
                    if (RELATIVE_PATH_ROOT.indexOf('/') === 0) dirs.splice(0, 1); // on n'a pas de dossier avant la racine (split)
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
            if (navigator_isMac) {
                this._file = path;
                return path;
            }

            else if (pathMatcher) {
                path = pathMatcher.replace(path);
                this._file = path;
                return path;
            }

            throw new Error('not implemented for path : ' + path);
        }

        return this._file;
    }

    // TODO : faire un méthode set.findSection({beatTime: 60}) ou set.findSection({secTime: 159.65984})
}

class Section {

    /**
     * @type {Set}
     */
    public set : LiveSet;
    private index : number;
    private json;

    private _measures : Array<Measure>;

    constructor(set : LiveSet, index : number) {
        this.set = set;
        if (typeof index === 'undefined') throw new Error('Impossible de créer une section sans index');
        this.index = index;
        this.json = this.set.midiClips ? this.set.midiClips[index] : this.set.audioClips[index];
    }

    /**
     * @returns {LiveSet}
     */
    get parent() : LiveSet {
        return this.set;
    }

    /**
     * Inclusif (ce beat fait partie de la section, c'est le 1er)
     * <CurrentStart Value="96" />
     */
    get currentStart() : number {
        return parseFloat(this.json.CurrentStart[0].$.Value);
    }

    /**
     * Exclusif (ce beat ne fait pas partie de la section mais c'est le 1er de la section suivante)
     * <CurrentEnd Value="128" />
     */
    get currentEnd() : number {
        return parseFloat(this.json.CurrentEnd[0].$.Value);
    }

    get beatTime() {
        return this.currentStart; // on pourrait prendre aussi <AudioClip Time="96">
    }

    get secTime() {
        return this.parent.secTime(this.beatTime); // TODO : cache
    }

    /**
     * <Name Value="Refrain" />
     */
    get name() : string {
        return this.json.Name[0].$.Value;
    }

    get colorIndex() : number {
        return parseInt(this.json.ColorIndex[0].$.Value);
    }

    get next() : Section {
        var parent = this.parent;
        if (!parent || !parent.sections || this.index >= parent.sections.length) return null;
        return parent.sections[this.index + 1];
    }

    get beatDuration() : number {
        return this.currentEnd - this.currentStart;
    }

    get measures() {
        var measures = this._measures;
        if (!measures) {
            var lastIncomplete = this.beatDuration % 4 != 0;
            if (lastIncomplete) console.warn('Nombre de battement non multiple de 4 pour la section %s', this.name);

            var n = Math.ceil(this.beatDuration / 4);
            measures = new Array(n);
            for (var i = 0; i < measures.length; ++i) {
                var ratio = i / n;
                var measure = new Measure(
                    this,
                    i,
                    (i < n - 1) ? 4 : this.beatDuration - (n - 1) * 4 // durée totale - toutes les autres
                );

                // Dernière incomplète ?
                if (lastIncomplete && i === measures.length - 1) measure.incomplete = true;

                Object.defineProperties(measure, {
                    beatTime: {
                        get: function() {
                            return this.section.beatTime + this.index * 4;
                        }
                    },
                    secTime: {
                        get: function() {
                            return this.section.secTimeAt(this.beatTime);
                        }
                    }
                    /*beatDuration: {
                     get: function() {
                     var n = this.section.measures.length;
                     if (this.index < n - 1) return 4;
                     else return this.section.beatDuration - (n - 1) * 4; // durée totale - toutes les autres
                     }
                     }*/
                });

                // Style
                measure.style = {
                    left: (ratio * 100) + '%',
                    width: (measure.beatDuration / this.beatDuration * 100) + '%'
                };

                measures[i] = measure;
            }

            this._measures = measures;
        }
        return measures;
    }

    measureAt(query) : Measure {
        return elementAt(this.measures, query);
    }

    secTimeAt(beatTime) : number {
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
    }

    get style() {
        return {
            left: this.beatTime / this.set.beatDuration * 100 + '%',
            //right: 100 - (this.next ? this.next.beatTime : this.set.beatDuration) / this.set.beatDuration * 100 + '%'
            width: this.beatDuration / this.set.beatDuration * 100 + '%'
        }
    }

}

class Measure {
    public incomplete : boolean;
    public section : Section;
    public index : number;
    public beatDuration : number;
    public style; // CSS

    constructor(section, index, beatDuration) {
        this.section = section;
        this.index = index;
        this.beatDuration = beatDuration;
    }
}