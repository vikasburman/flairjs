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
        defaultLoadContext = null,
        unloadDefaultContext = null,
        isUnloaded = false;

    // default load context
    defaultLoadContext = new AssemblyLoadContext('default', this, null, currentContexts, contexts),
    unloadDefaultContext = defaultLoadContext.unload;
    delete defaultLoadContext.unload; // default load context cannot be unloaded directly, unless app domain is unloaded
    defaultLoadContext = Object.freeze(defaultLoadContext);
    contexts[defaultLoadContext.name] = defaultLoadContext;

    // app domain
    domains[name] = this;
    this.name = name;
    this.isRemote = false;
    this.isUnloaded = () => { return isUnloaded; };
    this.unload = () => {
        if (!isUnloaded) {
            // mark unloaded
            isUnloaded = true;

            // unload all contexts of this domain, including default one
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

            // clear registries
            asmFiles = {},
            asmTypes = {};
            contexts = {};
            domains = {};
            allADOs = [];
        }
    };
    this.createDomain = (name) => {
        return new Promise((resolve, reject) => {
            if(typeof name !== 'string' || name === 'default' || domains[name]) { reject(_Exception.invalidArguments('name')); }
            let proxy = Object.freeze(new AppDomainProxy(name, domains, allADOs));
            domains[name] = proxy;
            resolve(proxy);
        });
    };
    this.domains = (name) => { return domains[name] || null; }
   
    // assembly load context
    this.context = defaultLoadContext;
    this.contexts = (name) => { return contexts[name] || null; }
    this.createContext = (name) => {
        return new Promise((resolve, reject) => {
            if(typeof name !== 'string' || name === 'default' || contexts[name]) { reject(_Exception.invalidArguments('name')); }
            let alc = Object.freeze(new AssemblyLoadContext(name, this, defaultLoadContext, currentContexts, contexts));
            contexts[name] = alc;
            resolve(alc);
        });
    };

    // ados
    this.registerAdo = (...ados) => {
        // when call is coming from direct assembly loading
        let isThrowOnDuplicate = true;
        if (ados.length === 1 && typeof ados[0] === 'string') { 
            let ado = JSON.parse(ados[0]);
            ados = [ado];
            isThrowOnDuplicate = false;   
        }

        // register
        ados.forEach(ado => {
            if (_typeOf(ado.types) !== 'array' || 
                _typeOf(ado.resources) !== 'array' ||
                _typeOf(ado.assets) !== 'array' ||
                typeof ado.name !== 'string' ||
                typeof ado.file !== 'string' || ado.file === '') {
                throw _Exception.InvalidArgument('ado');
            }

            ado.file = which(ado.file, true); // min/dev contextual pick
            if (asmFiles[ado.file]) {
                if (isThrowOnDuplicate) { throw new _Exception('DuplicateName', `Assembly is already registered. (${ado.file})`); }
                return;
            } else {
                // register
                asmFiles[ado.file] = Object.freeze(ado);

                // flatten types
                ado.types.forEach(qualifiedName => {
                    // qualified names across anywhere should be unique
                    if (asmTypes[qualifiedName]) {
                        throw new _Exception('DuplicateName', `Type is already registered. (${qualifiedName})`);
                    } else {
                        asmTypes[qualifiedName] = ado.file; // means this type can be loaded from this assembly 
                    }
                });

                // flatten resources
                ado.resources.forEach(qualifiedName => {
                    // qualified names across anywhere should be unique
                    if (asmTypes[qualifiedName]) {
                        throw new _Exception('DuplicateName', `Resource is already registered. (${qualifiedName})`);
                    } else {
                        asmTypes[qualifiedName] = ado.file; // means this resource can be loaded from this assembly
                    }
                });                
            }
        });  

        // store raw, for use when creating new app domain
        allADOs.push(...ados);
    };
    this.getAdo = (file) => {
        if (typeof file !== 'string') { throw new _Exception('InvalidArgument', `Argument type is not valid. (${file})`); }
        return asmFiles[file] || null;
    };
    this.allAdos = () => { return Object.keys(asmFiles); }

    // types
    this.resolve = (qualifiedName) => {
        if (typeof qualifiedName !== 'string') { throw new _Exception('InvalidArgument', 'Argument type if not valid. (qualifiedName)'); }
        return asmTypes[qualifiedName] || null; // gives the assembly file name where this type reside     
    };
    this.allTypes = () => { return Object.keys(asmTypes); }

    // scripts
    this.loadScripts = (...scripts) => {
        return new Promise((resolve, reject) => {
            try {
                _bring(scripts, () => {
                    resolve(); // resolve without passing anything
                });
            } catch (e) {
                reject(e);
            }
        });
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
