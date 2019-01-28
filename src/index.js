/**
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

    // add build engine to create assemblies on server
    let isServer = (typeof global !== 'undefined');
    if (isServer) { factory.build = require('./flair.build.js'); }

    // freeze
    let _factory = Object.freeze(factory);

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

    // reset everything and then proceed to set a clean environment
    let isServer = (new Function("try {return this===global;}catch(e){return false;}"))(),
        _global = (isServer ? global : window);
    if(_global.flair) { 
        // reset all globals
        let resetFunc = null,
            internalAPI = null;
        for(let name of _global.flair.members) {
            internalAPI = _global.flair[name]._;
            resetFunc = (internalAPI && internalAPI.reset) ? internalAPI.reset : null;
            if (typeof resetFunc === 'function') { resetFunc(); }
            delete _global[name];
        }
        
        // delete main global
        delete _global.flair;

        // special case (mostly for testing)
        if (typeof opts === 'string' && opts === 'END') { return; } // don't continue with reset
    }

    // environment
    if (!opts) { 
        opts = {}; 
    } else if (typeof opts === 'string') { // only symbols can be given as comma delimited string
        opts = { symbols: opts.split(',').map(item => item.trim()) };
    }

    // core support objects
    <!-- inject: ./misc/_exception.js -->
    <!-- inject: ./misc/_typeOf.js -->
    <!-- inject: ./misc/_is.js -->
    <!-- inject: ./misc/_args.js -->

    // helpers
    <!-- inject: ./misc/helpers.js -->

    let flair = { members: [] },
        noop = () => {},
        sym = (opts.symbols || []), // eslint-disable-next-line no-unused-vars
        noopAsync = (resolve, reject) => { resolve(); },
        _args = (isServer ? process.argv : new window.URLSearchParams(window.location.search)),
        isTesting = (sym.indexOf('TEST') !== -1);

    // forced server/client mocking for test environment
    if (isTesting) {
        if (sym.indexOf('SERVER') !== -1) { 
            isServer = true;
        } else if (sym.indexOf('CLIENT') !== -1) {
            isServer = false;
        }
    }

    // options
    let options = Object.freeze({
            symbols: Object.freeze(sym),
            env: Object.freeze({
                type: opts.env || (isServer ? 'server' : 'client'),
                isTesting: isTesting,
                isServer: isServer,
                isClient: !isServer,
                isProd: (sym.indexOf('PROD') !== -1),
                isDebug: (sym.indexOf('DEBUG') !== -1),
                global: _global,
                supressGlobals: (typeof opts.supressGlobals === 'undefined' ? false : opts.supressGlobals),
                args: _args
            }),
            loaders: Object.freeze({
                module: Object.freeze({ // (file) => {} that gives a promise to resolve with the module object, on success
                    server: opts.moduleLoaderServer || null,
                    client: opts.moduleLoaderClient || null  
                }),
                file: Object.freeze({ // (file) => {} that gives a promise to resolve with file content, on success
                    server: opts.fileLoaderServer || null,
                    client: opts.fileLoaderClient || null
                }),
                define: (type, fn) => {
                    if (_Args('string, function')(type, fn).isInvalid()) { throw new _Exception('InvalidArgument', `Arguments type error. (${type})`); }
                    let loaderOverrides = flair.options.loaderOverrides;
                    switch(type) { // NOTE: only once these can be defined after loading
                        case 'sm': loaderOverrides.moduleLoaderServer = loaderOverrides.moduleLoaderServer || fn; break;
                        case 'cm': loaderOverrides.moduleLoaderClient = loaderOverrides.moduleLoaderClient || fn; break;
                        case 'sf': loaderOverrides.fileLoaderServer = loaderOverrides.fileLoaderServer || fn; break;
                        case 'cf': loaderOverrides.fileLoaderClient = loaderOverrides.fileLoaderClient || fn; break;
                    }
                }
            }),
            loaderOverrides: {
                moduleLoaderServer: null,
                moduleLoaderClient: null,
                fileLoaderServer: null,
                fileLoaderClient: null
            }
        });
    
    // special symbols
    if (options.env.isProd && options.env.isDebug) { // when both are given
        throw new _Exception('InvalidOption', `DEBUG and PROD symbols are mutually exclusive. Use only one of these symbols.`);
    }

    flair._ = Object.freeze({
        name: '<title>',
        version: '<version>',
        copyright: '<copyright>',
        license: '<license>',
        link: '<link>',
        lupdate: new Date('<datetime>')
    });
    flair.info = flair._;
    flair.options = options;

    <!-- inject: ./types/exception.js -->
    <!-- inject: ./types/args.js -->
    <!-- inject: ./assembly/assembly.js -->
    <!-- inject: ./assembly/namespace.js -->
    <!-- inject: ./assembly/types.js -->
    <!-- inject: ./types/class.js -->
    <!-- inject: ./types/mixin.js -->
    <!-- inject: ./types/interface.js -->
    <!-- inject: ./types/enum.js -->
    <!-- inject: ./types/proc.js -->
    <!-- inject: ./types/resource.js -->
    <!-- inject: ./types/structure.js -->
    <!-- inject: ./func/bring.js -->
    <!-- inject: ./func/using.js -->
    <!-- inject: ./func/as.js -->
    <!-- inject: ./func/typeOf.js -->
    <!-- inject: ./func/is.js -->
    <!-- inject: ./func/isDerivedFrom.js -->
    <!-- inject: ./func/isImplements.js -->
    <!-- inject: ./func/isInstanceOf.js -->
    <!-- inject: ./func/isMixed.js -->
    <!-- inject: ./di/container.js -->
    <!-- inject: ./attributes/attribute.js -->
    <!-- inject: ./attributes/async.js -->
    <!-- inject: ./attributes/deprecate.js -->
    <!-- inject: ./attributes/enumerate.js -->
    <!-- inject: ./di/inject.js -->
    <!-- inject: ./di/multiinject.js -->
    <!-- inject: ./aop/aspects.js -->
    <!-- inject: ./aop/aspect.js -->
    <!-- inject: ./serialization/serializer.js -->
    <!-- inject: ./reflection/reflector.js -->

    // expose to global environment
    if (!options.env.supressGlobals) {
        for(let name of flair.members) {
            _global[name] = Object.freeze(flair[name]);
        }
    }
    flair.members = Object.freeze(flair.members);
    _global.flair = Object.freeze(flair); // this is still exposed, so can be used globally

    // return
    return _global.flair;
});