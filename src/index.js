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
    <!-- inject: ./attributes/getAttr.js -->    // OK
    <!-- inject: ./attributes/getTypeAttr.js -->    // OK

    <!-- inject: ./bundle/cli.js -->    // OK
    <!-- inject: ./bundle/assembly.js -->
    <!-- inject: ./bundle/namespace.js -->
    <!-- inject: ./bundle/resource.js -->

    <!-- inject: ./di/container.js -->
    <!-- inject: ./di/include.js -->

    <!-- inject: ./dispose/dispose.js -->   // OK
    <!-- inject: ./dispose/using.js -->     // OK

    <!-- inject: ./error/args.js -->    // OK
    <!-- inject: ./error/exception.js -->

    <!-- inject: ./events/on.js --> // OK

    <!-- inject: ./helpers/builder.js -->   // OK
    <!-- inject: ./helpers/dispatcher.js -->    // OK
    <!-- inject: ./helpers/general.js -->   // OK

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
    <!-- inject: ./misc/noop.js -->     // OK
    <!-- inject: ./misc/telemetry.js -->    // OK

    <!-- inject: ./mixin/isMixed.js -->
    <!-- inject: ./mixin/mixin.js -->

    <!-- inject: ./reflection/reflector.js -->    

    <!-- inject: ./serialization/serializer.js -->  // OK

    // freeze members
    flair.members = Object.freeze(flair.members);

    // return
    return Object.freeze(flair);
});    
