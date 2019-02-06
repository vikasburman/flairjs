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
(function(factory) { // eslint-disable-line getter-return
    'use strict';

    // add factory extensions for server-side CLI processing
    let isServer = (typeof global !== 'undefined');
    if (isServer) { factory.build = require('./flair.build.js'); }
    
    // freeze factory
    let _factory = Object.freeze(factory);
    
    // expose as module and globally
    if (typeof define === 'function' && define.amd) { // AMD support
        define(function() { return _factory; });
    } else if (typeof exports === 'object') { // CommonJS and Node.js module support
        if (module !== undefined && module.exports) {
            exports = module.exports = _factory; // Node.js specific `module.exports`
        }
        module.exports = exports = _factory; // CommonJS
    } else if (!isServer) {
        window.Flair = _factory; // expose factory as global
    }

}).call((new Function("try {return global;}catch(e){return window;}"))(), (opts) => {
    'use strict';

    // locals
    let isServer = (new Function("try {return this===global;}catch(e){return false;}"))(),
        _global = (isServer ? global : window),
        flair = {}, 
        sym = [],
        isTesting = false,
        noop = () => {},
        options = {};   

    // reset, if already initialized
    if(_global.flair) {
        // reset all globals
        let fn = null;
        for(let name of _global.flair.members) {
            fn = _global.flair[name]._ ? _global.flair[name]._.reset : null;
            if (typeof fn === 'function') { fn(); }
            delete _global[name];
        }

        // delete main global
        delete _global.flair;

        // continue to load or end
        if (typeof opts === 'string' && opts === 'END') { return; }
    }

    // process options
    if (!opts) { 
        opts = {};
    } else if (typeof opts === 'string') { // only symbols can be given as comma delimited string
        opts = { symbols: opts.split(',').map(item => item.trim()) };
    }
    options.symbols = Object.freeze(opts.symbols || []);
    sym = options.symbols,
    isTesting = (sym.indexOf('TEST') !== -1);
    options.env = Object.freeze({
        type: (isServer ? 'server' : 'client'),
        global: _global,
        isTesting: isTesting,
        isServer: (!isTesting ? isServer : (sym.indexOf('SERVER') !== -1 ? true : isServer)),
        isClient: (!isTesting ? !isServer : (sym.indexOf('CLIENT') !== -1 ? true : !isServer)),
        isProd: (sym.indexOf('DEBUG') === -1 && sym.indexOf('PROD') !== -1),
        isDebug: (sym.indexOf('DEBUG') !== -1),
        suppressGlobals: (typeof suppressGlobals !== 'undefined' ? opts.suppressGlobals : options.symbols.indexOf('SUPPRESS') !== -1),
        args: (isServer ? process.argv : new window.URLSearchParams(window.location.search))
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
    <!-- inject: ./misc/_helpers.js -->
    <!-- inject: ./types/exception.js -->
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
    <!-- inject: ./extend/port.js -->
    <!-- inject: ./extend/channel.js -->
    <!-- inject: ./misc/_builder.js -->
    <!-- inject: ./types/struct.js -->
    <!-- inject: ./assembly/assembly.js -->
    <!-- inject: ./assembly/namespace.js -->
    <!-- inject: ./assembly/types.js -->
    <!-- inject: ./types/class.js -->
    <!-- inject: ./types/mixin.js -->
    <!-- inject: ./types/interface.js -->
    <!-- inject: ./types/enum.js -->
    <!-- inject: ./types/proc.js -->
    <!-- inject: ./types/resource.js -->
    <!-- inject: ./di/container.js -->
    <!-- inject: ./attributes/attribute.js -->
    <!-- inject: ./attributes/async.js -->
    <!-- inject: ./attributes/deprecate.js -->
    <!-- inject: ./attributes/enumerate.js -->
    <!-- inject: ./di/include.js -->
    <!-- inject: ./di/inject.js -->
    <!-- inject: ./di/multiinject.js -->
    <!-- inject: ./aop/aspects.js -->
    <!-- inject: ./aop/aspect.js -->
    <!-- inject: ./serialization/serializer.js -->
    <!-- inject: ./reflection/reflector.js -->    

    // setup ports
    _Port.define('moduleLoader', 'function');                                       // to define an external server/client specific module loader of choice
    _Port.define('fileLoader', 'function');                                         // to define an external server/client specific file loader of choice
    _Port.define('sessionStorage', 'object', ['key', 'setItem', 'getItem']);        // to define an external server/client specific file loader of choice
    _Port.define('localStorage', 'object', ['key', 'setItem', 'getItem']);          // to define an external server/client specific file loader of choice
    _Port.define('pubsub', 'object', ['publish', 'subscribe']);                     // to define a pubsub library of choice having defined members

    // setup telemetry channels
    _Channel.define('raw', 'flair.system.raw');             // type and instances creation telemetry
    _Channel.define('exec', 'flair.system.execute');        // member access execution telemetry
    _Channel.define('info', 'flair.system.info');           // info, warning and exception telemetry
    _Channel.define('incl', 'flair.system.include');        // file or module include telemetry

    // set global
    if (!options.env.suppressGlobals) {
        for(let name of flair.members) {
            _global[name] = Object.freeze(flair[name]);
        }
    }
    flair.members = Object.freeze(flair.members);
    _global.flair = flair;

    // return
    return _global.flair;
});