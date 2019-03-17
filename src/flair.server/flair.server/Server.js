const express = require('express');
const { ServerHost } = ns('flair.boot');

/**
 * @name Server
 * @description Default server implementation
 */
$$('sealed');
$$('ns', '(auto)');
Class('(auto)', ServerHost, function() {
    let mountedApps = {};
    
    $$('override');
    this.construct = (base) => {
        base('Express', '4.x');
    };

    // main express app
    this.app = () => { return this.mounts['main']; }

    // all mounted express apps
    this.mounts = {
        get: () => { return mountedApps; },
        set: noop
    };

    $$('override');
    this.boot = async (base) => {
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
    this.start = async (base) => {
        base();

    };

    $$('override');
    this.stop = async (base) => {
        base();

    };

    $$('override');
    this.ready = async (base) => {
        base();

    };

    $$('override');
    this.dispose = (base) => {
        base();

        mountedApps = null;
    };
});
