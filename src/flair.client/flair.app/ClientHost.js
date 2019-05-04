const { Host } = ns('flair.app');

/**
 * @name ClientHost
 * @description Client host implementation
 */
$$('sealed');
$$('ns', '(auto)');
Class('(auto)', Host, function() {
    let mountedApps = {},
        page = window.page,
        hashChangeHandler = null;

    $$('override');
    this.construct = (base) => {
        base('Page', '1.x'); // https://www.npmjs.com/package/page
    };

    this.app = () => { return this.mounts['main']; } // main page app
    this.mounts = { // all mounted page apps
        get: () => { return mountedApps; },
        set: noop
    };

    $$('override');
    this.boot = async (base) => { // mount all page app and pseudo sub-apps
        base();

        let appOptions = null,
            mountPath = '',
            mount = null;
        const getOptions = (mountName) => {
            let appOptions = {};
            // app options: https://www.npmjs.com/package/page#pageoptions
            // each item is: { name: '', value:  }
            // name: as in above link (as-is)
            // value: as defined in above link
            let pageOptions = settings[`${mountName}-options`];
            if (pageOptions && pageOptions.length > 0) {
                for(let pageOption of pageOptions) {
                    appOptions[pageOption.name] = pageOption.value;
                }
            }   

            // inbuilt fixed options, overwrite even if defined outside
            appOptions.click = false;
            appOptions.popstate = false;
            appOptions.dispatch = false;
            appOptions.hashbang = false;
            appOptions.decodeURLComponents = true;

            return appOptions;         
        };

        // create main app instance of page
        // 'page' variable is already loaded, as page.js is bundled in fliar.app
        appOptions = getOptions('main');
        let mainApp = page(appOptions);
        mainApp.strict(appOptions.strict);
        mainApp.base('/');

        // create one instance of page app for each mounted path
        for(let mountName of Object.keys(settings.mounts)) {
            if (mountName === 'main') {
                mountPath = '/';
                mount = mainApp;
            } else {
                appOptions = getOptions(mountName);
                mountPath = settings.mounts[mountName];
                mount = page.create(appOptions); // create a sub-app
                mount.strict(appOptions.strict);
                mount.base(mountPath);
            }

            // attach
            mountedApps[mountName] = Object.freeze({
                name: mountName,
                root: mountPath,
                app: mount
            });
        }

        // store
        mountedApps = Object.freeze(mountedApps);       
    };

    $$('override');
    this.start = async (base) => { // configure hashchange handler
        base();

        hashChangeHandler = () => {
            // get clean path
            let path = window.location.hash;
            if (path.substr(0, 3) === '#!/') { path = path.substr(3); }
            if (path.substr(0, 2) === '#!') { path = path.substr(2); }
            if (path.substr(0, 2) === '#/') { path = path.substr(2); }
            if (path.substr(0, 1) === '#') { path = path.substr(1); }
            
            // route this path to most suitable mounted app
            let app = null,
                mountName = '';
            for(let mount of this.mounts) {
                if (path.startsWith(mount.root)) { 
                    app = mount.app; 
                    path = path.substr(mount.root.length); // remove all base path, so it becomes at part the way paths were added to this app
                    mountName = mount;
                    break; 
                }
            }
            if (!app) { // when nothing matches, give it to main
                mountName = 'main';
                app = this.mounts[mountName]; 
            } 
            
            // add initial /
            if (path.substr(0, 1) !== '/') { path = '/' + path; }

            // run app to initiate routing
            setTimeout(() => { 
                try {
                    app(path);
                } catch (err) {
                    this.error(err); // pass-through event
                }
            }, 0); 
        };
    };

    $$('override');
    this.ready = async (base) => { // start listening hashchange event
        base();

        // attach event handler
        window.addEventListener('hashchange', hashChangeHandler);

        // navigate to home
        this.app.redirect(settings.url.home);

        // ready
        console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version}`); // eslint-disable-line no-console
    };

    $$('override');
    this.stop = async (base) => { // stop listening hashchange event
        base();

        // detach event handler
        window.removeEventListener('hashchange', hashChangeHandler);
    };

    $$('override');
    this.dispose = (base) => {
        base();

        mountedApps = null;
    };
});
