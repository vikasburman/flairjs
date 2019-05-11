/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.app
 *     File: ./flair.app.js
 *  Version: 0.6.6
 *  Sat, 11 May 2019 03:36:59 GMT
 * 
 * (c) 2017-2019 Vikas Burman
 * MIT
 */
(function(root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) { // AMD support
        define(factory);
    } else if (typeof exports === 'object') { // CommonJS and Node.js module support
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = factory; // Node.js specific module.exports
        }
        module.exports = exports = factory; // CommonJS        
    } else { // expose as global on window
        root['flair.app'] = factory;
    }
})(this, async function(__asmFile) {
    'use strict';

    // flair object
    const flair = (typeof global !== 'undefined' ? require('flairjs') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));

    // assembly closure init (start)
    /* eslint-disable no-unused-vars */
    
    // flair types, variables and functions
    const { Class, Struct, Enum, Interface, Mixin, Aspects, AppDomain, $$, attr, bring, Container, include, Port, on, post, telemetry,
            Reflector, Serializer, Tasks, as, is, isComplies, isDerivedFrom, isAbstract, isSealed, isStatic, isSingleton, isDeprecated,
            isImplements, isInstanceOf, isMixed, getAssembly, getAttr, getContext, getResource, getRoute, getType, ns, getTypeOf,
            getTypeName, typeOf, dispose, using, Args, Exception, noop, nip, nim, nie, event } = flair;
    const { TaskInfo } = flair.Tasks;
    const { env } = flair.options;
    const { forEachAsync, replaceAll, splitAndTrim, findIndexByProp, findItemByProp, which, guid, isArrowFunc, isASyncFunc, sieve,
            deepMerge, b64EncodeUnicode, b64DecodeUnicode } = flair.utils;
    
    // inbuilt modifiers and attributes compile-time-safe support
    const { $$static, $$abstract, $$virtual, $$override, $$sealed, $$private, $$privateSet, $$protected, $$protectedSet, $$readonly, $$async,
            $$overload, $$enumerate, $$dispose, $$post, $$on, $$timer, $$type, $$args, $$inject, $$resource, $$asset, $$singleton, $$serialize,
            $$deprecate, $$session, $$state, $$conditional, $$noserialize, $$ns } = $$;
    
    // access to DOC
    const DOC = ((env.isServer || env.isWorker) ? null : window.document);
    
    // current for this assembly
    const __currentContextName = AppDomain.context.current().name;
    const __currentFile = __asmFile;
    const __currentPath = __currentFile.substr(0, __currentFile.lastIndexOf('/') + 1);
    AppDomain.loadPathOf('flair.app', __currentPath);
    
    // settings of this assembly
    let settings = JSON.parse('{"boot":{"load":[]},"di":{"container":{}},"client":{"view":{"el":"main","title":"","transition":""},"url":{"404":"/404","hashbang":false,"i18n":false,"home":"/"},"vue":{"components":[],"filters":[],"mixins":[],"directives":[],"plugins":[],"pluginOptions":{}},"i18n":{"enabled":true,"locale":"en","locales":[{"code":"en","name":"English","native":"English"}]},"routing":{"mounts":{"main":"/"},"main-options":[],"main-interceptors":[]}},"server":{"express":{"server-http":{"enable":false,"port":80,"timeout":-1},"server-https":{"enable":false,"port":443,"timeout":-1,"privateKey":"","publicCert":""}},"envVars":{"vars":[],"options":{"overwrite":true}},"routing":{"mounts":{"main":"/"},"main-appSettings":[],"main-middlewares":[],"main-interceptors":[]}}}');
    let settingsReader = flair.Port('settingsReader');
    if (typeof settingsReader === 'function') {
        let externalSettings = settingsReader('flair.app');
        if (externalSettings) { settings = deepMerge([settings, externalSettings], false); }
    }
    settings = Object.freeze(settings);
    
    // config of this assembly
    let config = JSON.parse('{}');
    config = Object.freeze(config);
    
    /* eslint-enable no-unused-vars */
    // assembly closure init (end)
    
    // assembly global functions (start)
    // global handler
    let onLoadComplete = () => {
    }; 
    // assembly global functions (end)
    
    // set assembly being loaded
    AppDomain.context.current().currentAssemblyBeingLoaded('./flair.app{.min}.js');
    
    // assembly types (start)
        
    await (async () => { // type: ./src/flair.app/flair.app/@1-Bootware.js
        /**
         * @name Bootware
         * @description Bootware base class
         */
        $$('abstract');
        $$('ns', 'flair.app');
        Class('Bootware', function() {
            /**  
             * @name construct
             * @arguments
             *  name: string - name of the bootware
             *  version: string - version number of the bootware
            */
            $$('virtual');
            this.construct = (name, version, isMountSpecific) => {
                let args = Args('name: string, version: string',
                                'name: string, version: string, isMountSpecific: boolean',
                                'name: string, isMountSpecific: boolean',
                                'name: string')(name, version, isMountSpecific); args.throwOnError(this.construct);
        
                // set info
                this.info = Object.freeze({
                    name: args.values.name || '',
                    version: args.values.version || '',
                    isMountSpecific: args.values.isMountSpecific || false
                });
            };
        
            /**  
             * @name boot
             * @arguments
             *  mount: object - mount object
            */
            $$('virtual');
            $$('async');
            this.boot = noop;
        
            $$('readonly');
            this.info = null;
        
            /**  
             * @name ready
             * @arguments
             *  mount: object - mount object
            */
            $$('virtual');
            $$('async');
            this.ready = noop;
        
            $$('virtual');
            this.dispose = noop;
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.app/@1-Handler.js
        
        const { IDisposable } = ns();
        
        /**
         * @name Handler
         * @description Handler base class
         */
        $$('ns', 'flair.app');
        Class('Handler', [IDisposable], function() {
            $$('virtual');
            this.construct = () => {
            };
        
            $$('virtual');
            this.dispose = () => {
            };
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.app/@2-App.js
        const { IDisposable } = ns();
        const { Bootware } = ns('flair.app');
        
        /**
         * @name App
         * @description App base class
         */
        $$('ns', 'flair.app');
        Class('App', Bootware, [IDisposable], function() {
            $$('override');
            this.construct = (base) => {
                // set info
                let asm = getAssembly(this);
                base(asm.title, asm.version);
            };
            
            $$('override');
            this.boot = async (base) => {
                base();
                AppDomain.host().error.add(this.onError); // host's errors are handled here
            };
        
            $$('virtual');
            this.start = async () => {
                // initialize view state
                if (!env.isServer && !env.isWorker) {
                    const { ViewState } = ns('flair.ui');
                    new ViewState(); // this initializes the global view state store's persistance via this singleton object
                }
            };
        
            $$('virtual');
            this.stop = async () => {
                // clear view state
                if (!env.isServer && !env.isWorker) {
                    const { ViewState } = ns('flair.ui');
                    new ViewState().clear();
                }
            };
        
            $$('virtual');
            this.onError = (e) => {
                throw Exception.OperationFailed(e.error, this.onError);
            };
        
            $$('override');
            this.dispose = (base) => {
                base();
                AppDomain.host().error.remove(this.onError); // remove error handler
            };
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.app/@2-Host.js
        const { IDisposable } = ns();
        const { Bootware } = ns('flair.app');
        
        /**
         * @name App
         * @description App base class
         */
        $$('ns', 'flair.app');
        Class('Host', Bootware, [IDisposable], function() {
            $$('privateSet');
            this.isStarted = false;
        
            $$('virtual');
            this.start = async () => {
                this.isStarted = true;
            };
        
            $$('virtual');
            this.stop = async () => {
                this.isStarted = false;
            };
        
            this.restart = async () => {
                await this.stop();
                await this.start();
            };
        
            this.error = event((err) => {
                return { error: err };
            });
            
            this.raiseError = (err) => {
                this.error(err);
            };
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.ui.vue/@3-VueComponentMembers.js
        /**
         * @name VueComponentMembers
         * @description Vue Component Members
         */
        $$('ns', 'flair.ui.vue');
        Mixin('VueComponentMembers', function() {
            var _this = this;
        
            $$('private');
            this.define = async () => {
                const Vue = await include('vue/vue{.min}.js');   
                const { ViewState } = ns('flair.ui');
                const { VueFilter, VueMixin, VueDirective, VueComponent } = ns('flair.ui.vue');
        
                let viewState = new ViewState(),
                    component = {};
        
                // get port
                let clientFileLoader = Port('clientFile');  
        
                // load style content in property
                if (this.style && this.style.endsWith('.css')) { // if style file is defined via $$('asset', '<fileName>');
                    this.style = await clientFileLoader(this.style);
                }
        
                // load html content in property
                if (this.html && this.html.endsWith('.html')) { // if html file is defined via $$('asset', '<fileName>');
                    this.html = await clientFileLoader(this.html);
                }
        
                // local i18n resources
                // each i18n resource file is defined as:
                // "ns": "json-file-name"
                // when loaded, each ns will convert into JSON object from defined file
                if(settings.i18n.enabled && this.i18n) {
                    let i18ResFile = '';
                    for(let i18nNs in this.i18n) {
                        if (this.i18n.hasOwnProperty(i18nNs)) {
                            i18ResFile = this.$self.assemblyName + '/locales/' + this.locale() + '/' + this.i18n[i18nNs];
                            this.i18n[i18nNs] = await clientFileLoader(i18ResFile); // this will load defined json file as json object here
                        }
                    }
                }
        
                // template
                // https://vuejs.org/v2/api/#template
                // either manually defined, or loaded from html and style combination as fallback
                if (this.template) {
                    component.template = this.template;
                } else {
                    if (this.style && this.html) {
                        component.template = '<div><style scoped>' + this.style.trim() +'</style><div>' + this.html.trim() + '</div></div>';
                    } else if (this.html) {
                        component.template = this.html.trim();
                    }
                }
                
                // render
                // https://vuejs.org/v2/api/#render
                // https://vuejs.org/v2/guide/render-function.html#Functional-Components
                if (this.render && typeof this.render === 'function') {
                    component.render = this.render;
                }
        
                // functional
                // https://vuejs.org/v2/api/#functional
                // https://vuejs.org/v2/guide/render-function.html#Functional-Components
                if (typeof this.functional === 'boolean') { 
                    component.functional = this.functional;
                }
        
                // computed 
                // https://vuejs.org/v2/guide/computed.html#Computed-Properties
                // https://vuejs.org/v2/guide/computed.html#Computed-Setter
                // https://vuejs.org/v2/api/#computed
                if (this.computed) {
                    for(let p in this.computed) {
                        if (this.computed.hasOwnProperty(p)) {
                            component.computed = component.computed || {};
                            component.computed[p] = this.computed[p];
                        }
                    }
                }
                
                // state 
                // global state properties are added as computed properties
                // with get/set working over global ViewState store
                // each state property is defined as in the array
                // { "path": "path", "name": "name", "value": value }
                if(this.state && Array.isArray(this.state)) {
                    for(let p of this.state) {
                        if (component.computed[p.name]) { throw Exception.InvalidDefinition(`Computed (state) property already defined. (${p.name})`); }
                        component.computed = component.computed || {};
                        component.computed[p.name] = {
                            get: function() { return (viewState.get(p.path, p.name) || p.value); },
                            set: function(val) { viewState.set(p.path, p.name, val); }
                        };
                    }          
                }
        
                // methods
                // https://vuejs.org/v2/api/#methods
                if (this.methods) {
                    for(let m in this.methods) {
                        if (this.methods.hasOwnProperty(m)) {
                            component.methods = component.methods || {};
                            component.methods[m] = this.methods[m];
                        }
                    }
                }        
        
                // supporting built-in method: path 
                // this helps in building client side path nuances
                // e.g., {{ path('abc/xyz') }} will give: '/#/en/abc/xyz'
                component.methods = component.methods || {};
                component.methods['path'] = (path) => { return _this.path(path); };
        
                // supporting built-in method: route
                // this helps in using path from route settings itself
                // e.g., {{ route('home') }} will give: '/#/en/'
                component.methods = component.methods || {};
                component.methods['route'] = (routeName, placeholders) => { return _this.route(routeName, placeholders); };
        
                // i18n specific built-in methods
                if (settings.i18n.enabled) {
                    // supporting built-in method: locale 
                    // e.g., {{ locale() }} will give: 'en'
                    component.methods['locale'] = (value) => { return _this.locale(value); };
        
                    // supporting built-in method: i18n 
                    // e.g., {{ i18n('shared', 'OK', 'Ok!') }} will give: 'Ok' if this was the translation added in shared.json::OK key
                    component.methods['i18n'] = (ns, key, defaultValue) => {  
                        if (_this.i18n && _this.i18n[ns] && _this.i18n[ns][key]) {
                            return _this.i18n[ns][key] || defaultValue || '(i18n: 404)';
                        }
                        return defaultValue || '(i18n: 404)';
                    };
                }
        
                // watch
                // https://vuejs.org/v2/guide/computed.html#Computed-vs-Watched-Property
                // https://vuejs.org/v2/guide/computed.html#Watchers
                // https://vuejs.org/v2/api/#watch
                if (this.watch) {
                    for(let p in this.watch) {
                        if (this.watch.hasOwnProperty(p)) {
                            component.watch = component.watch || {};
                            component.watch[p] = this.watch[p];
                        }
                    }
                }
                
                // lifecycle
                // https://vuejs.org/v2/guide/instance.html#Instance-Lifecycle-Hooks
                // https://vuejs.org/v2/api/#Options-Lifecycle-Hooks
                if (this.lifecycle) {
                    for(let m in this.lifecycle) {
                        if (this.lifecycle.hasOwnProperty(m)) {
                            component[m] = this.lifecycle[m];
                        }
                    }
                }
        
                // components
                // each component in array is defined as:
                // { "name": "name", "type": "ns.typeName" }        
                // https://vuejs.org/v2/guide/components-registration.html#Local-Registration
                // https://vuejs.org/v2/api/#components
                if (this.components && Array.isArray(this.components)) {
                    let ComponentType = null,
                        component = null;
                    for(let item of this.components) {
                        if (!item.name) { throw Exception.OperationFailed(`Component name cannot be empty. (${item.type})`); }
                        if (!item.type) { throw Exception.OperationFailed(`Component type cannot be empty. (${item.name})`); }
        
                        
                        ComponentType = as(await include(item.name), VueComponent);
                        if (ComponentType) {
                            try {
                                component = new ComponentType();
        
                                // check for duplicate (global & local)
                                if (Vue.options.components[item.name]) { throw Exception.Duplicate(`Component already registered. (${item.name})`); }
                                if (component.components && component.components[item.name]) { throw Exception.Duplicate(`Component already registered. (${item.name})`); }
        
                                // register locally
                                component.components = component.components || {};
                                component.components[item.name] = await component.factory();
                            } catch (err) {
                                throw Exception.OperationFailed(`Component registration failed. (${item.type})`, err);
                            }
                        } else {
                            throw Exception.InvalidArgument(item.type);
                        }
                    }   
                }
        
                // mixins
                // each mixin in array is defined as:
                // { "name": "name", "type": "ns.typeName" }
                // https://vuejs.org/v2/guide/mixins.html
                // https://vuejs.org/v2/api/#mixins
                if (this.mixins && Array.isArray(this.mixins)) {
                    let MixinType = null,
                        mixin = null;
                    for(let item of this.mixins) {
                        if (!item.name) { throw Exception.OperationFailed(`Mixin name cannot be empty. (${item.type})`); }
                        if (!item.type) { throw Exception.OperationFailed(`Mixin type cannot be empty. (${item.name})`); }
        
                        MixinType = as(await include(item.type), VueMixin);
                        if (MixinType) {
                            try {
                                mixin = new MixinType();
        
                                // check for duplicate 
                                if (component.mixins && component.mixins[item.name]) { throw Exception.Duplicate(`Mixin already registered. (${item.name})`); }
        
                                // register locally
                                component.mixins = component.mixins || {};
                                component.mixins[item.name] = await mixin.factory();
                            } catch (err) {
                                throw Exception.OperationFailed(`Mixin registration failed. (${item.type})`, err);
                            }
                        } else {
                            throw Exception.InvalidArgument(item.type);
                        }
                    }
                }
        
                // directives
                // each directive in array is defined as:
                // { "name": "name", "type": "ns.typeName" }
                // https://vuejs.org/v2/guide/custom-directive.html
                // https://vuejs.org/v2/api/#directives
                if (this.directives && Array.isArray(this.directives)) {
                    let DirectiveType = null,
                    directive = null;
                    for(let item of this.directives) {
                        if (!item.name) { throw Exception.OperationFailed(`Directive name cannot be empty. (${item.type})`); }
                        if (!item.type) { throw Exception.OperationFailed(`Directive type cannot be empty. (${item.name})`); }
        
                        DirectiveType = as(await include(item.type), VueDirective);
                        if (DirectiveType) {
                            try {
                                directive = new DirectiveType();
        
                                // check for duplicate 
                                if (component.directives && component.directives[item.name]) { throw Exception.Duplicate(`Directive already registered. (${item.name})`); }
        
                                // register locally
                                component.directives = component.directives || {};
                                component.directives[item.name] = await directive.factory();
                            } catch (err) {
                                throw Exception.OperationFailed(`Directive registration failed. (${item.type})`, err);
                            }
                        } else {
                            throw Exception.InvalidArgument(item.type);
                        }
                    }
                }        
        
                // filters
                // each filter in array is defined as:
                // { "name": "name", "type": "ns.typeName" }
                // https://vuejs.org/v2/guide/filters.html
                // https://vuejs.org/v2/api/#filters
                if (this.filters && Array.isArray(this.filters)) {
                    let FilterType = null,
                        filter = null;
                    for(let item of this.filters) {
                        if (!item.name) { throw Exception.OperationFailed(`Filter name cannot be empty. (${item.type})`); }
                        if (!item.type) { throw Exception.OperationFailed(`Filter type cannot be empty. (${item.name})`); }
                        
                        FilterType = as(await include(item.type), VueFilter);
                        if (FilterType) {
                            try {
                                filter = new FilterType();
                                
                                // check for duplicate 
                                if (component.filters && component.filters[item.name]) { throw Exception.Duplicate(`Filter already registered. (${item.name})`); }
        
                                // register locally
                                component.filters = component.filters || {};
                                component.filters[item.name] = await filter.factory();
                            } catch (err) {
                                throw Exception.OperationFailed(`Filter registration failed. (${item.type})`, err);
                            }
                        } else {
                            throw Exception.InvalidArgument(item.type);
                        }
                    }             
                }
        
                // DI: provide and inject
                // https://vuejs.org/v2/guide/components-edge-cases.html#Dependency-Injection
                // https://vuejs.org/v2/api/#provide-inject
                // provided methods must be defined in this.methods
                // a shortcut is taken, so that method don't need to be define twice
                // therefore instead of defining provide as a function, define provide as an array
                // of method names, same as in inject elsewhere
                if (this.provide && Array.isArray(this.provide)) {
                    component.provide = this.provide;
                }
                if (this.inject && Array.isArray(this.inject)) {
                    component.inject = this.inject;
                }
        
                // done
                return component;
            };    
            
            $$('protected');
            this.locale = (value) => { return AppDomain.host().locale(value); }
        
            $$('protected');
            this.path = (path) => { return AppDomain.host().path(path); }
            
            $$('protected');
            this.route = (routeName, placeholders) => { return AppDomain.host().route(routeName, placeholders); }
        
            $$('protected');
            this.i18n = null;
        
            $$('protected');
            this.style = '';
        
            $$('protected');
            this.html = ''; 
        
            $$('protected');
            this.template = null;
        
            $$('protected');
            this.render = null;
        
            $$('protected');
            this.functional = false;    
        
            $$('protected');
            this.computed = null;
        
            $$('protected');
            this.state = null;
        
            $$('protected');
            this.methods = null;
        
            $$('protected');
            this.watch = null;    
        
            $$('protected');
            this.lifecycle = null;    
        
            $$('protected');
            this.components = null;
        
            $$('protected');
            this.mixins = null;    
        
            $$('protected');
            this.directives = null;     
        
            $$('protected');
            this.filters = null;      
            
            $$('protected');
            this.provide = null;
        
            $$('protected');
            this.inject = null;
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.api/RestHandler.js
        const { Handler } = ns('flair.app');
        
        /**
         * @name RestHandler
         * @description Restful API Handler
         */
        $$('ns', 'flair.api');
        Class('RestHandler', Handler, function() {
            $$('virtual');
            this.get = noop;
        
            $$('virtual');
            this.post = noop;
        
            $$('virtual');
            this.put = noop;
        
            $$('virtual');
            this.delete = noop;
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.api/RestInterceptor.js
        /**
         * @name RestInterceptor
         * @description Api Interceptor
         */
        $$('ns', 'flair.api');
        Class('RestInterceptor', function() {
            $$('virtual');
            $$('async');
            this.run = noop;
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.app/BootEngine.js
        const { Bootware } = ns('flair.app');
        
        /**
         * @name BootEngine
         * @description Bootstrapper functionality
         */
        $$('static');
        $$('ns', 'flair.app');
        Class('BootEngine', function() {
            this.start = async function () {
                let allBootwares = [],
                    mountSpecificBootwares = [];
                const loadFilesAndBootwares = async () => {
                    // load bootwares, scripts and preambles
                    let Item = null,
                        Bw = null,
                        bw = null;
                    for(let item of settings.boot.load) {
                        // get bootware (it could be a bootware, a simple script or a preamble)
                        item = which(item); // server/client specific version
                        if (item) { // in case no item is set for either server/client
                            Item = await include(item);
                            if (Item && typeof Item !== 'boolean') {
                                Bw = as(Item, Bootware);
                                if (Bw) { // if boot
                                    bw = new Bw(); 
                                    allBootwares.push(bw); // push in array, so boot and ready would be called for them
                                    if (bw.info.isMountSpecific) { // if bootware is mount specific bootware - means can run once for each mount
                                        mountSpecificBootwares.push(bw);
                                    }
                                } // else ignore, this was something else, like a module which was just loaded
                            } // else ignore, as it could just be a file loaded which does not return anything
                        }
                    }
                };
                const runBootwares = async (method) => {
                    if (!env.isWorker) { // main env
                        let mounts = AppDomain.host().mounts,
                            mountNames = Object.keys(mounts),
                            mountName = '',
                            mount = null;
                    
                        // run all bootwares for main
                        mountName = 'main';
                        mount = mounts[mountName];
                        for(let bw of allBootwares) {
                            await bw[method](mount);
                        }
        
                        // run all bootwares which are mount specific for all other mounts (except main)
                        for(let mountName of mountNames) {
                            if (mountName === 'main') { continue; }
                            mount = mounts[mountName];
                            for(let bw of mountSpecificBootwares) {
                                await bw[method](mount);
                            }
                        }
                    } else { // worker env
                        // in this case as per load[] setting, no nountspecific bootwares should be present
                        if (mountSpecificBootwares.length !== 0) { 
                            console.warn('Mount specific bootwares are not supported for worker environment. Revisit worker:flair.app->load setting.'); // eslint-disable-line no-console
                        }
        
                        // run all for once (ignoring the mountspecific ones)
                        for(let bw of allBootwares) {
                            if (!bw.info.isMountSpecific) {
                                await bw[method]();
                            }
                        }
                    }
                };
                const boot = async () => {
                    const Host = await include('flair.app.ServerHost | flair.app.ClientHost');
                    const App = await include('flair.app.App');
                
                    // set host
                    if (!env.isWorker) {
                        let hostObj = new Host();
                        await hostObj.boot();
                        AppDomain.host(hostObj); 
                    }
                    
                    // boot
                    await runBootwares('boot');   
                    
                    // set app
                    let appObj = new App();
                    await appObj.boot();
                    AppDomain.app(appObj); 
                };        
                const start = async () => {
                    if (!env.isWorker) {
                        await AppDomain.host().start();
                    }
                    await AppDomain.app().start();
                };
                const DOMReady = () => {
                    return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                        if( document.readyState !== 'loading' ) {
                            resolve();
                        } else {
                            window.document.addEventListener("DOMContentLoaded", () => {
                                resolve();
                            });
                        }
                    });
                };
                const DeviceReady = () => {
                    return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                        window.document.addEventListener('deviceready', () => {
                            // NOTE: even if the device was already ready, registering for this event will immediately fire it
                            resolve();
                        }, false);
                    });
                };
                const ready = async () => {
                    if (env.isClient && !env.isWorker) {
                        await DOMReady();
                        if (env.isCordova) { await DeviceReady(); }
                    }
        
                    if (!env.isWorker) {
                        await AppDomain.host().ready();
                    }
                    await runBootwares('ready');
                    await AppDomain.app().ready();
                };
                  
                await loadFilesAndBootwares();
                await boot();
                await start();
                await ready();
                console.log('ready!'); // eslint-disable-line no-console
            };
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.app/ClientHost.js
        const { Host } = ns('flair.app');
        
        /**
         * @name ClientHost
         * @description Client host implementation
         */
        $$('sealed');
        $$('ns', 'flair.app');
        Class('ClientHost', Host, function() {
            let mountedApps = {},
                hashChangeHandler = null;
        
            $$('override');
            this.construct = (base) => {
                base('Page', '1.x'); // https://www.npmjs.com/package/page
            };
        
            this.app = {
                get: () => { return this.mounts['main'].app; },  // main page app
                set: noop
            };    
            this.mounts = { // all mounted page apps
                get: () => { return mountedApps; },
                set: noop
            };
        
            // localization support (start)
            $$('state');
            $$('private');
            this.currentLocale = settings.i18n.locale;
        
            this.defaultLocale = {
                get: () => { return settings.i18n.locale; },
                set: noop
            };
            this.supportedLocales = {
                get: () => { return settings.i18n.locales.slice(); },
                set: noop
            };
            this.locale = (newLocale, isSuppressRefresh) => {
                if (!settings.i18n.enabled) { return ''; }
        
                // update value and refresh for changes (if required)
                if (newLocale && this.currentLocale !== newLocale) { 
                    this.currentLocale = newLocale;
        
                    // change url and then redirect to new URL
                    if (!isSuppressRefresh) {
                        if (settings.url.i18n) {
                            // set new path with replaced locale
                            // this change will also go in history
                            window.location.hash = this.replaceLocale(window.location.hash);
                        } else {
                            // just refresh as is (it will pick the new currentLocale)
                            // this change will not go in history, as there is no url change
                            if (hashChangeHandler) { hashChangeHandler(); }
                        }
                    }
                }
        
                // return
                return this.currentLocale;
            };
            // localization support (end)
        
            // path support (start)
            $$('private');
            this.cleanPath = (path) => {
                if (path.substr(0, 1) === '/') { path = path.substr(1); }        
                if (path.substr(0, 3) === '#!/') { path = path.substr(3); }
                if (path.substr(0, 2) === '#!') { path = path.substr(2); }
                if (path.substr(0, 2) === '#/') { path = path.substr(2); }
                if (path.substr(0, 1) === '#') { path = path.substr(1); }
                if (path.substr(0, 1) === '/') { path = path.substr(1); }        
                return path;
            };
            $$('private');
            this.extractLocale = (path) => {
                if (!settings.url.i18n) { return ''; }
        
                // pick first path element
                let idx = path.indexOf('/');
                if (idx !== -1) {
                    let loc = path.substr(0, idx);
                    if (this.supportedLocales.indexOf(loc) !== -1) {
                        return loc; // found locale
                    }
                }
        
                return '';
            };
            $$('private');
            this.trimLocale = (path, locale) => {
                let lookFor = locale + '/',
                    idx = path.indexOf(lookFor);
                if (idx !== -1) {
                    return path.substr(idx + lookFor.length);
                }
                // return as is
                return path;
            };
            $$('private');
            this.replaceLocale = (path) => {
                // replace current locale with given locale
                if (settings.url.i18n) { 
                    // clean path first
                    path = this.cleanPath(path);
        
                   // extract locale from path
                   let extractedLocale = this.extractLocale(path);
                   if (extractedLocale) {
                        // trim locale from path
                        path = this.trimLocale(path, extractedLocale);
                    }
        
                    // build path with new locale
                    path = this.path(path);
                }
        
                // return
                return path;
            };
        
            this.path = (path) => {
                if (!path) { return ''; }
        
                // clean path
                path = this.cleanPath(path);
        
                // add hash
                if (settings.url.hashbang) {
                    path = '/#!/' + path;
                } else {
                    path = '/#/' + path;
                }
        
                // add i18n
                if (settings.i18n.enabled && settings.url.i18n) {
                    path = (this.currentLocale || this.defaultLocale) + '/' + path;
                }
        
                // return
                return path;
            };
            this.route = (route, placeholders) => {
                if (!route) { return; }
        
                // get path
                let path = '', 
                    routeObj = AppDomain.context.current().getRoute(route); // route = qualifiedRouteName
                if (routeObj) {
                    path = routeObj.path;
                }
        
                // replace placeholders
                // path can be like: test/:id
                // where it is expected that placeholders.id property will have what to replace in this
                if (path && placeholders) {
                    let idx1 = path.indexOf(':'),
                        idx2 = -1,
                        name = '';
                    while(idx1 !== -1) {
                        idx2 = path.substr(idx1 + 1).indexOf('/');
                        if (idx2 === -1) { // at the end
                            name = path.substr(idx1 + 1);
                        } else {
                            name = path.substr(idx1 + 1, idx2);
                        }
                        path = replaceAll(path, ':' + name, placeholders[name]);
                        idx1 = path.indexOf(':');
                    }
                }
        
                // build path now
                return this.path(path);
            };
            // path support (end)
        
            $$('override');
            this.boot = async (base) => { // mount all page app and pseudo sub-apps
                base();
        
                const page = await include('page/page{.min}.js', 'page');
        
                let appOptions = null,
                    mountPath = '',
                    mount = null;
                const getOptions = (mountName) => {
                    let appOptions = {};
                    // app options: https://www.npmjs.com/package/page#pageoptions
                    // each item is: { name: '', value:  }
                    // name: as in above link (as-is)
                    // value: as defined in above link
                    let pageOptions = settings[`${mountName}-options`];
                    if (pageOptions && pageOptions.length > 0) {
                        for(let pageOption of pageOptions) {
                            appOptions[pageOption.name] = pageOption.value;
                        }
                    }   
        
                    // inbuilt fixed options, overwrite even if defined outside
                    appOptions.click = false;
                    appOptions.popstate = false;
                    appOptions.dispatch = false;
                    appOptions.hashbang = false;
                    appOptions.decodeURLComponents = true;
                    appOptions.window = window; // always this is main window (even for sub-apps) - since we are not binding any handlers here, this is fine to have same window
        
                    return appOptions;         
                };
        
                // create main app instance of page
                appOptions = getOptions('main');
                page(appOptions); // configure main app
                let mainApp = page; // main-app is this object itself
                mainApp.strict(appOptions.strict);
                mainApp.base('/');
        
                // create one instance of page app for each mounted path
                for(let mountName of Object.keys(settings.routing.mounts)) {
                    if (mountName === 'main') {
                        mountPath = '/';
                        mount = mainApp;
                    } else {
                        appOptions = getOptions(mountName);
                        mountPath = settings.routing.mounts[mountName];
                        mount = page.create(appOptions); // create a sub-app
                        mount.strict(appOptions.strict);
                        mount.base(mountPath);
                    }
        
                    // attach
                    mountedApps[mountName] = Object.freeze({
                        name: mountName,
                        root: mountPath,
                        app: mount
                    });
                }
        
                // store
                mountedApps = Object.freeze(mountedApps);       
            };
        
            $$('override');
            this.start = async (base) => { // configure hashchange handler
                base();
        
                hashChangeHandler = () => {
                    // get clean path
                    let path = this.cleanPath(window.location.hash);
                    
                    // handle i18n specific routing
                    if (settings.i18n.enabled) {
                        if (settings.url.i18n) { // if i18n type urls are being used
                            // extract locale from path
                            let extractedLocale = this.extractLocale(path);
        
                            if (extractedLocale) {
                                // trim locale from path, so all paths here on are common across locales
                                path = this.trimLocale(path, extractedLocale);
        
                                // set this locale as currentLocale
                                this.locale(extractedLocale, true); // and don't initiate refresh, as it is already in that process
                            }
                        }
                    }
        
                    // at this point in time: 
                    // this.currentLocale has the right locale whether coming from url or otherwise
                    // path does not have any locale or hashbang and is just plain path for routing
        
                    // add a / in path, so it matches with routing definitions of mounts
                    path = ((path.substr(0, 1) !== '/') ? '/' : '') + path;
        
                    // route this path to most suitable mounted app
                    let app = null,
                        mountName = '';
                    for(let mount of this.mounts) {
                        if (path.startsWith(mount.root)) { 
                            app = mount.app; 
                            path = path.substr(mount.root.length); // remove all base path, so it becomes at part the way paths were added to this app
                            mountName = mount;
                            break; 
                        }
                    }
                    if (!app) { // when nothing matches, give it to main
                        mountName = 'main';
                        app = this.mounts[mountName]; 
                    } 
                    
                    // add initial /
                    if (path.substr(0, 1) !== '/') { path = '/' + path; }
        
                    // run app to initiate routing
                    setTimeout(() => { 
                        try {
                            app(path);
                        } catch (err) {
                            this.error(err); // pass-through event
                        }
                    }, 0); 
                };
            };
        
            $$('override');
            this.ready = async (base) => { // start listening hashchange event
                base();
        
                // attach event handler
                window.addEventListener('hashchange', hashChangeHandler);
        
                // navigate to home
                this.app.redirect(settings.url.home);
        
                // ready
                console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version}`); // eslint-disable-line no-console
            };
        
            $$('override');
            this.stop = async (base) => { // stop listening hashchange event
                base();
        
                // detach event handler
                window.removeEventListener('hashchange', hashChangeHandler);
            };
        
            $$('override');
            this.dispose = (base) => {
                base();
        
                mountedApps = null;
            };
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.app/ServerHost.js
        const { Host } = ns('flair.app');
        
        /**
         * @name ServerHost
         * @description Server host implementation
         */
        $$('sealed');
        $$('ns', 'flair.app');
        Class('ServerHost', Host, function() {
            let mountedApps = {},
                httpServer = null,
                httpsServer = null,
                httpSettings = settings.express['server-http'],
                httpsSettings = settings.express['server-https'];         
            
            $$('override');
            this.construct = (base) => {
                base('Express', '4.x');
            };
        
            this.app = {
                get: () => { return this.mounts['main'].app; },  // main express app
                set: noop
            };
            this.mounts = { // all mounted express apps
                get: () => { return mountedApps; },
                set: noop
            };
        
            $$('override');
            this.boot = async (base) => { // mount all express app and sub-apps
                base();
        
                const express = await include('express | x');
        
                const applySettings = (mountName, mount) => {
                    // app settings
                    // each item is: { name: '', value:  }
                    // name: as in above link (as-is)
                    // value: as defined in above link
                    let appSettings = settings[`${mountName}-appSettings`];
                    if (appSettings && appSettings.length > 0) {
                        for(let appSetting of appSettings) {
                            mount.set(appSetting.name, appSetting.value);
                        }
                    }            
                };
        
                // create main app instance of express
                let mainApp = express();
                applySettings('main', mainApp);
        
                // create one instance of express app for each mounted path
                let mountPath = '',
                    mount = null;
                for(let mountName of Object.keys(settings.routing.mounts)) {
                    if (mountName === 'main') {
                        mountPath = '/';
                        mount = mainApp;
                    } else {
                        mountPath = settings.routing.mounts[mountName];
                        mount = express(); // create a sub-app
                    }
        
                    // attach
                    mountedApps[mountName] = Object.freeze({
                        name: mountName,
                        root: mountPath,
                        app: mount
                    });
        
                    // apply settings and attach to main app
                    if (mountName !== 'main') {
                        applySettings(mountName, mount);
                        mainApp.use(mountPath, mount); // mount sub-app on given root path                
                    }
                }
        
                // store
                mountedApps = Object.freeze(mountedApps);        
            };
        
            $$('override');
            this.start = async (base) => { // configure express http and https server
                base();
        
                const fs = await include('fs | x');
                const http = await include('http | x');
                const https = await include('https | x');
                const httpShutdown = await include('http-shutdown | x');    
        
                // configure http server
                if (httpSettings.enable) { 
                    httpServer = http.createServer(this.app);
                    httpServer = httpShutdown(httpServer); // wrap
                    httpServer.on('error', (err) => {
                        this.error(err);
                    }); // pass-through event
                    if (httpSettings.timeout !== -1) { httpServer.timeout = httpSettings.timeout; } // timeout must be in milliseconds
                }
        
                // configure httpS server
                if (httpsSettings.enable) { 
                    // SSL Certificate
                    // NOTE: For creating test certificate:
                    //  > Goto http://www.cert-depot.com/
                    //  > Create another test certificate
                    //  > Download KEY+PEM files
                    //  > Rename *.private.pem as key.pem
                    //  > Rename *.public.pem as cert.pem
                    //  > Update these files at private folder
                    const privateKey  = fs.readFileSync(AppDomain.resolvePath(httpsSettings.privateKey), 'utf8');
                    const publicCert = fs.readFileSync(AppDomain.resolvePath(httpsSettings.publicCert), 'utf8');
                    const credentials = { key: privateKey, cert: publicCert };
        
                    httpsServer = https.createServer(credentials, this.app);
                    httpsServer = httpShutdown(httpsServer); // wrap
                    httpsServer.on('error', (err) => {
                        this.error(err);
                    }); // pass-through event
                    if (httpsSettings.timeout !== -1) { httpsServer.timeout = httpsSettings.timeout; } // timeout must be in milliseconds
                }
            };
        
            $$('override');
            this.ready = (base) => { // start listening express http and https servers
                return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
                    base();
        
                    // start server
                    let httpPort = httpSettings.port || 80,
                        httpsPort = process.env.PORT || httpsSettings.port || 443;
                    if (httpServer && httpsServer) {
                        httpServer.listen(httpPort, () => {
                            httpsServer.listen(httpsPort, () => {
                                console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version} (http: ${httpPort}, https: ${httpsPort})`); // eslint-disable-line no-console
                                resolve();
                            });
                        });
                    } else if (httpServer) {
                        httpServer.listen(httpPort, () => {
                            console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version} (http: ${httpPort})`); // eslint-disable-line no-console
                            resolve();
                        });
                    } else if (httpsServer) {
                        httpsServer.listen(httpsPort, () => {
                            console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version} (https: ${httpsPort})`); // eslint-disable-line no-console
                            resolve();
                        });
                    } else {
                        console.log(`${AppDomain.app().info.name}, v${AppDomain.app().info.version}`); // eslint-disable-line no-console
                        resolve();
                    }
                });
            };
        
            $$('override');
            this.stop = async (base) => { // graceful shutdown express http and https servers
                base();
        
                // stop http server gracefully
                if (httpServer) {
                    console.log('http server is shutting down...'); // eslint-disable-line no-console
                    httpServer.shutdown(() => {
                        httpServer = null;
                        console.log('http server is cleanly shutdown!'); // eslint-disable-line no-console
                    });
                }
        
                // stop https server gracefully
                if (httpsServer) {
                    console.log('https server is shutting down...'); // eslint-disable-line no-console
                    httpsServer.shutdown(() => {
                        httpsServer = null;
                        console.log('https server is cleanly shutdown!'); // eslint-disable-line no-console
                    });
                }
            }; 
        
            $$('override');
            this.dispose = (base) => {
                base();
        
                mountedApps = null;
            };
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.boot/ClientRouter.js
        const { Bootware } = ns('flair.app');
        
        /**
         * @name ClientRouter
         * @description Client Router Configuration Setup
         */
        $$('sealed');
        $$('ns', 'flair.boot');
        Class('ClientRouter', Bootware, function () {
            const { ViewHandler, ViewInterceptor } = ns('flair.ui');
        
            let routes = null;
            
            $$('override');
            this.construct = (base) => {
                base('Client Router', true); // mount specific 
            };
        
            $$('override');
            this.boot = async (base, mount) => {
                base();
                
                // get all registered routes, and sort by index, if was not already done in previous call
                if (!routes) {
                    routes = AppDomain.context.current().allRoutes(true);
                    routes.sort((a, b) => {
                        if (a.index < b.index) {
                            return -1;
                        }
                        if (a.index > b.index) {
                            return 1;
                        }
                        return 0;
                    });
                }
        
                const runInterceptor = (IC, ctx) => {
                    return new Promise((resolve, reject) => {
                        try {
                            let aic = new IC();
                            aic.run(ctx).then(() => {
                                if (ctx.$stop) {
                                    reject();
                                } else {
                                    resolve();
                                }
                            }).catch(reject);
                        } catch (err) {
                            reject(err);
                        }
                    });
                };
                const runInterceptors = (interceptors, ctx) => {
                    return forEachAsync(interceptors, (resolve, reject, ic) => {
                        include(ic).then((theType) => {
                            let RequiredICType = as(theType, ViewInterceptor);
                            if (RequiredICType) {
                                runInterceptor(RequiredICType, ctx).then(resolve).catch(reject);
                            } else {
                                reject(Exception.InvalidDefinition(`Invalid interceptor type. (${ic})`));
                            }
                        }).catch(reject);
                    });
                };
        
                // add routes related to current mount
                let verb = 'view'; // only view verb is supported on client
                for (let route of routes) {
                    if (route.mount === mount.name) { // add route-handler
                        // NOTE: verbs are ignored for client routing, only 'view' verb is processed
                        mount.app(route.path, (ctx) => { // mount.app = page object/func
                            const onError = (err) => {
                                AppDomain.host().raiseError(err);
                            };
                            const onRedirect = (url) => {
                                mount.app.redirect(url);
                            };
                            const handleRoute = () => {
                                include(route.handler).then((theType) => {
                                    let RouteHandler = as(theType, ViewHandler);
                                    if (RouteHandler) {
                                        try {
                                            using(new RouteHandler(), (routeHandler) => {
                                                // ctx.params has all the route parameters.
                                                // e.g., for route "/users/:userId/books/:bookId" ctx.params will 
                                                // have "ctx.params: { "userId": "34", "bookId": "8989" }"
                                                routeHandler[verb](ctx).then(() => {
                                                    ctx.handled = true;
                                                    if (ctx.$redirect) {
                                                        onRedirect(ctx.$redirect);
                                                    }
                                                }).catch(onError);
                                            });
                                        } catch (err) {
                                            onError(err);
                                        }
                                    } else {
                                        onError(Exception.InvalidDefinition(`Invalid route handler. (${route.handler})`));
                                    }
                                }).catch(onError);
                            };
        
                            // add special properties to context
                            ctx.$stop = false;
                            ctx.$redirect = '';
        
                            // run mount specific interceptors
                            // each interceptor is derived from ViewInterceptor and
                            // run method of it takes ctx, can update it
                            // each item is: "InterceptorTypeQualifiedName"
                            let mountInterceptors = settings[`${mount.name}-interceptors`] || [];
                            runInterceptors(mountInterceptors, ctx).then(() => {
                                if (!ctx.$stop) {
                                    handleRoute();
                                } else {
                                    ctx.handled = true;
                                    if (ctx.$redirect) {
                                        onRedirect(ctx.$redirect);
                                    }
                                }
                            }).catch((err) => {
                                if (ctx.$stop) { // reject might also be because of stop done by an interceptor
                                    ctx.handled = true;
                                    if (ctx.$redirect) {
                                        onRedirect(ctx.$redirect);
                                    }
                                } else {
                                    onError(err);
                                }
                            });
                        });
                    }
                }
        
                // catch 404 for this mount and forward to error handler
                mount.app("*", (ctx) => { // mount.app = page object/func
                    // redirect to 404 route, which has to be defined route
                    let url404 = settings.url['404'];
                    if (url404) {
                        ctx.handled = true;
                        if (ctx.pathname !== url404) { 
                            mount.app.redirect(url404);
                        } else { // when even 404 is not handled
                            // just mark as handled, and don't do anything
                        }
                    } else {
                        window.history.back(); // nothing else can be done
                    }
                });
            };
        });
    })();    
    await (async () => { // type: ./src/flair.app/flair.boot/DIContainer.js
        const { Bootware } = ns('flair.app');
        
        /**
         * @name DIContainer
         * @description Initialize DI Container
         */
        $$('sealed');
        $$('ns', 'flair.boot');
        Class('DIContainer', Bootware, function() {
            $$('override');
            this.construct = (base) => {
                base('DI Container');
            };
        
            $$('override');
            this.boot = async (base) => {
                base();
                
                let containerItems = settings.di.container;
                for(let alias in containerItems) {
                    if (containerItems.hasOwnProperty(alias)) {
                        Container.register(alias, containerItems[alias]);
                    }
                }
            };
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.boot/Middlewares.js
        const { Bootware } = ns('flair.app');
        
        /**
         * @name Middlewares
         * @description Express Middleware Configurator
         */
        $$('sealed');
        $$('ns', 'flair.boot');
        Class('Middlewares', Bootware, function() {
            $$('override');
            this.construct = (base) => {
                base('Express Middlewares', true); // mount specific
            };
        
            $$('override');
            this.boot = async (base, mount) => {
                base();
                
                // middleware information is defined at: https://expressjs.com/en/guide/using-middleware.html#middleware.application
                // each item is: { name: '', func: '', 'args': []  }
                // name: module name of the middleware, which can be required
                // func: if middleware has a function that needs to be called for configuration, empty if required object itself is a function
                // args: an array of args that need to be passed to this function or middleware function
                //       Note: In case a particular argument setting is a function - define the function code as an arrow function string with a 'return prefix' and it will be loaded as function
                //       E.g., setHeaders in https://expressjs.com/en/4x/api.html#express.static is a function
                //       define it as: "return (res, path, stat) => { res.set('x-timestamp', Date.now()) }"
                //       this string will be passed to new Function(...) and returned values will be used as value of option
                //       all object type arguments will be scanned for string values that start with 'return ' and will be tried to convert into a function
                let middlewares = settings[`${mount.name}-middlewares`];
                if (middlewares && middlewares.length > 0) {
                    let mod = null,
                        func = null;
                    for(let middleware of middlewares) {
                        if (middleware.name) {
                            try {
                                // get module
                                // it could be 'express' itself for inbuilt middlewares
                                mod = require(middleware.name);
        
                                // get func
                                if (middleware.func) {
                                    func = mod[middleware.func];
                                } else {
                                    func = mod;
                                }
        
                                // process args
                                let args = [],
                                    argValue = null;
                                middleware.args = middleware.args || [];
                                for (let arg of middleware.args) {
                                    if (typeof arg === 'string' && arg.startsWith('return ')) { // note a space after return
                                        argValue = new Function(arg)();
                                    } else if (typeof arg === 'object') {
                                        for(let prop in arg) {
                                            if (arg.hasOwnProperty(prop)) {
                                                argValue = arg[prop];
                                                if (typeof argValue === 'string' && argValue.startsWith('return ')) { // note a space after return
                                                    argValue = new Function(arg)();
                                                    arg[prop] = argValue;
                                                }
                                            }
                                        }
                                        argValue = arg;
                                    } else {
                                        argValue = arg;
                                    }
                                    args.push(argValue);
                                }
        
                                // add middleware
                                mount.app.use(func(...args));
                            } catch (err) {
                                throw Exception.OperationFailed(`Middleware ${middleware.module} load failed.`, err, this.boot);
                            }
                        }
                    }
                }
            };
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.boot/NodeEnv.js
        const { Bootware } = ns('flair.app');
        
        /**
         * @name NodeEnv
         * @description Node Environment Settings
         */
        $$('sealed');
        $$('ns', 'flair.boot');
        Class('NodeEnv', Bootware, function() {
            $$('override');
            this.construct = (base) => {
                base('Node Server Environment');
            };
        
            $$('override');
            this.boot = async (base) => {
                base();
        
                if (settings.envVars.vars.length > 0) {
                    const nodeEnv = await include('node-env-file | x');
        
                    if (nodeEnv) {
                        for(let envVar of settings.envVars.vars) {
                            nodeEnv(AppDomain.resolvePath(envVar), settings.envVars.options);
                        }
                    }
                }
            };
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.boot/ResHeaders.js
        const { Bootware } = ns('flair.app');
        
        /**
         * @name ResHeaders
         * @description Express Response Header Settings (Common to all routes)
         */
        $$('sealed');
        $$('ns', 'flair.boot');
        Class('ResHeaders', Bootware, function() {
            $$('override');
            this.construct = (base) => {
                base('Server Response Headers', true); // mount specific
            };
        
            $$('override');
            this.boot = async (base, mount) => {
                base();
                
                let resHeaders = settings[`${mount.name}-resHeaders`];
                if (resHeaders && resHeaders.length > 0) {
                    mount.app.use((req, res, next) => {
                        // each item is: { name: '', value:  }
                        // name: standard header name
                        // value: header value
                        for(let header of resHeaders) {
                            res.setHeader(header.name, header.value);
                        }
                        next();
                    });         
                }
            };
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.boot/ServerRouter.js
        const { Bootware } = ns('flair.app');
        
        /**
         * @name ServerRouter
         * @description Server Router Configuration Setup
         */
        $$('sealed');
        $$('ns', 'flair.boot');
        Class('ServerRouter', Bootware, function () {
            const { RestHandler, RestInterceptor } = ns('flair.api');
        
            let routes = null;
            
            $$('override');
            this.construct = (base) => {
                base('Server Router', true); // mount specific 
            };
        
            $$('override');
            this.boot = async (base, mount) => {
                base();
                
                // get all registered routes, and sort by index, if was not already done in previous call
                if (!routes) {
                    routes = AppDomain.context.current().allRoutes(true);
                    routes.sort((a, b) => {
                        if (a.index < b.index) {
                            return -1;
                        }
                        if (a.index > b.index) {
                            return 1;
                        }
                        return 0;
                    });
                }
        
                let result = false;
        
                const runInterceptor = (IC, req, res) => {
                    return new Promise((resolve, reject) => {
                        try {
                            let aic = new IC();
                            aic.run(req, res).then(() => {
                                if (req.$stop) {
                                    reject();
                                } else {
                                    resolve();
                                }
                            }).catch(reject);
                        } catch (err) {
                            reject(err);
                        }
                    });
                };
                const runInterceptors = (interceptors, req, res) => {
                    return forEachAsync(interceptors, (resolve, reject, ic) => {
                        include(ic).then((theType) => {
                            let RequiredICType = as(theType, RestInterceptor);
                            if (RequiredICType) {
                                runInterceptor(RequiredICType, req, res).then(resolve).catch(reject);
                            } else {
                                reject(Exception.InvalidDefinition(`Invalid interceptor type. (${ic})`));
                            }
                        }).catch(reject);
                    });
                };
               
                // add routes related to current mount
                for (let route of routes) {
                    if (route.mount === mount.name) { // add route-handler
                        route.verbs.forEach(verb => {
                            mount.app[verb](route.path, (req, res, next) => { // verb could be get/set/delete/put/, etc.
                                const onError = (err) => {
                                    next(err);
                                };
                                const onDone = (result) => {
                                    if (!result) {
                                        next();
                                    }
                                };
                                const handleRoute = () => {
                                    include(route.handler).then((theType) => {
                                        let RouteHandler = as(theType, RestHandler);
                                        if (RouteHandler) {
                                            try {
                                                using(new RouteHandler(), (routeHandler) => {
                                                    // req.params has all the route parameters.
                                                    // e.g., for route "/users/:userId/books/:bookId" req.params will 
                                                    // have "req.params: { "userId": "34", "bookId": "8989" }"
                                                    result = routeHandler[verb](req, res);
                                                    if (result && typeof result.then === 'function') {
                                                        result.then((delayedResult) => {
                                                            onDone(delayedResult);
                                                        }).catch(onError);
                                                    } else {
                                                        onDone(result);
                                                    }
                                                });
                                            } catch (err) {
                                                onError(err);
                                            }
                                        } else {
                                            onError(Exception.InvalidDefinition(`Invalid route handler. ${route.handler}`));
                                        }
                                    }).catch(onError);
                                };
        
                                // add special properties to req
                                req.$stop = false;
        
                                // run mount specific interceptors
                                // each interceptor is derived from RestInterceptor and
                                // run method of it takes req, can update it, also takes res method and can generate response, in case request is being stopped
                                // each item is: "InterceptorTypeQualifiedName"
                                let mountInterceptors = settings[`${mount.name}-interceptors`] || [];
                                runInterceptors(mountInterceptors, req, res).then(() => {
                                    if (!req.$stop) {
                                        handleRoute();
                                    } else {
                                        res.end();
                                    }
                                }).catch((err) => {
                                    if (req.stop) {
                                        res.end();
                                    } else {
                                        onError(err);
                                    }
                                });
                            });
                        });
                    }
                }
        
                // catch 404 for this mount and forward to error handler
                mount.app.use((req, res, next) => {
                    var err = new Error('Not Found');
                    err.status = 404;
                    next(err);
                });
        
                // dev/prod error handler
                if (env.isProd) {
                    mount.app.use((err, req, res) => {
                        res.status(err.status || 500);
                        if (req.xhr) {
                            res.status(500).send({
                                error: err.toString()
                            });
                        } else {
                            res.render('error', {
                                message: err.message,
                                error: err
                            });
                        }
                        res.end();
                    });
                } else {
                    mount.app.use((err, req, res) => {
                        res.status(err.status || 500);
                        if (req.xhr) {
                            res.status(500).send({
                                error: err.toString()
                            });
                        } else {
                            res.render('error', {
                                message: err.message,
                                error: err
                            });
                        }
                        res.end();
                    });
                }
            };
        });
    })();    
    await (async () => { // type: ./src/flair.app/flair.ui/ViewHandler.js
        const { Handler } = ns('flair.app');
        
        /**
         * @name ViewHandler
         * @description GUI View Handler
         */
        $$('ns', 'flair.ui');
        Class('ViewHandler', Handler, function() {
            let mainEl = '';
        
            $$('override');
            this.construct = (base, el, title, transition) => {
                base();
        
                mainEl = el || 'main';
                this.viewTransition = transition;
                this.title = this.title + (title ? ' - ' + title : '');
            };
        
            $$('privateSet');
            this.viewTransition = '';
        
            $$('protectedSet');
            this.name = '';
        
            $$('protectedSet');
            this.title = '';
        
            // each meta in array can be defined as:
            // { "<nameOfAttribute>": "<contentOfAttribute>", "<nameOfAttribute>": "<contentOfAttribute>", ... }
            $$('protectedSet');
            this.meta = null;
        
            this.view = async (ctx) => {
                const { ViewTransition } = ns('flair.ui');
        
                // give it a unique name, if not already given
                this.name = this.name || (this.$self.id + '_' + guid());
        
                // load view transition
                if (this.viewTransition) {
                    let ViewTransitionType = as(await include(this.viewTransition), ViewTransition);
                    if (ViewTransitionType) {
                        this.viewTransition = new ViewTransitionType();
                    } else {
                        this.viewTransition = '';
                    }
                }
        
                // add view el to parent
                let el = DOC.createElement('div'),
                    parentEl = DOC.getElementById(mainEl);
                el.id = this.name;
                el.setAttribute('hidden', '');
                parentEl.appendChild(el);
                
                // load view
                this.load(ctx, el);
        
                // swap views (old one is replaced with this new one)
                await this.swap();
            };
        
            $$('protected');
            $$('virtual');
            $$('async');
            this.loadView = noop;
        
            $$('private');
            this.swap = async () => {
                let thisViewEl = DOC.getElementById(this.name);
        
                // outgoing view
                if (this.$static.currentView) {
                    let currentViewEl = DOC.getElementById(this.$static.currentView);
        
                    // remove outgoing view meta   
                    for(let meta of this.meta) {
                        DOC.head.removeChild(DOC.querySelector('meta[name="' + meta + '"]'));
                    }
                        
                    // apply transitions
                    if (this.viewTransition) {
                        // leave outgoing, enter incoming
                        await this.viewTransition.leave(currentViewEl, thisViewEl);
                        await this.viewTransition.enter(thisViewEl, currentViewEl);
                    } else {
                        // default is no transition
                        currentViewEl.hidden = true;
                        thisViewEl.hidden = false;
                    }
        
                    // remove outgoing view
                    let parentEl = DOC.getElementById(mainEl);            
                    parentEl.removeChild(currentViewEl);
                }
        
                // add incoming view meta
                for(let meta of this.meta) {
                    var metaEl = document.createElement('meta');
                    for(let metaAttr in meta) {
                        metaEl[metaAttr] = meta[metaAttr];
                    }
                    DOC.head.appendChild(metaEl);
                }
        
                // in case there was no previous view
                if (!this.$static.currentView) {
                    thisViewEl.hidden = false;
                }
        
                // update title
                DOC.title = this.title;
        
                // set new current
                this.$static.currentView = this.name;
                this.$static.currentViewMeta = this.meta;
            };
        
            $$('static');
            this.currentView = '';
        
            $$('static');
            this.currentViewMeta = [];
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.ui/ViewInterceptor.js
        /**
         * @name ViewInterceptor
         * @description GUI View Interceptor
         */
        $$('ns', 'flair.ui');
        Class('ViewInterceptor', function() {
            $$('virtual');
            $$('async');
            this.run = noop;
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.ui/ViewState.js
        /**
         * @name ViewState
         * @description GUI View State Global Store
         */
        $$('singleton');
        $$('ns', 'flair.ui');
        Class('ViewState', function() {
            $$('state');
            $$('private');
            this.store = {};
        
            this.get = (path, name) => {
                path = path || ''; name = name || '';
                return this.store[path + '/' + name] || null;
            };
            this.set = (path, name, value) => {
                path = path || ''; name = name || '';
                if (typeof value !== 'boolean' && !value) {
                    delete this.store[path + '/' + name]; return;
                }
                this.store[path + '/' + name] = value;
            };
        
            this.clear = () => { this.store = null; }
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.ui/ViewTransition.js
        /**
         * @name ViewTransition
         * @description GUI View Transition
         */
        $$('ns', 'flair.ui');
        Class('ViewTransition', function() {
            $$('virtual');
            $$('async');
            this.enter = noop;
        
            $$('virtual');
            $$('async');
            this.leave = noop;
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.ui.vue/VueComponent.js
        const { VueComponentMembers } = ns('flair.ui.vue');
        
        /**
         * @name VueComponent
         * @description Vue Component
         */
        $$('ns', 'flair.ui.vue');
        Class('VueComponent', [VueComponentMembers], function() {
            this.factory = async () => {
                // shared between view and component both
                // coming from VueComponentMembers mixin
                let component = this.define();
        
                // props
                // https://vuejs.org/v2/guide/components-props.html
                // https://vuejs.org/v2/api/#props
                // these names can then be defined as attribute on component's html node
                if (this.props && Array.isArray(this.props)) {
                    component.props = this.props;
                }
        
                // data
                // https://vuejs.org/v2/api/#data
                if (this.data && typeof this.data === 'function') { 
                    component.data = this.data;
                }
        
                // name
                // https://vuejs.org/v2/api/#name
                if (this.name) {
                    component.name = this.name;
                }
        
                // model
                // https://vuejs.org/v2/api/#model
                if (this.model) {
                    component.model = this.model;
                }
        
                // inheritAttrs
                // https://vuejs.org/v2/api/#inheritAttrs
                if (typeof this.inheritAttrs === 'boolean') { 
                    component.inheritAttrs = this.inheritAttrs;
                }
        
                // done
                return component;
            };
        
            $$('protected');
            this.props = null;
        
            $$('protected');
            this.data = null;    
        
            $$('protected');
            this.model = null;    
        
            $$('protected');
            this.inheritAttrs = null;
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.ui.vue/VueDirective.js
        /**
         * @name VueDirective
         * @description Vue Directive
         */
        $$('ns', 'flair.ui.vue');
        Class('VueDirective', function() {
            $$('virtual');
            $$('async');
            this.factory = noop;
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.ui.vue/VueFilter.js
        /**
         * @name VueFilter
         * @description Vue Filter
         */
        $$('ns', 'flair.ui.vue');
        Class('VueFilter', function() {
            $$('virtual');
            $$('async');
            this.factory = noop;
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.ui.vue/VueLayout.js
        /**
         * @name VueLayout
         * @description Vue Layout
         */
        $$('ns', 'flair.ui.vue');
        Class('VueLayout', function() {
            $$('protected');
            this.html = '';
        
            $$('protected');
            this.style = '';
        
            // this is the "div-id" (in defined html) where actual view's html will come
            $$('protected');
            this.viewArea = 'view';
        
            // each area here can be as:
            // { "area: "", component": "", "type": "" } 
            // "area" is the div-id (in defined html) where the component needs to be placed
            // "component" is the name of the component
            // "type" is the qualified component type name
            $$('protectedSet');
            this.areas = [];
        
            this.merge = async (viewHtml) => {
                // get port
                let clientFileLoader = Port('clientFile');  
        
                // load style content in property
                if (this.style && this.style.endsWith('.css')) { // if style file is defined via $$('asset', '<fileName>');
                    this.style = await clientFileLoader(this.style);
                }
        
                // load html content in property
                if (this.html && this.html.endsWith('.html')) { // if html file is defined via $$('asset', '<fileName>');
                    this.html = await clientFileLoader(this.html);
                }
        
                // root
                let rootEl = DOC.createElement('div');
                if (this.style) {
                    let styleEl = DOC.createElement('style');
                    styleEl.innerHTML = this.style.trim();
                    styleEl.setAttribute('scoped', '');
                    rootEl.append(styleEl);
                } 
                if (this.html) {
                    let htmlEl = DOC.createElement('div');
                    htmlEl.innerHTML = this.html.trim();
                    rootEl.append(htmlEl);
                }
                
                // merge view area
                this.viewArea = this.viewArea || 'view'; // inbuilt default value
                let viewAreaEl = rootEl.content.getElementById(this.viewArea);
                if (viewAreaEl) { viewAreaEl.innerHTML = viewHtml; }
        
                // merge all other areas with component name placeholders
                // each area here can be as:
                // { "area: "", component": "", "type": "" } 
                // "area" is the div-id (in defined html) where the component needs to be placed
                // "component" is the name of the component
                // "type" is the qualified component type name         
                let areaEl = null;
                if (this.layout && this.layout.areas && Array.isArray(this.layout.areas)) {
                    for(let area of this.layout.areas) {
                        areaEl = rootEl.content.getElementById(area.area);
                        if (areaEl) { 
                            let componentEl = DOC.createElement('component');
                            componentEl.setAttribute('is', area.component);
                            areaEl.append(componentEl);
                        }
                    }
                }       
                
                // done
                return rootEl.innerHTML;
            };
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.ui.vue/VueMixin.js
        /**
         * @name VueMixin
         * @description Vue Mixin
         */
        $$('ns', 'flair.ui.vue');
        Class('VueMixin', function() {
            $$('virtual');
            $$('async');
            this.factory = noop;
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.ui.vue/VuePlugin.js
        /**
         * @name VuePlugin
         * @description Vue Plugin
         */
        $$('ns', 'flair.ui.vue');
        Class('VuePlugin', function() {
            this.construct = (name) => {
                // load options, if name and corresponding options are defined
                if (settings.vue.pluginOptions[name]) {
                    this.options = Object.assign({}, settings.vue.pluginOptions[name]); // keep a copy
                }
            };
        
            $$('virtual');
            $$('async');
            this.factory = noop;
        
            this.options = null;
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.ui.vue/VueSetup.js
        const { Bootware } = ns('flair.app');
        
        /**
         * @name VueSetup
         * @description Vue initializer
         */
        $$('ns', 'flair.ui.vue');
        Class('VueSetup', Bootware, function() {
            $$('override');
            this.construct = (base) => {
                base('Vue Setup');
            };
        
            $$('override');
            this.boot = async (base) => {
                base();
        
                const Vue = await include('vue/vue{.min}.js');
                const { VueComponent, VueFilter, VueDirective, VuePlugin, VueMixin } = ns('flair.ui.vue');
                
                // setup Vue configuration
                // TODO:
        
                // load Vue global plugins
                // each plugin in array is defined as:
                // { "name": "name", "type": "ns.typeName" }
                let plugins = settings.vue.plugins,
                    PluginType = null,
                    plugin = null;
                for(let item of plugins) {
                    if (!item.name) { throw Exception.OperationFailed(`Plugin name cannot be empty. (${item.type})`); }
                    if (!item.type) { throw Exception.OperationFailed(`Plugin type cannot be empty. (${item.name})`); }
        
                    PluginType = as(await include(item.type), VuePlugin);
                    if (PluginType) {
                        try {
                            plugin = new PluginType(item.name);
                            Vue.use(await plugin.factory(), plugin.options || {});
                        } catch (err) {
                            throw Exception.OperationFailed(`Plugin registration failed. (${item.type})`, err);
                        }
                    } else {
                        throw Exception.InvalidArgument(item.type);
                    }
                }  
        
                // load Vue global mixins
                // each mixin in array is defined as:
                // { "name": "name", "type": "ns.typeName" }
                let mixins = settings.vue.mixins,
                    MixinType = null,
                    mixin = null;
                for(let item of mixins) {
                    if (!item.name) { throw Exception.OperationFailed(`Mixin name cannot be empty. (${item.type})`); }
                    if (!item.type) { throw Exception.OperationFailed(`Mixin type cannot be empty. (${item.name})`); }
        
                    MixinType = as(await include(item.type), VueMixin);
                    if (MixinType) {
                        try {
                            mixin = new MixinType();
                            Vue.mixin(await mixin.factory());
                        } catch (err) {
                            throw Exception.OperationFailed(`Mixin registration failed. (${item.type})`, err);
                        }
                    } else {
                        throw Exception.InvalidArgument(item.type);
                    }
                }         
        
                // load Vue global directives
                // each directive in array is defined as:
                // { "name": "name", "type": "ns.typeName" }
                let directives = settings.vue.directives,
                    DirectiveType = null,
                    directive = null;
                for(let item of directives) {
                    if (!item.name) { throw Exception.OperationFailed(`Directive name cannot be empty. (${item.type})`); }
                    if (!item.type) { throw Exception.OperationFailed(`Directive type cannot be empty. (${item.name})`); }
        
                    DirectiveType = as(await include(item.type), VueDirective);
                    if (DirectiveType) {
                        try {
                            directive = new DirectiveType();
                            Vue.directive(item.name, await directive.factory());
                        } catch (err) {
                            throw Exception.OperationFailed(`Directive registration failed. (${item.type})`, err);
                        }
                    } else {
                        throw Exception.InvalidArgument(item.type);
                    }
                }         
        
                // load Vue global filters 
                // each filter in array is defined as:
                // { "name": "name", "type": "ns.typeName" }
                let filters = settings.vue.filters,
                    FilterType = null,
                    filter = null;
                for(let item of filters) {
                    if (!item.name) { throw Exception.OperationFailed(`Filter name cannot be empty. (${item.type})`); }
                    if (!item.type) { throw Exception.OperationFailed(`Filter type cannot be empty. (${item.name})`); }
                    FilterType = as(await include(item.type), VueFilter);
                    if (FilterType) {
                        try {
                            filter = new FilterType();
                            // TODO: prevent duplicate filter registration, as done for components
                            Vue.filter(item.name, await filter.factory());
                        } catch (err) {
                            throw Exception.OperationFailed(`Filter registration failed. (${item.type})`, err);
                        }
                    } else {
                        throw Exception.InvalidArgument(item.type);
                    }
                } 
        
                // register global components
                // each component in array is defined as:
                // { "name": "name", "type": "ns.typeName" }
                let components = settings.vue.components,
                    ComponentType = null,
                    component = null;
                for(let item of components) {
                    if (!item.name) { throw Exception.OperationFailed(`Component name cannot be empty. (${item.type})`); }
                    if (!item.type) { throw Exception.OperationFailed(`Component type cannot be empty. (${item.name})`); }
        
                    ComponentType = as(await include(item.name), VueComponent);
                    if (ComponentType) {
                        try {
                            component = new ComponentType();
        
                            // check for duplicate
                            if (Vue.options.components[item.name]) { throw Exception.Duplicate(`Component already registered. (${item.name})`); }
                        
                            // register globally
                            Vue.component(item.name, await component.factory());
                        } catch (err) {
                            throw Exception.OperationFailed(`Component registration failed. (${item.type})`, err);
                        }
                    } else {
                        throw Exception.InvalidArgument(item.type);
                    }
                }   
            };   
        });
        
    })();    
    await (async () => { // type: ./src/flair.app/flair.ui.vue/VueView.js
        const { ViewHandler } = ns('flair.ui');
        const { VueComponentMembers } = ns('flair.ui.vue');
        
        /**
         * @name VueView
         * @description Vue View
         */
        $$('ns', 'flair.ui.vue');
        Class('VueView', ViewHandler, [VueComponentMembers], function() {
            let isLoaded = false;
        
            $$('override');
            this.construct = (base) => {
                base(settings.view.el, settings.view.title, settings.view.transition);
            };
        
            $$('private');
            this.factory = async () => {
                // merge layout's components
                // each area here can be as:
                // { "area: "", component": "", "type": "" } 
                // "area" is the div-id (in defined html) where the component needs to be placed
                // "component" is the name of the component
                // "type" is the qualified component type name      
                if (this.layout && this.layout.areas && Array.isArray(this.layout.areas)) {
                    this.components = this.components || [];
                    for(let area of this.layout.areas) {
                        // each component arrat item is: { "name": "name", "type": "ns.typeName" }
                        this.components.push({ name: area.component, type: area.type });
                    }
                }
        
                // shared between view and component both
                // coming from VueComponentMembers mixin
                let component = this.define();
        
                // el
                // https://vuejs.org/v2/api/#el
                component.el = '#' + this.name;
        
                // propsData
                // https://vuejs.org/v2/api/#propsData
                if (this.propsData) {
                    component.propsData = this.propsData;
                }
        
                // data
                // https://vuejs.org/v2/api/#data
                if (this.data && typeof this.data !== 'function') {
                    component.data = this.data;
                }
        
                // merge view and view' layout's template
                if (this.layout) {
                    component.template = await this.layout.merge(component.template);
                }
        
                // done
                return component;
            };    
            
            $$('protected');
            $$('override');
            $$('sealed');
            this.loadView = async (base, ctx, el) => {
                if (!isLoaded) {
                    isLoaded = true;
                    base();
        
                    const Vue = await include('vue/vue{.min}.js');
        
                    // custom load op
                    await this.load(ctx, el);
        
                    // setup Vue view instance
                    new Vue(await this.factory());
                }
            };
        
            $$('protected');
            $$('virtual');
            $$('async');
            this.load = noop;
        
            $$('protected');
            this.el = null;
        
            $$('protected');
            this.propsData = null;
        
            $$('protected');
            this.data = null;
        
            $$('protected');
            this.layout = null;
        });
        
    })();
    // assembly types (end)
    
    // assembly embedded resources (start)
    // (not defined)
    // assembly embedded resources (end)        
    
    // clear assembly being loaded
    AppDomain.context.current().currentAssemblyBeingLoaded('');

    // register assembly definition object
    AppDomain.registerAdo('{"name":"flair.app","file":"./flair.app{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.6.6","lupdate":"Sat, 11 May 2019 03:36:59 GMT","builder":{"name":"flairBuild","version":"1","format":"fasm","formatVersion":"1","contains":["init","func","type","vars","reso","asst","rout","sreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.app.Bootware","flair.app.Handler","flair.app.App","flair.app.Host","flair.ui.vue.VueComponentMembers","flair.api.RestHandler","flair.api.RestInterceptor","flair.app.BootEngine","flair.app.ClientHost","flair.app.ServerHost","flair.boot.ClientRouter","flair.boot.DIContainer","flair.boot.Middlewares","flair.boot.NodeEnv","flair.boot.ResHeaders","flair.boot.ServerRouter","flair.ui.ViewHandler","flair.ui.ViewInterceptor","flair.ui.ViewState","flair.ui.ViewTransition","flair.ui.vue.VueComponent","flair.ui.vue.VueDirective","flair.ui.vue.VueFilter","flair.ui.vue.VueLayout","flair.ui.vue.VueMixin","flair.ui.vue.VuePlugin","flair.ui.vue.VueSetup","flair.ui.vue.VueView"],"resources":[],"assets":[],"routes":[{"name":"flair.ui.vue.test2","mount":"main","index":101,"verbs":[],"path":"test/:id","handler":"abc.xyz.Test"},{"name":"flair.ui.vue.exit2","mount":"main","index":103,"verbs":[],"path":"exit","handler":"abc.xyz.Exit"}]}');

    // assembly load complete
    if (typeof onLoadComplete === 'function') { 
        onLoadComplete();   // eslint-disable-line no-undef
    }
});