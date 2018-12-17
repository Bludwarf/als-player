"use strict";
/**
 * Created by mlavigne on 30/12/2015.
 * Tout doit être fait comme si on était côté client.
 */
///<reference path='../typings/tsd.d.ts'/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// Import uniquement de bibliothèque qui existent côté client
var _ = require("underscore");
/**
 * a dummy class it to inherite array.
 * @author http://stackoverflow.com/a/14001136/1655155
 */
var ArrayClass = (function () {
    function ArrayClass() {
        Array.apply(this, arguments);
        return new Array();
    }
    // we need this, or TS will show an error,
    //XArray["prototype"] = new Array(); will replace with native js arrray function
    ArrayClass.prototype.pop = function () { return ""; };
    ArrayClass.prototype.push = function (val) { return 0; };
    return ArrayClass;
}());
//Adding Arrray to XArray prototype chain.
ArrayClass["prototype"] = new ArrayClass();
function pad(num, size) {
    var s = num + "";
    while (s.length < size)
        s = "0" + s;
    return s;
}
var als;
(function (als) {
    var PathMatcher = (function () {
        function PathMatcher() {
        }
        /**
         * Conversion d'un path dans le Set Live vers un Path pour la machine actuelle
         * @param path
         */
        PathMatcher.prototype.replace = function (path) {
            throw new Error('abstract method');
        };
        return PathMatcher;
    }());
    var RELATIVE_PATH_ROOT = '/Users/bludwarf/Dropbox/Musiques/Funk Pierre/Sets Live';
    var navigator_isMac = false; // FIXME : this['navigator'] && navigator.userAgent && navigator.userAgent.toLowerCase().indexOf('macintosh') != -1;
    var pathMatcher = null;
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
        var child = element[prop];
        if (!child)
            return null;
        // <Child Value="16" />
        if (child.$ && child.$.Value)
            return parseFloat(child.$.Value);
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
    function toMS(seconds, withFrac) {
        //var h = Math.floor(seconds / 3600);
        //var m = Math.floor(seconds % 3600 / 60);
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        if (!withFrac)
            s = Math.round(s);
        return m + ':' + pad(s, 2);
    }
    als.toMS = toMS;
    /**
     * BeatTime au format : mesure.beat.sixteenth TODO : sixteenth quand on est en ternaire ?
     * En estimant qu'aucun changement de signature n'est eu lieu dans le morceau, sinon décalage du numéro de mesure.
     * @param beatTime
     * @param beatPerMeasure numérateur (chiffre du haut) de la signature
     */
    function toMBX(beatTime, beatPerMeasure) {
        beatPerMeasure = beatPerMeasure || 4;
        var m = Math.floor(beatTime / beatPerMeasure);
        var b = Math.floor(beatTime % beatPerMeasure);
        var x = beatTime % 1 * 4; // sixteenth = 1/4 beat
        // Notation commençant à 1 et pas 0
        ++m;
        ++b;
        ++x;
        return m + "." + b + "." + x;
    }
    als.toMBX = toMBX;
    /**
     * Accélération en tenant compte de l'intervale entre les deux changement de tempo en bpm / battement  (c'est-à-dire en secondes ?)
     * @param tempo
     * @param prevTempo tempo précédent
     * @param duration intervale en beat entre les deux tempos
     * @returns {number} bpm / battement  (c'est-à-dire en secondes ?)
     */
    function acceleration(prevTempo, duration, tempo) {
        // diff de tempo avec le précédent
        var diff = tempo - prevTempo;
        // accélération par rapport à l'intervale entre les deux tempos (en bpm / battement)
        return diff / duration;
    }
    als.acceleration = acceleration;
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
        if (value < prop(first, name))
            return null;
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
    var LiveSet = (function () {
        /**
         * Set Live à partir de fragments JSON du fichier .als d'origine converti par als-player/lib/als.js
         * @param name {String} nom unique du Set (par exemple le nom du fichier als sans extension)
         * @param jsonParts {{audioClips, midiClips, warpMarkers}} (cf als.split) ou syntaxe '.../MonFichier.*.json' pour chercher automatiquement tous les fichiers
         * @constructor
         */
        function LiveSet(name, jsonParts) {
            if (!name)
                throw new Error('name obligatoire');
            this.name = name;
            if (jsonParts)
                this.loadJsonParts(jsonParts);
        }
        LiveSet.prototype.loadJsonParts = function (jsonParts) {
            throw new Error("Doit être implémenté de manière différenete côté Serveur et côté Client");
        };
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
        LiveSet.prototype.initElements = function (json, manualConstructor) {
            var elements;
            if (json) {
                elements = [];
                json.forEach(function (element) {
                    elements.push(manualConstructor(element));
                });
            }
            return elements;
        };
        Object.defineProperty(LiveSet.prototype, "patterns", {
            get: function () {
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
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LiveSet.prototype, "beatDuration", {
            /**
             * @returns {Number} Diff entre le début du 1er pattern et la fin du dernier (en beat)
             */
            get: function () {
                var first = this.patterns[0];
                var last = this.patterns[this.patterns.length - 1];
                return last.currentEnd - first.currentStart;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LiveSet.prototype, "secDuration", {
            /**
             * @returns {Number} Diff entre le début du 1er pattern et la fin du dernier (en secondes)
             */
            get: function () {
                var first = this.patterns[0];
                var last = this.patterns[this.patterns.length - 1];
                return last.secTimeAt(last.currentEnd) - first.secTimeAt(first.currentStart);
            },
            enumerable: true,
            configurable: true
        });
        /*warpMarkerAt(beatTime) {
         return elementAt(warpMarkers, beatTime); // TODO : défini en dur dans un .js
         }*/
        LiveSet.prototype.measureAt = function (query) {
            var pattern = (typeof query.beatTime != 'undefined') ? this.patternAt(query.beatTime) : this.patternAtSecTime(query.secTime);
            return pattern.measureAt(query);
        };
        /**
         *
         * @param secTime (float)
         * @returns {Pattern}
         */
        LiveSet.prototype.patternAtSecTime = function (secTime) {
            return elementAt(this.patterns, { secTime: secTime });
        };
        /**
         *
         * @param beatTime absolu (sera converti en relatif par rapport à l'AudioClip de référence)
         * @returns {*} le dernier marker si on a dépassé le dernier beat
         * @deprecated
         */
        LiveSet.prototype.indexOfWarpMarkerAt = function (beatTime) {
            beatTime = beatTime - this.currentStart; // relatif à l'AudioClip de référence
            // TODO : utiliser als.elementAt
            for (var i = 0; i < this.warpMarkers.length - 1; ++i) {
                var m = this.warpMarkers[i];
                if (m.beatTime < beatTime)
                    continue;
                // BeatTime supérieur
                if (m.beatTime > beatTime) {
                    if (i == 0)
                        throw new Error('warpMarkerAt(' + beatTime + ') impossible avant le premier WarpMarker');
                    return i - 1;
                }
                else {
                    return i;
                }
            }
            // On a dépassé le dernier beat
            return this.warpMarkers.length - 2;
        };
        /**
         * SecTime relativement à l'AudioClip de référence
         * @param beatTime beatTime absolu
         * @returns {number|number}
         */
        LiveSet.prototype.secTime = function (beatTime) {
            // TODO : tout mettre dans warpMarkers
            var beatTimeRel = beatTime - this.currentStart;
            return this.warpMarkers.secTimeAt(beatTimeRel);
        };
        /**
         *
         * @param beatTime absolu dans le SetLive et pas relatif comme dans les WarpMarkers
         * @returns {Pattern}
         */
        LiveSet.prototype.patternAt = function (beatTime) {
            var patterns = this.patterns;
            if (patterns) {
                // Supérieur au début du premier Pattern ?
                var last = patterns[patterns.length - 1];
                if (beatTime >= last.currentEnd) {
                    console.warn(beatTime + ' Supérieur ou égal à la fin du dernier pattern de ' + this.name);
                    return null;
                }
                if (beatTime >= last.currentStart)
                    return last;
                var patternBefore, patternAfter;
                for (var i = 0; i < patterns.length; ++i) {
                    var pattern = patterns[i];
                    if (pattern.beatTime < beatTime)
                        continue;
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
                    else {
                        return pattern;
                    }
                }
            }
            throw new Error('patternAt(' + beatTime + ') non implémenté pour le morceau ' + this.name);
        };
        LiveSet.prototype.patternAt_WarpMarker = function (m) {
            throw new Error('@deprecated : on doit calculer le beatTime absolu en connaissant le Set dont sont extraits ces WarpMarkers');
            //return this.patternAt(m.beatTime);
        };
        Object.defineProperty(LiveSet.prototype, "file", {
            /**
             * @returns {String} le chemin vers le fichier audio (du premier clip) pour cet ordinateur
             */
            get: function () {
                if (!this._file) {
                    var fileRef = this.audioClips[0].SampleRef[0].FileRef[0];
                    var filename = fileRef.Name[0].$.Value;
                    var dirs;
                    var pathElements = fileRef.SearchHint[0].PathHint[0].RelativePathElement;
                    if (pathElements) {
                        dirs = _.map(pathElements, function (pathElement) {
                            return pathElement['$'].Dir;
                        });
                    }
                    else {
                        // Chemin relatif ?
                        pathElements = fileRef.RelativePath[0].RelativePathElement;
                        if (pathElements) {
                            dirs = RELATIVE_PATH_ROOT.split('/');
                            if (RELATIVE_PATH_ROOT.indexOf('/') === 0)
                                dirs.splice(0, 1); // on n'a pas de dossier avant la racine (split)
                            if (pathElements.length === 0)
                                throw new Error('not implemented : RelativePathElement vide');
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
                    if (!dirs)
                        throw new Error('Impossible trouver le chemin vers le fichier dans le projet Live');
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
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LiveSet.prototype, "currentStart", {
            /**
             * Début réel de l'audio de référence
             */
            get: function () {
                var audioClip = this.audioClips[0];
                var currentStart = parseFloat(audioClip.$.Time); // <CurrentStart Value="14.268227345571095" />
                var loopStart = parseFloat(audioClip.Loop[0].LoopStart[0].$.Value); // <LoopStart Value="-1.7317726544289045" />
                return currentStart - loopStart;
            },
            enumerable: true,
            configurable: true
        });
        /**
         *
         * @param filter cf als#elementAt
         */
        LiveSet.prototype.locatorAt = function (filter) {
            return elementAt(this.locators, filter);
        };
        Object.defineProperty(LiveSet.prototype, "sections", {
            get: function () {
                if (!this._sections) {
                    this._sections = [];
                    var last = null;
                    var section = null;
                    for (var i = 0; i < this.patterns.length; ++i) {
                        var pattern = this.patterns[i];
                        if (!section || !last || last.name != pattern.name) {
                            section = new Section();
                            this._sections.push(section);
                        }
                        section.add(pattern);
                        last = pattern;
                    }
                }
                return this._sections;
            },
            enumerable: true,
            configurable: true
        });
        return LiveSet;
    }());
    als.LiveSet = LiveSet;
    /**
     * Relativement à une structure qui se base un clip audio de référence
     */
    var Pattern = (function () {
        function Pattern(set, index) {
            this.set = set;
            if (typeof index === 'undefined')
                throw new Error('Impossible de créer un pattern sans index');
            this.index = index;
            this.json = this.set.midiClips ? this.set.midiClips[index] : this.set.audioClips[index];
            this.isAudio = !(this.set.midiClips);
        }
        Object.defineProperty(Pattern.prototype, "parent", {
            /**
             * @returns {LiveSet}
             */
            get: function () {
                return this.set;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "currentStart", {
            /**
             * Inclusif (ce beat fait partie du pattern, c'est le 1er)
             * <CurrentStart Value="96" />
             */
            get: function () {
                return parseFloat(this.json.CurrentStart[0].$.Value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "currentEnd", {
            /**
             * Exclusif (ce beat ne fait pas partie du pattern mais c'est le 1er du pattern suivant)
             * <CurrentEnd Value="128" />
             */
            get: function () {
                return parseFloat(this.json.CurrentEnd[0].$.Value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "beatTime", {
            get: function () {
                return this.currentStart; // on pourrait prendre aussi <AudioClip Time="96">
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Relatif au premier Pattern
         * @param beatTime
         * @returns {number}
         */
        Pattern.prototype.relativeBeatTime = function (beatTime) {
            /*var clips = this.parent.midiClips ? this.parent.midiClips : this.parent.audioClips;
            var offset = parseFloat(clips[0].$.Time);*/
            var offset = this.parent.currentStart;
            return beatTime - offset;
        };
        Object.defineProperty(Pattern.prototype, "beatTimeRelative", {
            get: function () {
                return this.relativeBeatTime(this.beatTime);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "currentStartRelative", {
            get: function () {
                return this.relativeBeatTime(this.currentStart);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "currentEndRelative", {
            get: function () {
                return this.relativeBeatTime(this.currentEnd);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "secTime", {
            /**
             * SecTime relativement à l'AudioClip de référence
             * @returns {number|number}
             */
            get: function () {
                return this.parent.secTime(this.beatTime); // TODO : cache
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "name", {
            /**
             * <Name Value="Refrain" />
             */
            get: function () {
                return this.json.Name[0].$.Value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "colorIndex", {
            get: function () {
                return parseInt(this.json.ColorIndex[0].$.Value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "next", {
            get: function () {
                var parent = this.parent;
                if (!parent || !parent.patterns || this.index >= parent.patterns.length)
                    return null;
                return parent.patterns[this.index + 1];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "prev", {
            get: function () {
                var parent = this.parent;
                if (!parent || !parent.patterns || this.index <= 0)
                    return null;
                return parent.patterns[this.index - 1];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "beatDuration", {
            get: function () {
                return this.currentEnd - this.currentStart;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "secDuration", {
            get: function () {
                var secStart = this.secTimeAt(this.currentStart);
                var secEnd = this.secTimeAt(this.currentEnd);
                return secEnd - secStart;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "measures", {
            /**
             * Pour l'instant considère uniquement du 4/4
             * @returns {Array<Measure>}
             */
            get: function () {
                var measures = this._measures;
                if (!measures) {
                    var lastIncomplete = this.beatDuration % 4 != 0;
                    if (lastIncomplete)
                        console.warn('Nombre de battement non multiple de 4 pour la pattern %s', this.name);
                    var n = Math.ceil(this.beatDuration / 4);
                    measures = new Array(n);
                    for (var i = 0; i < measures.length; ++i) {
                        var ratio = i / n;
                        var measure = new Measure(this, i, (i < n - 1) ? 4 : this.beatDuration - (n - 1) * 4 // durée totale - toutes les autres
                        );
                        // Dernière incomplète ?
                        if (lastIncomplete && i === measures.length - 1)
                            measure.incomplete = true;
                        Object.defineProperties(measure, {
                            beatTime: {
                                get: function () {
                                    return this.pattern.beatTime + this.index * 4;
                                }
                            },
                            secTime: {
                                get: function () {
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
            },
            enumerable: true,
            configurable: true
        });
        Pattern.prototype.measureAt = function (query) {
            return elementAt(this.measures, query);
        };
        Pattern.prototype.secTimeAt = function (beatTime) {
            if (beatTime === this.beatTime)
                return this.secTime;
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
        Object.defineProperty(Pattern.prototype, "tempo", {
            /**
             * Tempo moyen
             * @returns {number}
             */
            get: function () {
                return this.beatDuration / this.secDuration * 60;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "acceleration", {
            /**
             * Accélération par rapport au précédent Pattern en bpm / battement (c'est-à-dire en secondes ?)
             * @returns {number}
             */
            get: function () {
                if (!this.prev)
                    throw new Error("Impossible de calculer une accéleration sans élément précédent");
                return als.acceleration(this.prev.tempo, this.prev.beatDuration, this.tempo);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "style", {
            get: function () {
                return {
                    left: this.beatTime / this.set.beatDuration * 100 + '%',
                    //right: 100 - (this.next ? this.next.beatTime : this.set.beatDuration) / this.set.beatDuration * 100 + '%'
                    width: this.beatDuration / this.set.beatDuration * 100 + '%'
                };
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pattern.prototype, "locator", {
            /**
             * Le repère dans lequel on se trouve actuellement
             */
            get: function () {
                return this.parent.locatorAt(this.beatTime);
            },
            enumerable: true,
            configurable: true
        });
        return Pattern;
    }());
    als.Pattern = Pattern;
    var Measure = (function () {
        function Measure(pattern, index, beatDuration) {
            this.pattern = pattern;
            this.index = index;
            this.beatDuration = beatDuration;
        }
        return Measure;
    }());
    als.Measure = Measure;
    var WarpMarkers = (function (_super) {
        __extends(WarpMarkers, _super);
        function WarpMarkers(array) {
            var _this = _super.call(this) || this;
            if (array) {
                var that = _this;
                var last;
                array.forEach(function (e) {
                    var warpMarker = new WarpMarker(e);
                    that.push(warpMarker);
                });
            }
            return _this;
        }
        WarpMarkers.prototype.push = function (warpMarker) {
            // lien next/prev
            var last = this.length > 0 ? this[this.length - 1] : null;
            if (last) {
                last.next = warpMarker;
                warpMarker.prev = last;
            }
            return _super.prototype.push.call(this, warpMarker);
        };
        Object.defineProperty(WarpMarkers.prototype, "tempo", {
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
            get: function () {
                var tempoMoyen = 0;
                var beatDuration = 0;
                for (var i = 1; i + 1 < this.length; ++i) {
                    var m = this[i];
                    // Tempo moyen (pondéré par le BeatTime)
                    tempoMoyen += m.tempo * m.beatDuration;
                    beatDuration += m.beatDuration;
                }
                // Tempo moyen (pondéré)
                tempoMoyen = tempoMoyen / beatDuration;
                return tempoMoyen;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Tempo moyen (pondéré)
         * @param start inclu
         * @param end exclu
         * @returns {number}
         */
        WarpMarkers.prototype.tempo_between = function (start, end) {
            var m = this.warpMarkerAt({ beatTime: start });
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
        };
        /**
         *
         * @param filter {{[beatTime]: number, [secTime]: number}} relatifs à l'AudioClip de référence
         * @returns {number}
         */
        WarpMarkers.prototype.warpMarkerAt = function (filter) {
            return elementAt(this, filter);
        };
        /**
         *
         * @param beatTime relatif à l'AudioClip de référence
         * @returns {number}
         */
        WarpMarkers.prototype.secTimeAt = function (beatTime) {
            var warpMarker = this.warpMarkerAt({ beatTime: beatTime });
            return warpMarker.secTimeAt(beatTime);
        };
        return WarpMarkers;
    }(ArrayClass));
    als.WarpMarkers = WarpMarkers;
    var WarpMarker = (function () {
        /**
         *
         * @param object {{$} | {SecTime, BeatTime}}
         */
        function WarpMarker(object) {
            var attribs = object.$ || object;
            this.secTime = parseFloat(attribs.SecTime);
            this.beatTime = parseFloat(attribs.BeatTime);
        }
        Object.defineProperty(WarpMarker.prototype, "tempo", {
            /**
             * Tempo en bpm à partir de ce WarpMarker jusqu'au suivant
             */
            get: function () {
                if (!this._tempo) {
                    if (!this.next)
                        throw new Error('Impossible de calculer le tempo du dernier WarpMarker');
                    this._tempo = this.beatDuration / this.secDuration * 60;
                }
                return this._tempo;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WarpMarker.prototype, "beatDuration", {
            /**
             * Durée avant le prochain WarpMarker (en battements)
             * @constructor
             */
            get: function () {
                if (!this.next)
                    throw new Error('Impossible de calculer la durée du dernier WarpMarker');
                return this.next.beatTime - this.beatTime;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WarpMarker.prototype, "secDuration", {
            /**
             * Durée avant le prochain WarpMarker (en secondes)
             * @constructor
             */
            get: function () {
                if (!this.next)
                    throw new Error('Impossible de calculer la durée du dernier WarpMarker');
                return this.next.secTime - this.secTime;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WarpMarker.prototype, "acceleration", {
            /**
             * Accélération par rapport au précédent WarpMarker en bpm / battement (c'est-à-dire en secondes ?)
             * @returns {number}
             */
            get: function () {
                if (!this.prev)
                    throw new Error("Impossible de calculer une accéleration sans élément précédent");
                return als.acceleration(this.prev.tempo, this.prev.beatDuration, this.tempo);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WarpMarker.prototype, "beatValue", {
            get: function () {
                var secDiff = this.next.secTime - this.secTime;
                var beatDiff = this.next.beatTime - this.beatTime;
                return secDiff / beatDiff;
            },
            enumerable: true,
            configurable: true
        });
        /**
         *
         * @param beatTime relatif à l'AudioClip de référence
         */
        WarpMarker.prototype.secTimeAt = function (beatTime) {
            if (this.beatTime === beatTime)
                return this.secTime; // pile sur le WarpMarker
            // Interpolation
            return this.secTime + (beatTime - this.beatTime) * this.beatValue;
        };
        return WarpMarker;
    }());
    als.WarpMarker = WarpMarker;
    var Section = (function () {
        function Section() {
            this.patterns = [];
        }
        /**
         * Ajout d'un pattern à la suite des autres dans cette section. Aucune vérif de doublon.
         * @param pattern
         * @returns {number} le nombre de pattern dans cette section suite à l'ajout
         */
        Section.prototype.add = function (pattern) {
            return this.patterns.push(pattern);
        };
        Section.prototype.propOfFirstChild = function (propName) {
            if (!this.patterns || !this.patterns.length)
                return null;
            return this.patterns[0][propName];
        };
        Object.defineProperty(Section.prototype, "colorIndex", {
            /**
             * colorIndex du 1er pattern
             * @returns {any}
             */
            get: function () {
                return this.propOfFirstChild('colorIndex');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Section.prototype, "name", {
            /**
             * name du 1er pattern
             * @returns {any}
             */
            get: function () {
                return this.propOfFirstChild('name');
            },
            enumerable: true,
            configurable: true
        });
        return Section;
    }());
    als.Section = Section;
    /**
     * <Locator>
         <Time Value="16" />
         <Name Value="Tchouchou" />
         <Annotation Value="" />
         <IsSongStart Value="false" />
       </Locator>
     */
    var Locator = (function () {
        /**
         * @param object JSON
         */
        function Locator(object) {
            this._json = object;
        }
        Object.defineProperty(Locator.prototype, "name", {
            get: function () {
                return this._json.Name[0].$.Value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Locator.prototype, "time", {
            get: function () {
                return parseFloat(this._json.Time[0].$.Value);
            },
            enumerable: true,
            configurable: true
        });
        return Locator;
    }());
    als.Locator = Locator;
})(als || (als = {}));
module.exports = als;
//# sourceMappingURL=als-module.js.map