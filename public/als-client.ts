/**
 * Created by mlavigne on 17/12/2015.
 */

/**
 * Set Live à partir de fragments JSON du fichier .als d'origine converti par als-player/lib/als.js
 * @param name {String} nom unique du Set
 * @param jsonParts {{audioClips, midiClips, warpMarkers}} cf als.split
 * @constructor
 */
class LiveSet {

    private warpMarkers;

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
}

class Section {

    /**
     * @type {Set}
     */
    private set;
    private json;

    constructor(set, index) {
        this.set = set;
        if (typeof index === 'undefined') throw new Error('Impossible de créer une section sans index');
        this.json = this.set.midiClips ? this.set.midiClips[index] : this.set.audioClips[index];
    }

    /**
     * @returns {LiveSet}
     */
    get parent() : LiveSet {
        return this.set;
    }

    get currentStart():number {
        return parseFloat(this.json.CurrentStart[0].$.Value);
    }

    get beatTime() {
        return this.currentStart; // on pourrait prendre aussi <AudioClip Time="96">
    }

    get secTime() {
        return this.parent.secTime(this.beatTime); // TODO : cache
    }
}