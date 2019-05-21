const { Host } = ns('flair.app');
const { ViewHandler, Page } = ns('flair.ui');

/**
 * @name ClientHost
 * @description Client host implementation
 */
$$('sealed');
$$('ns', '(auto)');
Class('(auto)', Host, function() {
    let mountedApps = {},
        hashChangeHandler = null;

    $$('override');
    this.construct = (base) => {
        base('Client'); 
    };

    this.app = {
        get: () => { return this.mounts['main'].app; },  // main page app
        set: noop
    };    
    this.mounts = { // all mounted page apps
        get: () => { return mountedApps; },
        set: noop
    };

    // localization support (start)
    $$('state');
    $$('private');
    this.currentLocale = settings.client.i18n.lang.default;

    this.defaultLocale = {
        get: () => { return settings.client.i18n.lang.default; },
        set: noop
    };
    this.supportedLocales = {
        get: () => { return settings.client.i18n.lang.locales.slice(); },
        set: noop
    };
    this.locale = (newLocale, isRefresh) => {
        // update value and refresh for changes (if required)
        if (newLocale && this.currentLocale !== newLocale) { 
            this.currentLocale = newLocale;

            if (isRefresh) {
                let app = this(window.location.hash);
                let updatedUrl = app.rebuildUrl(window.location.hash);
                this.go(updatedUrl);
            }
        }

        // return
        return this.currentLocale;
    };
    // localization support (end)

    // path support (start)
    this.routeToUrl = (route, params) => {
        if (!route) { return null; }

        // get route object
        let routeObj = AppDomain.context.current().getRoute(route); // route = qualifiedRouteName
        if (!routeObj) {
            return replaceAll(route, '.', '_'); // convert route qualified name in a non-existent utl, so it will automatically go to notfound view
        }

        // get app
        let app = this.mounts[routeObj.mount].app;

        // return
        return app.buildUrl(routeObj.path, params);
    };
    this.pathToUrl = (path, params) => {
        let app = this.urlToApp(path); // it will still work even if this is not url
        return app.buildUrl(path, params);
    };
    $$('private');
    this.urlToApp = (url) => {
        // remove any # or #! and start with /
        if (url.substr(0, 3) === '#!/') { url = url.substr(3); }
        if (url.substr(0, 2) === '#!') { url = url.substr(2); }
        if (!url.startsWith('/')) { url = '/' + url }

        // look for all mounted apps and find the best (longest) matched base path
        let lastFoundMount = null;
        for(let mount in this.mounts) {
            if (this.mounts.hasOwnProperty(mount)) {
                if (url.startsWith(mount.base)) { 
                    if (mount.base.length > lastFoundMount.base.length) {
                        lastFoundMount = mount;
                    }
                }
            }
        }

        // return
        return (lastFoundMount ? lastFoundMount.app : this.app);
    };
    // path support (end)

    // view (start)
    this.view = {
        get: () => { return ViewHandler.currentView; },
        set: noop
    };
    this.redirect = async (route, params, isRefresh) => {
        await this.navigate(route, params, true);
        if (isRefresh) { await this.refresh(); }
    };
    this.navigate = async (route, params, isReplace) => {
        params = params || {};

        // get url from route
        // routeName: qualifiedRouteName
        // url: hash part of url 
        let url = this.routeToUrl(route, params);

        // navigate/replace
        if (url) {
            await this.go(url, isReplace);
        } else {
            this.raiseError(Exception.NotFound(route, this.navigate));
        }
    };  
    this.go = async (url, isReplace) => {
        if (isReplace) {
            // this will not trigger hanschange event, neither will add a history entry
            history.replaceState(null, null, window.document.location.pathname + url);
        } else {
            // this will trigger hanschange event, and will add a history entry
            if (url.substr(0, 1) === '#') { url = url.substr(1); } // remove #, because it will automatically be added when setting hash below
            window.location.hash = url;
        }
    };
    this.refresh = async () => {
        setTimeout(() => {
            hashChangeHandler(); // force refresh
        }, 0)
    };
    // view (end)

    $$('override');
    this.boot = async (base) => { // mount all page app and pseudo sub-apps
        base();

        let appSettings = {},
            mount = null;
        const getSettings = (mountName) => {
            // each item is: { name: '', value:  }
            let pageSettings = settings.client.routing[`${mountName}-settings`];
            if (pageSettings && pageSettings.length > 0) {
                for(let pageSetting of pageSettings) {
                    appSettings[pageSetting.name] = pageSetting.value;
                }
            }   

            // special settings
            appSettings.base = settings.client.routing.mounts[mountName];

            return appSettings;         
        };

        // create main app instance of page
        appSettings = getSettings('main');
        let mainApp = new Page(appSettings);

        // create one instance of page app for each mounted path
        for(let mountName of Object.keys(settings.client.routing.mounts)) {
            if (mountName === 'main') {
                mount = mainApp;
            } else {
                appSettings = getSettings(mountName);
                mount = new Page(appSettings); 
            }

            // attach
            mountedApps[mountName] = Object.freeze({
                name: mountName,
                root: mount.base,
                app: mount
            });
        }

        // store
        mountedApps = Object.freeze(mountedApps);       
    };

    $$('override');
    this.start = async (base) => { // configure hashchange handler
        base();

        hashChangeHandler = async () => {
            // get page app mount to handle the url
            let app = this.urlToApp(window.location.hash);

            // run app to initiate routing
            await app.run(window.location.hash);
        };
    };

    $$('override');
    this.ready = async (base) => { // start listening hashchange event
        base();

        // attach event handler
        window.addEventListener('hashchange', hashChangeHandler);

        // redirect to home
        if (settings.client.routes.home) {
            await this.redirect(settings.client.routes.home, {}, true); // force refresh but don't let history entry added for first page
        }

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
