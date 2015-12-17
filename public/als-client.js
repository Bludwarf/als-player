/**
 * Created by mlavigne on 17/12/2015.
 */
/**
 * Set Live à partir de fragments JSON du fichier .als d'origine converti par als-player/lib/als.js
 * @param name {String} nom unique du Set
 * @param jsonParts {{audioClips, midiClips, warpMarkers}} cf als.split
 * @constructor
 */
var LiveSet = (function () {
    function LiveSet() {
    }
    /**
     *
     * @param beatTime
     * @returns {*} le dernier marker si on a dépassé le dernier beat
     */
    LiveSet.prototype.indexOfWarpMarkerAt = function (beatTime) {
        for (var i = 0; i < this.warpMarkers.length - 1; ++i) {
            var warpMarker = this.warpMarkers[i];
            if (warpMarker.$.BeatTime < beatTime)
                continue;
            // BeatTime supérieur
            if (warpMarker.$.BeatTime > beatTime) {
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
    LiveSet.prototype.secTime = function (beatTime) {
        // TODO : utiliser als.elementAt
        var i = this.indexOfWarpMarkerAt(beatTime);
        var warpMarkerBefore = this.warpMarkers[i];
        var secTime = parseFloat(warpMarkerBefore.$.SecTime);
        if (parseFloat(warpMarkerBefore.$.BeatTime) === beatTime)
            return secTime;
        // Interpolation
        var warpMarkerAfter = this.warpMarkers[i + 1];
        if (!warpMarkerBefore.beatValue) {
            var secDiff = warpMarkerAfter.$.SecTime - warpMarkerBefore.$.SecTime;
            var beatDiff = warpMarkerAfter.$.BeatTime - warpMarkerBefore.$.BeatTime;
            warpMarkerBefore.beatValue = secDiff / beatDiff;
        }
        return parseFloat(warpMarkerBefore.$.SecTime) + (beatTime - warpMarkerBefore.$.BeatTime) * warpMarkerBefore.beatValue;
    };
    return LiveSet;
})();
var Section = (function () {
    function Section(set, index) {
        this.set = set;
        if (typeof index === 'undefined')
            throw new Error('Impossible de créer une section sans index');
        this.json = this.set.midiClips ? this.set.midiClips[index] : this.set.audioClips[index];
    }
    Object.defineProperty(Section.prototype, "parent", {
        /**
         * @returns {LiveSet}
         */
        get: function () {
            return this.set;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Section.prototype, "currentStart", {
        get: function () {
            return parseFloat(this.json.CurrentStart[0].$.Value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Section.prototype, "beatTime", {
        get: function () {
            return this.currentStart; // on pourrait prendre aussi <AudioClip Time="96">
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Section.prototype, "secTime", {
        get: function () {
            return this.parent.secTime(this.beatTime); // TODO : cache
        },
        enumerable: true,
        configurable: true
    });
    return Section;
})();
//# sourceMappingURL=als-client.js.map