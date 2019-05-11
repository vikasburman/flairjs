const { Host } = ns('flair.app');

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
        base('Page', '1.x'); // https://www.npmjs.com/package/page
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
    this.currentLocale = settings.client.i18n.locale;

    this.defaultLocale = {
        get: () => { return settings.client.i18n.locale; },
        set: noop
    };
    this.supportedLocales = {
        get: () => { return settings.client.i18n.locales.slice(); },
        set: noop
    };
    this.locale = (newLocale, isSuppressRefresh) => {
        if (!settings.client.i18n.enabled) { return ''; }

        // update value and refresh for changes (if required)
        if (newLocale && this.currentLocale !== newLocale) { 
            this.currentLocale = newLocale;

            // change url and then redirect to new URL
            if (!isSuppressRefresh) {
                if (settings.client.url.i18n) {
                    // set new path with replaced locale
                    // this change will also go in history
                    window.location.hash = this.replaceLocale(window.location.hash);
                } else {
                    // just refresh as is (it will pick the new currentLocale)
                    // this change will not go in history, as there is no url change
                    if (hashChangeHandler) { hashChangeHandler(); }
                }
            }
        }

        // return
        return this.currentLocale;
    };
    // localization support (end)

    // path support (start)
    $$('private');
    this.cleanPath = (path) => {
        if (path.substr(0, 1) === '/') { path = path.substr(1); }        
        if (path.substr(0, 3) === '#!/') { path = path.substr(3); }
        if (path.substr(0, 2) === '#!') { path = path.substr(2); }
        if (path.substr(0, 2) === '#/') { path = path.substr(2); }
        if (path.substr(0, 1) === '#') { path = path.substr(1); }
        if (path.substr(0, 1) === '/') { path = path.substr(1); }        
        return path;
    };
    $$('private');
    this.extractLocale = (path) => {
        if (!settings.client.url.i18n) { return ''; }

        // pick first path element
        let idx = path.indexOf('/');
        if (idx !== -1) {
            let loc = path.substr(0, idx);
            if (this.supportedLocales.indexOf(loc) !== -1) {
                return loc; // found locale
            }
        }

        return '';
    };
    $$('private');
    this.trimLocale = (path, locale) => {
        let lookFor = locale + '/',
            idx = path.indexOf(lookFor);
        if (idx !== -1) {
            return path.substr(idx + lookFor.length);
        }
        // return as is
        return path;
    };
    $$('private');
    this.replaceLocale = (path) => {
        // replace current locale with given locale
        if (settings.client.url.i18n) { 
            // clean path first
            path = this.cleanPath(path);

           // extract locale from path
           let extractedLocale = this.extractLocale(path);
           if (extractedLocale) {
                // trim locale from path
                path = this.trimLocale(path, extractedLocale);
            }

            // build path with new locale
            path = this.path(path);
        }

        // return
        return path;
    };

    this.path = (path) => {
        if (!path) { return ''; }

        // clean path
        path = this.cleanPath(path);

        // add hash
        if (settings.client.url.hashbang) {
            path = '/#!/' + path;
        } else {
            path = '/#/' + path;
        }

        // add i18n
        if (settings.client.i18n.enabled && settings.client.url.i18n) {
            path = (this.currentLocale || this.defaultLocale) + '/' + path;
        }

        // return
        return path;
    };
    this.route = (route, placeholders) => {
        if (!route) { return; }

        // get path
        let path = '', 
            routeObj = AppDomain.context.current().getRoute(route); // route = qualifiedRouteName
        if (routeObj) {
            path = routeObj.path;
        }

        // replace placeholders
        // path can be like: test/:id
        // where it is expected that placeholders.id property will have what to replace in this
        if (path && placeholders) {
            let idx1 = path.indexOf(':'),
                idx2 = -1,
                name = '';
            while(idx1 !== -1) {
                idx2 = path.substr(idx1 + 1).indexOf('/');
                if (idx2 === -1) { // at the end
                    name = path.substr(idx1 + 1);
                } else {
                    name = path.substr(idx1 + 1, idx2);
                }
                path = replaceAll(path, ':' + name, placeholders[name]);
                idx1 = path.indexOf(':');
            }
        }

        // build path now
        return this.path(path);
    };
    // path support (end)

    $$('override');
    this.boot = async (base) => { // mount all page app and pseudo sub-apps
        base();

        const page = await include('page/page{.min}.js', 'page');

        let appOptions = null,
            mountPath = '',
            mount = null;
        const getOptions = (mountName) => {
            let appOptions = {};
            // app options: https://www.npmjs.com/package/page#pageoptions
            // each item is: { name: '', value:  }
            // name: as in above link (as-is)
            // value: as defined in above link
            let pageOptions = settings.client.routing[`${mountName}-options`];
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
            appOptions.window = window; // always this is main window (even for sub-apps) - since we are not binding any handlers here, this is fine to have same window

            return appOptions;         
        };

        // create main app instance of page
        appOptions = getOptions('main');
        page(appOptions); // configure main app
        let mainApp = page; // main-app is this object itself
        mainApp.strict(appOptions.strict);
        mainApp.base('/');

        // create one instance of page app for each mounted path
        for(let mountName of Object.keys(settings.client.routing.mounts)) {
            if (mountName === 'main') {
                mountPath = '/';
                mount = mainApp;
            } else {
                appOptions = getOptions(mountName);
                mountPath = settings.client.routing.mounts[mountName];
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
            let path = this.cleanPath(window.location.hash);
            
            // handle i18n specific routing
            if (settings.client.i18n.enabled) {
                if (settings.client.url.i18n) { // if i18n type urls are being used
                    // extract locale from path
                    let extractedLocale = this.extractLocale(path);

                    if (extractedLocale) {
                        // trim locale from path, so all paths here on are common across locales
                        path = this.trimLocale(path, extractedLocale);

                        // set this locale as currentLocale
                        this.locale(extractedLocale, true); // and don't initiate refresh, as it is already in that process
                    }
                }
            }

            // at this point in time: 
            // this.currentLocale has the right locale whether coming from url or otherwise
            // path does not have any locale or hashbang and is just plain path for routing

            // add a / in path, so it matches with routing definitions of mounts
            path = ((path.substr(0, 1) !== '/') ? '/' : '') + path;

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
        this.app.redirect(settings.client.url.home);

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
