let incCycle = [];
/**
 * @name include
 * @description Fetch, load and/or resolve an external dependency for required context
 * @example
 *  include(deps, fn)
 * @params
 *  deps: array - array of strings, each defining a dependency to fetch/load or resolve
 *      >> each dep definition string should be defined using following syntax:
 *          'name: definition'
 *          e.g., fs: fs OR MyClass: my.namespace.MyClass
 * 
 *          >> Each definition can take following form:
 *          >> <namespace>.<name>
 *              >> e.g., 'my.namespace.MyClass'
 *              >> this will be looked in given namespace first, so an already loaded type will be picked first
 *              >> if not found in given namespace, it will look for the assembly where this type might be registered
 *              >> if found in a registered assembly, it will load that assembly and again look for it in given namespace
 *          >> [<name>]
 *              >> e.g., '[IBase]'
 *              >> this can be a registered alias to any type and is resolved via DI container
 *              >> if resolved type is an string, it will again pass through <namespace>.<name> resolution process
 *          >> <name>
 *              >> e.g., 'fs'
 *              >> this can be a NodeJS module name (on server side) or a JavaScript module name (on client side)
 *          >> <path>/<file>.js|.mjs
 *              >> e.g., '/my/path/somefile.js'
 *              >> this can be a bare file to load to
 *              >> path is always treated in context of the root path - full, relative paths from current place are not supported
 *              >> to handle PRODUCTION and DEBUG scenarios automatically, use <path>/<file>{.min}.js|.mjs format. 
 *              >> it PROD symbol is available, it will use it as <path>/<file>.min.js otherwise it will use <path>/<file>.js
 *          >> <path>/<file.css|json|html|...>
 *              >> e.g., '/my/path/somefile.css'
 *              >>  if ths is not a js|mjs file, it will treat it as a resource file and will use fetch/require, as applicable
 *      
 *          NOTE: Each dep definition can also be defined for contextual consideration as:
 *          '<depA> | <depB>'
 *          when running on server, <depA> would be considered, and when running on client <depB> will be used
 * 
 *          IMPORTANT: Each dependency is resolved with a Resolved Object
 *  fn: function - function where to pass resolved dependencies
 *          >> this func is passed an extractor function (generally named as deps) and if there was any error in deps definitions
 *           (<name>) returns null if failed or not defined, or the dependency, if loaded
 *           (<name>, true) returns dependency or throw actual exception that caused dependency load to fail
 * @returns void
 * @throws
 *  None
 */ 
flair.include = (deps, fn) => {
    let _depsType = _typeOf(deps),
        _depsError = null;
    if (_depsType !== 'string' && _depsType !== 'array') { _depsError = new _Exception('InvalidArgument', 'Argument type is invalid. (deps)'); }
    if (!_depsError && _depsType === 'string') { deps = [deps]; }
    if (!_depsError && typeof fn !== 'function') { _depsError = new _Exception('InvalidArgument', 'Argument type is invalid. (fn)'); }

    let resolvedItems = {},
        _deps = (_depsError ? null : deps.slice());

    let loader = (isServer, isModule, file) => {
        let moduleLoader = _Port('moduleLoader'),
            fileLoader = _Port('fileLoader');
            loader = null;
        return new Promise((resolve, reject) => {
            let ext = file.substr(file.lastIndexOf('.') + 1).toLowerCase();
            if (isServer) {
                if (isModule) {
                    loader = moduleLoader || null;
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
                    loader = fileLoader || null;
                    if (typeof loader === 'function') {
                        loader(file).then(resolve).catch(reject);
                    } else {
                        try {
                            let httpOrhttps = null,
                                body = '';
                            if (file.startsWith('https')) {
                                httpOrhttps = require('https');
                            } else {
                                httpOrhttps = require('http'); // for urls where it is not defined
                            }
                            httpOrhttps.get(file, (resp) => {
                                resp.on('data', (chunk) => { body += chunk; });
                                resp.on('end', () => { 
                                    if (ext === 'json') { 
                                        resolve(JSON.parse(body));
                                    } else {
                                        resolve(body);
                                    }
                                });
                            }).on('error', reject);
                        } catch(e) {
                            reject(e);
                        }
                    }
                }
            } else { // client
                if (isModule) {
                    loader = moduleLoader || null;
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
                                js.onload = resolve;
                                js.onerror = reject;
                                flair.options.env.global.document.head.appendChild(js);
                            }
                        } catch(e) {
                            reject(e);
                        }
                    }
                } else { // file
                    loader = fileLoader || null;
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
        });
    };
    let _dep_extract = (name, isThrow) => {
        if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
        if (!resolvedItems[name]) { throw new _Exception('InvalidName', `Name is not valid. (${name})`); }
        if (resolvedItems[name].error && isThrow) { throw resolvedItems[name].error; }
        return resolvedItems[name].dep;
    };
    let processedAll = () => {
        if (typeof fn === 'function') {
            fn(_dep_extract, _depsError); 
        }
    };
    let resolveNext = () => {
        if (_depsError || _deps.length === 0) {
            processedAll(); return;
        } else {
            let _dep = _deps.shift().trim(),
                _depName = '',
                _resolved = null,
                _error = null;

            // get dep name
            if (_dep === '') { _depsError = new _Exception('InvalidArgument', `Argument type is invalid. (deps)`); processedAll(); return; }
            let _items = _dep.split(':');
            if (_items.length !== 2) { _depsError = new _Exception('InvalidArgument', `Argument type is invalid. (${_dep})`); processedAll(); return; }
            _depName = _items[0].trim();
            _dep = _items[1].trim();
            if (resolvedItems[_depName]) { _depsError = new _Exception('DuplicateName', `Duplicate names are not allowed. (${_depName})`); processedAll(); return; }
            resolvedItems[_depName] = {
                error: null,
                dep: null
            };

            // pick contextual dep
            _dep = which(_dep);

            // check if this is an alias registered on DI container
            let option1 = (done) => {
                if (_dep.startsWith('[') && _dep.endsWith(']') && _dep.indexOf('.') === -1) {
                    let _dep2 = _dep.substr(1, _dep.length -2).trim(); // remove [ and ]
                    if (flair.Container.isRegistered(_dep2)) {
                        _resolved = flair.Container(_dep2); // first registered item
                        if (typeof _resolved === 'string') { // this was an alias to something else, treat it as not resolved
                            _dep = _resolved; // instead continue resolving with this new redirected _dep 
                            _resolved = null;
                        }
                    }
                }
                done();
            };            

            // check if it is available in any namespace
            let option2 = (done) => {
                _resolved = flair.Namespace.getType(_dep); done();
            };

            // check if it is available in any unloaded assembly
            let option3 = (done) => {
                let asm = flair.Assembly.get(_dep);
                if (asm) { // if type exists in an assembly
                    if (!asm.isLoaded()) {
                        asm.load().then(() => {
                            _resolved = flair.Namespace.getType(_dep); done();
                        }).catch((e) => {
                            _error = new _Exception('AssemblyLoad', `Assembly load operation failed with error: ${e}. (${asm.file()})`); done();
                        });
                    } else {
                        _resolved = flair.Namespace.getType(_dep); done();
                    }
                } else {
                    done();
                }
            };

            // check if this is a file
            let option4 = (done) => {
                let ext = _dep.substr(_dep.lastIndexOf('.') + 1).toLowerCase();
                if (ext) {
                    if (ext === 'js' || ext === 'mjs') {
                        // pick contextual file for DEBUG/PROD
                        _dep = which(_dep, true);
                        
                        // this will be loaded as module in next option as a module
                        done();
                    } else { // some other file (could be json, css, html, etc.)
                        loader(flair.options.env.isServer, false, _dep).then((content) => {
                            _resolved = content; done();
                        }).catch((e) => {
                            _error = new _Exception('FileLoad', `File load failed. (${_dep})`, e); done();
                        });
                    }
                } else { // not a file
                    done();
                }
            };

            // check if this is a module
            let option5 = (done) => {
                loader(flair.options.env.isServer, true, _dep).then((content) => { // as last option, try to load it as module
                    _resolved = content; done();
                }).catch((e) => {
                    _error = new _Exception('ModuleLoad', `Module load operation failed with error: ${e}. (${_dep})`); done();
                });                
            };

            // done
            let resolved = (isExcludePop) => {
                resolvedItems[_depName].error = _error;
                resolvedItems[_depName].dep = _resolved; 
                if (!isExcludePop) { incCycle.pop(); } // removed the last added dep
                resolveNext();
            };

            // process
            if (_dep === '') { // nothing is defined to process
                resolved(true); return;
            } else {
                // cycle break check
                if (incCycle.indexOf(_dep) !== -1) {
                    _error = new _Exception('CircularDependency', `Circular dependency identified. (${_dep})`);
                    resolved(true); return;
                } else {
                    incCycle.push(_dep);
                }

                // run
                option1(() => {
                    if (!_resolved) { option2(() => {
                        if (!_resolved) { option3(() => {
                            if (!_resolved) { option4(() => {
                                if (!_resolved) { option5(() => {
                                    if (!_resolved) {
                                        _error = new _Exception('DependencyResolution', `Failed to resolve dependency. ${_dep}`);
                                        resolved(); return;
                                    } else { resolved(); }
                                }) } else { resolved(); }
                            }) } else { resolved(); }
                        }) } else { resolved(); }
                    }) } else { resolved(); }
                }); 
            }
        }
    }

    // start processing
    resolveNext();
};

// reset api
flair.include._ = {
    reset: () => { incCycle = []; }
};

// add to members list
flair.members.push('include');