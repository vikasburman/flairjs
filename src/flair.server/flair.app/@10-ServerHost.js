const { Host } = ns('flair.app');
const Server = await include(settings['server'] || 'flair.app.server.ExpressServer');
const express = await include('express | x');

/**
 * @name ServerHost
 * @description Server host implementation
 */
$$('sealed');
$$('ns', '(auto)');
Class('(auto)', Host, [Server], function() {
    let mountedApps = {};
    
    $$('override');
    this.construct = (base) => {
        base('Express', '4.x');
    };

    this.app = {
        get: () => { return this.mounts['main'].app; },  // main express app
        set: noop
    };
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
