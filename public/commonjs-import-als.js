/**
 * Created by mlavigne on 08/01/2016.
 * @require commonjs-import.js
 */

// Bouchon pour accepter la ligne commonjs : var _ = require("underscore");
// Bouchon pour accepter la ligne commonjs : module.exports = als
window.setModuleExports('als', {
    'underscore': '_'
});
