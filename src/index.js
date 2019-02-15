/**
 * @preserve
 * <title>
 * <desc>
 * Version <version>
 * <datetime>
 * <copyright>
 * <license>
 * <link>
 */

// eslint-disable-next-line for-direction
(function(root, factory) { // eslint-disable-line getter-return
    'use strict';

    if (typeof define === 'function' && define.amd) { // AMD support
        define(factory);
    } else if (typeof exports === 'object') { // CommonJS and Node.js module support
        if (module !== undefined && module.exports) {
            exports = module.exports = factory(); // Node.js specific `module.exports`
        }
        module.exports = exports = factory(); // CommonJS        
    } else { // expose as global on window
        root.flair = factory();
    }
})(this, function() {
    'use strict';

    // locals
    let isServer = new Function("try {return this===global;}catch(e){return false;}")(),
        _global = (isServer ? global : window),
        _noop = () => {},
        flair = {},
        sym = [],
        options = {},
        argsString = '';

    // read symbols from environment
    if (isServer) {
        let idx = process.argv.findIndex((item) => { return (item.startsWith('--flairSymbols') ? true : false); });
        if (idx !== -1) { argsString = process.argv[idx].substr(2).split('=')[1]; }
    } else {
        argsString = (typeof window.flairSymbols !== 'undefined') ? window.flairSymbols : '';
    }
    if (argsString) { sym = argsString.split(',').map(item => item.trim()); }

    options.symbols = Object.freeze(sym);
    options.env = Object.freeze({
        type: (isServer ? 'server' : 'client'),
        global: _global,
        isTesting: (sym.indexOf('TEST') !== -1),
        isServer: isServer,
        isClient: !isServer,
        isCordova: (!isServer && !!window.cordova),
        isNodeWebkit: (isServer && process.versions['node-webkit']),
        isProd: (sym.indexOf('DEBUG') === -1 && sym.indexOf('PROD') !== -1),
        isDebug: (sym.indexOf('DEBUG') !== -1)
    });

    // flair
    flair.info = Object.freeze({
        name: '<title>',
        version: '<version>',
        copyright: '<copyright>',
        license: '<license>',
        link: '<link>',
        lupdate: new Date('<datetime>')
    });
    flair.members = [];
    flair.options = Object.freeze(options);

    // members
    <!-- inject: ./helpers/general.js -->
    <!-- inject: ./helpers/dispatcher.js -->
    <!-- inject: ./func/on.js -->
    <!-- inject: ./telemetry/telemetry.js -->
    <!-- inject: ./classes/exception.js -->
    <!-- inject: ./func/args.js -->
    <!-- inject: ./func/typeOf.js -->
    <!-- inject: ./func/isInstanceOf.js -->
    <!-- inject: ./func/is.js -->
    <!-- inject: ./func/isDerivedFrom.js -->
    <!-- inject: ./func/isImplements.js -->
    <!-- inject: ./func/isComplies.js -->
    <!-- inject: ./func/isMixed.js -->
    <!-- inject: ./func/as.js -->
    <!-- inject: ./func/using.js -->
    <!-- inject: ./func/attr.js -->
    <!-- inject: ./func/events.js -->
    <!-- inject: ./helpers/builder.js -->
    <!-- inject: ./types/struct.js -->
    <!-- inject: ./assembly/assembly.js -->
    <!-- inject: ./assembly/namespace.js -->
    <!-- inject: ./assembly/types.js -->
    <!-- inject: ./types/class.js -->
    <!-- inject: ./types/mixin.js -->
    <!-- inject: ./types/interface.js -->
    <!-- inject: ./types/enum.js -->
    <!-- inject: ./classes/resource.js -->
    <!-- inject: ./di/container.js -->
    <!-- inject: ./attributes/attribute.js -->
    <!-- inject: ./di/include.js -->
    <!-- inject: ./di/inject.js -->
    <!-- inject: ./di/multiinject.js -->
    <!-- inject: ./aop/aspects.js -->
    <!-- inject: ./aop/aspect.js -->
    <!-- inject: ./serialization/serializer.js -->
    <!-- inject: ./reflection/reflector.js -->    
    <!-- inject: ./cli/build.js -->  

    // freeze members
    flair.members = Object.freeze(flair.members);

    // return
    return Object.freeze(flair);
});    
