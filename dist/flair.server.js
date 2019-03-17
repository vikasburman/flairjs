/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.server
 *     File: ./flair.server.js
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

let settings = JSON.parse('{"envVars":[],"envVarsloadOptions":{"overwrite":true},"mounts":{"main":"/"},"main-appSettings":[{"name":"case sensitive routing","value":false},{"name":"strict routing","value":false}],"main-middlewares":[],"main-resHeaders":[],"server-http":{"enable":false,"port":80,"timeout":-1},"server-https":{"enable":false,"port":443,"timeout":-1,"privateKey":"","publicCert":""}}'); // eslint-disable-line no-unused-vars

        let settingsReader = flair.Port('settingsReader');
        if (typeof settingsReader === 'function') {
            let externalSettings = settingsReader('flair.server');
            if (externalSettings) { settings = Object.assign(settings, externalSettings); }
        }
        settings = Object.freeze(settings);
        flair.AppDomain.context.current().currentAssemblyBeingLoaded('./flair.server{.min}.js');

(async () => { // ./src/flair.server/flair.bw.server/Middlewares.js
'use strict';
const { Bootware } = ns();

/**
 * @name Middlewares
 * @description Express Middleware Configurator
 */
$$('sealed');
$$('ns', 'flair.bw.server');
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

(async () => { // ./src/flair.server/flair.bw.server/NodeEnv.js
'use strict';
const env = require('node-env-file');
const { Bootware } = ns();

/**
 * @name NodeEnv
 * @description Node Environment Settings
 */
$$('sealed');
$$('ns', 'flair.bw.server');
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

(async () => { // ./src/flair.server/flair.bw.server/ResHeaders.js
'use strict';
const { Bootware } = ns();

/**
 * @name ResHeaders
 * @description Express Response Header Settings (Common to all routes)
 */
$$('sealed');
$$('ns', 'flair.bw.server');
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

(async () => { // ./src/flair.server/flair.bw.server/Router.js
'use strict';
const { Bootware } = ns();

/**
 * @name Router
 * @description Server Router Configuration Setup
 */
$$('sealed');
$$('ns', 'flair.bw.server');
Class('Router', Bootware, function() {
    let routes = null;
    $$('override');
    this.construct = (base) => {
        base('Server Router', true); // mount specific 
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
                        AppDomain.app().onError(err);
                    };

                    routeHandler = new route.Handler();
                    try {
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
});

})();

(async () => { // ./src/flair.server/flair.server/App.js
'use strict';
const { App } = ns('flair.boot');

/**
 * @name App
 * @description Default server-side app implementation
 */
$$('ns', 'flair.server');
Class('App', App, function() {
});

})();

(async () => { // ./src/flair.server/flair.server/Server.js
'use strict';
const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const httpShutdown = require('http-shutdown');

const { ServerHost } = ns('flair.boot');

/**
 * @name Server
 * @description Default server implementation
 */
$$('sealed');
$$('ns', 'flair.server');
Class('Server', ServerHost, function() {
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
            httpServer.on('error', AppDomain.app().onError);
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
            httpsServer.on('error', AppDomain.app().onError);
            if (httpsSettings.timeout !== -1) { httpsServer.timeout = httpsSettings.timeout; } // timeout must be in milliseconds
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
    this.dispose = (base) => {
        base();

        mountedApps = null;
    };
});

})();

(async () => { // ./src/flair.server/flair.server/WorkerApp.js
'use strict';
const { App } = ns('flair.boot');

/**
 * @name App
 * @description Default server-side worker-app implementation
 */
$$('ns', 'flair.server');
Class('WorkerApp', App, function() {
});

})();

flair.AppDomain.context.current().currentAssemblyBeingLoaded('');

flair.AppDomain.registerAdo('{"name":"flair.server","file":"./flair.server{.min}.js","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.25.53","lupdate":"Sun, 17 Mar 2019 20:42:37 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","types","enclosureVars","enclosedTypes","resources","assets","routes","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.bw.server.Middlewares","flair.bw.server.NodeEnv","flair.bw.server.ResHeaders","flair.bw.server.Router","flair.server.App","flair.server.Server","flair.server.WorkerApp"],"resources":[],"assets":[],"routes":[]}');

})();
