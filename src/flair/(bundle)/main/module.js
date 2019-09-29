if (typeof define === 'function' && define.amd) { // AMD support
    define(() => { return factory(); });
} else if (typeof exports === 'object') { // CommonJS and Node.js module support
    let fo = factory();
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = fo; // Node.js specific `module.exports`
    }
    module.exports = exports = fo; // CommonJS        
} else { // expose as global on window
    root.flair = factory();
}