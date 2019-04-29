const { Bootware } = ns('flair.app');
const { RestHandler, RestInterceptor } = ns('flair.api');
const { ViewHandler, ViewInterceptor } = ns('flair.ui');

/**
 * @name Router
 * @description Router Configuration Setup
 */
$$('sealed');
$$('ns', '(auto)');
Class('(auto)', Bootware, function() {
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

        let result = false;
        const setupServerRoutes = () => {
            const runApiInterceptors = (mountName, req, res) => {
                return new Promise((resolve, reject) => {
                    // run mount specific interceptors
                    // each interceptor is derived from RestInterceptor and
                    // run method of it takes req, can update it, also takes res method and can generate response, in case request is being stopped
                    // each item is: "InterceptorTypeQualifiedName"
                    let mountInterceptors = settings[`${mountName}-interceptors`] || [];
                    if (mountInterceptors && mountInterceptors.length > 0) {
                        forEachAsync(mountInterceptors, (_resolve, _reject, ic) => {
                            include(ic).then((theType) => {
                                let ApiICType = as(theType, RestInterceptor);
                                if (ApiICType) {
                                    try {
                                        let aic = new ApiICType();
                                        aic.run(req, res).then(() => {
                                            if (req.$stop) { 
                                                _reject(); 
                                            } else {
                                                _resolve();
                                            }
                                        }).catch(_reject);
                                    } catch (err) {
                                        _reject(err);
                                    }
                                } else {
                                    _reject(Exception.InvalidDefinition(`Invalid api interceptor. (${ic})`));
                                }
                            }).catch(_reject);                            
                        }).then(resolve).catch(reject);
                    } else {
                        resolve();
                    }
                });
            };

            // add routes related to current mount
            for(let route of routes) {
                if (route.mount === mount.name) { // add route-handler
                    route.verbs.forEach(verb => {
                        mount.app[verb](route.path, (req, res, next) => { // verb could be get/set/delete/put/, etc.
                            const onError = (err) => { next(err); };
                            const onDone = (result) => { if (!result) { next(); } };

                            // add special properties to req
                            req.$stop = false;

                            // run api interceptors
                            runApiInterceptors(mount.name, req, res).then(() => {
                                if (!req.$stop) {
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
                                } else {
                                    res.end();
                                }
                            }).catch((err) => {
                                if (req.$stop) { // reject might also be because of stop done by an interceptor
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
                        res.status(500).send({ error: err.toString() }); 
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
                        res.status(500).send({ error: err.toString() }); 
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
        const setupClientRoutes = () => {
            const runViewInterceptors = (mountName, ctx) => {
                return new Promise((resolve, reject) => {
                    // run mount specific interceptors
                    // each interceptor is derived from ViewInterceptor and
                    // run method of it takes ctx, can update it
                    // each item is: "InterceptorTypeQualifiedName"
                    let mountInterceptors = settings[`${mountName}-interceptors`] || [];
                    if (mountInterceptors && mountInterceptors.length > 0) {
                        forEachAsync(mountInterceptors, (_resolve, _reject, ic) => {
                            include(ic).then((theType) => {
                                let ViewICType = as(theType, ViewInterceptor);
                                if (ViewICType) {
                                    try {
                                        let vic = new ViewICType();
                                        vic.run(ctx).then(() => {
                                            if (ctx.$stop) { 
                                                _reject(); 
                                            } else {
                                                _resolve();
                                            }
                                        }).catch(_reject);
                                    } catch (err) {
                                        _reject(err);
                                    }
                                } else {
                                    _reject(Exception.InvalidDefinition(`Invalid view interceptor. (${ic})`));
                                }
                            }).catch(_reject);                            
                        }).then(resolve).catch(reject);
                    } else {
                        resolve();
                    }
                });
            };

            // add routes related to current mount
            let verb = 'view'; // only view verb is supported on client
            for(let route of routes) {
                if (route.mount === mount.name) { // add route-handler
                    // NOTE: verbs are ignored for client routing, only 'view' verb is processed
                    mount.app(route.path, (ctx) => { // mount.app = page object/func
                        const onError = (err) => { AppDomain.host().raiseError(err); };
                        const onRedirect = (url) => { mount.app.redirect(url); };

                        // add special properties to context
                        ctx.$stop = false;
                        ctx.$redirect = '';

                        // run view interceptors
                        runViewInterceptors(mount.name, ctx).then(() => {
                            if (!ctx.$stop) {
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
                                                    if (ctx.$redirect) { onRedirect(ctx.$redirect); } 
                                                }).catch(onError);
                                            });
                                        } catch (err) {
                                            onError(err);
                                        }
                                    } else {
                                        onError(Exception.InvalidDefinition(`Invalid route handler. (${route.handler})`));
                                    }
                                }).catch(onError);
                            } else {
                                ctx.handled = true;
                                if (ctx.$redirect) { onRedirect(ctx.$redirect); }  
                            }
                        }).catch((err) => {
                            if (ctx.$stop) { // reject might also be because of stop done by an interceptor
                                ctx.handled = true;
                                if (ctx.$redirect) { onRedirect(ctx.$redirect); }  
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

        if (env.isServer) {
            setupServerRoutes();
        } else { // client
            setupClientRoutes();
        }
    };
});
