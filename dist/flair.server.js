/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.server
 *     File: ./flair.server.js
 *  Version: 0.50.32
 *  Sat, 04 May 2019 18:35:16 GMT
 * 
 * (c) 2017-2019 Vikas Burman
 * Licensed under MIT
 */
(() => {
'use strict';

/* eslint-disable no-unused-vars */
const flair = (typeof global !== 'undefined' ? require('flairjs') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));
const { Class, Struct, Enum, Interface, Mixin, Aspects, AppDomain, $$, attr, bring, Container, include, Port, on, post, telemetry,
				Reflector, Serializer, Tasks, as, is, isComplies, isDerivedFrom, isAbstract, isSealed, isStatic, isSingleton, isDeprecated,
				isImplements, isInstanceOf, isMixed, getAssembly, getAttr, getContext, getResource, getRoute, getType, ns, getTypeOf,
				getTypeName, typeOf, dispose, using, Args, Exception, noop, nip, nim, nie, event } = flair;
const { TaskInfo } = flair.Tasks;
const { env } = flair.options;
const DOC = ((env.isServer || env.isWorker) ? null : window.document);
const { forEachAsync, replaceAll, splitAndTrim, findIndexByProp, findItemByProp, which, guid, isArrowFunc, isASyncFunc, sieve,
				b64EncodeUnicode, b64DecodeUnicode } = flair.utils;
const { $$static, $$abstract, $$virtual, $$override, $$sealed, $$private, $$privateSet, $$protected, $$protectedSet, $$readonly, $$async,
				$$overload, $$enumerate, $$dispose, $$post, $$on, $$timer, $$type, $$args, $$inject, $$resource, $$asset, $$singleton, $$serialize,
				$$deprecate, $$session, $$state, $$conditional, $$noserialize, $$ns } = $$;

// define current context name
const __currentContextName = AppDomain.context.current().name;

// define loadPathOf this assembly
let __currentFile = (env.isServer ? __filename : window.document.currentScript.src.replace(window.document.location.href, './'));
let __currentPath = __currentFile.substr(0, __currentFile.lastIndexOf('/') + 1);
AppDomain.loadPathOf('flair.server', __currentPath)

// assembly level error handler
const __asmError = (err) => { AppDomain.onError(err); };
/* eslint-enable no-unused-vars */

// load assembly settings from settings file
let settings = JSON.parse('{"server":"flair.app.express.Server","server-http":{"enable":false,"port":80,"timeout":-1},"server-https":{"enable":false,"port":443,"timeout":-1,"privateKey":"","publicCert":""},"envVars":[],"envVarsloadOptions":{"overwrite":true},"mounts":{"main":"/"},"main-appSettings":[],"main-middlewares":[],"main-interceptors":[]}'); // eslint-disable-line no-unused-vars
let settingsReader = flair.Port('settingsReader');
if (typeof settingsReader === 'function') {
let externalSettings = settingsReader('flair.server');
if (externalSettings) { settings = Object.assign(settings, externalSettings); }}
settings = Object.freeze(settings);

// default assembly config
let config = {}; // eslint-disable-line no-unused-vars
config = Object.freeze(config);

AppDomain.context.current().currentAssemblyBeingLoaded('./flair.server{.min}.js');

try{

(async () => { // ./src/flair.server/flair.api/RestHandler.js
try{
const { Handler } = ns('flair.app');

/**
 * @name RestHandler
 * @description Restful API Handler
 */
$$('ns', 'flair.api');
Class('RestHandler', Handler, function() {
    $$('virtual');
    this.get = noop;

    $$('virtual');
    this.post = noop;

    $$('virtual');
    this.put = noop;

    $$('virtual');
    this.delete = noop;
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.server/flair.api/RestInterceptor.js
try{
/**
 * @name RestInterceptor
 * @description Api Interceptor
 */
$$('ns', 'flair.api');
Class('RestInterceptor', function() {
    $$('virtual');
    $$('async');
    this.run = noop;
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.server/flair.app/ServerHost.js
try{
const { Host } = ns('flair.app');
const Server = await include(settings['server'] || 'flair.app.express.Server');
const express = await include('express | x');

/**
 * @name ServerHost
 * @description Server host implementation
 */
$$('sealed');
$$('ns', 'flair.app');
Class('ServerHost', Host, [Server], function() {
    let mountedApps = {};
    
    $$('override');
    this.construct = (base) => {
        base('Express', '4.x');
    };

    this.app = () => { return this.mounts['main'].app; }  // main express app
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
    this.dispose = (base) => {
        base();

        mountedApps = null;
    };
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.server/flair.app.express/Server.js
try{
const fs = await include('fs | x');
const http = await include('http | x');
const https = await include('https | x');
const httpShutdown = await include('http-shutdown | x');

/**
 * @name Server
 * @description Express Server implementation
 */

$$('ns', 'flair.app.express');
Mixin('Server', function() {
    let httpServer = null,
        httpsServer = null,
        httpSettings = settings['server-http'],
        httpsSettings = settings['server-https'];        
    
    $$('override');
    this.start = async (base) => { // configure express http and https server
        base();

        // configure http server
        if (httpSettings.enable) { 
            httpServer = http.createServer(this.app());
            httpServer = httpShutdown(httpServer); // wrap
            httpServer.on('error', (err) => {
                this.error(err);
            }); // pass-through event
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
            const privateKey  = fs.readFileSync(AppDomain.resolvePath(httpsSettings.privateKey), 'utf8');
            const publicCert = fs.readFileSync(AppDomain.resolvePath(httpsSettings.publicCert), 'utf8');
            const credentials = { key: privateKey, cert: publicCert };

            httpsServer = https.createServer(credentials, this.app());
            httpsServer = httpShutdown(httpsServer); // wrap
            httpsServer.on('error', (err) => {
                this.error(err);
            }); // pass-through event
            if (httpsSettings.timeout !== -1) { httpsServer.timeout = httpsSettings.timeout; } // timeout must be in milliseconds
        }
    };

    $$('override');
    this.ready = (base) => { // start listening express http and https servers
        return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
            base();

            // start server
            let httpPort = httpSettings.port || 80,
                httpsPort = process.env.PORT || httpsSettings.port || 443;
            if (httpServer && httpsServer) {
                httpServer.listen(httpPort, () => {
                    httpsServer.listen(httpsPort, () => {
                        console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version} (http: ${httpPort}, https: ${httpsPort})`); // eslint-disable-line no-console
                        resolve();
                    });
                });
            } else if (httpServer) {
                httpServer.listen(httpPort, () => {
                    console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version} (http: ${httpPort})`); // eslint-disable-line no-console
                    resolve();
                });
            } else if (httpsServer) {
                httpsServer.listen(httpsPort, () => {
                    console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version} (https: ${httpsPort})`); // eslint-disable-line no-console
                    resolve();
                });
            } else {
                console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version}`); // eslint-disable-line no-console
                resolve();
            }
        });
    };

    $$('override');
    this.stop = async (base) => { // graceful shutdown express http and https servers
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
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.server/flair.app.firebase/Server.js
try{
// const fs = await include('fs | x');
// const http = await include('http | x');
// const https = await include('https | x');
// const httpShutdown = await include('http-shutdown | x');

/**
 * @name Server
 * @description Firebase Server implementation
 */

$$('ns', 'flair.app.firebase');
Mixin('Server', function() {
    
    $$('override');
    this.start = async (base) => { 
        base();


    };

    $$('override');
    this.ready = (base) => { 
        base();

    };

    $$('override');
    this.stop = async (base) => { 
        base();


    };    
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.server/flair.boot/Middlewares.js
try{
const { Bootware } = ns('flair.app');

/**
 * @name Middlewares
 * @description Express Middleware Configurator
 */
$$('sealed');
$$('ns', 'flair.boot');
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
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.server/flair.boot/NodeEnv.js
try{
const nodeEnv = await include('node-env-file | x');
const { Bootware } = ns('flair.app');

/**
 * @name NodeEnv
 * @description Node Environment Settings
 */
$$('sealed');
$$('ns', 'flair.boot');
Class('NodeEnv', Bootware, function() {
    $$('override');
    this.construct = (base) => {
        base('Node Server Environment');
    };

    $$('override');
    this.boot = async () => {
        if (settings.envVars.length > 0) {
            for(let envVar of settings.envVars) {
                nodeEnv(AppDomain.resolvePath(envVar), settings.envVarsLoadOptions);
            }
        }
    };
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.server/flair.boot/ResHeaders.js
try{
const { Bootware } = ns('flair.app');

/**
 * @name ResHeaders
 * @description Express Response Header Settings (Common to all routes)
 */
$$('sealed');
$$('ns', 'flair.boot');
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
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.server/flair.boot/ServerRouter.js
try{
const { Bootware } = ns('flair.app');
const { RestHandler, RestInterceptor } = ns('flair.api');

/**
 * @name ServerRouter
 * @description Server Router Configuration Setup
 */
$$('sealed');
$$('ns', 'flair.boot');
Class('ServerRouter', Bootware, function () {
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
                if (a.index < b.index) {
                    return -1;
                }
                if (a.index > b.index) {
                    return 1;
                }
                return 0;
            });
        }

        let result = false;

        const runInterceptor = (IC, req, res) => {
            return new Promise((resolve, reject) => {
                try {
                    let aic = new IC();
                    aic.run(req, res).then(() => {
                        if (req.$stop) {
                            reject();
                        } else {
                            resolve();
                        }
                    }).catch(reject);
                } catch (err) {
                    reject(err);
                }
            });
        };
        const runInterceptors = (interceptors, req, res) => {
            return forEachAsync(interceptors, (resolve, reject, ic) => {
                include(ic).then((theType) => {
                    let RequiredICType = as(theType, RestInterceptor);
                    if (RequiredICType) {
                        runInterceptor(RequiredICType, req, res).then(resolve).catch(reject);
                    } else {
                        reject(Exception.InvalidDefinition(`Invalid interceptor type. (${ic})`));
                    }
                }).catch(reject);
            });
        };
       
        // add routes related to current mount
        for (let route of routes) {
            if (route.mount === mount.name) { // add route-handler
                route.verbs.forEach(verb => {
                    mount.app[verb](route.path, (req, res, next) => { // verb could be get/set/delete/put/, etc.
                        const onError = (err) => {
                            next(err);
                        };
                        const onDone = (result) => {
                            if (!result) {
                                next();
                            }
                        };
                        const handleRoute = () => {
                            include(route.handler).then((theType) => {
                                let RouteHandler = as(theType, RestHandler);
                                if (RouteHandler) {
                                    try {
                                        using(new RouteHandler(), (routeHandler) => {
                                            // req.params has all the route parameters.
                                            // e.g., for route "/users/:userId/books/:bookId" req.params will 
                                            // have "req.params: { "userId": "34", "bookId": "8989" }"
                                            result = routeHandler[verb](req, res);
                                            if (result && typeof result.then === 'function') {
                                                result.then((delayedResult) => {
                                                    onDone(delayedResult);
                                                }).catch(onError);
                                            } else {
                                                onDone(result);
                                            }
                                        });
                                    } catch (err) {
                                        onError(err);
                                    }
                                } else {
                                    onError(Exception.InvalidDefinition(`Invalid route handler. ${route.handler}`));
                                }
                            }).catch(onError);
                        };

                        // add special properties to req
                        req.$stop = false;

                        // run mount specific interceptors
                        // each interceptor is derived from RestInterceptor and
                        // run method of it takes req, can update it, also takes res method and can generate response, in case request is being stopped
                        // each item is: "InterceptorTypeQualifiedName"
                        let mountInterceptors = settings[`${mount.name}-interceptors`] || [];
                        runInterceptors(mountInterceptors, req, res).then(() => {
                            if (!req.$stop) {
                                handleRoute();
                            } else {
                                res.end();
                            }
                        }).catch((err) => {
                            if (req.stop) {
                                res.end();
                            } else {
                                onError(err);
                            }
                        });
                    });
                });
            }
        }

        // catch 404 for this mount and forward to error handler
        mount.app.use((req, res, next) => {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        // dev/prod error handler
        if (env.isProd) {
            mount.app.use((err, req, res) => {
                res.status(err.status || 500);
                if (req.xhr) {
                    res.status(500).send({
                        error: err.toString()
                    });
                } else {
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                }
                res.end();
            });
        } else {
            mount.app.use((err, req, res) => {
                res.status(err.status || 500);
                if (req.xhr) {
                    res.status(500).send({
                        error: err.toString()
                    });
                } else {
                    res.render('error', {
                        message: err.message,
                        error: err
                    });
                }
                res.end();
            });
        }
    };
});} catch(err) {
	__asmError(err);
}
})();

} catch(err) {
	__asmError(err);
}

AppDomain.context.current().currentAssemblyBeingLoaded('');

AppDomain.registerAdo('{"name":"flair.server","file":"./flair.server{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.50.32","lupdate":"Sat, 04 May 2019 18:35:16 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","functions","types","enclosureVars","enclosedTypes","resources","assets","routes","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.api.RestHandler","flair.api.RestInterceptor","flair.app.ServerHost","flair.app.express.Server","flair.app.firebase.Server","flair.boot.Middlewares","flair.boot.NodeEnv","flair.boot.ResHeaders","flair.boot.ServerRouter"],"resources":[],"assets":[],"routes":[]}');

if(typeof onLoadComplete === 'function'){ onLoadComplete(); onLoadComplete = noop; } // eslint-disable-line no-undef

})();
