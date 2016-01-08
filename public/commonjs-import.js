/**
 * Created by mlavigne on 08/01/2016.
 *
 * Avant on faisait :

 // Transpiler als-module.ts en commonjs avec les options : --target es5 --module commonjs
 // Copier le .js transpilé dans ce dossier
 // Remplacer la ligne tout en haut : var _ = require("underscore");
 // par :
 if (!window) var _ = require("underscore");

 // Remplacer la ligne tout en bas :  module.exports = als;
 // par :
 if (window) window.als = als;
 else module.exports = als;

 */

// Bouchon pour accepter la ligne commonjs : var _ = require("underscore");
window.require = function(moduleName) {
    var module = this.alreadyLoadedModules[moduleName];
    // Normalement on a déjà du charger le module
    if (!module) throw new Error('Il faut charger le module '+moduleName+' avant de charger ce script');
    return module;
};

/**
 * Exemple ('underscore', '_')
 * @param module
 * @param exportedName
 */
window.addAlreadyLoadedModule = function(module, exportedName) {
    this.alreadyLoadedModules = this.alreadyLoadedModules || {};
    this.alreadyLoadedModules[module] = this[exportedName];
};

// Bouchon pour accepter la ligne commonjs : module.exports = als
window.module = {};

/**
 *
 * @param moduleName
 * @param deps module déjà importés manuellement
 */
window.setModuleExports = function(moduleName, deps) {
    Object.defineProperty(window.module, "exports", {
        set: function(module) {
            window[moduleName] = module;
        }
    });

    // deps ?
    if (deps) {
        for (var module in deps) {
            var exportedName = deps[module];
            this.addAlreadyLoadedModule(module, exportedName);
        }
    }
};