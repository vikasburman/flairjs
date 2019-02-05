// add build engine to create assemblies on server
let isServer = (typeof global !== 'undefined');
if (isServer) { factory.build = require('./flair.build.js'); }

// freeze
let _factory = Object.freeze(factory);

if (typeof define === 'function' && define.amd) { // AMD support
    define(function() { return _factory; });
} else if (typeof exports === 'object') { // CommonJS and Node.js module support
    if (module !== undefined && module.exports) {
        exports = module.exports = _factory; // Node.js specific `module.exports`
    }
    module.exports = exports = _factory; // CommonJS
} else if (!isServer) {
    window.Flair = _factory; // expose factory as global
}