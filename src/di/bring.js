// bring
let bringCycle = [];
// bring(members, scopeFn)
//  members: is an array of strings to define members to bring to the scoped function
//  scopeFn: a function that make use of injected (read brought-up) members (passed as parameters in same order as members are defined in members array)
flair.bring = (members, scopeFn) => {
    // members can be defined as:
    //  <namespace>.<name>
    //      this will be looked in Namespace first, so an already loaded type will be picked first
    //      if not found in Namespace, it will look for a Assembly where this type might be registered, 
    //      if found in an Assembly, it will load Assembly and again look for it Namespace
    //      if still not found, it will resolve to null
    //  
    //  <name>
    //      this can be a registered alias or a node js module name (on server side) or an aliased module name (on client side)
    //      it will first assume it to be alias name amd will try to resolve it, if not resolved,
    //      it will be loaded using configured moduleLoaderFn
    //      if no moduleLoaderFn is configured, it will throw an error
    //  
    //  <path>/<file>.js
    //      this is a bare file to load to, it will be resolved using configured module loader
    //      to handle PRODUCTION and DEBUG scenarios automatically, use <path>/<file>{.min}.js format. 
    //      it PROD symbol is available, it will use it as <path>/<file>.min.js otherwise it will
    //      use it as <path>/<file>.js 
    //      NOTE: Path is always in context of the root path - full. Relative paths are not supported.
    //  
    //  <path>/<file.css|json|html|md|...>
    //      if ths is not a js file, it will treat it as any other file and will try to fetch as a resource on client
    //      and using request on server
    //      
    //  Each member definition can also be defined for contextual consideration
    //      <member1> | <member2>
    //          when running on server, <member1> would be considered, and
    //          when running on client, <member2> will be considered
    //  

    if (typeof members === 'string') { members = [members]; }

    // resolve all dependencies first
    let resolvedItems = [],
        _members = members.slice();

    let loader = (isServer, isModule, file) => {
        let loaders = flair.options.loaders,
            loaderOverrides = flair.options.loaderOverrides,
            loader = null;
        return new Promise(resolve, reject) {
            let ext = file.substr(file.lastIndexOf('.') + 1).toLowerCase();
            if (isServer) {
                if (isModule) {
                    loader = loaders.module.server || loaderOverrides.moduleLoaderServer || null;
                    if (typeof loader === 'function') {
                        loader(file).then(resolve).catch(reject);
                    } else {
                        try {
                            resolve(require(file));
                        } catch(e) {
                            reject(e);
                        }
                    }
                } else { // file
                    loader = loaders.file.server || loaderOverrides.fileLoaderServer || null;
                    if (typeof loader === 'function') {
                        loader(file).then(resolve).catch(reject);
                    } else {
                        try {
                            const request = require('request');
                            request(file, (err, res, body) => {
                                if (err) {  
                                    reject(err)
                                } else {
                                    if (ext === 'json') { 
                                        resolve(JSON.parse(body));
                                    } else {
                                        resolve(body);
                                    }
                                }
                            });
                        } catch(e) {
                            reject(e);
                        }
                    }
                }
            } else { // client
                if (isModule) {
                    loader = loaders.module.client || loaderOverrides.moduleLoaderClient || null;
                    if (typeof loader === 'function') {
                        loader(file).then(resolve).catch(reject);
                    } else { 
                        try {
                            if (typeof require !== 'undefined') { // if requirejs type library having require() is available to load modules / files on client
                                require([file], resolve, reject);
                            } else { // load it as file on browser, this could be a problem for module types // TODO: this needs to be changed, when there is a case
                                let js = flair.options.env.global.document.createElement('script');
                                js.type = 'text/javascript';
                                js.name = file;
                                js.src = file;
                                js.onload = () => { resolve(true); }
                                js.onerror = () => { reject(`Failed to load: ${file}`); }
                                flair.options.env.global.document.head.appendChild(js);
                            }
                        } catch(e) {
                            reject(e);
                        }
                    }
                } else { // file
                    loader = loaders.file.client || loaderOverrides.fileLoaderClient || null;
                    if (typeof loader === 'function') {
                        loader(file).then(resolve).catch(reject);
                    } else {
                        fetch(file).then((response) => {
                            if (response.status !== 200) {
                                reject(response.status);
                            } else {
                                if (ext === 'json') { // special case of JSON
                                    response.json().then(resolve).catch(reject);
                                } else {
                                    resolve(response.text());
                                }
                            }
                        }).catch(reject);
                    }                    
                }
            }
        };
    };

    let processNextMember = () => {
        if (_members.length === 0) {
            scopeFn(...resolvedItems);
            return;
        } else {
            let _member = _members.shift().trim(),
                _resolved = null;

            // pick contextual member
            _member = flair.which(_member);
            
            // check if this is an alias registered on DI container
            let option1 = (done) => {
                if (flair.Container.isRegistered(_member)) {
                    _resolved = flair.Container.resolve(_member);
                    if (typeof _resolved === 'string') { // this was an alias to something else, treat it as not resolved
                        _member = _resolved; // instead continue resolving with this new redirected _member 
                        _resolved = null;
                    }
                    done();
                }
            };            

            // check if it is available in any namespace
            let option2 = (done) => {
                _resolved = flair.Namespace.getType(_member);
                done();
            };

            // check if it is available in any unloaded assembly
            let option3 = (done) => {
                let asm = flair.Assembly.get(_member);
                if (asm) { // if type exists in an assembly
                    if (!flair.Assembly.isLoaded(asm)) {
                        flair.Assembly.load(asm).then(() => {
                            _resolved = flair.Namespace.getType(_member);
                            done();
                        }).catch((e) => {
                            throw `Failed to load ${_member} with error: ${e}.`;
                        });
                    }
                }
            };

            // check if this is a file
            let option4 = (done) => {
                let ext = _member.substr(_member.lastIndexOf('.') + 1).toLowerCase();
                if (ext) {
                    if (ext === 'js' || ext === 'mjs') {
                        // pick contextual file
                        _member = flair.which(_member, true);
                        
                        // this will be loaded as module in next option as a module
                        done();
                    } else { // some other file (could be json, css, html, etc.)
                        loader(flair.options.env.isServer, false, _member).then((content) => {
                            _resolved = content;
                            done();
                        }).catch((e) => {
                            throw `Failed to load ${_member} as file, with error: ${e}.`;
                        });
                    }
                } else { // not a file
                    done();
                }
            };

            // check if this is a module
            let option5 = (done) => {
                loader(flair.options.env.isServer, true, _member).then((content) => { // as last option, try to load it as module
                    _resolved = content;
                    done();
                }).catch((e) => {
                    throw `Failed to load ${_member} as module, with error: ${e}.`;
                });                
            };

            // done
            let resolved = () => {
                resolvedItems.push(_resolved); // this one ie resolved
                bringCycle.pop(); // removed the last added member
                processNextMember();
            };

            // cycle break check
            if (bringCycle.indexOf(_member) !== -1) {
                throw `Cyclic dependency identified for ${_member}.`;
            } else {
                bringCycle.push(_member);
            }

            // run
            option1(() => {
                if (!_resolved) { option2(() => {
                    if (!_resolved) { option3(() => {
                        if (!_resolved) { option4(() => {
                            if (!_resolved) { option5(() => {
                                if (!_resolved) { 
                                    throw `Could not resolve ${_member}.`;
                                } else { resolved(); }
                            }) } else { resolved(); }
                        }) } else { resolved(); }
                    }) } else { resolved(); }
                }) } else { resolved(); }
            });                
        }
    }

    // start processing
    processNextMember();
};
