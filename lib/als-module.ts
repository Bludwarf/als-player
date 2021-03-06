/**
 * Created by mlavigne on 30/12/2015.
 * Tout doit être fait comme si on était côté client.
 */
///<reference path='../typings/tsd.d.ts'/>

// Import uniquement de bibliothèque qui existent côté client
import _ = require("underscore");

/**
 * a dummy class it to inherite array.
 * @author http://stackoverflow.com/a/14001136/1655155
 */
class ArrayClass<T> {
    constructor() {
        Array.apply(this, arguments);
        return new Array();
    }
    // we need this, or TS will show an error,
    //XArray["prototype"] = new Array(); will replace with native js arrray function
    pop(): any { return "" }
    push(val): number { return 0; }
    length: number;
}
//Adding Arrray to XArray prototype chain.
ArrayClass["prototype"] = new ArrayClass();

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}


module als {

    class PathMatcher {

        /**
         * Conversion d'un path dans le Set Live vers un Path pour la machine actuelle
         * @param path
         */
        public replace(path : string) : string {
            throw new Error('abstract method');
        }
    }

    var RELATIVE_PATH_ROOT = '/Users/bludwarf/Dropbox/Musiques/Funk Pierre/Sets Live';
    var navigator_isMac = false; // FIXME : this['navigator'] && navigator.userAgent && navigator.userAgent.toLowerCase().indexOf('macintosh') != -1;
    var pathMatcher : PathMatcher = null;

    /**
     * Valeur d'une propriété
     * @param element
     * @param prop en miniscule. par exemple beatTime ou secTime
     * @returns {*}
     */
    function prop(element : any, prop : string) : number {
        if (element.$) {
            // JSON Ableton Live
            var xmlProp = prop[0].toUpperCase() + prop.substring(1);
            return parseFloat(element.$[xmlProp]);
        }

        var child = element[prop];
        if (!child) return null;

        // <Child Value="16" />
        if (child.$ && child.$.Value) return parseFloat(child.$.Value);

        return parseFloat(child);
    }

    function beatTime(element) {
        return this.prop(element, 'beatTime');
    }

    function secTime(element) {
        return this.prop(element, 'secTime');
    }

    /**
     * Conversion de secondes au format M:SS comme Ableton Live 8
     * @param seconds
     * @param withFrac affiche la partie fractionnaire des secondes
     */
    export function toMS(seconds : number, withFrac? : boolean) : string {
        //var h = Math.floor(seconds / 3600);
        //var m = Math.floor(seconds % 3600 / 60);
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        if (!withFrac) s = Math.round(s);
        return /*pad(h, 2) + ':' +*/ m + ':' + pad(s, 2);
    }

    /**
     * BeatTime au format : mesure.beat.sixteenth TODO : sixteenth quand on est en ternaire ?
     * En estimant qu'aucun changement de signature n'est eu lieu dans le morceau, sinon décalage du numéro de mesure.
     * @param beatTime
     * @param beatPerMeasure numérateur (chiffre du haut) de la signature
     */
    export function toMBX(beatTime : number, beatPerMeasure? : number) : string {
        beatPerMeasure = beatPerMeasure || 4;
        var m = Math.floor(beatTime / beatPerMeasure);
        var b = Math.floor(beatTime % beatPerMeasure);
        var x = beatTime % 1 * 4; // sixteenth = 1/4 beat

        // Notation commençant à 1 et pas 0
        ++m;
        ++b;
        ++x;
        return m+"."+b+"."+x;
    }

    /**
     * Accélération en tenant compte de l'intervale entre les deux changement de tempo en bpm / battement  (c'est-à-dire en secondes ?)
     * @param tempo
     * @param prevTempo tempo précédent
     * @param duration intervale en beat entre les deux tempos
     * @returns {number} bpm / battement  (c'est-à-dire en secondes ?)
     */
    export function acceleration(prevTempo : number, duration : number, tempo : number) : number {
        // diff de tempo avec le précédent
        var diff = tempo - prevTempo;

        // accélération par rapport à l'intervale entre les deux tempos (en bpm / battement)
        return diff / duration;
    }

    /**
     * Exemple : als.elementAt(set.warpMarkers, {secTime: 0})
     * @param elements {*[]}
     * @param filter {{[beatTime]: float, [secTime]: float}} ou par défaut beatTime directement (!? coïcidence)
     * @returns {*} l'élément qui commence avant (ou pile) le beatTime/secTime indiqué
     */
    function elementAt(elements, filter) {
        var name = _.keys(filter)[0];
        var value = filter[name];

        var first = elements[0];
        if (value < prop(first, name)) return null;
        //var last = elements[elements.length - 1];
        //if (first != last && beatTime > last.currentEnd) return null;

        for (var i = elements.length - 1; i >= 0; --i) {
            var element = elements[i];
            if (value >= prop(element, name)) {
                return element;
            }
        }

        // par défaut on renvoie le dernier élément
        return elements[elements.length - 1];
    }

    /**
     * Set Live à partir de fragments JSON du fichier .als d'origine converti par als-player/lib/als.js
     */
    export class LiveSet {

        public name : string;
        public audioClips; // JSON
        public midiClips; // JSON
        public warpMarkers;
        public locators : Array<Locator>; // JSON

        private _patterns : Array<Pattern>;
        private _sections : Array<Section>;

        private _file : string;

        /**
         * Set Live à partir de fragments JSON du fichier .als d'origine converti par als-player/lib/als.js
         * @param name {String} nom unique du Set (par exemple le nom du fichier als sans extension)
         * @param jsonParts {{audioClips, midiClips, warpMarkers}} (cf als.split) ou syntaxe '.../MonFichier.*.json' pour chercher automatiquement tous les fichiers
         * @constructor
         */
        constructor(name, jsonParts?) {
            if (!name) throw new Error('name obligatoire');
            this.name = name;

            if (jsonParts) this.loadJsonParts(jsonParts);
        }

        public loadJsonParts(jsonParts) {
            throw new Error("Doit être implémenté de manière différenete côté Serveur et côté Client");
        }

        /**
         * This callback type is called `requestCallback` and is displayed as a global symbol.
         *
         * @callback manualConstructor
         * @param {number} responseCode
         * @param {string} responseMessage
         */

        /**
         *
         * @param json
         * @param manualConstructor {function}
         * @returns Array
         */
        private initElements(json, manualConstructor) {
            var elements;
            if (json) {
                elements = [];
                json.forEach(function(element) {
                    elements.push(manualConstructor(element));
                });
            }
            return elements;
        }

        get patterns() : Array<Pattern> {
            if (!this._patterns) {
                // Création des patterns à partir des audioClips (ou des midiClips si présents)
                var clips = this.midiClips || this.audioClips;
                if (clips) {
                    this._patterns = [];
                    for (var i = 0; i < clips.length; ++i) {
                        var pattern = new Pattern(this, i);
                        this._patterns.push(pattern);
                    }
                }
                else {
                    console.warn("Aucun clip trouvé pour ce morceau");
                }
            }
            return this._patterns;
        }

        /**
         * @returns {Number} Diff entre le début du 1er pattern et la fin du dernier (en beat)
         */
        get beatDuration() : number {
            var first = this.patterns[0];
            var last  = this.patterns[this.patterns.length - 1];
            return last.currentEnd - first.currentStart;
        }

        /**
         * @returns {Number} Diff entre le début du 1er pattern et la fin du dernier (en secondes)
         */
        get secDuration() : number {
            var first = this.patterns[0];
            var last  = this.patterns[this.patterns.length - 1];
            return last.secTimeAt(last.currentEnd) - first.secTimeAt(first.currentStart);
        }

        /*warpMarkerAt(beatTime) {
         return elementAt(warpMarkers, beatTime); // TODO : défini en dur dans un .js
         }*/

        measureAt(query) : Measure {
            var pattern = (typeof query.beatTime != 'undefined') ? this.patternAt(query.beatTime) : this.patternAtSecTime(query.secTime);
            return pattern.measureAt(query);
        }

        /**
         *
         * @param secTime (float)
         * @returns {Pattern}
         */
        patternAtSecTime(secTime : number) : Pattern {
            return elementAt(this.patterns, {secTime: secTime});
        }


        /**
         *
         * @param beatTime absolu (sera converti en relatif par rapport à l'AudioClip de référence)
         * @returns {*} le dernier marker si on a dépassé le dernier beat
         * @deprecated
         */
        indexOfWarpMarkerAt(beatTime) {
            beatTime = beatTime - this.currentStart; // relatif à l'AudioClip de référence

            // TODO : utiliser als.elementAt
            for (var i = 0; i < this.warpMarkers.length - 1; ++i) { // jusqu'à l'avant dernier
                var m = this.warpMarkers[i];

                if (m.beatTime < beatTime) continue;

                // BeatTime supérieur
                if (m.beatTime > beatTime) {
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

        /**
         * SecTime relativement à l'AudioClip de référence
         * @param beatTime beatTime absolu
         * @returns {number|number}
         */
        secTime(beatTime) {
            // TODO : tout mettre dans warpMarkers
            var beatTimeRel = beatTime - this.currentStart;
            return this.warpMarkers.secTimeAt(beatTimeRel);
        }

        /**
         *
         * @param beatTime absolu dans le SetLive et pas relatif comme dans les WarpMarkers
         * @returns {Pattern}
         */
        patternAt(beatTime : number) : Pattern {
            var patterns = this.patterns;

            if (patterns) {
                // Supérieur au début du premier Pattern ?
                var last = patterns[patterns.length - 1];
                if (beatTime >= last.currentEnd) {
                    console.warn(beatTime + ' Supérieur ou égal à la fin du dernier pattern de ' + this.name);
                    return null;
                }
                if (beatTime >= last.currentStart) return last;

                var patternBefore, patternAfter;
                for (var i = 0; i < patterns.length; ++i) {
                    var pattern = patterns[i];

                    if (pattern.beatTime < beatTime) continue;

                    // BeatTime supérieur
                    if (pattern.beatTime > beatTime) {
                        patternAfter = pattern;
                        if (pattern.beatTime === beatTime) {
                            patternBefore = pattern;
                        }
                        else {
                            if (i == 0) {
                                console.error('Impossible de trouver getPatternAt(' + beatTime + ') avant le premier pattern');
                                return null;
                            }
                            patternBefore = patterns[i - 1];
                        }

                        return patternBefore;
                    }

                    // BeatTime connu
                    else {
                        return pattern;
                    }
                }
            }

            throw new Error('patternAt(' + beatTime + ') non implémenté pour le morceau ' + this.name);
        }

        patternAt_WarpMarker(m : WarpMarker) : Pattern {
            throw new Error('@deprecated : on doit calculer le beatTime absolu en connaissant le Set dont sont extraits ces WarpMarkers');
            //return this.patternAt(m.beatTime);
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
                        return pathElement['$'].Dir;
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

        /**
         * Début réel de l'audio de référence
         */
        get currentStart() {
            var audioClip = this.audioClips[0];
            var currentStart = parseFloat(audioClip.$.Time); // <CurrentStart Value="14.268227345571095" />
            var loopStart = parseFloat(audioClip.Loop[0].LoopStart[0].$.Value); // <LoopStart Value="-1.7317726544289045" />
            return currentStart - loopStart;
        }

        /**
         *
         * @param filter cf als#elementAt
         */
        public locatorAt(filter : any) : any {
            return elementAt(this.locators, filter);
        }

        get sections() : Array<Section> {
            if (!this._sections) {
                this._sections = [];

                var last : Pattern = null;
                var section : Section = null;
                for (var i = 0; i < this.patterns.length; ++i) {
                    var pattern : Pattern = this.patterns[i];
                    if (!section || !last || last.name != pattern.name) {
                        section = new Section();
                        this._sections.push(section);
                    }
                    section.add(pattern);
                    last = pattern;
                }
            }
            return this._sections;
        }

    }

    /**
     * Relativement à une structure qui se base un clip audio de référence
     */
    export class Pattern {

        /**
         * @type {Set}
         */
        public set : LiveSet;
        private index : number;
        private json;
        private isAudio : boolean;

        private _measures : Array<Measure>;

        constructor(set : LiveSet, index : number) {
            this.set = set;
            if (typeof index === 'undefined') throw new Error('Impossible de créer un pattern sans index');
            this.index = index;
            this.json = this.set.midiClips ? this.set.midiClips[index] : this.set.audioClips[index];
            this.isAudio = !(this.set.midiClips);
        }

        /**
         * @returns {LiveSet}
         */
        get parent() : LiveSet {
            return this.set;
        }

        /**
         * Inclusif (ce beat fait partie du pattern, c'est le 1er)
         * <CurrentStart Value="96" />
         */
        get currentStart() : number {
            return parseFloat(this.json.CurrentStart[0].$.Value);
        }

        /**
         * Exclusif (ce beat ne fait pas partie du pattern mais c'est le 1er du pattern suivant)
         * <CurrentEnd Value="128" />
         */
        get currentEnd() : number {
            return parseFloat(this.json.CurrentEnd[0].$.Value);
        }

        get beatTime() {
            return this.currentStart; // on pourrait prendre aussi <AudioClip Time="96">
        }

        /**
         * Relatif au premier Pattern
         * @param beatTime
         * @returns {number}
         */
        protected relativeBeatTime(beatTime : number) {
            /*var clips = this.parent.midiClips ? this.parent.midiClips : this.parent.audioClips;
            var offset = parseFloat(clips[0].$.Time);*/
            var offset = this.parent.currentStart;
            return beatTime - offset;
        }

        get beatTimeRelative() : number {
            return this.relativeBeatTime(this.beatTime);
        }

        get currentStartRelative() : number {
            return this.relativeBeatTime(this.currentStart);
        }

        get currentEndRelative() : number {
            return this.relativeBeatTime(this.currentEnd);
        }

        /**
         * SecTime relativement à l'AudioClip de référence
         * @returns {number|number}
         */
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

        get next() : Pattern {
            var parent = this.parent;
            if (!parent || !parent.patterns || this.index >= parent.patterns.length) return null;
            return parent.patterns[this.index + 1];
        }

        get prev() : Pattern {
            var parent = this.parent;
            if (!parent || !parent.patterns || this.index <= 0) return null;
            return parent.patterns[this.index - 1];
        }

        get beatDuration() : number {
            return this.currentEnd - this.currentStart;
        }

        get secDuration() : number {
            var secStart = this.secTimeAt(this.currentStart);
            var secEnd   = this.secTimeAt(this.currentEnd);
            return secEnd - secStart;
        }

        /**
         * Pour l'instant considère uniquement du 4/4
         * @returns {Array<Measure>}
         */
        get measures() : Array<Measure> {
            var measures = this._measures;
            if (!measures) {
                var lastIncomplete = this.beatDuration % 4 != 0;
                if (lastIncomplete) console.warn('Nombre de battement non multiple de 4 pour la pattern %s', this.name);

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
                                return this.pattern.beatTime + this.index * 4;
                            }
                        },
                        secTime: {
                            get: function() {
                                throw new Error('TODO de compilation TypeScript');
                                // TODO  : return this.pattern.secTimeAt(this.beatTime);
                            }
                        }
                        /*beatDuration: {
                         get: function() {
                         var n = this.pattern.measures.length;
                         if (this.index < n - 1) return 4;
                         else return this.pattern.beatDuration - (n - 1) * 4; // durée totale - toutes les autres
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

        /**
         * Tempo moyen
         * @returns {number}
         */
        get tempo() : number {
            return this.beatDuration / this.secDuration * 60;
        }

        /**
         * Accélération par rapport au précédent Pattern en bpm / battement (c'est-à-dire en secondes ?)
         * @returns {number}
         */
        get acceleration() : number {
            if (!this.prev) throw new Error("Impossible de calculer une accéleration sans élément précédent");
            return als.acceleration(this.prev.tempo, this.prev.beatDuration, this.tempo);
        }

        get style() {
            return {
                left: this.beatTime / this.set.beatDuration * 100 + '%',
                //right: 100 - (this.next ? this.next.beatTime : this.set.beatDuration) / this.set.beatDuration * 100 + '%'
                width: this.beatDuration / this.set.beatDuration * 100 + '%'
            }
        }

        /**
         * Le repère dans lequel on se trouve actuellement
         */
        get locator() : any {
            return this.parent.locatorAt(this.beatTime);
        }

    }

    export class Measure {
        public incomplete : boolean;
        public pattern : Pattern;
        public index : number;
        public beatDuration : number;
        public style; // CSS

        constructor(pattern, index, beatDuration) {
            this.pattern = pattern;
            this.index = index;
            this.beatDuration = beatDuration;
        }
    }

    export class WarpMarkers extends ArrayClass<WarpMarker> {

        constructor(array : Array<any>) {
            super();

            if (array) {
                var that = this;
                var last : WarpMarker;
                array.forEach(function (e) {
                    var warpMarker = new WarpMarker(e);
                    that.push(warpMarker);
                });
            }
        }

        push(warpMarker : WarpMarker) {

            // lien next/prev
            var last = this.length > 0 ? this[this.length - 1] : null;
            if (last) {
                last.next = warpMarker;
                warpMarker.prev = last;
            }

            return super.push(warpMarker);
        }

        /**
         * Foreach sans le dernier élément
         * @param cb  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
         * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
         */
        /*forEach(cb: (value: WarpMarker, index: number, array: WarpMarker[]) => void, thisArg?: any): void {
            // On ne prend pas le dernier qui représente la fin de l'AudioClip
            this.slice(0, this.length - 2).forEach(cb, thisArg);
        }*/

        /**
         * Tempo moyen (pondéré)
         * @returns {number}
         */
        get tempo() : number {
            var tempoMoyen = 0;
            var beatDuration = 0;
            for (var i = 1; i+1 < this.length; ++i) {
                var m = this[i];

                // Tempo moyen (pondéré par le BeatTime)
                tempoMoyen       += m.tempo * m.beatDuration;
                beatDuration += m.beatDuration;
            }

            // Tempo moyen (pondéré)
            tempoMoyen = tempoMoyen / beatDuration;
            return tempoMoyen;
        }

        /**
         * Tempo moyen (pondéré)
         * @param start inclu
         * @param end exclu
         * @returns {number}
         */
        public tempo_between(start : number, end : number) : number {
            var m = this.warpMarkerAt({beatTime: start});

            // Tempo pondéré
            var tempoMoyen = 0;
            var beatDuration = 0;
            /*var tempoMoyen = m.tempo;
            var beatDuration = m.beatDuration - (start - m.beatTime);
            m = m.next; // on passe au suivant*/

            // Boucle sur chaque WarpMarker
            while (m.beatTime < end) {
                var currentBeatDuration = m.beatDuration;

                // Si start ne tombe pas juste sur un WarpMarker on diminue la durée du premier WarpMarker qui est incomplet sur la tranche demandée
                if (m.beatTime < start) {
                    currentBeatDuration -= start - m.beatTime;
                }

                tempoMoyen += m.tempo * currentBeatDuration;
                beatDuration += currentBeatDuration;
                m = m.next;
            }

            // Tempo moyen (pondéré)
            tempoMoyen = tempoMoyen / beatDuration;
            return tempoMoyen;
        }

        /**
         *
         * @param filter {{[beatTime]: number, [secTime]: number}} relatifs à l'AudioClip de référence
         * @returns {number}
         */
        public warpMarkerAt(filter : any) : WarpMarker {
            return elementAt(this, filter);
        }

        /**
         *
         * @param beatTime relatif à l'AudioClip de référence
         * @returns {number}
         */
        public secTimeAt(beatTime : number) : number {
            var warpMarker = this.warpMarkerAt({beatTime: beatTime});
            return warpMarker.secTimeAt(beatTime);
        }

    }

    export class WarpMarker {

        public secTime  : number; // float

        /** RELATIF à l'AudioClip d'origine. Pour avoir le BeatTime absolu dans le Set Live il faut ajouter LiveSet.currentStart */
        public beatTime : number; // float

        public prev : WarpMarker;
        public next : WarpMarker;

        private _tempo  : number;

        /**
         *
         * @param object {{$} | {SecTime, BeatTime}}
         */
        constructor(object) {
            var attribs = object.$ || object;
            this.secTime  = parseFloat(attribs.SecTime);
            this.beatTime = parseFloat(attribs.BeatTime);
        }

        /**
         * Tempo en bpm à partir de ce WarpMarker jusqu'au suivant
         */
        get tempo() {
            if (!this._tempo) {
                if (!this.next) throw new Error('Impossible de calculer le tempo du dernier WarpMarker');
                this._tempo = this.beatDuration / this.secDuration * 60;
            }
            return this._tempo;
        }

        /**
         * Durée avant le prochain WarpMarker (en battements)
         * @constructor
         */
        get beatDuration() {
            if (!this.next) throw new Error('Impossible de calculer la durée du dernier WarpMarker');
            return this.next.beatTime - this.beatTime;
        }

        /**
         * Durée avant le prochain WarpMarker (en secondes)
         * @constructor
         */
        get secDuration() {
            if (!this.next) throw new Error('Impossible de calculer la durée du dernier WarpMarker');
            return this.next.secTime - this.secTime;
        }

        /**
         * Accélération par rapport au précédent WarpMarker en bpm / battement (c'est-à-dire en secondes ?)
         * @returns {number}
         */
        get acceleration() {
            if (!this.prev) throw new Error("Impossible de calculer une accéleration sans élément précédent");
            return als.acceleration(this.prev.tempo, this.prev.beatDuration, this.tempo);
        }

        get beatValue() : number {
            var secDiff = this.next.secTime - this.secTime;
            var beatDiff = this.next.beatTime - this.beatTime;
            return secDiff / beatDiff;
        }

        /**
         *
         * @param beatTime relatif à l'AudioClip de référence
         */
        public secTimeAt(beatTime : number) : number {
            if (this.beatTime === beatTime) return this.secTime; // pile sur le WarpMarker

            // Interpolation
            return this.secTime + (beatTime - this.beatTime) * this.beatValue;
        }

    }

    export class Section {

        public patterns : Array<Pattern> = [];

        /**
         * Ajout d'un pattern à la suite des autres dans cette section. Aucune vérif de doublon.
         * @param pattern
         * @returns {number} le nombre de pattern dans cette section suite à l'ajout
         */
        public add(pattern : Pattern) : number {
            return this.patterns.push(pattern);
        }

        private propOfFirstChild(propName : string) : any {
            if (!this.patterns || !this.patterns.length) return null;
            return this.patterns[0][propName];
        }

        /**
         * colorIndex du 1er pattern
         * @returns {any}
         */
        get colorIndex() {
            return this.propOfFirstChild('colorIndex');
        }

        /**
         * name du 1er pattern
         * @returns {any}
         */
        get name() {
            return this.propOfFirstChild('name');
        }

    }

    /**
     * <Locator>
         <Time Value="16" />
         <Name Value="Tchouchou" />
         <Annotation Value="" />
         <IsSongStart Value="false" />
       </Locator>
     */
    export class Locator {

        public _json : any;

        /**
         * @param object JSON
         */
        constructor(object) {
            this._json = object;
        }

        get name() {
            return this._json.Name[0].$.Value;
        }

        get time() {
            return parseFloat(this._json.Time[0].$.Value);
        }
    }

}

export = als;