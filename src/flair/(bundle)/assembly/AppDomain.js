/**
 * @name AppDomain
 * @description Thread level isolation.
 * @example
 *  
 */
const AppDomain = function(name) {
    let asmFiles = {},
        asmTypes = {}, // lists all Types and Resource Types
        domains = {},
        contexts = {},
        currentContexts = [],
        allADOs = [],
        loadPaths = {},
        entryPoint = '',
        rootPath = '',
        configFileJSON = null,
        app = null,
        host = null,
        defaultLoadContext = null,
        unloadDefaultContext = null,
        isUnloaded = false,
        isBooted = false;
    
    // app domain
    domains[name] = this;
    this.name = name;
    this.isRemote = false;
    this.isUnloaded = () => { return isUnloaded; };
    this.unload = async () => {
        if (!isUnloaded) {
            // mark unloaded
            isUnloaded = true;

            // stop app 
            if (app && typeof app.stop === 'function') { await app.stop(); _dispose(app); }

            // stop host 
            if (host && typeof host.stop === 'function') { await host.stop(); _dispose(host); }

            // unload all contexts of this domain, including default one (async)
            for(let context in contexts) {
                if (contexts.hasOwnProperty(context)) {
                    if (typeof contexts[context].unload === 'function') {
                        contexts[context].unload();
                    }
                }
            }
            unloadDefaultContext();

            // unload all domains, including this one
            for(let domain in domains) {
                if (domains.hasOwnProperty(domain) && domains[domain] !== this) {
                    domains[domain].unload();
                }
            }

            // clear registries and vars
            asmFiles = {},
            asmTypes = {};
            contexts = {};
            domains = {};
            currentContexts = [];
            allADOs = [];
            loadPaths = {};
            entryPoint = '';
            rootPath = '';
            configFileJSON = null;
            app = null;
            host = null;
            defaultLoadContext = null;
            unloadDefaultContext = null;
        }
    };
    this.createDomain = (name) => {
        return new Promise((resolve, reject) => {
            if(typeof name !== 'string' || (name && name === 'default') || domains[name]) { reject(_Exception.InvalidArguments('name')); return; }
            let proxy = Object.freeze(new AppDomainProxy(name, domains, allADOs));
            domains[name] = proxy;
            resolve(proxy);
        });
    };
    this.domains = (name) => { return domains[name] || null; }
   
    // assembly load context
    const setNewDefaultContext = () => {
        defaultLoadContext = new AssemblyLoadContext('default', this, null, currentContexts, contexts),
        unloadDefaultContext = defaultLoadContext.unload;
        delete defaultLoadContext.unload; // default load context cannot be unloaded directly, unless app domain is unloaded
        defaultLoadContext = Object.freeze(defaultLoadContext);
        contexts[defaultLoadContext.name] = defaultLoadContext;
        return defaultLoadContext;
    };
    this.context = setNewDefaultContext();
    this.contexts = (name) => { return contexts[name] || null; }
    this.createContext = (name) => {
        return new Promise((resolve, reject) => {
            if(typeof name !== 'string' || (name && name === 'default') || contexts[name]) { reject(_Exception.InvalidArguments('name')); return; }
            let alc = Object.freeze(new AssemblyLoadContext(name, this, defaultLoadContext, currentContexts, contexts));
            contexts[name] = alc;
            resolve(alc);
        });
    };

    // ados
    this.registerAdo = (ado) => {
        if (typeof ado === 'string') { ado = JSON.parse(ado); }

        // validate
        if (_typeOf(ado.types) !== 'array' || 
            _typeOf(ado.resources) !== 'array' ||
            _typeOf(ado.routes) !== 'array' ||
            _typeOf(ado.assets) !== 'array' ||
            typeof ado.name !== 'string' ||
            typeof ado.file !== 'string' || ado.file === '') {
            throw _Exception.InvalidArgument('ado', this.registerAdo);
        }

        // register (no overwrite ever)
        ado.file = which(ado.file, true); // min/dev contextual pick
        if (!asmFiles[ado.file]) {
            asmFiles[ado.file] = Object.freeze(ado);

            // flatten types
            ado.types.forEach(qualifiedName => {
                // qualified names across anywhere should be unique
                if (asmTypes[qualifiedName]) {
                    throw _Exception.Duplicate(qualifiedName, this.registerAdo);
                } else {
                    asmTypes[qualifiedName] = ado.file; // means this type can be loaded from this assembly 
                }
            });

            // flatten resources
            ado.resources.forEach(qualifiedName => {
                // qualified names across anywhere should be unique
                if (asmTypes[qualifiedName]) {
                    throw _Exception.Duplicate(qualifiedName, this.registerAdo);
                } else {
                    asmTypes[qualifiedName] = ado.file; // means this resource can be loaded from this assembly
                }
            });
                
            // register routes
            this.context.registerRoutes(ado.routes, ado.file);

            // store raw, for later use and reference
            allADOs.push(ado);
        }  
    };
    this.getAdo = (file) => {
        if (typeof file !== 'string') { throw _Exception.InvalidArgument('file', this.getAdo); }
        return asmFiles[file] || null;
    };
    this.allAdos = () => { return Object.keys(asmFiles); }

    // types
    this.resolve = (qualifiedName) => {
        if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.resolve); }
        return asmTypes[qualifiedName] || null; // gives the assembly file name where this type reside     
    };
    this.allTypes = () => { return Object.keys(asmTypes); }

    // app domain start/restart
    this.boot = async (__entryPoint, __config) => {
        __config = __config || this.config();
        __entryPoint = __entryPoint || this.entryPoint();

        // don't boot if entry point is not defined
        if (!__entryPoint) { 
            console.log('No entry point defined, boot aborted.'); // eslint-disable-line no-console
            return false; 
        }

        // this is a place where all basic settings are done on start time
        // and now ready to start boot engine
        // also, this is called when app wants to restart
        // in that case, it do the same operations again

        // if this is a restart scenario, these will exist
        if (isBooted) { // if already booted, unload domain first
            await this.unload();
            isUnloaded = false; // so for next unload it remains same as on first load

            // initialize new default load context (for reboot context only)
            setNewDefaultContext();
        }

        // set root
        this.root(isServer ? process.cwd() : './');

        // set entry point, if defined
        if (__entryPoint) {
            this.entryPoint(__entryPoint);
        }

        // load config, if specified, otherwise ignore
        if (__config) {
            await this.config(__config);
        }

        // load flairjs preamble
        let preambleFile = '';
        if(flair.info.file.indexOf('flair.js') !== -1) {
            preambleFile = flair.info.file.replace('flair.js', 'preamble.js');
        } else if (flair.info.file.indexOf('flair.min.js') !== -1) {
            preambleFile = flair.info.file.replace('flair.min.js', 'preamble.js');
        }
        if (preambleFile) { 
            // this loads it as an async function which is called here
            let preambleLoader = await _include(preambleFile);
            await preambleLoader(flair);
        }

        // boot only when __entryPoint is defined
        let be = await _include(settings.bootEngine);
        await be.start();
        isBooted = true;

        // return
        return true;
    };

    // set onces, read many times
    this.config = (configFile) => {
        if (!configFileJSON && configFile) { // load only when not already loaded
            return new Promise((resolve, reject) => {
                _include(configFile).then((json) => {
                    configFileJSON = json;
                    resolve(Object.assign({}, configFileJSON)); // return a copy
                }).catch(reject);
            });
        } else {
            if (configFileJSON) {
                return Object.assign({}, configFileJSON); // return a copy
            }
            return null;
        }
    };
    this.entryPoint = (file) => {
        if (typeof file === 'string' && !entryPoint) { entryPoint = file; }
        return entryPoint;
    };
    this.app = (appObj) => {
        if (appObj && !app) { app = appObj; }
        return app;
    };
    this.host = (hostObj) => {
        if (hostObj) { host = hostObj; }
        return host;
    };
    this.loadPathOf = (file, path) => {
        if (typeof file !== 'string') { throw _Exception.InvalidArgument('file', this.loadPath); }
        if (path) { // set
            if (!loadPaths[file]) {
                loadPaths[file] = path;
            }
        }
        return loadPaths[file] || '';
    };
    this.root = (path) => {
        if (typeof path === 'string' && !rootPath) { 
            rootPath = path; 
            if (!rootPath.endsWith('/')) { rootPath += '/'; }
        }
        return rootPath;
    };
    this.resolvePath = (path) => {
        if (typeof path !== 'string') { throw _Exception.InvalidArgument('path', this.resolvePath); }
        return path.replace('./', this.root());
    };

    // scripts
    this.loadScripts = (...scripts) => {
        return new Promise((resolve, reject) => {
            try {
                _bring(scripts, () => {
                    resolve(); // resolve without passing anything
                });
            } catch (err) {
                reject(err);
            }
        });
    };

    // error router
    this.onError = (err) => {
        if (host) {
            host.raiseError(err);
        } else {
            throw err;
        }
    };
};

// build default app domain
let defaultAppDomain = new AppDomain('default'),
    unloadDefaultAppDomain = defaultAppDomain.unload;
delete defaultAppDomain.unload; // default app domain cannot be unloaded directly

const _AppDomain = defaultAppDomain;

// attach to flair
a2f('AppDomain', _AppDomain, () => {
    unloadDefaultAppDomain(); // unload default app domain
});
