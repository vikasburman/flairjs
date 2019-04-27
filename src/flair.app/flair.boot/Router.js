const { Bootware } = ns('flair.app');

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
            // add routes related to current mount
            for(let route of routes) {
                if (route.mount === mount.name) { // add route-handler
                    route.verbs.forEach(verb => {
                        mount.app[verb](route.path, (req, res, next) => { // verb could be get/set/delete/put/, etc.
                            const onDone = (result) => {
                                if (!result) {
                                    next();
                                }
                            };
                            const onError = (err) => {
                                next(err);
                            };
    
                            try {
                                using(new route.Handler(), (routeHandler) => {
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
            // add routes related to current mount
            for(let route of routes) {
                if (route.mount === mount.name) { // add route-handler
                    // NOTE: verbs are ignored for client routing, only 'view' verb is processed
                    mount.app(route.path, (ctx) => { // mount.app = page object/func
                        try {
                            using(new route.Handler(), (routeHandler) => {
                                // add redirect options
                                ctx.redirectUrl = '';

                                // ctx.params has all the route parameters.
                                // e.g., for route "/users/:userId/books/:bookId" ctx.params will 
                                // have "ctx.params: { "userId": "34", "bookId": "8989" }"
                                routeHandler.view(ctx).then((result) => {
                                    if (!result) { // result could be undefined, true/false or any value
                                        if (ctx.redirectUrl !== '') { // redirect url was set
                                            ctx.handled = true; 
                                            mount.app.redirect(ctx.redirectUrl);
                                        } else {
                                            ctx.handled = false; 
                                        }
                                    } else {
                                        ctx.handled = true;
                                    }
                                }).catch((err) => {
                                    AppDomain.host().raiseError(err);
                                });

                            });
                        } catch (err) {
                            AppDomain.host().raiseError(err);
                        }
                    }); 
                }
            }

            // add 404 handler
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
