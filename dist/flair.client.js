/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.client
 *     File: ./flair.client.js
 *  Version: 0.51.56
 *  Mon, 06 May 2019 02:38:11 GMT
 * 
 * (c) 2017-2019 Vikas Burman
 * MIT
 */
(function(root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) { // AMD support
        define(factory);
    } else if (typeof exports === 'object') { // CommonJS and Node.js module support
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = factory; // Node.js specific module.exports
        }
        module.exports = exports = factory; // CommonJS        
    } else { // expose as global on window
        root['flair.client'] = factory;
    }
})(this, async function() {
    'use strict';
    
    // assembly closure init (start)
    /* eslint-disable no-unused-vars */
    
    // flair object
    const flair = (typeof global !== 'undefined' ? require('flairjs') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));
    
    // flair types, variables and functions
    const { Class, Struct, Enum, Interface, Mixin, Aspects, AppDomain, $$, attr, bring, Container, include, Port, on, post, telemetry,
            Reflector, Serializer, Tasks, as, is, isComplies, isDerivedFrom, isAbstract, isSealed, isStatic, isSingleton, isDeprecated,
            isImplements, isInstanceOf, isMixed, getAssembly, getAttr, getContext, getResource, getRoute, getType, ns, getTypeOf,
            getTypeName, typeOf, dispose, using, Args, Exception, noop, nip, nim, nie, event } = flair;
    const { TaskInfo } = flair.Tasks;
    const { env } = flair.options;
    const { forEachAsync, replaceAll, splitAndTrim, findIndexByProp, findItemByProp, which, guid, isArrowFunc, isASyncFunc, sieve,
            b64EncodeUnicode, b64DecodeUnicode } = flair.utils;
    
    // inbuilt modifiers and attributes compile-time-safe support
    const { $$static, $$abstract, $$virtual, $$override, $$sealed, $$private, $$privateSet, $$protected, $$protectedSet, $$readonly, $$async,
            $$overload, $$enumerate, $$dispose, $$post, $$on, $$timer, $$type, $$args, $$inject, $$resource, $$asset, $$singleton, $$serialize,
            $$deprecate, $$session, $$state, $$conditional, $$noserialize, $$ns } = $$;
    
    // access to DOC
    const DOC = ((env.isServer || env.isWorker) ? null : window.document);

    // current for this assembly
    const __currentContextName = AppDomain.context.current().name;
    const __currentFile = (env.isServer ? __filename : window.document.currentScript.src.replace(window.document.location.href, './'));
    const __currentPath = __currentFile.substr(0, __currentFile.lastIndexOf('/') + 1);
    AppDomain.loadPathOf('flair.client', __currentPath);

    // settings of this assembly
    let settings = JSON.parse('{"el":"main","title":"","viewTransition":"","components":[],"transitions":[],"filters":[],"mixins":[],"directives":[],"plugins":[],"pluginOptions":{},"url":{"404":"/404","home":"/"},"mounts":{"main":"/"},"main-options":[],"main-interceptors":[]}');
    let settingsReader = flair.Port('settingsReader');
    if (typeof settingsReader === 'function') {
        let externalSettings = settingsReader('flair.client');
        if (externalSettings) { settings = Object.assign(settings, externalSettings); }
    }
    settings = Object.freeze(settings);

    // config of this assembly
    let config = JSON.parse('{}');
    config = Object.freeze(config);

    /* eslint-enable no-unused-vars */
    // assembly closure init (end)

    // assembly global functions (start)
    // (not defined)
    // assembly global functions (end)

    // set assembly being loaded
    AppDomain.context.current().currentAssemblyBeingLoaded('./flair.client{.min}.js');

    // assembly types (start)
    
    await (async () => { // type: ./src/flair.client/flair.ui/@1-ViewTransition.js
    /**
     * @name ViewTransition
     * @description GUI View Transition
     */
    $$('ns', 'flair.ui');
    Class('ViewTransition', function() {
        $$('virtual');
        $$('async');
        this.enter = noop;
    
        $$('virtual');
        $$('async');
        this.leave = noop;
    });
    
    })();
    
    await (async () => { // type: ./src/flair.client/flair.app/ClientHost.js
    const { Host } = ns('flair.app');
    
    /**
     * @name ClientHost
     * @description Client host implementation
     */
    $$('sealed');
    $$('ns', 'flair.app');
    Class('ClientHost', Host, function() {
        let mountedApps = {},
            page = window.page,
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
                let pageOptions = settings[`${mountName}-options`];
                if (pageOptions && pageOptions.length > 0) {
                    for(let pageOption of pageOptions) {
                        appOptions[pageOption.name] = pageOption.value;
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
            // 'page' variable is already loaded, as page.js is bundled in fliar.app
            appOptions = getOptions('main');
            let mainApp = page(appOptions);
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
                let path = window.location.hash;
                if (path.substr(0, 3) === '#!/') { path = path.substr(3); }
                if (path.substr(0, 2) === '#!') { path = path.substr(2); }
                if (path.substr(0, 2) === '#/') { path = path.substr(2); }
                if (path.substr(0, 1) === '#') { path = path.substr(1); }
                
                // route this path to most suitable mounted app
                let app = null,
                    mountName = '';
                for(let mount of this.mounts) {
                    if (path.startsWith(mount.root)) { 
                        app = mount.app; 
                        path = path.substr(mount.root.length); // remove all base path, so it becomes at part the way paths were added to this app
                        mountName = mount;
                        break; 
                    }
                }
                if (!app) { // when nothing matches, give it to main
                    mountName = 'main';
                    app = this.mounts[mountName]; 
                } 
                
                // add initial /
                if (path.substr(0, 1) !== '/') { path = '/' + path; }
    
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
            window.addEventListener('hashchange', hashChangeHandler);
    
            // navigate to home
            this.app.redirect(settings.url.home);
    
            // ready
            console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version}`); // eslint-disable-line no-console
        };
    
        $$('override');
        this.stop = async (base) => { // stop listening hashchange event
            base();
    
            // detach event handler
            window.removeEventListener('hashchange', hashChangeHandler);
        };
    
        $$('override');
        this.dispose = (base) => {
            base();
    
            mountedApps = null;
        };
    });
    
    })();
    
    await (async () => { // type: ./src/flair.client/flair.boot/ClientRouter.js
    const { Bootware } = ns('flair.app');
    const { ViewHandler, ViewInterceptor } = ns('flair.ui');
    
    /**
     * @name ClientRouter
     * @description Client Router Configuration Setup
     */
    $$('sealed');
    $$('ns', 'flair.boot');
    Class('ClientRouter', Bootware, function () {
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
                    if (a.index < b.index) {
                        return -1;
                    }
                    if (a.index > b.index) {
                        return 1;
                    }
                    return 0;
                });
            }
    
            const runInterceptor = (IC, ctx) => {
                return new Promise((resolve, reject) => {
                    try {
                        let aic = new IC();
                        aic.run(ctx).then(() => {
                            if (ctx.$stop) {
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
            const runInterceptors = (interceptors, ctx) => {
                return forEachAsync(interceptors, (resolve, reject, ic) => {
                    include(ic).then((theType) => {
                        let RequiredICType = as(theType, ViewInterceptor);
                        if (RequiredICType) {
                            runInterceptor(RequiredICType, ctx).then(resolve).catch(reject);
                        } else {
                            reject(Exception.InvalidDefinition(`Invalid interceptor type. (${ic})`));
                        }
                    }).catch(reject);
                });
            };
    
            // add routes related to current mount
            let verb = 'view'; // only view verb is supported on client
            for (let route of routes) {
                if (route.mount === mount.name) { // add route-handler
                    // NOTE: verbs are ignored for client routing, only 'view' verb is processed
                    mount.app(route.path, (ctx) => { // mount.app = page object/func
                        const onError = (err) => {
                            AppDomain.host().raiseError(err);
                        };
                        const onRedirect = (url) => {
                            mount.app.redirect(url);
                        };
                        const handleRoute = () => {
                            include(route.handler).then((theType) => {
                                let RouteHandler = as(theType, ViewHandler);
                                if (RouteHandler) {
                                    try {
                                        using(new RouteHandler(), (routeHandler) => {
                                            // ctx.params has all the route parameters.
                                            // e.g., for route "/users/:userId/books/:bookId" ctx.params will 
                                            // have "ctx.params: { "userId": "34", "bookId": "8989" }"
                                            routeHandler[verb](ctx).then(() => {
                                                ctx.handled = true;
                                                if (ctx.$redirect) {
                                                    onRedirect(ctx.$redirect);
                                                }
                                            }).catch(onError);
                                        });
                                    } catch (err) {
                                        onError(err);
                                    }
                                } else {
                                    onError(Exception.InvalidDefinition(`Invalid route handler. (${route.handler})`));
                                }
                            }).catch(onError);
                        };
    
                        // add special properties to context
                        ctx.$stop = false;
                        ctx.$redirect = '';
    
                        // run mount specific interceptors
                        // each interceptor is derived from ViewInterceptor and
                        // run method of it takes ctx, can update it
                        // each item is: "InterceptorTypeQualifiedName"
                        let mountInterceptors = settings[`${mount.name}-interceptors`] || [];
                        runInterceptors(mountInterceptors, ctx).then(() => {
                            if (!ctx.$stop) {
                                handleRoute();
                            } else {
                                ctx.handled = true;
                                if (ctx.$redirect) {
                                    onRedirect(ctx.$redirect);
                                }
                            }
                        }).catch((err) => {
                            if (ctx.$stop) { // reject might also be because of stop done by an interceptor
                                ctx.handled = true;
                                if (ctx.$redirect) {
                                    onRedirect(ctx.$redirect);
                                }
                            } else {
                                onError(err);
                            }
                        });
                    });
                }
            }
    
            // catch 404 for this mount and forward to error handler
            mount.app("*", (ctx) => { // mount.app = page object/func
                // redirect to 404 route, which has to be defined route
                let url404 = settings.url['404'];
                if (url404) {
                    ctx.handled = true;
                    mount.app.redirect(url404);
                } else {
                    window.history.back(); // nothing else can be done
                }
            });
        };
    });
    })();
    
    await (async () => { // type: ./src/flair.client/flair.ui/ViewHandler.js
    const { Handler } = ns('flair.app');
    const { ViewTransition } = ns('flair.ui');
    
    /**
     * @name ViewHandler
     * @description GUI View Handler
     */
    $$('ns', 'flair.ui');
    Class('ViewHandler', Handler, function() {
        let mainEl = '';
    
        $$('override');
        this.construct = (base, el, title, transition) => {
            base();
    
            mainEl = el || 'main';
            this.viewTransition = transition;
            this.title = this.title + (title ? ' - ' + title : '');
        };
    
        $$('privateSet');
        this.viewTransition = '';
    
        $$('protectedSet');
        this.name = '';
    
        $$('protectedSet');
        this.title = '';
    
        // each meta in array can be defined as:
        // { "<nameOfAttribute>": "<contentOfAttribute>", "<nameOfAttribute>": "<contentOfAttribute>", ... }
        $$('protectedSet');
        this.meta = null;
    
        this.view = async (ctx) => {
            // give it a unique name, if not already given
            this.name = this.name || (this.$self.id + '_' + guid());
    
            // load view transition
            if (this.viewTransition) {
                let ViewTransitionType = as(await include(this.viewTransition), ViewTransition);
                if (ViewTransitionType) {
                    this.viewTransition = new ViewTransitionType();
                } else {
                    this.viewTransition = '';
                }
            }
    
            // add view el to parent
            let el = DOC.createElement('div'),
                parentEl = DOC.getElementById(mainEl);
            el.id = this.name;
            el.setAttribute('hidden', '');
            parentEl.appendChild(el);
            
            // load view
            this.load(ctx, el);
    
            // swap views (old one is replaced with this new one)
            await this.swap();
        };
    
        $$('protected');
        $$('virtual');
        $$('async');
        this.loadView = noop;
    
        $$('private');
        this.swap = async () => {
            let thisViewEl = DOC.getElementById(this.name);
    
            // outgoing view
            if (this.$static.currentView) {
                let currentViewEl = DOC.getElementById(this.$static.currentView);
    
                // remove outgoing view meta   
                for(let meta of this.meta) {
                    DOC.head.removeChild(DOC.querySelector('meta[name="' + meta + '"]'));
                }
                    
                // apply transitions
                if (this.viewTransition) {
                    // leave outgoing, enter incoming
                    await this.viewTransition.leave(currentViewEl, thisViewEl);
                    await this.viewTransition.enter(thisViewEl, currentViewEl);
                } else {
                    // default is no transition
                    currentViewEl.hidden = true;
                    thisViewEl.hidden = false;
                }
    
                // remove outgoing view
                let parentEl = DOC.getElementById(mainEl);            
                parentEl.removeChild(currentViewEl);
            }
    
            // add incoming view meta
            for(let meta of this.meta) {
                var metaEl = document.createElement('meta');
                for(let metaAttr in meta) {
                    metaEl[metaAttr] = meta[metaAttr];
                }
                DOC.head.appendChild(metaEl);
            }
    
            // in case there was no previous view
            if (!this.$static.currentView) {
                thisViewEl.hidden = false;
            }
    
            // update title
            DOC.title = this.title;
    
            // set new current
            this.$static.currentView = this.name;
            this.$static.currentViewMeta = this.meta;
        };
    
        $$('static');
        this.currentView = '';
    
        $$('static');
        this.currentViewMeta = [];
    });
    
    })();
    
    await (async () => { // type: ./src/flair.client/flair.ui/ViewInterceptor.js
    /**
     * @name ViewInterceptor
     * @description GUI View Interceptor
     */
    $$('ns', 'flair.ui');
    Class('ViewInterceptor', function() {
        $$('virtual');
        $$('async');
        this.run = noop;
    });
    
    })();
    
    await (async () => { // type: ./src/flair.client/flair.ui/ViewState.js
    /**
     * @name ViewState
     * @description GUI View State Global Store
     */
    $$('singleton');
    $$('ns', 'flair.ui');
    Class('ViewState', function() {
        $$('state');
        $$('private');
        this.store = {};
    
        this.get = (path, name) => {
            path = path || ''; name = name || '';
            return this.store[path + '/' + name] || null;
        };
        this.set = (path, name, value) => {
            path = path || ''; name = name || '';
            if (typeof value !== 'boolean' && !value) {
                delete this.store[path + '/' + name]; return;
            }
            this.store[path + '/' + name] = value;
        };
    
        this.clear = () => { this.store = null; }
    });
    
    })();
    
    // assembly types (end)

    // assembly embedded resources (start)
    
    // assembly embedded resources (end)        

    // clear assembly being loaded
    AppDomain.context.current().currentAssemblyBeingLoaded('');

    // register assembly definition object
    AppDomain.registerAdo('{"name":"flair.client","file":"./flair.client{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.51.56","lupdate":"Mon, 06 May 2019 02:38:11 GMT","builder":{"name":"flairBuild","version":"1","format":"fasm","formatVersion":"1","contains":["init","func","type","vars","reso","asst","rout","sreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.ui.ViewTransition","flair.app.ClientHost","flair.boot.ClientRouter","flair.ui.ViewHandler","flair.ui.ViewInterceptor","flair.ui.ViewState"],"resources":[],"assets":[],"routes":[]}');

    // assembly load complete
    if (typeof onLoadComplete === 'function') { 
        onLoadComplete();   // eslint-disable-line no-undef
    } 
});