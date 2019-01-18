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

    // add build time support for server
    // build engine to create assemblies
    if ((new Function("try {return this===global;}catch(e){return false;}"))()) { // server
        factory.build = require('./flair.build.js');
    }

    // state;
    factory.isInitialized = false;

    // freezed version
    let _factory = Object.freeze(factory);

    if (typeof define === 'function' && define.amd) { // AMD support
        define(function() { return _factory; });
    } else if (typeof exports === 'object') { // CommonJS and Node.js module support
        if (module !== undefined && module.exports) {
            exports = module.exports = _factory; // Node.js specific `module.exports`
        }
        exports.flair = _factory; // CommonJS module 1.1.1 spec
        module.exports = exports = _factory; // CommonJS
    } else if (this === window) { // client side global
        this.flair = _factory;
    }
}).call(this, (opts) => {
    'use strict';

    if(this.flair && typeof this.flair !== 'function') { return this.flair; }
    let isServer = (new Function("try {return this===global;}catch(e){return false;}"))(),
        getGlobal = new Function("try {return (this===global ? global : window);}catch(e){return window;}");
    if (!opts) { opts = {}; }
    if (typeof opts === 'string') { // only symbols can be given as comma delimited string
        opts = {
            symbols: opts.split(',').map(item => item.trim())
        };
    }

    const guid = () => {
        return '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    const flarized = (type, name, obj, mex = {}) => {
        // check
        if (!name || typeof name !== 'string') { throw `000000: Invalid type name ${name}.`; }

        // add meta information
        let _ = mex; // whatever meta extensions are provided
        _.name = name;
        _.type = type;
        _.namespace = null;
        _.assembly = () => { return flair.Assembly.get(name) || null; };
        _.id = guid();
        _.__ = {}; // store any dynamic information here under this unfreezed area

        // attach meta
        obj._ = _;

        // register obj with namespace
        flair.Namespace(obj); // instances are not

        // freeze meta
        obj._ = Object.freeze(obj._);

        // return freezed
        return Object.freeze(obj);
    };
    const flarizedInstance = (type, obj, mex = {}) => {
        // add meta information
        let _ = mex; // whatever meta extensions are provided
        _.type = type;
        _.id = guid();
        _.__ = {}; // store any dynamic information here under this unfreezed area

        // attach freezed meta
        obj._ = Object.freeze(_);

        // return freezed
        return Object.freeze(obj);
    };    

    let flair = {
            isInitialized: true,
            members: []
        },
        noop = () => {},
        sym = (opts.symbols || []), // eslint-disable-next-line no-unused-vars
        noopAsync = (resolve, reject) => { resolve(); },
        options = Object.freeze({
            symbols: Object.freeze(sym),
            env: Object.freeze({
                type: opts.env || (isServer ? 'server' : 'client'),
                isServer: isServer,
                isClient: !isServer,
                isProd: (sym.indexOf('PROD') !== -1),
                isDebug: (sym.indexOf('DEBUG') !== -1),
                global: getGlobal(),
                supressGlobals: (typeof opts.supressGlobals === 'undefined' ? false : opts.supressGlobals),
                args: (isServer ? process.argv : new URLSearchParams(location.search))
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
                    // NOTE: only once these can be defined after loading
                    let loaderOverrides = flair.options.loaderOverrides;
                    switch(type) {
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
        throw `DEBUG and PROD symbols are mutually exclusive. Use only one.`;
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

    <!-- inject: ./misc/exception.js -->
    <!-- inject: ./assembly/assembly.js -->
    <!-- inject: ./assembly/namespace.js -->
    <!-- inject: ./types/class.js -->
    <!-- inject: ./types/mixin.js -->
    <!-- inject: ./types/interface.js -->
    <!-- inject: ./types/enum.js -->
    <!-- inject: ./types/proc.js -->
    <!-- inject: ./types/resource.js -->
    <!-- inject: ./types/structure.js -->
    <!-- inject: ./func/which.js -->
    <!-- inject: ./func/bring.js -->
    <!-- inject: ./func/using.js -->
    <!-- inject: ./func/as.js -->
    <!-- inject: ./func/is.js -->
    <!-- inject: ./func/classOf.js -->
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
    let g = options.env.global;
    if (!options.env.supressGlobals) {
        for(let name of flair.members) {
            g[name] = Object.freeze(flair[name]);
        }
    }
    flair.members = Object.freeze(flair.members);
    g.flair = Object.freeze(flair); // this is still exposed, so can be used globally

    // return
    return g.flair;
});