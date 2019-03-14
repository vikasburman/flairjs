/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.app
 *     File: ./flair.app.js
 *  Version: 0.16.98
 *  Thu, 14 Mar 2019 17:47:35 GMT
 * 
 * (c) 2017-2019 Vikas Burman
 * Licensed under MIT
 */
(() => {
'use strict';

/* eslint-disable no-unused-vars */
const flair = (typeof global !== 'undefined' ? require('flair') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));
const { Class, Struct, Enum, Interface, Mixin } = flair;
const { Aspects } = flair;
const { AppDomain } = flair;
const __currentContextName = flair.AppDomain.context.current().name;
const { $$, attr } = flair;
const { bring, Container, include } = flair;
const { Port } = flair;
const { on, post, telemetry } = flair;
const { Reflector } = flair;
const { Serializer } = flair;
const { Tasks } = flair;
const { TaskInfo } = flair.Tasks;
const { as, is, isComplies, isDerivedFrom, isImplements, isInstanceOf, isMixed } = flair;
const { getAssembly, getAttr, getContext, getResource, getType, ns, getTypeOf, typeOf } = flair;
const { dispose, using } = flair;
const { args, Exception, noop, nip, nim, nie, event } = flair;
const { env } = flair.options;
const { forEachAsync, replaceAll, splitAndTrim, findIndexByProp, findItemByProp, which, isArrowFunc, isASyncFunc, sieve, b64EncodeUnicode, b64DecodeUnicode } = flair.utils;
const { $static, $abstract, $virtual, $override, $sealed, $private, $protected, $readonly, $async } = $$;
const { $enumerate, $dispose, $post, $on, $timer, $type, $args, $inject, $resource, $asset, $singleton, $serialize, $deprecate, $session, $state, $conditional, $noserialize, $ns } = $$;
/* eslint-enable no-unused-vars */

let settings = JSON.parse('{"preambles":[],"bootwares":[],"server":"flair.server.Server","app":"flair.server.App | flair.client.App","entryPoint":"./main.js | ./index.js"}'); // eslint-disable-line no-unused-vars

        let settingsReader = flair.Port('settingsReader');
        if (typeof settingsReader === 'function') {
            let externalSettings = settingsReader('flair.app');
            if (externalSettings) { settings = Object.assign(settings, externalSettings); }
        }
        settings = Object.freeze(settings);
        flair.AppDomain.context.current().currentAssemblyBeingLoaded('./flair.app{.min}.js');

(async () => { // ./src/flair.app/flair.boot/App.js
'use strict';
const { IDisposable, ILifecycleHandle, LifecycleHandler } = ns();
const { Bootware } = ns('flair.boot');

/**
 * @name App
 * @description App base class
 */
$$('ns', 'flair.boot');
Class('App', Bootware, [IDisposable, ILifecycleHandle, LifecycleHandler], function() {
    $$('virtual');
    this.construct = noop;

    $$('virtual');
    this.dispose = noop;
});

})();

(async () => { // ./src/flair.app/flair.boot/BootEngine.js
'use strict';
const { IBootware } = ns('flair.boot');

/**
 * @name BootEngine
 * @description Bootstrapper functionality
 */
$$('static');
$$('ns', 'flair.boot');
Class('BootEngine', function() {
    this.start = async () => {
        // load preambles
        await AppDomain.loadScripts(...settings.preambles);

        // boot
        let bootwares = [],
            bootware = null;
        for(let item of settings.bootwares) {
            // get bootware
            item = which(item); // server/client specific version
            if (item) { // in case no item is set for either server/client
                let Bootware = as(await include(item), IBootware);
                if (!Bootware) { throw Exception.InvalidDefinition(item, this.start); }
    
                // boot
                bootware = new Bootware();
                bootwares.push(bootware);
                await bootware.boot();
            }
        }

        // boot server
        if (env.isServer) {
            let server = as(await include(settings.server), IBootware);
            if (!server) { throw Exception.InvalidDefinition(settings.server, this.start); }
            await server.boot();
            AppDomain.Server(server); // set server
        }

        // boot app
        let app = as(await include(which(settings.app)), IBootware); // pick server/client specific setting
        if (!app) { throw Exception.InvalidDefinition(settings.app, this.start); }
        await app.boot();
        AppDomain.App(app); // set app

        // start server
        if (env.isServer) {
            await AppDomain.Server().start();
        }
        
        // start app
        await AppDomain.App().start();

        // ready
        for(let bw of bootwares) {
            await bw.ready();
        }

        // ready server
        await AppDomain.Server().ready();

        // finally make app ready
        await AppDomain.App.ready();
    };
});

})();

(async () => { // ./src/flair.app/flair.boot/BootHandler.js
'use strict';
/**
 * @name BootHandler 
 * @description Bootware functions
 */
$$('ns', 'flair.boot');
Mixin('BootHandler', function() {
    $$('virtual');
    $$('async');
    this.boot = noop;

    $$('virtual');
    $$('async');
    this.ready = noop;
});

})();

(async () => { // ./src/flair.app/flair.boot/Bootware.js
'use strict';
const { IBootware } = ns('flair.boot');
const { BootHandler } = ns('flair.boot');

/**
 * @name Bootware
 * @description Bootware base class
 */
$$('abstract');
$$('ns', 'flair.boot');
Class('Bootware', [IBootware, BootHandler], function() {
});

})();

(async () => { // ./src/flair.app/flair.boot/IBootware.js
'use strict';
/**
 * @name IBootware
 * @description IBootware interface
 */
$$('ns', 'flair.boot');
Interface('IBootware', function() {
    // boot - async
    this.boot = nim;

    // ready - async
    this.ready = nim;
});

})();

(async () => { // ./src/flair.app/flair.boot/Server.js
'use strict';
const { IDisposable, ILifecycleHandle, LifecycleHandler } = ns();
const { Bootware } = ns('flair.boot');

/**
 * @name Server
 * @description Server base class
 */
$$('ns', 'flair.boot');
Class('Server', Bootware, [IDisposable, ILifecycleHandle, LifecycleHandler], function() {
    $$('virtual');
    this.construct = noop;

    $$('virtual');
    this.dispose = noop;
});

})();

flair.AppDomain.context.current().currentAssemblyBeingLoaded('');

flair.AppDomain.registerAdo('{"name":"flair.app","file":"./flair.app{.min}.js","desc":"True Object Oriented JavaScript","version":"0.16.98","lupdate":"Thu, 14 Mar 2019 17:47:35 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","types","enclosureVars","enclosedTypes","resources","assets","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.boot.App","flair.boot.BootEngine","flair.boot.BootHandler","flair.boot.Bootware","flair.boot.IBootware","flair.boot.Server"],"resources":[],"assets":[]}');

})();
