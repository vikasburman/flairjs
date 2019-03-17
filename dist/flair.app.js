/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.app
 *     File: ./flair.app.js
 *  Version: 0.25.53
 *  Sun, 17 Mar 2019 20:42:37 GMT
 * 
 * (c) 2017-2019 Vikas Burman
 * Licensed under MIT
 */
(() => {
'use strict';

/* eslint-disable no-unused-vars */
const flair = (typeof global !== 'undefined' ? require('flairjs') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));
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
const { getAssembly, getAttr, getContext, getResource, getRoute, getType, ns, getTypeOf, typeOf } = flair;
const { dispose, using } = flair;
const { Args, Exception, noop, nip, nim, nie, event } = flair;
const { env } = flair.options;
const { forEachAsync, replaceAll, splitAndTrim, findIndexByProp, findItemByProp, which, isArrowFunc, isASyncFunc, sieve, b64EncodeUnicode, b64DecodeUnicode } = flair.utils;
const { $static, $abstract, $virtual, $override, $sealed, $private, $privateSet, $protected, $protectedSet, $readonly, $async } = $$;
const { $enumerate, $dispose, $post, $on, $timer, $type, $args, $inject, $resource, $asset, $singleton, $serialize, $deprecate, $session, $state, $conditional, $noserialize, $ns } = $$;
/* eslint-enable no-unused-vars */

let settings = JSON.parse('{"host":"flair.server.Server | flair.client.Client","app":"flair.server.App ~ flair.server.WorkerApp | flair.client.App ~ flair.client.WorkerApp","load":[],"container":{}}'); // eslint-disable-line no-unused-vars

        let settingsReader = flair.Port('settingsReader');
        if (typeof settingsReader === 'function') {
            let externalSettings = settingsReader('flair.app');
            if (externalSettings) { settings = Object.assign(settings, externalSettings); }
        }
        settings = Object.freeze(settings);
        flair.AppDomain.context.current().currentAssemblyBeingLoaded('./flair.app{.min}.js');

(async () => { // ./src/flair.app/(root)/BootEngine.js
'use strict';
const { Bootware } = ns();

/**
 * @name BootEngine
 * @description Bootstrapper functionality
 */
$$('static');
$$('ns', '(root)');
Class('BootEngine', function() {
    this.start = async (entryPoint) => {
        let allBootwares = [],
            mountSpecificBootwares = [];
        const setEntryPoint = () => {
            // set entry point for workers
            AppDomain.entryPoint(entryPoint);
        };
        const loadFilesAndBootwares = async () => {
            // load bootwares, scripts and preambles
            let Item = null,
                Bootware = null,
                bw = null;
            for(let item of settings.load) {
                // get bootware (it could be a bootware, a simple script or a preamble)
                item = which(item); // server/client specific version
                if (item) { // in case no item is set for either server/client
                    Item = await include(item);
                    if (Item) {
                        Bootware = as(Item, Bootware);
                        if (Bootware) { // if boot
                            bw = new Bootware(); 
                            allBootwares.push(bw); // push in array, so boot and ready would be called for them
                            if (bw.info.isMountSpecific) { // if bootware is mount specific bootware - means can run once for each mount
                                mountSpecificBootwares.push(bw);
                            }
                        } // else ignore, this was something else, like a module which was just loaded
                    } // else ignore, as it could just be a file loaded which does not return anything
                }
            }
        };
        const runBootwares = async (method) => {
            if (!env.isWorker) { // main env
                let mounts = AppDomain.host().mounts,
                    mountNames = Object.keys(mounts),
                    mountName = '',
                    mount = null;
            
                // run all bootwares for main
                mountName = 'main';
                mount = mounts[mountName];
                for(let bw of allBootwares) {
                    await bw[method](mountName, mount);
                }

                // run all bootwares which are mount specific for all other mounts (except main)
                for(let mountName of mountNames) {
                    if (mountName === 'main') { continue; }
                    mount = mounts[mountName];
                    for(let bw of mountSpecificBootwares) {
                        await bw[method](mountName, mount);
                    }
                }
            } else { // worker env
                // in this case as per load[] setting, no nountspecific bootwares should be present
                if (mountSpecificBootwares.length !== 0) { 
                    console.warn('Mount specific bootwares are not supported for worker environment. Revisit worker:flair.app->load setting.'); // eslint-disable-line no-console
                }

                // run all for once (ignoring the mountspecific ones)
                for(let bw of allBootwares) {
                    if (!bw.info.isMountSpecific) {
                        await bw[method]();
                    }
                }
            }
        };
        const boot = async () => {
            if (!env.isWorker) {
                let host = which(settings.host), // pick server/client specific host
                    Host = as(await include(host), Bootware),
                    hostObj = null;
                if (!Host) { throw Exception.InvalidDefinition(host, this.start); }
                hostObj = new Host();
                await hostObj.boot();
                AppDomain.host(hostObj); // set host
            }
            
            await runBootwares('boot');   
            
            let app = which(settings.app), // pick server/client specific host
            App = as(await include(app), Bootware),
            appObj = null;
            if (!App) { throw Exception.InvalidDefinition(app, this.start); }
            appObj = new App();
            await appObj.boot();
            AppDomain.app(appObj); // set app
        };        
        const start = async () => {
            if (!env.isWorker) {
                await AppDomain.host().start();
            }
            await AppDomain.app().start();
        };
        const DOMReady = () => {
            return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                env.global.document.addEventListener("DOMContentLoaded", resolve);
            });
        };
        const DeviceReady = () => {
            return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                document.addEventListener('deviceready', resolve, false);
            });
        };
        const ready = async () => {
            if (env.isClient && !env.isWorker) {
                await DOMReady();
                if (env.isCordova) { await DeviceReady(); }
            }

            if (!env.isWorker) {
                await AppDomain.host().ready();
            }
            await runBootwares('ready');
            await AppDomain.app().ready();
        };
          
        setEntryPoint();
        await loadFilesAndBootwares();
        await boot();
        await start();
        await ready();
    };
});

})();

(async () => { // ./src/flair.app/(root)/Bootware.js
'use strict';
/**
 * @name Bootware
 * @description Bootware base class
 */
$$('abstract');
$$('ns', '(root)');
Class('Bootware', function() {
    /**  
     * @name construct
     * @arguments
     *  name: string - name of the bootware
     *  version: string - version number of the bootware
    */
    $$('virtual');
    this.construct = (name, version, isMountSpecific) => {
        let args = Args('name: string, version: string',
                        'name: string, version: string, isMountSpecific: boolean',
                        'name: string, isMountSpecific: boolean',
                        'name: string')(name, version, isMountSpecific); args.throwOnError(this.construct);

        // set info
        this.info = Object.freeze({
            name: args.name || '',
            version: args.version || '',
            isMountSpecific: args.isMountSpecific || false
        });
    };

    /**  
     * @name boot
     * @arguments
     *  mount: object - mount object
    */
    $$('virtual');
    $$('async');
    this.boot = noop;

    $$('readonly');
    this.info = null;

    /**  
     * @name ready
     * @arguments
     *  mount: object - mount object
    */
    $$('virtual');
    $$('async');
    this.ready = noop;
});

})();

(async () => { // ./src/flair.app/(root)/LifeCycleHandler.js
'use strict';

/**
 * @name LifeCycleHandler 
 * @description LifeCycleHandler Mixin
 */
$$('ns', '(root)');
Mixin('LifeCycleHandler', function() {
    $$('virtual');
    this.start = async () => {
        this.isStarted = true;
    };

    $$('virtual');
    this.stop = async () => {
        this.isStarted = false;
    };

    $$('privateSet');
    $$('type', 'boolean');
    this.isStarted = false;

    this.restart = async () => {
        await this.stop();
        await this.start();
    };

    $$('virtual');
    this.dispose = noop;    
});

})();

(async () => { // ./src/flair.app/flair.boot/App.js
'use strict';
const { IDisposable, Bootware, LifeCycleHandler } = ns();

/**
 * @name App
 * @description App base class
 */
$$('ns', 'flair.boot');
Class('App', Bootware, [LifeCycleHandler, IDisposable], function() {
    $$('override');
    this.construct = (base) => {
        // set info
        let asm = getAssembly(this);
        base(asm.title, asm.version);
    };

    $$('virtual');
    this.dispose = noop;

    $$('virtual');
    this.onError = (err) => {
        throw Exception.OperationFailed(err, this.onError);
    };
});

})();

(async () => { // ./src/flair.app/flair.boot/ClientHost.js
'use strict';
const { IDisposable, Bootware, LifeCycleHandler } = ns();

/**
 * @name ClientHost
 * @description Client host base class
 */
$$('ns', 'flair.boot');
Class('ClientHost', Bootware, [LifeCycleHandler, IDisposable], function() {
    $$('virtual');
    this.dispose = noop;
});

})();

(async () => { // ./src/flair.app/flair.boot/ServerHost.js
'use strict';
const { IDisposable, Bootware, LifeCycleHandler } = ns();

/**
 * @name ServerHost
 * @description Server host base class
 */
$$('ns', 'flair.boot');
Class('ServerHost', Bootware, [LifeCycleHandler, IDisposable], function() {
    $$('virtual');
    this.dispose = noop;
});

})();

(async () => { // ./src/flair.app/flair.bw/DIContainer.js
'use strict';
const { Bootware } = ns();

/**
 * @name DIContainer
 * @description Initialize DI Container
 */
$$('sealed');
$$('ns', 'flair.bw');
Class('DIContainer', Bootware, function() {
    $$('override');
    this.construct = (base) => {
        base('DI Container');
    };

    $$('override');
    this.boot = async () => {
        let containerItems = settings.container;
        for(let alias in containerItems) {
            if (containerItems.hasOwnProperty(alias)) {
                Container.register(alias, containerItems[alias]);
            }
        }
    };
});

})();

flair.AppDomain.context.current().currentAssemblyBeingLoaded('');

flair.AppDomain.registerAdo('{"name":"flair.app","file":"./flair.app{.min}.js","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.25.53","lupdate":"Sun, 17 Mar 2019 20:42:37 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","types","enclosureVars","enclosedTypes","resources","assets","routes","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["BootEngine","Bootware","LifeCycleHandler","flair.boot.App","flair.boot.ClientHost","flair.boot.ServerHost","flair.bw.DIContainer"],"resources":[],"assets":[],"routes":[]}');

})();
