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
    //      it PROD or PRODUCTION symbol is available, it will use it as <path>/<file>.min.js otherwise it will
    //      use it as <path>/<file>.js 
    //      NOTE: Path is always in context of the root path - full. Relative paths are not supported.
    //  
    //  <path>/<file.css|json|html|md|...>
    //      if ths is not a js file, it will treat it as any other file and will try to fetch as a resource on client
    //      and using request() on server
    //      
    //  Each member definition can also be defined for contextual consideration
    //      <member1> | <member2>
    //          when running on server, <member1> would be considered, and
    //          when running on client, <member2> will be considered
    //  

    // resolve all dependencies first
    let resolvedItems = [],
        _members = members.slice();

    let processNextMember = () => {
        if (_members.length === 0) {
            scopeFn(...resolvedItems);
            return;
        } else {
            let _member = _members.shift().trim(),
                _resolved = null;

            // pick contextual member
            if (_member.indexOf('|')) {
                let items = _member.split('|');
                if (flair.options.isServer) {
                    _member = items[0].trim();
                } else {
                    _member = items[1].trim();
                }
            }            
            
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
                    if (ext === 'js') {
                        // pick minified or dev version
                        if (_member.indexOf('{.min}') !== -1) {
                            if (flair.options.isProd) {
                                _member = _member.replace('{.min}', '.min'); // a{.min}.js => a.min.js
                            } else {
                                _member = _member.replace('{.min}', ''); // a{.min}.js => a.js
                            }
                        }
                        
                        // this will be loaded as module in next option as a module
                        done();
                    } else { // some other file (could be json, css, html, etc.)
                        if (flair.options.isServer) {
                            const request = require('request');
                            request(_member, (err, res, body) => {
                              if (err) {  
                                  throw `Failed to load ${_member} with error: ${err}.`;
                              }
                              _resolved = body;

                              // special case of JSON
                              if (ext === 'json') {
                                try {
                                    if (_resolved) {
                                        _resolved = JSON.parse(_resolved);
                                    }
                                }  catch(e) {
                                    throw `Failed to parse JSON of ${_member} with error: ${e}.`;
                                }
                              }
                              done();
                            });
                        } else { // client
                            fetch(_member).then((response) => {
                                if (response.status !== 200) {
                                    throw `Failed to load ${_member} with error code: ${response.status}.`;
                                }
                                _resolved = response.text();

                                // special case of JSON
                                if (ext === 'json') {
                                    response.json().then((data) => {
                                        _resolved = data;
                                        done();
                                    });
                                } else {
                                    done();
                                }
                            }).catch((err) => {
                                throw `Failed to load ${_member} with error: ${err}.`;
                            });
                        }
                    }
                } else { // not a file
                    done();
                }
            };

            // check if this is a module
            let option5 = (done) => {
                // use module loader to load it as module, as last option
                loadAsModule(done);
            };

            // load as module
            let loadAsModule = (done) => {
                let loaderFn = flair.options.moduleLoader;
                if (typeof loaderFn !== 'function') {
                    throw `Module loader is not configured to load ${_member}.`
                }

                // load module
                loaderFn(_member).then((item) => {
                    _resolved = item;
                    done();
                }).catch((e) => {
                    throw `Failed to load module ${_member} with error: ${e}.`;
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
                                } else {
                                    resolved();
                                }
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
