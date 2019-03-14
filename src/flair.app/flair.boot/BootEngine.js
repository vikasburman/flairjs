const { IBootware } = ns('flair.boot');

/**
 * @name BootEngine
 * @description Bootstrapper functionality
 */
$$('static');
$$('ns', '(auto)');
Class('(auto)', function() {
    this.start = async (entryPoint) => {
        // set entry point for workers
        AppDomain.entryPoint(entryPoint);

        // load preambles
        await AppDomain.loadScripts(...settings.preambles);

        // boot
        let bootwares = [],
            bootware = null;
        for(let item of settings.bootwares) {
            // get bootware
            item = which(item); // server/client specific version
            if (item) { // in case no item is set for either server/client
                let Bootware = as(await include(item), IBootware);
                if (!Bootware) { throw Exception.InvalidDefinition(item, this.start); }
    
                // boot
                bootware = new Bootware();
                bootwares.push(bootware);
                await bootware.boot();
            }
        }

        // boot server
        if (env.isServer) {
            let server = as(await include(settings.server), IBootware);
            if (!server) { throw Exception.InvalidDefinition(settings.server, this.start); }
            await server.boot();
            AppDomain.Server(server); // set server
        }

        // boot app
        let app = as(await include(which(settings.app)), IBootware); // pick server/client specific setting
        if (!app) { throw Exception.InvalidDefinition(settings.app, this.start); }
        await app.boot();
        AppDomain.App(app); // set app

        // start server
        if (env.isServer) {
            await AppDomain.Server().start();
        }
        
        // start app
        await AppDomain.App().start();

        // ready
        for(let bw of bootwares) {
            await bw.ready();
        }

        // ready server
        await AppDomain.Server().ready();

        // finally make app ready
        await AppDomain.App.ready();
    };
});
