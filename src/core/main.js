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
        let oojs = {},
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
            g.Class = oojs.Class; g.Mixin = oojs.Mixin; g.Interface = oojs.Interface; g.Structure = oojs.Structure;  g.Enum = oojs.Enum; g.Assembly = oojs.Assembly;
            g.using = oojs.using; g.as = oojs.as;
            g.Attribute = oojs.Attribute; 
            g.Aspects = oojs.Aspects; g.Aspect = oojs.Aspect; 
            g.Container = oojs.Container;
            g.Serializer = oojs.Serializer; 
            g.Reflector = oojs.Reflector;
        }

        // return
        return Object.freeze(oojs);
    };

    // export
    if (typeof (typeof module !== 'undefined' && module !== null ? module.exports : void 0) === 'object') {
        module.exports = def;
    } else if (typeof define === 'function' && typeof define.amd !== 'undefined') {
        define(function() { return def; });
    } else {
        this.oojs = def;
    }
}).call(this);