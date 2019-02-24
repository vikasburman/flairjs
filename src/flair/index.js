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
        isWorker = isServer ? (!require('worker_threads').isMainThread) : (typeof WorkerGlobalScope !== undefined ? true : false),
        _global = (isServer ? global : (isWorker ? WorkerGlobalScope : window)),
        flair = {},
        sym = [],
        disposers = [],
        options = {},
        flairTypes = ['class', 'enum', 'interface', 'mixin', 'struct'],
        argsString = '';

    // read symbols from environment
    if (isServer) {
        let idx = process.argv.findIndex((item) => { return (item.startsWith('--flairSymbols') ? true : false); });
        if (idx !== -1) { argsString = process.argv[idx].substr(2).split('=')[1]; }
    } else {
        argsString = (typeof _global.flairSymbols !== 'undefined') ? _global.flairSymbols : '';
    }
    if (argsString) { sym = argsString.split(',').map(item => item.trim()); }

    options.symbols = Object.freeze(sym);
    options.env = Object.freeze({
        type: (isServer ? 'server' : 'client'),
        global: _global,
        isTesting: (sym.indexOf('TEST') !== -1),
        isServer: isServer,
        isClient: !isServer,
        isWorker : isWorker,
        isMain: !isWorker,
        isCordova: (!isServer && !!_global.cordova),
        isNodeWebkit: (isServer && process.versions['node-webkit']),
        isProd: (sym.indexOf('DEBUG') === -1 && sym.indexOf('PROD') !== -1),
        isDebug: (sym.indexOf('DEBUG') !== -1)
    });

    // flair
    flair.info = Object.freeze({
        name: '<<name>>',
        version: '<<version>>',
        copyright: '<<copyright>>',
        license: '<<license>>',
        lupdate: new Date('<<lupdate>>')
    });
    flair.members = [];
    flair.options = Object.freeze(options);
    const a2f = (name, obj, disposer) => {
        flair[name] = Object.freeze(obj);
        flair.members.push(name);
        if (typeof disposer === 'function') { disposers.push(disposer); }
    };

    // members
    <!-- inject: ./(bundle)/types/support/noop.js -->   
    <!-- inject: ./(bundle)/types/support/Exception.js -->  
    <!-- inject: ./(bundle)/types/support/Dispatcher.js -->
    <!-- inject: ./(bundle)/port/port.js -->
    <!-- inject: ./(bundle)/types/support/general.js -->  

    <!-- inject: ./(bundle)/assembly/AssemblyLoadContext.js -->  
    <!-- inject: ./(bundle)/assembly/Assembly.js -->  
    <!-- inject: ./(bundle)/assembly/Resource.js -->  
    <!-- inject: ./(bundle)/assembly/AppDomain.js -->  

    <!-- inject: ./(bundle)/types/get/getAttr.js -->   
    <!-- inject: ./(bundle)/types/get/getAssembly.js -->   
    <!-- inject: ./(bundle)/types/get/getContext.js -->   
    <!-- inject: ./(bundle)/types/get/getResource.js -->  
    <!-- inject: ./(bundle)/types/get/getType.js -->   
    <!-- inject: ./(bundle)/types/get/typeOf.js -->   
    <!-- inject: ./(bundle)/types/get/getTypeOf.js -->    
    <!-- inject: ./(bundle)/types/check/isDerivedFrom.js --> 
    <!-- inject: ./(bundle)/types/check/isInstanceOf.js -->  
    <!-- inject: ./(bundle)/types/check/as.js --> 
    <!-- inject: ./(bundle)/types/check/is.js --> 
    <!-- inject: ./(bundle)/types/check/isComplies.js -->  
    <!-- inject: ./(bundle)/types/check/isImplements.js -->   
    <!-- inject: ./(bundle)/types/check/isMixed.js --> 

    <!-- inject: ./(bundle)/di/include.js -->  
    <!-- inject: ./(bundle)/types/lifecycle/dispose.js -->  
    <!-- inject: ./(bundle)/types/lifecycle/using.js -->   
    <!-- inject: ./(bundle)/types/support/args.js -->   
    <!-- inject: ./(bundle)/attributes/attr.js -->  

    <!-- inject: ./(bundle)/types/support/builder.js -->  
    <!-- inject: ./(bundle)/types/class.js -->  
    <!-- inject: ./(bundle)/types/interface.js -->  
    <!-- inject: ./(bundle)/types/struct.js -->  
    <!-- inject: ./(bundle)/types/enum.js --> 
    <!-- inject: ./(bundle)/types/mixin.js -->

    <!-- inject: ./(bundle)/pubsub/on.js --> 
    <!-- inject: ./(bundle)/pubsub/post.js --> 
    <!-- inject: ./(bundle)/assembly/cli.js -->   
    <!-- inject: ./(bundle)/di/container.js -->  
    <!-- inject: ./(bundle)/pubsub/telemetry.js -->    
    <!-- inject: ./(bundle)/aop/aspects.js -->   
    <!-- inject: ./(bundle)/serialization/serializer.js --> 
    <!-- inject: ./(bundle)/reflection/reflector.js -->    
    <!-- inject: ./(bundle)/port/ports.js --> 

    // freeze members
    flair.members = Object.freeze(flair.members);

    // return
    return Object.freeze(flair);
});    
