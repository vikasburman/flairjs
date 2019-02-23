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
    <!-- inject: ./(bundle)/misc/noop.js -->   
    <!-- inject: ./(bundle)/helpers/general.js -->  
    <!-- inject: ./(bundle)/error/exception.js -->  
    <!-- inject: ./(bundle)/helpers/dispatcher.js -->   

    <!-- inject: ./(bundle)/attributes/getAttr.js -->   
    <!-- inject: ./(bundle)/bundle/getAssembly.js -->   
    <!-- inject: ./(bundle)/bundle/Resource.js -->   
    <!-- inject: ./(bundle)/bundle/getResource.js -->  
    <!-- inject: ./(bundle)/bundle/getType.js -->   
    <!-- inject: ./(bundle)/inheritance/typeOf.js -->   
    <!-- inject: ./(bundle)/inheritance/getTypeOf.js -->    
    <!-- inject: ./(bundle)/inheritance/isDerivedFrom.js --> 
    <!-- inject: ./(bundle)/inheritance/isInstanceOf.js -->  
    <!-- inject: ./(bundle)/interface/as.js --> 
    <!-- inject: ./(bundle)/interface/is.js --> 
    <!-- inject: ./(bundle)/interface/isComplies.js -->  
    <!-- inject: ./(bundle)/interface/isImplements.js -->   
    <!-- inject: ./(bundle)/mixin/isMixed.js --> 

    <!-- inject: ./(bundle)/di/include.js -->  
    <!-- inject: ./(bundle)/dispose/dispose.js -->  
    <!-- inject: ./(bundle)/dispose/using.js -->   
    <!-- inject: ./(bundle)/error/args.js -->   
    <!-- inject: ./(bundle)/attributes/attr.js -->  

    <!-- inject: ./(bundle)/helpers/builder.js -->  
    <!-- inject: ./(bundle)/inheritance/class.js -->  
    <!-- inject: ./(bundle)/interface/interface.js -->  
    <!-- inject: ./(bundle)/inheritance/struct.js -->  
    <!-- inject: ./(bundle)/misc/enum.js --> 
    <!-- inject: ./(bundle)/mixin/mixin.js -->

    <!-- inject: ./(bundle)/events/on.js --> 
    <!-- inject: ./(bundle)/events/post.js --> 
    <!-- inject: ./(bundle)/bundle/cli.js -->   
    <!-- inject: ./(bundle)/bundle/assembly.js -->  
    <!-- inject: ./(bundle)/bundle/namespace.js -->  
    <!-- inject: ./(bundle)/di/container.js -->  
    <!-- inject: ./(bundle)/misc/telemetry.js -->    
    <!-- inject: ./(bundle)/aop/aspects.js -->   
    <!-- inject: ./(bundle)/serialization/serializer.js --> 
    <!-- inject: ./(bundle)/reflection/reflector.js -->    

    // freeze members
    flair.members = Object.freeze(flair.members);

    // return
    return Object.freeze(flair);
});    
