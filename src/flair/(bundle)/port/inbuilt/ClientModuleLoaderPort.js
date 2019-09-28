/**
 * @name ClientModuleLoaderPort
 * @description Default client module loading implementation
 */
const ClientModuleLoaderPort = function() {
    this.name = 'clientModule';

    this.require = async (module) => {
        if (typeof module !== 'string') { throw _Exception.InvalidArgument('module'); }
        
        let doLoadViaRequire = () => {
            return new Promise((resolve, reject) => { 
                require([module], resolve, reject); 
            });
        };
        let doLoadViaDOM = () => {
            return new Promise((resolve, reject) => { 
                let ext = module.substr(module.lastIndexOf('.') + 1).toLowerCase();
                let js = window.document.createElement('script');
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
                window.document.head.appendChild(js);                    
            });
        };

        if (typeof require !== 'undefined') { // if requirejs is available
            return await doLoadViaRequire();
        } else { // load it as file on browser or in web worker
            if (options.env.isWorker) {
                importScripts(module); // sync call
                return // TODO: Check how we can pass the loaded 'exported' object of module to this resolve.
            } else { // browser
                return await doLoadViaDOM();
            }
        }        
    };
    this.undef = (module) => {
        if (typeof module !== 'string') { throw _Exception.InvalidArgument('module'); }

        let _requireJs = null;
        if (options.env.isWorker) {
            _requireJs = WorkerGlobalScope.requirejs || null;
        } else {
            _requireJs = window.requirejs || null;
        }
        if (_requireJs) { // if requirejs library is available
            _requireJs.undef(module);
        } else {
            console.warn("No approach is available to undef a loaded module. Connect clientModule port to an external handler."); // eslint-disable-line no-console
        }
    };
};
