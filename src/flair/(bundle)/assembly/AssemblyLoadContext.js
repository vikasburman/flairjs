/**
 * @name AssemblyLoadContext
 * @description The isolation boundary of type loading across assemblies. 
 */
const AssemblyLoadContext = function(name, domain, defaultLoadContext, currentContexts, contexts) {
    let alcTypes = {},
        alcResources = {},
        asmFiles = {},
        isUnloaded = false,
        currentAssemblyBeingLoaded = '';

    // context
    this.name = name;
    this.domain = domain;
    this.isUnloaded = () => { return isUnloaded || domain.isUnloaded(); };
    this.unload = () => {
        if (!isUnloaded) {
            // mark unloaded
            isUnloaded = true;

            // delete from domain registry
            delete contexts[name];

            // clear registries
            alcTypes = {};
            asmFiles = {};
            alcResources = {};
        }
    };
    this.current = () => {
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }        
        if (currentContexts.length === 0) {
            return defaultLoadContext || this; // the first content created is the default context, so in first case, it will come as null, hence return this
        } else { // return last added context
            // when a context load any assembly, it pushes itself to this list, so
            // that context become current context and all loading types will attach itself to this
            // new context, and as soon as load is completed, it removes itself.
            // Now, if for some reason, an assembly load operation itself (via some code in index.js)
            // initiate another context load operation, that will push itself on top of this context and
            // it will trickle back to this context when that secondary load is done
            // so always return from here the last added context in list
            return currentContexts[currentContexts.length - 1];
        }
    };

     // types
    this.registerType = (Type) => {
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }        
        // only valid types are allowed
        if (flairTypes.indexOf(_typeOf(Type)) === -1) { throw new _Exception('InvalidArgument', `Type is not valid.`); }

        let name = Type._.name, // namespace name is already attached to it, and for all '(root)' 
                                // marked types' no namespace is added, so it will automatically go to root
        ns = name.substr(0, name.lastIndexOf('.'));

        // check if already registered
        if (alcTypes[name]) { throw `Type (${name}) is already registered.`; }

        // register
        alcTypes[name] = Type;

        // return namespace where it gets registered
        return ns;
    };
    this.getType = (qualifiedName) => {
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }        
        if (typeof qualifiedName !== 'string') { throw new _Exception('InvalidArgument', `Argument type is not valid. (${qualifiedName})`); }
        return alcTypes[qualifiedName] || null;
    };
    this.allTypes = () => { 
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }        
        return Object.keys(alcTypes); 
    }
    this.execute = (info) => {
        return new Promise((resolve, reject) => {
            if (this.isUnloaded()) { 
                reject('Unloaded'); // TODO: fix
            }

            // execution info
            info.type = info.type || '';
            info.typeArgs = info.typeArgs || [];
            info.func = info.func || '';
            info.args = info.args || [];
            if (!info.type || !info.func) { throw new _Exception.InvalidArgument('info'); }

            let instance = null;
            try {
                // get type
                let Type = this.getType(info.type);
                
                // create instance
                if (info.typeArgs.length === 0) {
                    instance = new Type();
                } else {
                    instance = new Type(...info.typeArgs);
                }
            } catch (err) {
                reject(err);
            }

            // run
            let result = _using(instance, (obj) => {
                if(info.args.length === 0) {
                    return obj[info.func]();
                } else {
                    return obj[info.func](...info.args);
                }
            });
            if (result && typeof result.then === 'function') {
                result.then(resolve).catch(reject);
            } else {
                return result;
            }
        });
    };

    // assembly
    this.currentAssemblyBeingLoaded = (value) => {
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }        
        if (typeof value !== 'undefined') { 
            currentAssemblyBeingLoaded = which(value, true);
        }
        return currentAssemblyBeingLoaded;
    }
    this.loadAssembly = (file) => {
        return new Promise((resolve, reject) => {
            if (this.isUnloaded()) { 
                reject('Unloaded'); // TODO: fix
            }            
            if (!asmFiles[file]) { // load only when it is not already loaded in this load context
                // set this context as current context, so all types being loaded in this assembly will get attached to this context;
                currentContexts.push(this);

                // uncache module, so it's types get to register again with this new context
                uncacheModule(file);

                // load module
                loadModule(file).then(() => {
                    // remove this from current context list
                    currentContexts.pop();

                    // add to list
                    asmFiles[file] = Object.freeze(new Assembly(this.domain.getADO(file), this));

                    // resolve
                    resolve();
                }).catch((e) => {
                    // remove this from current context list
                    currentContexts.pop();

                    // reject
                    reject(e);
                });
            }
        });        
    };    
    this.getAssembly = (file) => {
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }        
        if (typeof file !== 'string') { throw new _Exception('InvalidArgument', `Argument type is not valid. (${file})`); }
        return asmFiles[file] || null;
    };
    this.allAssemblies = () => { 
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }
        return Object.keys(asmFiles); 
    }

    // resources
    this.registerResource = (rdo) => {
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }        
        if (typeof rdo.name !== 'string' || rdo.name === '' ||
            typeof rdo.encodingType !== 'string' || rdo.encodingType === '' ||
            typeof rdo.file !== 'string' || rdo.file === '' ||
            typeof rdo.data !== 'string' || rdo.data === '') {
            throw _Exception.InvalidArgument('rdo');
        }

        // namespace name is already attached to it, and for all '(root)'    
        // marked types' no namespace is added, so it will automatically go to root
        let ns = rdo.name.substr(0, rdo.name.lastIndexOf('.'));

        // check if already registered
        if (alcTypes[rdo.name]) { throw `Type (${name}) is already registered.`; }

        // register
        alcResources[rdo.name] = Object.freeze(new Resource(rdo, ns, this));

        // return namespace where it gets registered
        return ns;
    };
    this.getResource = (qualifiedName) => {
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }        
        if (typeof qualifiedName !== 'string') { throw new _Exception('InvalidArgument', `Argument type is not valid. (${qualifiedName})`); }
        return alcResources[qualifiedName] || null;
    };     
    this.allResources = () => { 
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }        
        return Object.keys(alcResources); 
    }    
};
