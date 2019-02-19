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
        disposers = [],
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
    const a2f = (name, obj, disposer) => {
        flair[name] = Object.freeze(obj);
        flair.members.push(name);
        if (typeof disposer === 'function') { disposers.push(disposer); }
    };

    // members
    <!-- inject: ./misc/noop.js -->     // OK
    <!-- inject: ./helpers/general.js -->   // OK
    <!-- inject: ./error/exception.js -->   // OK
    <!-- inject: ./helpers/dispatcher.js -->    // OK

    <!-- inject: ./attributes/getAttr.js -->    // OK
    <!-- inject: ./bundle/getAssembly.js -->    // OK
    <!-- inject: ./bundle/getResource.js -->    // OK
    <!-- inject: ./bundle/getType.js -->    // OK
    <!-- inject: ./inheritance/typeOf.js -->    // OK
    <!-- inject: ./inheritance/getTypeOf.js -->     // OK 
    <!-- inject: ./inheritance/isDerivedFrom.js --> // OK
    <!-- inject: ./inheritance/isInstanceOf.js -->  // OK
    <!-- inject: ./interface/as.js -->  // OK
    <!-- inject: ./interface/is.js -->  // OK
    <!-- inject: ./interface/isComplies.js -->  // OK
    <!-- inject: ./interface/isImplements.js -->    // OK
    <!-- inject: ./mixin/isMixed.js --> // OK

    <!-- inject: ./di/include.js -->    // OK
    <!-- inject: ./dispose/dispose.js -->   // OK
    <!-- inject: ./dispose/using.js -->     // OK
    <!-- inject: ./error/args.js -->    // OK
    <!-- inject: ./attributes/attr.js -->   // OK

    <!-- inject: ./helpers/builder.js -->   // OK
    <!-- inject: ./inheritance/class.js -->  // OK
    <!-- inject: ./interface/interface.js -->   // OK
    <!-- inject: ./inheritance/struct.js -->    // OK
    <!-- inject: ./misc/enum.js --> // OK
    <!-- inject: ./mixin/mixin.js -->

    <!-- inject: ./events/on.js --> // OK
    <!-- inject: ./events/post.js --> // OK
    <!-- inject: ./bundle/cli.js -->    // OK
    <!-- inject: ./bundle/assembly.js -->   // OK
    <!-- inject: ./bundle/namespace.js -->  // OK
    <!-- inject: ./bundle/resource.js -->   // OK
    <!-- inject: ./di/container.js -->  // OK
    <!-- inject: ./misc/telemetry.js -->    // OK
    <!-- inject: ./aop/aspects.js -->   // OK
    <!-- inject: ./serialization/serializer.js -->  // OK
    <!-- inject: ./reflection/reflector.js -->    

    <!-- inject: ./aop/aspect.js -->    // OK
    <!-- inject: ./attributes/attribute.js -->  // OK

    // freeze members
    flair.members = Object.freeze(flair.members);

    // return
    return Object.freeze(flair);
});    
