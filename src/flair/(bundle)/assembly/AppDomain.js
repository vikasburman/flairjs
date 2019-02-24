/**
 * @name AppDomain
 * @description Thread level isolation.
 * @example
 *  
 */
const AppDomain = function(name) {
    let asmFiles = {},
        asmTypes = {},
        domains = [],
        contexts = [],
        currentContexts = [],
        defaultLoadContext = null,
        unloadDefaultContext = null,
        isUnloaded = false;

    // default load context
    defaultLoadContext = new AssemblyLoadContext('default', this, null, currentContexts),
    unloadDefaultContext = defaultLoadContext.unload;
    delete defaultLoadContext.unload; // default load context cannot be unloaded directly, unless app domain is unloaded
    defaultLoadContext = Object.freeze(defaultLoadContext);

    // app domain
    this.name = name;
    this.isUnloaded = () => { return isUnloaded; };
    this.unload = () => {
        // unload all domains
        domains.forEach((domain) => { domain.unload(); })

        // unload all contexts of this domain
        contexts.forEach((context) => { context.unload(); })
        unloadDefaultContext(); // unload default context

        // clear registry
        asmFiles = {},
        asmTypes = {};

        // unload this // TODO: clear worker too
        if (isWorker) {
            if (isServer) { // worker thread

            } else { // web worker

            }
        }

        // mark unloaded
        isUnloaded = true;
    };
    this.createDomain = (name) => { // eslint-disable-line no-unused-vars
        // TODO: worker thread and web worker usage
        // store in secondaryDomains and return newly created one
    };
   
    // assembly load context
    this.context = defaultLoadContext;
    this.createContext = (name) => {
        if(typeof name !== 'string' || name === 'default') { throw _Exception.invalidArguments(name); }
        let alc = Object.freeze(new AssemblyLoadContext(name, this, currentContexts));
        contexts.push(alc);
        return alc;
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
            }
        });  

    };
    this.getAdo = (file) => {
        if (typeof file !== 'string') { throw new _Exception('InvalidArgument', `Argument type is not valid. (${file})`); }
        return asmFiles[file] || null;
    };
    this.allAdos = () => { return Object.keys(asmFiles); }

    // type
    this.resolve = (qualifiedName) => {
        if (typeof qualifiedName !== 'string') { throw new _Exception('InvalidArgument', 'Argument type if not valid. (qualifiedName)'); }
        return asmTypes[qualifiedName] || null;        
    };
    this.allTypes = () => { return Object.keys(asmTypes); }
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


