/**
 * @preserve
 * <<title>>
 * <<desc>>
 * 
 * Assembly: <<asm>>
 *     File: <<file>>
 *  Version: <<version>>
 *  <<lupdate>>
 * 
 * <<copyright>>
 * <<license>>
 */
(function(root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) { // AMD support
        define(() => { return factory; });
    } else if (typeof exports === 'object') { // CommonJS and Node.js module support
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = factory; // Node.js specific module.exports
        }
        module.exports = exports = factory; // CommonJS        
    } else { // expose as global on root
        root['<<asm>>'] = factory;
    }
})(this, async function(flair, __asmFile) {
    'use strict';

    <<asm_payload>>
});