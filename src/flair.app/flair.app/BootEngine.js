const { Bootware } = ns('flair.app');

/**
 * @name BootEngine
 * @description Bootstrapper functionality
 */
$$('static');
$$('ns', '(auto)');
Class('(auto)', function() {
    this.start = async function () {
        let allBootwares = [],
            mountSpecificBootwares = [];
        const loadFiles = async () => {
            // load scripts
            for(let item of settings.boot.files) {
                // get simple script file
                item = which(item); // server/client specific version
                if (item) { // in case no item is set for either server/client
                    await include(item); // script file will be loaded as is
                }
            }
        };
        const loadPreambles = async () => {
            // load preambles
            let preambleLoader = null;
            for(let item of settings.boot.preambles) {
                // get simple script file
                item = which(item); // server/client specific version (although this will not be the case, generally)
                if (item) { // in case no item is set for either server/client
                    // this loads it as a function which is called here
                    preambleLoader = await include(item);
                    await preambleLoader(flair);
                }
            }
        };
        const loadBootwares = async () => {
            // load bootwares
            let Item = null,
                Bw = null,
                bw = null;
            for(let item of settings.boot.bootwares) {
                // get bootware
                item = which(item); // server/client specific version
                if (item) { // in case no item is set for either server/client
                    Item = await include(item);
                    if (Item && typeof Item !== 'boolean') {
                        Bw = as(Item, Bootware);
                        if (Bw) { // if boot
                            bw = new Bw(); 
                            allBootwares.push(bw); // push in array, so boot and ready would be called for them
                            if (bw.info.isMountSpecific) { // if bootware is mount specific bootware - means can run once for each mount
                                mountSpecificBootwares.push(bw);
                            }
                        } // else ignore, this was something else, like a module which was just loaded, for no reason (either by mistake or to take advantage of this load cycle)
                    } // else ignore, as it could just be a file loaded which does not return anything, for no reason (either by mistake or to take advantage of this load cycle)
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
                    await bw[method](mount);
                }

                // run all bootwares which are mount specific for all other mounts (except main)
                for(let mountName of mountNames) {
                    if (mountName === 'main') { continue; }
                    mount = mounts[mountName];
                    for(let bw of mountSpecificBootwares) {
                        await bw[method](mount);
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
            const Host = await include(settings.host);
            const App = await include(settings.app);
        
            // set host
            if (!env.isWorker) {
                let hostObj = new Host();
                await hostObj.boot();
                AppDomain.host(hostObj); 
            }
            
            // boot
            await runBootwares('boot');   
            
            // set app
            let appObj = new App();
            await appObj.boot();
            AppDomain.app(appObj); 
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
          
        await loadFiles();
        await loadPreambles();
        await loadBootwares();
        await boot();
        await start();
        await ready();
        console.log('ready!'); // eslint-disable-line no-console
    };
});
