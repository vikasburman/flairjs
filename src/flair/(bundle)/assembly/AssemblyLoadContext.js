/**
 * @name AssemblyLoadContext
 * @description The isolation boundary of type loading across assemblies. 
 */
const AssemblyLoadContext = function(name, domain, defaultLoadContext, currentContexts, contexts) {
    let alcTypes = {},
        alcResources = {},
        instances = {},
        asmFiles = {},
        namespaces = {},
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

            // dispose all active instances
            for(let instance in instances) {
                if (instance.hasOwnProperty(instance)) {
                    _dispose(instances[instance]);
                }
            }

            // clear registries
            alcTypes = {};
            asmFiles = {};
            alcResources = {};
            instances = {};
            namespaces = {};
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
        // certain types are built as instances, like interface and enum
        let name = '',
            type = '';
        if (Type._.Type) {
            name = Type._.Type._.name;
            type = Type._.Type._.type;
        } else {
            name = Type._.name;
            type = Type._.type;
        }

        // only valid types are allowed
        if (flairTypes.indexOf(type) === -1) { throw new _Exception('InvalidArgument', `Type is not valid.`); }

        // namespace name is already attached to it, and for all '(root)' 
        // marked types' no namespace is added, so it will automatically go to root
        let ns = name.substr(0, name.lastIndexOf('.')),
            onlyName = name.replace(ns + '.', '');

        // check if already registered
        if (alcTypes[name]) { throw `Type (${name}) is already registered.`; }
        if (alcResources[name]) { throw `Already registered as resource. (${name})`; }

        // register
        alcTypes[name] = Type;

        // register to namespace as well
        if (ns) {
            if (!namespaces[ns]) { namespaces[ns] = {}; }
            namespaces[ns][onlyName] = Type;
        } else { // root
            namespaces[onlyName] = Type;
        }

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
    this.ensureType = (qualifiedName) => {
        return new Promise((resolve, reject) => {
            let Type = this.getType(qualifiedName);
            if (!Type) {
                let asmFile = domain.resolve(qualifiedName);
                if (asmFile) { 
                    this.loadAssembly(asmFile).then(() => {
                        Type = this.getType(qualifiedName);
                        if (!Type) {
                            reject();
                        } else {
                            resolve(Type);
                        }
                    }).catch(reject);
                } else {
                    reject();
                }
            } else {
                resolve(Type);
            }
        });
    };
    this.allTypes = () => { 
        if (this.isUnloaded()) { 
            throw 'Unloaded'; // TODO: fix
        }        
        return Object.keys(alcTypes); 
    }
    this.execute = (info, progressListener) => {
        // NOTE: The logic goes as:
        // 1. instance of given type is created with given constructor arguments
        // 2. if the type implements IProgressReporter and progressListener is passed,
        //    it hooks progressListener to 'progress' event of instance.
        // 3. given function is then executed with given arguments
        // 4. if keepAlive is set to true, it keeps the instance for later use, using info.type as identifier
        //    if in next run, keepAlive is found true, and instance was previously created, it uses same instance
        //    if instance was kept because of previous call of keepAlive, but now in this call keepAlive is set to false
        //    after this execution it is removed from internal stored instances list
        //    if just the instance is to be removed and no func is to be called, set funcName to '' and keepAlive to false
        //    and it will not call function but just remove stored instance

        return new Promise((resolve, reject) => {
            if (this.isUnloaded()) { 
                reject('Unloaded'); // TODO: fix
            }

            // execution info
            info.type = info.type || '';
            info.typeArgs = info.typeArgs || [];
            info.func = info.func || '';
            info.args = info.args || [];
            info.keepAlive = (typeof info.keepAlive !== 'undefined' ? info.keepAlive : false);
            
            const getInstance = () => {
                return new Promise((resolve, reject) => {
                    let instance = null;
                    this.ensureType(info.type).then((Type) => {
                        try {
                            instance = new Type(...info.typeArgs);

                            // listen to progress report, if need be
                            if (typeof progressListener === 'function' && _is(instance, 'IProgressReporter')) {
                                instance.progress.add(progressListener);
                            }

                            resolve(instance);
                        } catch (err) {
                            reject(err);
                        }
                    }).catch(reject);
                });
            };
            const runInstanceFunc = (instance) => {
                return new Promise((resolve, reject) => {
                    let result = null;
                    result = instance[info.func](...info.args);
                    if (result && typeof result.then === 'function') {
                        result.then(resolve).catch(reject);
                    } else {
                        resolve(result);
                    }                
                });
            };

            // process
            let instance = null;
            if (info.keepAlive) {
                if (instances[info.type]) {
                    instance = instances[info.type];
                    runInstanceFunc(instance).then(resolve).catch(reject);
                } else {
                    getInstance().then((obj) => {
                        instance = obj;
                        instances[info.type] = instance;
                        runInstanceFunc(instance).then(resolve).catch(reject);
                    }).catch(reject);
                }
            } else {
                if (instances[info.type]) {
                    instance = instances[info.type];
                    if (info.func) {
                        runInstanceFunc(instance).then(resolve).catch(reject).finally(() => {
                            _dispose(instance);
                            delete instances[info.type];
                        });
                    } else { // special request of just removing the instance - by keeping func name as empty
                        _dispose(instance);
                        delete instances[info.type];
                        resolve();
                    }
                } else {
                    getInstance().then((obj) => {
                        runInstanceFunc(obj).then(resolve).catch(reject).finally(() => {
                            _dispose(obj);
                        });
                    }).catch(reject);                
                }
            }
        });
    };

    // namespace
    this.namespace = (name) => { 
        if (name && name === '(root)') { name = ''; }
        let source = null;
        if (name) {
            source = namespaces[name] || null;
        } else { // root
            source = namespaces;
        }
        if (source) {
            return Object.freeze(shallowCopy({}, source)); // return a freezed copy of the namespace segment
        } else {
            return null;
        }
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
            } else {
                resolve();
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
        let ns = rdo.name.substr(0, rdo.name.lastIndexOf('.')),
            onlyName = rdo.name.replace(ns + '.', '');

        // check if already registered
        if (alcResources[rdo.name]) { throw `Resource (${rdo.name}) is already registered.`; }
        if (alcTypes[rdo.name]) { throw `Already registered as Type. (${rdo.name})`; }

        // register
        alcResources[rdo.name] = Object.freeze(new Resource(rdo, ns, this));

        // register to namespace as well
        // register to namespace as well
        if (ns) {
            if (!namespaces[ns]) { namespaces[ns] = {}; }
            namespaces[ns][onlyName] =  alcResources[rdo.name];
        } else { // root
            namespaces[onlyName] =  alcResources[rdo.name];
        }        

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
    
    // state (just to be in sync with proxy)
    this.isBusy = () => { return false; }
    this.hasActiveInstances = () => { return Object.keys(instances).length; }
};
