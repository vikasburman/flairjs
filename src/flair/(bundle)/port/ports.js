// define all ports with their inbuilt implementations as applicable

// sessionStorage
const __sessionStorage = (env) => {
    if (env.isServer) {
        if (!env.global.sessionStorage) { 
            // the way, on browser sessionStorage is different for each tab, 
            // here 'sessionStorage' property on global is different for each node instance in a cluster
            let nodeSessionStorage = function() {
                let keys = {};
                this.key = (key) => { 
                    if (!key) { throw _Exception.invalidArgument('key'); }
                    return (keys.key ? true : false); 
                };
                this.getItem = (key) => { 
                    if (!key) { throw _Exception.invalidArgument('key'); }
                    return keys.key || null 
                };
                this.setItem = (key, value) => { 
                    if (!key) { throw _Exception.invalidArgument('key'); }
                    if (typeof value === 'undefined') { throw _Exception.invalidArgument('value'); }
                    keys[key] = value; 
                };
                this.removeItem = (key) => { 
                    if (!key) { throw _Exception.invalidArgument('key'); }
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
_Port.define('sessionStorage', ['key', 'getItem', 'setItem', 'removeItem', 'clear'], __sessionStorage(flair.options.env));

// localStorage
const __localStorage = (env) => {
    if (env.isServer) {
        console.log("Use of 'state' is not support on server. Using 'session' instead."); // eslint-disable-line no-console
        return __sessionStorage(env);
    } else { // client
        return env.global.localStorage;
    }
};
_Port.define('localStorage', ['key', 'getItem', 'setItem', 'removeItem', 'clear'], __localStorage(flair.options.env));

// serverModule
const __serverModule = (env) => { // eslint-disable-line no-unused-vars
    return {
        require: (module) => {
            return new Promise((resolve, reject) => {
                // both worker and normal scenarios, same loading technique
                try {
                    resolve(require(module));
                } catch (e) {
                    reject(e);
                }
            });
        },
        undef: (module) => {
            delete require.cache[require.resolve(module)]
        }
    }
};
_Port.define('serverModule', ['require', 'undef'], __serverModule(flair.options.env));

// clientModule
const __clientModule = (env) => {
    return {
        require: (module) => {
            return new Promise((resolve, reject) => {
                let ext = module.substr(module.lastIndexOf('.') + 1).toLowerCase();
                try {
                    if (typeof env.global.require !== 'undefined') { // if requirejs is available
                        env.global.require([module], resolve, reject);
                    } else { // load it as file on browser or in web worker
                        if (env.isWorker) {
                            try {
                                env.global.importScripts(module); // sync call
                                resolve(); // TODO: Check how we can pass the loaded 'exported' object of module to this resolve.
                            } catch (e) {
                                reject(e);
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
                            js.onerror = (e) => {
                                reject(e);
                            };
                            env.global.document.head.appendChild(js);
                        }
                    }
                } catch(e) {
                    reject(e);
                }
            });
        },
        undef: (module) => {
            if (typeof env.global.requirejs !== 'undefined') { // if requirejs library is available
                env.global.requirejs.undef(module);
            } // else no default way to uncache - for other environments, this port can be connected to an external handler
        }
    }
};
_Port.define('clientModule', ['require', 'undef'], __clientModule(flair.options.env));

// serverFile
const __serverFile = (env) => { // eslint-disable-line no-unused-vars
    return (file) => {
        return new Promise((resolve, reject) => {
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
                            } catch (e) {
                                reject(e);
                            }
                        } else { // everything else is a text
                            resolve(body);
                        }
                    });
                }).on('error', reject);
            } catch(e) {
                reject(e);
            }
        });
    };
};
_Port.define('serverFile', null, __serverFile(flair.options.env));

// clientFile
const __clientFile = (env) => { // eslint-disable-line no-unused-vars
    return (file) => {
        return new Promise((resolve, reject) => {
            let ext = file.substr(file.lastIndexOf('.') + 1).toLowerCase();
            fetch(file).then((response) => {
                if (response.status !== 200) {
                    reject(response.status);
                } else {
                    let contentType = response.headers['content-type'];
                    if (ext === 'json' || /^application\/json/.test(contentType)) { // special case of JSON
                        response.json().then(resolve).catch(reject);
                    } else { // everything else is a text
                        response.text().then(resolve).catch(reject);
                    }
                }
            }).catch(reject);
        });
    };
};
_Port.define('clientFile', null, __clientFile(flair.options.env));
