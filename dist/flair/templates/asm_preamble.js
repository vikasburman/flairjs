/**
 * @preserve
 * Preamble for assemblies at: <<path>>
 * Created: <<lupdate>>
 */
(function(root, loader) {
    'use strict';

    if (typeof define === 'function' && define.amd) { // AMD support
        define(loader);
    } else if (typeof exports === 'object') { // CommonJS and Node.js module support
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = loader; // Node.js specific module.exports
        }
        module.exports = exports = loader; // CommonJS        
    } else { // expose as global on window
        root['preambles'] = root['preambles'] || [];
        root['preambles'][].push(loader);
    }
})(this, async function(flair) {
    'use strict';

    <<preamble_payload>>
});