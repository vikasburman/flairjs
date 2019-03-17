/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.client
 *     File: ./flair.client.js
 *  Version: 0.17.13
 *  Sun, 17 Mar 2019 01:44:37 GMT
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

let settings = JSON.parse('{"mounts":{"main":"/"},"main-appSettings":[{"name":"strict","value":false},{"name":"click","value":false},{"name":"popstate","value":false},{"name":"dispatch","value":false},{"name":"hashbang","value":false},{"name":"decodeURLComponents","value":true}],"main-middlewares":[]}'); // eslint-disable-line no-unused-vars

        let settingsReader = flair.Port('settingsReader');
        if (typeof settingsReader === 'function') {
            let externalSettings = settingsReader('flair.client');
            if (externalSettings) { settings = Object.assign(settings, externalSettings); }
        }
        settings = Object.freeze(settings);
        flair.AppDomain.context.current().currentAssemblyBeingLoaded('./flair.client{.min}.js');

(async () => { // ./src/flair.client/flair.bw.client/Router.js
'use strict';
const { Bootware } = ns();

/**
 * @name Router
 * @description Client Router Configuration Setup
 */
$$('sealed');
$$('ns', 'flair.bw.client');
Class('Router', Bootware, function() {
    let routes = null;
    $$('override');
    this.construct = (base) => {
        base('Client Router', true); // mount specific 
    };

    $$('override');
    this.boot = async (mount) => {
        // get all registered routes, and sort by index, if was not already done in previous call
        if (!routes) {
            routes = AppDomain.context.current().allRoutes(true);
            routes.sort((a, b) => { 
                if (a.index < b.index) { return -1; }
                if (a.index > b.index) { return 1; }
                return 0;
            });
        }
         
        // add routes related to current mount
        let routeHandler = null,
            result = false;
        for(let route of routes) {
            if (route.mount === mount.name) { // add route-handler
                mount.app(route.path, (ctx, next) => { 
                    const onDone = (result) => {
                        if (!result) { next(); }
                    };
                    const onError = (err) => {
                        throw Exception.OperationFailed(err, routeHandler[route.verb]);
                    };

                    routeHandler = new route.Handler();
                    try {
                        // ctx.params has all the route parameters.
                        // e.g., for route "/users/:userId/books/:bookId" req.params will 
                        // have "req.params: { "userId": "34", "bookId": "8989" }"
                        result = routeHandler[route.verb](ctx);  // verbs could be 'view' or any custom verb
                        if (typeof result.then === 'function') {
                            result.then((delayedResult) => {
                                onDone(delayedResult);
                            }).catch(onError);
                        } else {
                            onDone(result);
                        }
                    } catch (err) {
                        onError(err);
                    }
                }); 
            }
        }
    };
});

})();

(async () => { // ./src/flair.client/flair.client/App.js
'use strict';
const { App } = ns('flair.boot');

/**
 * @name App
 * @description Default client-side app implementation
 */
$$('ns', 'flair.client');
Class('App', App, function() {
    $$('override');
    this.construct = () => {
    };

    $$('override');
    this.boot = async () => {
    };

    $$('override');
    this.start = async () => {
    };

    $$('override');
    this.stop = async () => {
    };

    $$('override');
    this.ready = async () => {
    };

    $$('override');
    this.dispose = () => {
    };
});

})();

(async () => { // ./src/flair.client/flair.client/Client.js
'use strict';
const page = await include('[Page]', 'page'); // express style routing: https://visionmedia.github.io/page.js/
const { ClientHost } = ns('flair.boot');        

/**
 * @name Client
 * @description Default client implementation
 */
$$('sealed');
$$('ns', 'flair.client');
Class('Client', ClientHost, function() {
    let mountedApps = {},
        hashChangeHandler = null;

    $$('override');
    this.construct = (base) => {
        base('Page', '1.x'); // https://www.npmjs.com/package/page
    };

    this.mounts = {
        get: () => { return mountedApps; },
        set: noop
    };

    $$('override');
    this.boot = async (base) => {
        base();

        let appOptions = null,
            mountPath = '',
            mount = null;
        const getOptions = (mountName) => {
            let appOptions = {};
            // app options: https://www.npmjs.com/package/page#pageoptions
            // each item is: { name: '', value:  }
            // name: as in above link (as-is)
            // value: as defined in above link
            let appSettings = settings[`${mountName}-appSettings`];
            if (appSettings && appSettings.length > 0) {
                for(let appSetting of appSettings) {
                    appOptions[appSetting.name] = appSetting.value;
                }
            }   
            return appOptions;         
        };

        // create main app instance of page
        appOptions = getOptions('main');
        let mainApp = page.create(appOptions);
        mainApp.strict(appOptions.strict);
        mainApp.base('/');

        // create one instance of page app for each mounted path
        for(let mountName of Object.keys(settings.mounts)) {
            if (mountName === 'main') {
                mountPath = '/';
                mount = mainApp;
            } else {
                appOptions = getOptions(mountName);
                mountPath = settings.mounts[mountName];
                mount = page.create(appOptions); // create a sub-app
                mount.strict(appOptions.strict);
                mount.base(mountPath);
            }

            // attach
            mountedApps[mountName] = Object.freeze({
                name: mountName,
                root: mountPath,
                app: mount
            });
        }

        // store
        mountedApps = Object.freeze(mountedApps);       
    };

    $$('override');
    this.start = async (base) => {
        base();

        hashChangeHandler = () => {
            // get clean path
            let path = env.global.location.hash;
            if (path.substr(0, 3) === '#!/') { path = path.substr(3); }
            if (path.substr(0, 2) === '#!') { path = path.substr(2); }
            if (path.substr(0, 2) === '#/') { path = path.substr(2); }
            if (path.substr(0, 1) === '#') { path = path.substr(1); }
            
            // route this path to most suitable mounted app
            let app = null;
            for(let mount of this.mounts) {
                if (path.startsWith(mount.root)) { 
                    app = mount.app; 
                    path = path.substr(mount.root.length); // remove all base path, so it becomes at part the way paths were added to this app
                    break; 
                }
            }
            if (!app) { app = this.mounts['main']; } // when nothing matches, give it to main
            
            // run app to initiate routing
            setTimeout(() => { app(path); }, 0); 
        };

        // attach event handler
        env.global.addEventListener('hashchange', hashChangeHandler);
    };

    $$('override');
    this.stop = async (base) => {
        base();

        // detach event handler
        env.global.removeEventListener('hashchange', hashChangeHandler);
    };

    $$('override');
    this.ready = async (base) => {
        base();
    };

    $$('override');
    this.dispose = (base) => {
        base();

        mountedApps = null;
    };
});

})();

(async () => { // ./src/flair.client/flair.client/WorkerApp.js
'use strict';
const { App } = ns('flair.boot');

/**
 * @name App
 * @description Default client-side worker-app implementation
 */
$$('ns', 'flair.client');
Class('WorkerApp', App, function() {
    $$('override');
    this.construct = () => {
    };

    $$('override');
    this.boot = async () => {
    };

    $$('override');
    this.start = async () => {
    };

    $$('override');
    this.stop = async () => {
    };

    $$('override');
    this.ready = async () => {
    };

    $$('override');
    this.dispose = () => {
    };
});

})();

flair.AppDomain.context.current().currentAssemblyBeingLoaded('');

flair.AppDomain.registerAdo('{"name":"flair.client","file":"./flair.client{.min}.js","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.17.13","lupdate":"Sun, 17 Mar 2019 01:44:37 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","types","enclosureVars","enclosedTypes","resources","assets","routes","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.bw.client.Router","flair.client.App","flair.client.Client","flair.client.WorkerApp"],"resources":[],"assets":[],"routes":[]}');

})();
