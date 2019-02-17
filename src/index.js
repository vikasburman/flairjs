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
    <!-- inject: ./aop/aspect.js -->
    <!-- inject: ./aop/aspects.js -->

    <!-- inject: ./attributes/attr.js -->
    <!-- inject: ./attributes/attribute.js -->
    <!-- inject: ./attributes/getAttr.js -->
    <!-- inject: ./attributes/getTypeAttr.js -->

    <!-- inject: ./bundle/cli.js -->
    <!-- inject: ./bundle/assembly.js -->
    <!-- inject: ./bundle/namespace.js -->
    <!-- inject: ./bundle/resource.js -->

    <!-- inject: ./di/container.js -->
    <!-- inject: ./di/include.js -->

    <!-- inject: ./dispose/dispose.js -->
    <!-- inject: ./dispose/using.js -->

    <!-- inject: ./error/args.js -->
    <!-- inject: ./error/exception.js -->

    <!-- inject: ./events/dispatcher.js -->
    <!-- inject: ./events/on.js -->

    <!-- inject: ./helpers/builder.js -->
    <!-- inject: ./helpers/general.js -->

    <!-- inject: ./inheritance/class.js -->
    <!-- inject: ./inheritance/getTypeOf.js -->
    <!-- inject: ./inheritance/isDerivedFrom.js -->
    <!-- inject: ./inheritance/isInstanceOf.js -->
    <!-- inject: ./inheritance/struct.js -->
    <!-- inject: ./inheritance/typeOf.js -->
    <!-- inject: ./inheritance/types.js -->

    <!-- inject: ./interface/as.js -->
    <!-- inject: ./interface/interface.js -->
    <!-- inject: ./interface/is.js -->
    <!-- inject: ./interface/isComplies.js -->
    <!-- inject: ./interface/isImplements.js -->

    <!-- inject: ./misc/enum.js -->
    <!-- inject: ./misc/noop.js -->
    <!-- inject: ./misc/telemetry.js -->

    <!-- inject: ./mixin/isMixed.js -->
    <!-- inject: ./mixin/mixin.js -->

    <!-- inject: ./reflection/reflector.js -->    

    <!-- inject: ./serialization/serializer.js -->

    // freeze members
    flair.members = Object.freeze(flair.members);

    // return
    return Object.freeze(flair);
});    
