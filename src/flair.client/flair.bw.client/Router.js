const { Bootware } = ns();

/**
 * @name Router
 * @description Client Router Configuration Setup
 */
$$('sealed');
$$('ns', '(auto)');
Class('(auto)', Bootware, function() {
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
                        AppDomain.app().onError(err);
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
