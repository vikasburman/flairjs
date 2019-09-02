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
    this.createDomain = async (name) => {
        if(typeof name !== 'string' || (name && name === 'default') || domains[name]) { throw _Exception.InvalidArguments('name'); }
        if (isServer) {
            try {
                let worker_threads = require('worker_threads'); // eslint-disable-line no-unused-vars
            } catch (err) { // eslint-disable-line no-unused-vars
                throw _Exception.NotAvailable('worker_threads'); 
            }
        }
        let proxy = Object.freeze(new AppDomainProxy(name, domains, allADOs));
        domains[name] = proxy;
        return proxy;
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
    this.createContext = async (name) => {
        if(typeof name !== 'string' || (name && name === 'default') || contexts[name]) { throw _Exception.InvalidArguments('name'); }
        let alc = Object.freeze(new AssemblyLoadContext(name, this, defaultLoadContext, currentContexts, contexts));
        contexts[name] = alc;
        return alc;
    };

    // ados
    this.getAsmFileKey = (file) => {
        // file key is always xyz.js - be it for .min.js version or for .js version
        if (file.indexOf('{.min}') !== -1) { 
            file = file.replace('{.min}', ''); 
        } else if (file.indexOf('.min.js') !== -1) {
            file = file.replace('.min.js', '.js'); 
        }
        return file;
    };
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
        let fileKey = this.getAsmFileKey(ado.file);
        if (!asmFiles[fileKey]) {
            // generate namespaces (from types and resources)
            let nsName = '';
            ado.namespaces = [];            

            // flatten types
            ado.types.forEach(qualifiedName => {
                // qualified names across anywhere should be unique
                if (asmTypes[qualifiedName]) {
                    throw _Exception.Duplicate(qualifiedName, this.registerAdo);
                } else {
                    asmTypes[qualifiedName] = ado.file; // means this type can be loaded from this assembly 

                    // add namespace
                    nsName = qualifiedName.substr(0, qualifiedName.lastIndexOf('.'));
                    if (ado.namespaces.indexOf(nsName) === -1) {
                        ado.namespaces.push(nsName);
                    }
                }
            });

            // flatten resources
            ado.resources.forEach(qualifiedName => {
                // qualified names across anywhere should be unique
                if (asmTypes[qualifiedName]) {
                    throw _Exception.Duplicate(qualifiedName, this.registerAdo);
                } else {
                    asmTypes[qualifiedName] = ado.file; // means this resource can be loaded from this assembly

                    // add namespace
                    nsName = qualifiedName.substr(0, qualifiedName.lastIndexOf('.'));
                    if (ado.namespaces.indexOf(nsName) === -1) {
                        ado.namespaces.push(nsName);
                    }
                }
            });
                
            // register routes
            this.context.registerRoutes(ado.routes, ado.file);

            // store raw, for later use and reference
            asmFiles[fileKey] = Object.freeze(ado);
            allADOs.push(ado);
        }  
    };
    this.getAdo = (file) => {
        if (typeof file !== 'string') { throw _Exception.InvalidArgument('file', this.getAdo); }
        let fileKey = this.getAsmFileKey(file);
        return asmFiles[fileKey] || null;
    };
    this.allAdos = () => { return allADOs.slice(); }

    // types
    this.resolve = (qualifiedName) => {
        if (typeof qualifiedName !== 'string') { throw _Exception.InvalidArgument('qualifiedName', this.resolve); }
        return asmTypes[qualifiedName] || null; // gives the assembly file name where this type reside     
    };
    this.allTypes = () => { return Object.keys(asmTypes); }

    // app domain start/restart
    this.boot = async (bootOptions) => {
        bootOptions = bootOptions || {};

        let __config = '',
            __entryPoint = bootOptions.main || this.entryPoint(),
            __bootModule = bootOptions.module || config.bootModule,
            __bootEngine = bootOptions.engine || config.bootEngine;

        // config might be empty as well
        if (typeof bootOptions.config === 'string') {
            __config = bootOptions.config;
        } else {
            __config = this.config() || which(config.config);
        }

        // don't boot if bootEngine and fabric module is not configured
        if (!__bootModule || !__bootEngine) {
            console.log('Boot configuration is not available, boot aborted.'); // eslint-disable-line no-console
            return false; 
        }

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

        // set entry point, if specified, otherwise ignore
        if (__entryPoint) {
            this.entryPoint(__entryPoint);
        }

        // load config, if specified, otherwise ignore
        if (__config) {
            await this.config(__config);
        }

        // load boot module's preamble, if defined
        let bootModulePreambleFile = __bootModule + '/preamble{.min.}js';
        let preambleLoader = await _include(bootModulePreambleFile); // this loads it as an async function which is called here
        if (!preambleLoader) { 
            console.log('Could not load boot module preamble, boot aborted.'); // eslint-disable-line no-console
            return false;
        }
        await preambleLoader(flair);

        // boot 
        let be = await _include(__bootEngine);
        if (!be) { 
            console.log('Could not load boot engine, boot aborted.'); // eslint-disable-line no-console
            return false; 
        }
        isBooted = await be.start();

        // return
        return isBooted;
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
                if (!path.endsWith('/')) { path += '/'; }
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
    this.loadScripts = async (...scripts) => {
        return await _bring(scripts);
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
