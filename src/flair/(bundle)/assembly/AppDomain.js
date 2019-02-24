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
        // store in secondaryDomains and return newly created proxy of that domain
        // AppDomainProxy() will have:
        //  createContext - to create a new context in that secondary domain which returns AssemblyLoadContextProxy()
        //      it will have:
        //          name
        //          domain - proxy
        //          isUnloaded
        //          unload
        //          allTypes
        //          loadAssembly
        //          allAssemblies
        //          allResources
        //          createInstance(qualifiedTypeName, ...args) - new async method to create a proxy for an object that is created in that remote domain
        //                  this internally send a message to create a new instance of given type remotely
        //                  that instance is kept via guid of the instance in a list there
        //                  and guid is returned
        //                  then a Proxy() is created here - which passes all method and function calls as a message for this guid
        //                  to remote instance and if call fails, it fails, else it runs as a normal object
        //                  a proxy is actually a Proxy() that
        //          dispose(instance) - async method to dispose remote instance and remove it from list there
        //  context - default context proxy -- will have same methods as above
        //  unload - to unload this domain there and here the proxy
        //  isUnloaded 
        //  name
        //  getAdo
        //  allAdos
        //  allTypes
        //  loadScripts(...files) - new async method that loads these given files in this AppDomain
        //
        //  NOTE: those methods of AppDomain and AssemblyLoadContext which return non-primitive data are not available in proxy
        //  Any action oriented calls are proxied via channel
        //  Internally both Proxy will talk across domains via AppDomainSharedChannel() which passes raw messages
        //  
        //  
        // execute() == this will async execute a method on seondary domain
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


