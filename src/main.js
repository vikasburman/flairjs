/**
 * <basename>.js
 * <desc>
 * Version <version>
 * <copyright>
 * <license>
 */
(function() {
    // the definition
    const def = (opts = {}) => {
        let isServer = (new Function("try {return this===global;}catch(e){return false;}"))(),
            getGlobal = new Function("try {return (this===global ? global : window);}catch(e){return window;}");
        let flair = {},
            noop = () => {},
            noopAsync = (resolve, reject) => { resolve(); },
            options = {
                env: opts.env || (isServer ? 'server' : 'client'),
                global: getGlobal(),
                supressGlobals: (typeof opts.supressGlobals === 'undefined' ? false : opts.supressGlobals),
                symbols: opts.symbols || []
            };

        <!-- inject: ./types/class.js -->
        <!-- inject: ./types/mixin.js -->
        <!-- inject: ./types/interface.js -->
        <!-- inject: ./types/enum.js -->
        <!-- inject: ./types/structure.js -->
        <!-- inject: ./types/assembly.js -->
        
        <!-- inject: ./func/using.js -->
        <!-- inject: ./func/as.js -->

        <!-- inject: ./aop/aspects.js -->
        <!-- inject: ./aop/aspect.js -->

        <!-- inject: ./di/container.js -->

        <!-- inject: ./attributes/attribute.js -->
        <!-- inject: ./attributes/async.js -->
        <!-- inject: ./attributes/deprecate.js -->
        <!-- inject: ./attributes/enumerate.js -->
        <!-- inject: ./attributes/inject.js -->
        <!-- inject: ./attributes/multiinject.js -->

        <!-- inject: ./serialization/serializer.js -->

        <!-- inject: ./reflection/reflector.js -->

        // expose to global environment
        if (!options.supressGlobals) { 
            let g = options.global;
            g.Class = flair.Class; g.Mixin = flair.Mixin; g.Interface = flair.Interface; g.Structure = flair.Structure;  g.Enum = flair.Enum; g.Assembly = flair.Assembly;
            g.using = flair.using; g.as = flair.as;
            g.Attribute = flair.Attribute; 
            g.Aspects = flair.Aspects; g.Aspect = flair.Aspect; 
            g.Container = flair.Container;
            g.Serializer = flair.Serializer; 
            g.Reflector = flair.Reflector;
        }

        // return
        return Object.freeze(flair);
    };

    // export
    if (typeof (typeof module !== 'undefined' && module !== null ? module.exports : void 0) === 'object') {
        module.exports = def;
    } else if (typeof define === 'function' && typeof define.amd !== 'undefined') {
        define(function() { return def; });
    } else {
        this.flair = def;
    }
}).call(this);