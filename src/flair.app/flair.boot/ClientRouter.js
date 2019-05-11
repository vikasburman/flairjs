const { Bootware } = ns('flair.app');

/**
 * @name ClientRouter
 * @description Client Router Configuration Setup
 */
$$('sealed');
$$('ns', '(auto)');
Class('(auto)', Bootware, function () {
    const { ViewHandler, ViewInterceptor } = ns('flair.ui');

    let routes = null;
    
    $$('override');
    this.construct = (base) => {
        base('Client Router', true); // mount specific 
    };

    $$('override');
    this.boot = async (base, mount) => {
        base();
        
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
                if (ctx.pathname !== url404) { 
                    mount.app.redirect(url404);
                } else { // when even 404 is not handled
                    // just mark as handled, and don't do anything
                }
            } else {
                window.history.back(); // nothing else can be done
            }
        });
    };
});