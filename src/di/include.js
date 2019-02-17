/**
 * @name include
 * @description Fetch, load and/or resolve an external dependency for required context
 * @example
 *  include(deps, fn)
 * @usage
 *  include([
 *    'my.namespace.MyStruct',
 *    '[IBase]'
 *    'myServerClass | myClientClass'
 *    'fs | '
 *    './abc.mjs'
 *    './somepath/somefile.css'
 *  ], (MyStruct, IBase, MyClass, fs, abc, someCSS) => {
 *      ... use them here
 *  });
 * @params
 *  deps: array - array of strings, each defining a dependency to fetch/load or resolve
 *      >> each dep definition string  can take following form:
 *
 *          >> [<name>]
 *              >> e.g., '[IBase]'
 *              >> this can be a registered alias to any type and is resolved via DI container
 *              >> if resolved type is an string, it will again pass through <namespace>.<name> resolution process
 
 *          >> <namespace>.<name>
 *              >> e.g., 'my.namespace.MyClass'
 *              >> this will be looked in given namespace first, so an already loaded type will be picked first
 *              >> if not found in given namespace, it will look for the assembly where this type might be registered
 *              >> if found in a registered assembly, it will load that assembly and again look for it in given namespace
 * 
 *          >> <name>
 *              >> e.g., 'fs'
 *              >> this can be a NodeJS module name (on server side) or a JavaScript module name (on client side)
 * 
 *          >> <path>/<file>.js|.mjs
 *              >> e.g., '/my/path/somefile.js'
 *              >> this can be a bare file to load to
 *              >> path is always treated in context of the root path - full, relative paths from current place are not supported
 *              >> to handle PRODUCTION and DEBUG scenarios automatically, use <path>/<file>{.min}.js|.mjs format. 
 *              >> it PROD symbol is available, it will use it as <path>/<file>.min.js otherwise it will use <path>/<file>.js
 * 
 *          >> <path>/<file.css|json|html|...>
 *              >> e.g., '/my/path/somefile.css'
 *              >>  if ths is not a js|mjs file, it will treat it as a resource file and will use fetch/require, as applicable
 *      
 *          NOTE: Each dep definition can also be defined for contextual consideration as:
 *          '<depA> | <depB>'
 *          when running on server, <depA> would be considered, and when running on client <depB> will be used
 * 
 *          IMPORTANT: Each dependency is resolved with the resolved Object/content returned by dependency
 *                     if a dependency could not be resolved, it will throw the console.error()
 *                     cyclic dependencies are taken care of - if A is looking for B which is looking for C and that is looking for A - or any such scenario - it will throw error
 *  fn: function - function where to pass resolved dependencies, in order they are defined in deps
 * @returns void
 */ 
const incCycle = [];
const _include = (deps, fn) => {
    if (['string', 'array'].indexOf(_typeOf(deps)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (deps)'); }
    if (typeof fn !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (fn)'); }
    if (!Array.isArray(deps)) { deps = [deps]; }

    let _resolvedItems = [],
        _deps = deps.slice();

    let processedAll = () => {
        fn(..._resolvedItems); 
    };
    let resolveNext = () => {
        if (_deps.length === 0) {
            processedAll(); return;
        } else {
            let _dep = _deps.shift().trim(),
                _resolved = null;

            // pick contextual dep
            _dep = which(_dep);

            // check if this is an alias registered on DI container
            let option1 = (done) => {
                if (_dep.startsWith('[') && _dep.endsWith(']') && _dep.indexOf('.') === -1) {
                    let _alias = _dep.substr(1, _dep.length -2).trim(); // remove [ and ]
                    _resolved = _Container.resolve(_alias, false); // first item
                    if (typeof _resolved === 'string') { // this was an alias to something else, treat it as not resolved
                        _dep = _resolved; // instead continue resolving with this new redirected _dep 
                        _resolved = null;
                    }
                }
                done();
            };            

            // check if it is available in any namespace
            let option2 = (done) => {
                _resolved = _getType(_dep); done();
            };

            // check if it is available in any unloaded assembly
            let option3 = (done) => {
                let asm = _getAssembly(_dep);
                if (asm) { // if type exists in an assembly
                    if (!asm.isLoaded) {
                        asm.load().then(() => {
                            _resolved = _getType(_dep); done();
                        }).catch((e) => {
                            throw new _Exception('AssemblyLoad', `Assembly load operation failed with error: ${e}. (${asm.file})`);
                        });
                    } else {
                        _resolved = _getType(_dep); done();
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
                        loadFile(_dep).then((content) => {
                            _resolved = content; done();
                        }).catch((e) => {
                            throw new _Exception('FileLoad', `File load failed. (${_dep})`, e); 
                        });
                    }
                } else { // not a file
                    done();
                }
            };

            // check if this is a module
            let option5 = (done) => {
                loadModule(_dep).then((content) => { // as last option, try to load it as module
                    _resolved = content; done();
                }).catch((e) => {
                   throw new _Exception('ModuleLoad', `Module load operation failed with error: ${e}. (${_dep})`);
                });
            };

            // done
            let resolved = (isExcludePop) => {
                _resolvedItems.push(_resolved);
                if (!isExcludePop) { incCycle.pop(); } // removed the last added dep
                resolveNext();
            };

            // process
            if (_dep === '') { // nothing is defined to process
                resolved(true); return;
            } else {
                // cycle break check
                if (incCycle.indexOf(_dep) !== -1) {
                    throw new _Exception('CircularDependency', `Circular dependency identified. (${_dep})`);
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
                                        throw new _Exception('DependencyResolution', `Failed to resolve dependency. ${_dep}`);
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

// attach to flair
a2f('include', _include, () => {
    incCycle.length = 0;
});
