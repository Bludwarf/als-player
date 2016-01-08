/**
 * Created by mlavigne on 08/01/2016.
 * @require als-both.js (als client et serveur)
 */

// Le JSON en entier (copier-coller du contenu des fichiers JSON) doit apparaitre pour chaque pattern
// exemple :
// 1 - Importer dans le HTML le fichier jsonParts-Voyage-20151217.js qui défini jsonParts['Voyage-20151217'] = {midiClips: ..., locators: ...};

/**
 * Cf local-test/loadLocalJsonParts
 * @returns {string}
 */
als.LiveSet.prototype.loadLocalJsonParts = function() {
    // Données locales
    return this.loadJsonParts(als.local.jsonParts[this.name]);
};