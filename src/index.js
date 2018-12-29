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
            g.Class = Object.freeze(flair.Class); 
            g.Mixin = Object.freeze(flair.Mixin); 
            g.Interface = Object.freeze(flair.Interface); 
            g.Structure = Object.freeze(flair.Structure);  
            g.Enum = Object.freeze(flair.Enum); 
            g.Assembly = Object.freeze(flair.Assembly);
            g.using = Object.freeze(flair.using); 
            g.as = Object.freeze(flair.as);
            g.Attribute = Object.freeze(flair.Attribute); 
            g.Aspects = Object.freeze(flair.Aspects); 
            g.Aspect = Object.freeze(flair.Aspect); 
            g.Container = Object.freeze(flair.Container);
            g.Serializer = Object.freeze(flair.Serializer); 
            g.Reflector = Object.freeze(flair.Reflector);
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