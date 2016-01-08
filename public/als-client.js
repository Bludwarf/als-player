/**
 * Created by mlavigne on 08/01/2016.
 *
 * @require als-module (compilé de als-module.ts en commonjs puis modifier à la main en s'aidant de both.js
 */

if (!als) throw new Error('als-module.js doit être chargé avant');

/**
 * Utilisation : this.loadJsonParts(als.local.jsonParts[this.name]); pour les tests en local
 * @param jsonParts définies dans l'objet als.jsonParts par jsonParts-Voyage-20151217.js par exemple (cf resources/client-local-test/loadLocalJsonParts.js)
 * @returns {string}
 */
als.LiveSet.prototype.loadJsonParts = function(jsonParts) {
    this.audioClips = jsonParts.audioClips;
    this.midiClips = jsonParts.midiClips;
    if (jsonParts.warpMarkers) this.warpMarkers = new als.WarpMarkers(jsonParts.warpMarkers);
    this.locators = this.initElements(jsonParts.locators, function(json) {
        return new als.Locator(json);
    });
};
