const { Bootware } = ns('flair.app');

/**
 * @name BootEngine
 * @description Bootstrapper functionality
 */
$$('static');
$$('ns', '(auto)');
Class('(auto)', function() {
    this.start = async function (entryPoint) {
        let allBootwares = [],
            mountSpecificBootwares = [],
            currentScript = (env.isServer ? '' : window.document.scripts[window.document.scripts.length - 1].src);
        entryPoint = (env.isServer ? (env.isWorker ? '' : entryPoint) : (env.isWorker ? '' : currentScript));
        const setEntryPoint = () => {
            // set entry point for workers
            AppDomain.entryPoint(entryPoint);
        };
        const loadFilesAndBootwares = async () => {
            // load bootwares, scripts and preambles
            let Item = null,
                Bootware = null,
                bw = null;
            for(let item of settings.load) {
                // get bootware (it could be a bootware, a simple script or a preamble)
                item = which(item); // server/client specific version
                if (item) { // in case no item is set for either server/client
                    Item = await include(item);
                    if (Item) {
                        Bootware = as(Item, Bootware);
                        if (Bootware) { // if boot
                            bw = new Bootware(); 
                            allBootwares.push(bw); // push in array, so boot and ready would be called for them
                            if (bw.info.isMountSpecific) { // if bootware is mount specific bootware - means can run once for each mount
                                mountSpecificBootwares.push(bw);
                            }
                        } // else ignore, this was something else, like a module which was just loaded
                    } // else ignore, as it could just be a file loaded which does not return anything
                }
            }
        };
        const runBootwares = async (method) => {
            if (!env.isWorker) { // main env
                let mounts = AppDomain.host().mounts,
                    mountNames = Object.keys(mounts),
                    mountName = '',
                    mount = null;
            
                // run all bootwares for main
                mountName = 'main';
                mount = mounts[mountName];
                for(let bw of allBootwares) {
                    await bw[method](mountName, mount);
                }

                // run all bootwares which are mount specific for all other mounts (except main)
                for(let mountName of mountNames) {
                    if (mountName === 'main') { continue; }
                    mount = mounts[mountName];
                    for(let bw of mountSpecificBootwares) {
                        await bw[method](mountName, mount);
                    }
                }
            } else { // worker env
                // in this case as per load[] setting, no nountspecific bootwares should be present
                if (mountSpecificBootwares.length !== 0) { 
                    console.warn('Mount specific bootwares are not supported for worker environment. Revisit worker:flair.app->load setting.'); // eslint-disable-line no-console
                }

                // run all for once (ignoring the mountspecific ones)
                for(let bw of allBootwares) {
                    if (!bw.info.isMountSpecific) {
                        await bw[method]();
                    }
                }
            }
        };
        const boot = async () => {
            if (!env.isWorker) {
                let host = which(settings.host), // pick server/client specific host
                    Host = as(await include(host), Bootware),
                    hostObj = null;
                if (!Host) { throw Exception.InvalidDefinition(host, this.start); }
                hostObj = new Host();
                await hostObj.boot();
                AppDomain.host(hostObj); // set host
            }
            
            await runBootwares('boot');   
            
            let app = which(settings.app), // pick server/client specific host
            App = as(await include(app), Bootware),
            appObj = null;
            if (!App) { throw Exception.InvalidDefinition(app, this.start); }
            appObj = new App();
            await appObj.boot();
            AppDomain.app(appObj); // set app
        };        
        const start = async () => {
            if (!env.isWorker) {
                await AppDomain.host().start();
            }
            await AppDomain.app().start();
        };
        const DOMReady = () => {
            return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                if( document.readyState !== 'loading' ) {
                    resolve();
                } else {
                    window.document.addEventListener("DOMContentLoaded", () => {
                        resolve();
                    });
                }
            });
        };
        const DeviceReady = () => {
            return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                window.document.addEventListener('deviceready', () => {
                    // NOTE: even if the device was already ready, registering for this event will immediately fire it
                    resolve();
                }, false);
            });
        };
        const ready = async () => {
            if (env.isClient && !env.isWorker) {
                await DOMReady();
                if (env.isCordova) { await DeviceReady(); }
            }

            if (!env.isWorker) {
                await AppDomain.host().ready();
            }
            await runBootwares('ready');
            await AppDomain.app().ready();
        };
          
        setEntryPoint();
        await loadFilesAndBootwares();
        await boot();
        await start();
        await ready();
        console.log('ready!'); // eslint-disable-line no-console
    };
});
