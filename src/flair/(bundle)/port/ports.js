// define all ports with their inbuilt implementations as applicable

// sessionStorage factory
const __sessionStorage = (env) => {
    if (env.isServer) {
        if (!env.global.sessionStorage) { 
            // the way, on browser sessionStorage is different for each tab, 
            // here 'sessionStorage' property on global is different for each node instance in a cluster
            let nodeSessionStorage = function() {
                let keys = {};
                this.key = (key) => { 
                    if (!key) { throw _Exception.InvalidArgument('key', this.key); }
                    return (keys.key ? true : false); 
                };
                this.getItem = (key) => { 
                    if (!key) { throw _Exception.InvalidArgument('key', this.getItem); }
                    return keys.key || null;
                };
                this.setItem = (key, value) => {
                    if (!key) { throw _Exception.InvalidArgument('key', this.setItem); }
                    if (typeof value === 'undefined') { throw _Exception.InvalidArgument('value', this.setItem); }
                    keys[key] = value;
                };
                this.removeItem = (key) => { 
                    if (!key) { throw _Exception.InvalidArgument('key', this.removeItem); }
                    delete keys[key];
                };
                this.clear = () => { 
                    keys = {};
                };                        
            };
            env.global.sessionStorage = new nodeSessionStorage();
        }
        return env.global.sessionStorage;
    } else { // client
        return env.global.sessionStorage;
    }
};
_Port.define('sessionStorage', ['key', 'getItem', 'setItem', 'removeItem', 'clear'], __sessionStorage);

// localStorage factory
const __localStorage = (env) => {
    if (env.isServer) {
        console.warn("Use of 'state' is not support on server. Using 'session' instead."); // eslint-disable-line no-console
        return __sessionStorage(env);
    } else { // client
        return env.global.localStorage;
    }
};
_Port.define('localStorage', ['key', 'getItem', 'setItem', 'removeItem', 'clear'], __localStorage);

// serverModule factory
const __serverModule = (env) => { // eslint-disable-line no-unused-vars
    let funcs = {
        require: (module) => {
            return new Promise((resolve, reject) => {
                if (typeof module !== 'string') { reject(_Exception.InvalidArgument('module')); return; }

                // both worker and normal scenarios, same loading technique
                try {
                    resolve(require(module));
                } catch (err) {
                    reject(new _Exception(err));
                }
            });
        },
        undef: (module) => {
            if (typeof module !== 'string') { throw _Exception.InvalidArgument('module', funcs.undef); }
            try {
                delete require.cache[require.resolve(module)]
            } catch (err) {
                throw new _Exception(err, funcs.undef);
            }
        }
    };
    return funcs;
};
_Port.define('serverModule', ['require', 'undef'], __serverModule);

// clientModule factory
const __clientModule = (env) => {
    let funcs = {
        require: (module) => {
            return new Promise((resolve, reject) => {
                if (typeof module !== 'string') { reject(_Exception.InvalidArgument('module')); return; }

                let ext = module.substr(module.lastIndexOf('.') + 1).toLowerCase();
                try {
                    if (typeof env.global.require !== 'undefined') { // if requirejs is available
                        env.global.require([module], resolve, reject);
                    } else { // load it as file on browser or in web worker
                        if (env.isWorker) {
                            try {
                                env.global.importScripts(module); // sync call
                                resolve(); // TODO: Check how we can pass the loaded 'exported' object of module to this resolve.
                            } catch (err) {
                                reject(new _Exception(err));
                            }
                        } else { // browser
                            let js = env.global.document.createElement('script');
                            if (ext === 'mjs') {
                                js.type = 'module';
                            } else {
                                js.type = 'text/javascript';
                            }
                            js.name = module;
                            js.src = module;
                            js.onload = () => { 
                                resolve(); // TODO: Check how we can pass the loaded 'exported' object of module to this resolve.
                            };
                            js.onerror = (err) => {
                                reject(new _Exception(err));
                            };
                            env.global.document.head.appendChild(js);
                        }
                    }
                } catch(err) {
                    reject(new _Exception(err));
                }
            });
        },
        undef: (module) => {
            if (typeof module !== 'string') { throw _Exception.InvalidArgument('module', funcs.undef); }
            if (typeof env.global.requirejs !== 'undefined') { // if requirejs library is available
                env.global.requirejs.undef(module);
            } else {
                console.warn("No approach is available to undef a loaded module. Connect clientModule port to an external handler."); // eslint-disable-line no-console
            }
        }
    };
};
_Port.define('clientModule', ['require', 'undef'], __clientModule);

// serverFile factory
const __serverFile = (env) => { // eslint-disable-line no-unused-vars
    return (file) => {
        return new Promise((resolve, reject) => {
            if (typeof file !== 'string') { reject(_Exception.InvalidArgument('file')); return; }

            let ext = file.substr(file.lastIndexOf('.') + 1).toLowerCase();
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
                        let contentType = resp.headers['content-type'];
                        if (ext === 'json' || /^application\/json/.test(contentType)) { // special case of JSON
                            try {
                                let data = JSON.parse(body);
                                resolve(data);
                            } catch (err) {
                                reject(new _Exception(err));
                            }
                        } else { // everything else is a text
                            resolve(body);
                        }
                    });
                }).on('error', (err) => {
                    reject(new _Exception(err));
                });
            } catch(err) {
                reject(new _Exception(err));
            }
        });
    };
};
_Port.define('serverFile', null, __serverFile);

// clientFile factory
const __clientFile = (env) => { // eslint-disable-line no-unused-vars
    return (file) => {
        return new Promise((resolve, reject) => {
            if (typeof file !== 'string') { reject(_Exception.InvalidArgument('file')); return; }

            let ext = file.substr(file.lastIndexOf('.') + 1).toLowerCase();
            fetch(file).then((response) => {
                if (response.status !== 200) {
                    reject(_Exception.OperationFailed(file, response.status));
                } else {
                    let contentType = response.headers['content-type'];
                    if (ext === 'json' || /^application\/json/.test(contentType)) { // special case of JSON
                        response.json().then(resolve).catch((err) => {
                            reject(new _Exception(err));
                        });
                    } else { // everything else is a text
                        response.text().then(resolve).catch((err) => {
                            reject(new _Exception(err));
                        });
                    }
                }
            }).catch((err) => {
                reject(new _Exception(err));
            });
        });
    };
};
_Port.define('clientFile', null, __clientFile);

// settingsReader factory
const __settingsReader = (env) => {
    return (asmName) => {
        /** 
         * NOTE: appConfig.json (on server) and webConfig.json (on client)
         * is the standard config file which can contain settings for every
         * assembly for various settings. Only defined settings will be overwritten 
         * over inbuilt settings of that assembly's setting.json
         * there can be two versions of settings for each assembly:
         * 1. when assembly is loaded in main thread
         * 2. when assembly is loaded on worker thread
         * these can be defined as:
         * {
         *      "assemblyName": { <-- this is used when assembly is loaded in main thread
         *          "settingName1": "settingValue",
         *          "settingName2": "settingValue"
         *      }
         *      "worker:assemblyName": { <-- this is used when assembly is loaded in worker thread
         *          "settingName1": "settingValue",
         *          "settingName2": "settingValue"
         *      }
         * }
         * Note: The whole settings of the assembly are merged in following order as:
         * A. When assembly is being loaded in main thread:
         *      settings.json <-- appConfig/webConfig.assemblyName section
         * B. When assembly is being loaded in worker thread:
         *      settings.json <-- appConfig/webConfig:assemblyName section <-- appConfig/webConfig:worker:assemblyName section
         * 
         * This means, when being loaded on worker, only differentials should be defined for worker environment
         * which can be worker specific settings
         * 
         * NOTE: under every "assemblyName", all settings underneath are treated as whole object, 
         * and all merging happens at this level, merging does not go deeper than this level
        */

        // return relevant settings
        let settings = {},
            configFileJSON = _AppDomain.config();
        if (configFileJSON && configFileJSON[asmName]) { // pick non-worker settings
            settings = Object.assign(settings, configFileJSON[asmName]);
        }
        if (env.isWorker && configFileJSON && configFileJSON[`worker:${asmName}`]) { // overwrite with worker section if defined
            settings = Object.assign(settings, configFileJSON[`worker:${asmName}`]);
        }
        return settings;
    };
};
_Port.define('settingsReader', null, __settingsReader);
