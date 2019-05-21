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

        const runInterceptor = async (interceptor, ctx) => {
            let ICType = as(await include(interceptor), ViewInterceptor);
            if (ICType) {
                let ic = new ICType();
                await ic.run(ctx);
            } else {
                throw Exception.InvalidDefinition(`Invalid interceptor type. (${interceptor})`);
            }                    

        };
        const runHandler = async (routeHandler, ctx) => {
            let RouteHandler = as(await include(routeHandler), ViewHandler);
            if (RouteHandler) {
                let rh = new RouteHandler();
                await rh.view(ctx);
            } else {
                throw Exception.InvalidDefinition(`Invalid route handler. (${routeHandler})`);
            }
        };
        const getHandler = function(route) {
            return async (ctx) => {
                // ctx.params has all the route parameters.
                // e.g., for route "/users/:userId/books/:bookId" ctx.params will 
                // have "ctx.params: { "userId": "34", "bookId": "8989" }"
                // it supports everything in here: https://www.npmjs.com/package/path-to-regexp

                // run mount specific interceptors
                // each interceptor is derived from ViewInterceptor and
                // async run method of it takes ctx, can update it
                // each item is: "InterceptorTypeQualifiedName"
                let mountInterceptors = settings.client.routing[`${route.mount}-interceptors`] || [];
                for(let interceptor of mountInterceptors) {
                    await runInterceptor(interceptor, ctx);
                    if (ctx.$stop) { break; }
                }

                // handle route
                if (!ctx.$stop) {
                    await runHandler(route.handler, ctx);
                }
            };
        };

        // add routes related to current mount
        let app = mount.app;
        for (let route of routes) {
            if (route.mount === mount.name) { // add route-handler
                if (route.name !== settings.client.routes.notfound) { // add all except the 404 route
                    app.add(route, getHandler(route));
                } 
            }
        }

        // catch 404 for this mount
        app.add404(async (ctx) => {
            // 404 handler does not run interceptors
            // and instead of running the route (for which this ctx was setup)
            // it will pick the handler of notfound route and show that view with this ctx
            let route404 = settings.client.routes.notfound;
            if (route404) { route404 = AppDomain.context.current().getRoute(route404); }
            if (!route404) { // nothing else can be done
                setTimeout(() => { window.history.back(); }, 0);
                return;
            }

            // use route404 handler
            await runHandler(route404.handler, ctx);
        });
    };
});