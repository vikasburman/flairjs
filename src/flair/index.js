/**
 * @name flair
 * @description Initializer
 */
(function(root, factory) {
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
    <!-- inject: ./_members/misc/noop.js -->     // OK
    <!-- inject: ./_members/helpers/general.js -->   // OK
    <!-- inject: ./_members/error/exception.js -->   // OK
    <!-- inject: ./_members/helpers/dispatcher.js -->    // OK

    <!-- inject: ./_members/attributes/getAttr.js -->    // OK
    <!-- inject: ./_members/bundle/getAssembly.js -->    // OK
    <!-- inject: ./_members/bundle/Resource.js -->    // OK
    <!-- inject: ./_members/bundle/getResource.js -->    // OK
    <!-- inject: ./_members/bundle/getType.js -->    // OK
    <!-- inject: ./_members/inheritance/typeOf.js -->    // OK
    <!-- inject: ./_members/inheritance/getTypeOf.js -->     // OK 
    <!-- inject: ./_members/inheritance/isDerivedFrom.js --> // OK
    <!-- inject: ./_members/inheritance/isInstanceOf.js -->  // OK
    <!-- inject: ./_members/interface/as.js -->  // OK
    <!-- inject: ./_members/interface/is.js -->  // OK
    <!-- inject: ./_members/interface/isComplies.js -->  // OK
    <!-- inject: ./_members/interface/isImplements.js -->    // OK
    <!-- inject: ./_members/mixin/isMixed.js --> // OK

    <!-- inject: ./_members/di/include.js -->    // OK
    <!-- inject: ./_members/dispose/dispose.js -->   // OK
    <!-- inject: ./_members/dispose/using.js -->     // OK
    <!-- inject: ./_members/error/args.js -->    // OK
    <!-- inject: ./_members/attributes/attr.js -->   // OK

    <!-- inject: ./_members/helpers/builder.js -->   // OK
    <!-- inject: ./_members/inheritance/class.js -->  // OK
    <!-- inject: ./_members/interface/interface.js -->   // OK
    <!-- inject: ./_members/inheritance/struct.js -->    // OK
    <!-- inject: ./_members/misc/enum.js --> // OK
    <!-- inject: ./_members/mixin/mixin.js -->

    <!-- inject: ./_members/events/on.js --> // OK
    <!-- inject: ./_members/events/post.js --> // OK
    <!-- inject: ./_members/bundle/cli.js -->    // OK
    <!-- inject: ./_members/bundle/assembly.js -->   // OK
    <!-- inject: ./_members/bundle/namespace.js -->  // OK
    <!-- inject: ./_members/di/container.js -->  // OK
    <!-- inject: ./_members/misc/telemetry.js -->    // OK
    <!-- inject: ./_members/aop/aspects.js -->   // OK
    <!-- inject: ./_members/serialization/serializer.js -->  // OK
    <!-- inject: ./_members/reflection/reflector.js -->    

    // freeze members
    flair.members = Object.freeze(flair.members);

    // return
    return Object.freeze(flair);
});    
