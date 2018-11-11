/**
 * oojs.js
 * version 1.0.0
 * (C) 2017-2018, Vikas Burman
 * MIT License 
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

        <!-- inject: ./core/class.js -->
        <!-- inject: ./core/mixin.js -->
        <!-- inject: ./core/interface.js -->
        <!-- inject: ./core/enum.js -->
        <!-- inject: ./core/structure.js -->
        <!-- inject: ./core/assembly.js -->
        <!-- inject: ./core/using.js -->
        <!-- inject: ./core/as.js -->

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