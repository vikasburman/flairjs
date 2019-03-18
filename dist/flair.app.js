/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.app
 *     File: ./flair.app.js
 *  Version: 0.25.76
 *  Mon, 18 Mar 2019 22:04:59 GMT
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

let settings = JSON.parse('{"host":"flair.boot.ServerHost | flair.boot.ClientHost","app":"App","load":[],"container":{},"envVars":[],"envVarsloadOptions":{"overwrite":true},"mounts":{"main":"/"},"main-appSettings":[],"main-middlewares":[],"server-http":{"enable":false,"port":80,"timeout":-1},"server-https":{"enable":false,"port":443,"timeout":-1,"privateKey":"","publicCert":""}}'); // eslint-disable-line no-unused-vars

        let settingsReader = flair.Port('settingsReader');
        if (typeof settingsReader === 'function') {
            let externalSettings = settingsReader('flair.app');
            if (externalSettings) { settings = Object.assign(settings, externalSettings); }
        }
        settings = Object.freeze(settings);
        flair.AppDomain.context.current().currentAssemblyBeingLoaded('./flair.app{.min}.js');

(async () => { // ./src/flair.app/flair.boot/ClientHost.js
'use strict';
const page = await include('[Page]', 'page'); // express style routing: https://visionmedia.github.io/page.js/
const { Host } = ns('flair.app');

/**
 * @name Client
 * @description Default client implementation
 */
$$('sealed');
$$('ns', 'flair.boot');
Class('ClientHost', Host, function() {
    let mountedApps = {},
        hashChangeHandler = null;

    $$('override');
    this.construct = (base) => {
        base('Page', '1.x'); // https://www.npmjs.com/package/page
    };

    this.app = () => { return this.mounts['main']; } // main page app
    this.mounts = { // all mounted page apps
        get: () => { return mountedApps; },
        set: noop
    };

    $$('override');
    this.boot = async (base) => { // mount all page app and pseudo sub-apps
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

            // inbuilt fixed options, overwrite even if defined outside
            appOptions.click = false;
            appOptions.popstate = false;
            appOptions.dispatch = false;
            appOptions.hashbang = false;
            appOptions.decodeURLComponents = true;

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
    this.start = async (base) => { // configure hashchange handler
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
            setTimeout(() => { 
                try {
                    app(path); 
                } catch (err) {
                    this.error(err); // pass-through event
                }
            }, 0); 
        };
    };

    $$('override');
    this.ready = async (base) => { // start listening hashchange event
        base();

        // attach event handler
        env.global.addEventListener('hashchange', hashChangeHandler);
        console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version}`); // eslint-disable-line no-console        
    };

    $$('override');
    this.stop = async (base) => { // stop listening hashchange event
        base();

        // detach event handler
        env.global.removeEventListener('hashchange', hashChangeHandler);
    };

    $$('override');
    this.dispose = (base) => {
        base();

        mountedApps = null;
    };
});

})();

(async () => { // ./src/flair.app/flair.boot/ServerHost.js
'use strict';
const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const httpShutdown = require('http-shutdown');
const { Host } = ns('flair.app');

/**
 * @name Server
 * @description Default server implementation
 */
$$('sealed');
$$('ns', 'flair.boot');
Class('ServerHost', Host, function() {
    let mountedApps = {},
        httpServer = null,
        httpsServer = null,
        httpsSettings = settings['server-https'],
        httpSettings = settings['server-http'];
    
    $$('override');
    this.construct = (base) => {
        base('Express', '4.x');
    };

    this.app = () => { return this.mounts['main']; }  // main express app
    this.mounts = { // all mounted express apps
        get: () => { return mountedApps; },
        set: noop
    };

    $$('override');
    this.boot = async (base) => { // mount all express app and sub-apps
        base();

        const applySettings = (mountName, mount) => {
            // app settings
            // each item is: { name: '', value:  }
            // name: as in above link (as-is)
            // value: as defined in above link
            let appSettings = settings[`${mountName}-appSettings`];
            if (appSettings && appSettings.length > 0) {
                for(let appSetting of appSettings) {
                    mount.set(appSetting.name, appSetting.value);
                }
            }            
        };

        // create main app instance of express
        let mainApp = express();
        applySettings('main', mainApp);

        // create one instance of express app for each mounted path
        let mountPath = '',
            mount = null;
        for(let mountName of Object.keys(settings.mounts)) {
            if (mountName === 'main') {
                mountPath = '/';
                mount = mainApp;
            } else {
                mountPath = settings.mounts[mountName];
                mount = express(); // create a sub-app
            }

            // attach
            mountedApps[mountName] = Object.freeze({
                name: mountName,
                root: mountPath,
                app: mount
            });

            // apply settings and attach to main app
            if (mountName !== 'main') {
                applySettings(mountName, mount);
                mainApp.use(mountPath, mount); // mount sub-app on given root path                
            }
        }

        // store
        mountedApps = Object.freeze(mountedApps);        
    };

    $$('override');
    this.start = async (base) => { // configure http and https server
        base();

        // configure http server
        if (httpSettings.enable) { 
            httpServer = http.createServer(this.app());
            httpServer = httpShutdown(httpServer); // wrap
            httpServer.on('error', this.error); // pass-through event
            if (httpSettings.timeout !== -1) { httpServer.timeout = httpSettings.timeout; } // timeout must be in milliseconds
        }

        // configure httpS server
        if (httpsSettings.enable) { 
            // SSL Certificate
            // NOTE: For creating test certificate:
            //  > Goto http://www.cert-depot.com/
            //  > Create another test certificate
            //  > Download KEY+PEM files
            //  > Rename *.private.pem as key.pem
            //  > Rename *.public.pem as cert.pem
            //  > Update these files at private folder
            const privateKey  = fs.readFileSync(httpsSettings.privateKey, 'utf8');
            const publicCert = fs.readFileSync(httpsSettings.publicCert, 'utf8');
            const credentials = { key: privateKey, cert: publicCert };

            httpsServer = https.createServer(credentials, this.app());
            httpsServer = httpShutdown(httpsServer); // wrap
            httpsServer.on('error', this.error); // pass-through event
            if (httpsSettings.timeout !== -1) { httpsServer.timeout = httpsSettings.timeout; } // timeout must be in milliseconds
        }
    };

    $$('override');
    this.ready = async (base) => { // start listening http and https servers
        base();

        // start server
        let httpPort = httpSettings.port || 80,
            httpsPort = process.env.PORT || httpsSettings.port || 443;
        if (httpServer && httpsServer) {
            httpServer.listen(httpPort, () => {
                httpServer.listen(httpsPort, () => {
                    console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version} (http: ${httpPort}, https: ${httpsPort})`); // eslint-disable-line no-console
                });
            });
        } else if (httpServer) {
            httpServer.listen(httpPort, () => {
                console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version} (http: ${httpPort})`); // eslint-disable-line no-console
            });
        } else if (httpsServer) {
            httpsServer.listen(httpsPort, () => {
                console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version} (https: ${httpsPort})`); // eslint-disable-line no-console
            });
        } else {
            console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version}`); // eslint-disable-line no-console
        }
    };

    $$('override');
    this.stop = async (base) => { // graceful shutdown http and https servers
        base();

        // stop http server gracefully
        if (httpServer) {
            console.log('http server is shutting down...'); // eslint-disable-line no-console
            httpServer.shutdown(() => {
                httpServer = null;
                console.log('http server is cleanly shutdown!'); // eslint-disable-line no-console
            });
        }

        // stop https server gracefully
        if (httpsServer) {
            console.log('https server is shutting down...'); // eslint-disable-line no-console
            httpsServer.shutdown(() => {
                httpsServer = null;
                console.log('https server is cleanly shutdown!'); // eslint-disable-line no-console
            });
        }
    };    

    $$('override');
    this.dispose = (base) => {
        base();

        mountedApps = null;
    };
});

})();

(async () => { // ./src/flair.app/flair.bw/DIContainer.js
'use strict';
const { Bootware } = ns('flair.app');

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

(async () => { // ./src/flair.app/flair.bw/Middlewares.js
'use strict';
const { Bootware } = ns('flair.app');

/**
 * @name Middlewares
 * @description Express Middleware Configurator
 */
$$('sealed');
$$('ns', 'flair.bw');
Class('Middlewares', Bootware, function() {
    $$('override');
    this.construct = (base) => {
        base('Express Middlewares', true); // mount specific
    };

    $$('override');
    this.boot = async (mount) => {
        // middleware information is defined at: https://expressjs.com/en/guide/using-middleware.html#middleware.application
        // each item is: { module: '', func: '', 'args': []  }
        // module: module name of the middleware, which can be required
        // func: if middleware has a function that needs to be called for configuration, empty if required object itself is a function
        // args: an array of args that need to be passed to this function or middleware function
        //       Note: In case a particular argument setting is a function - define the function code as an arrow function string with a 'return prefix' and it will be loaded as function
        //       E.g., setHeaders in https://expressjs.com/en/4x/api.html#express.static is a function
        //       define it as: "return (res, path, stat) => { res.set('x-timestamp', Date.now()) }"
        //       this string will ne passed to new Function(...) and returned values will be used as value of option
        //       all object type arguments will be scanned for string values that start with 'return ' and will be tried to convert into a function
        let middlewares = settings[`${mount.name}-middlewares`];
        if (middlewares && middlewares.length > 0) {
            let mod = null,
                func = null;
            for(let middleware of middlewares) {
                if (middleware.module) {
                    try {
                        // get module
                        mod = require(middleware.name);

                        // get func
                        if (middleware.func) {
                            func = mod[middleware.func];
                        } else {
                            func = mod;
                        }

                        // process args
                        let args = [],
                            argValue = null;
                        middleware.args = middleware.args || [];
                        for (let arg of middleware.args) {
                            if (typeof arg === 'string' && arg.startsWith('return ')) { // note a space after return
                                argValue = new Function(arg)();
                            } else if (typeof arg === 'object') {
                                for(let prop in arg) {
                                    if (arg.hasOwnProperty(prop)) {
                                        argValue = arg[prop];
                                        if (typeof argValue === 'string' && argValue.startsWith('return ')) { // note a space after return
                                            argValue = new Function(arg)();
                                            arg[prop] = argValue;
                                        }
                                    }
                                }
                            } else {
                                argValue = arg;
                            }
                            args.push(argValue);
                        }

                        // add middleware
                        mount.app.use(func(...args));
                    } catch (err) {
                        throw Exception.OperationFailed(`Middleware ${middleware.module} load failed.`, err, this.boot);
                    }
                }
            }
        }
    };
});

})();

(async () => { // ./src/flair.app/flair.bw/NodeEnv.js
'use strict';
const env = require('node-env-file');
const { Bootware } = ns('flair.app');

/**
 * @name NodeEnv
 * @description Node Environment Settings
 */
$$('sealed');
$$('ns', 'flair.bw');
Class('NodeEnv', Bootware, function() {
    $$('override');
    this.construct = (base) => {
        base('Node Server Environment');
    };

    $$('override');
    this.boot = async () => {
        if (settings.envVars.length > 0) {
            for(let envVar of settings.envVars) {
                env(envVar, settings.envVarsLoadOptions);
            }
        }
    };
});

})();

(async () => { // ./src/flair.app/flair.bw/ResHeaders.js
'use strict';
const { Bootware } = ns('flair.app');

/**
 * @name ResHeaders
 * @description Express Response Header Settings (Common to all routes)
 */
$$('sealed');
$$('ns', 'flair.bw');
Class('ResHeaders', Bootware, function() {
    $$('override');
    this.construct = (base) => {
        base('Server Response Headers', true); // mount specific
    };

    $$('override');
    this.boot = async (mount) => {
        let resHeaders = settings[`${mount.name}-resHeaders`];
        if (resHeaders && resHeaders.length > 0) {
            mount.app.use((req, res, next) => {
                // each item is: { name: '', value:  }
                // name: standard header name
                // value: header value
                for(let header of resHeaders) {
                    res.setHeader(header.name, header.value);
                }
                next();
            });         
        }
    };
});

})();

(async () => { // ./src/flair.app/flair.bw/Router.js
'use strict';
const { Bootware } = ns('flair.app');

/**
 * @name Router
 * @description Router Configuration Setup
 */
$$('sealed');
$$('ns', 'flair.bw');
Class('Router', Bootware, function() {
    let routes = null;
    $$('override');
    this.construct = (base) => {
        base('Router', true); // mount specific 
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

        let routeHandler = null,
            result = false;
        const setupServerRoutes = () => {
            // add routes related to current mount
            for(let route of routes) {
                if (route.mount === mount.name) { // add route-handler
                    mount.app[route.verb] = (route.path, (req, res, next) => { // verb could be get/set/delete/put/, etc.
                        const onDone = (result) => {
                            if (result) {
                                res.end();
                            } else {
                                next();
                            }
                        };
                        const onError = (err) => {
                            res.status(500).end();
                            AppDomain.host().raiseError(err)
                        };

                        try {
                            routeHandler = new route.Handler();
                            // req.params has all the route parameters.
                            // e.g., for route "/users/:userId/books/:bookId" req.params will 
                            // have "req.params: { "userId": "34", "bookId": "8989" }"
                            result = routeHandler[route.verb](req, res);
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
        const setupClientRoutes = () => {
            // add routes related to current mount
            for(let route of routes) {
                if (route.mount === mount.name) { // add route-handler
                    mount.app(route.path, (ctx, next) => { 
                        const onDone = (result) => {
                            if (!result) { next(); }
                        };
                        const onError = (err) => {
                            AppDomain.host().raiseError(err);
                        };

                        try {
                            routeHandler = new route.Handler();
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

        if (env.isServer) {
            setupServerRoutes();
        } else { // client
            setupClientRoutes();
        }
    };
});

})();

flair.AppDomain.context.current().currentAssemblyBeingLoaded('');

flair.AppDomain.registerAdo('{"name":"flair.app","file":"./flair.app{.min}.js","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.25.76","lupdate":"Mon, 18 Mar 2019 22:04:59 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","types","enclosureVars","enclosedTypes","resources","assets","routes","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.boot.ClientHost","flair.boot.ServerHost","flair.bw.DIContainer","flair.bw.Middlewares","flair.bw.NodeEnv","flair.bw.ResHeaders","flair.bw.Router"],"resources":[],"assets":[],"routes":[]}');

})();
