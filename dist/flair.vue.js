/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.vue
 *     File: ./flair.vue.js
 *  Version: 0.8.82
 *  Sun, 23 Jun 2019 23:32:57 GMT
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
    } else { // expose as global on root
        root['flair.vue'] = factory;
    }
})(this, async function(flair, __asmFile) {
    'use strict';

    // assembly closure init (start)
    /* eslint-disable no-unused-vars */
    
    // flair types, variables and functions
    const { Class, Struct, Enum, Interface, Mixin, Aspects, AppDomain, $$, attr, bring, Container, include, Port, on, post, telemetry,
            Reflector, Serializer, Tasks, as, is, isComplies, isDerivedFrom, isAbstract, isSealed, isStatic, isSingleton, isDeprecated,
            isImplements, isInstanceOf, isMixed, getAssembly, getAttr, getContext, getResource, getRoute, getType, ns, getTypeOf,
            getTypeName, typeOf, dispose, using, Args, Exception, noop, nip, nim, nie, event } = flair;
    const { TaskInfo } = flair.Tasks;
    const { env } = flair.options;
    const { guid, forEachAsync, replaceAll, splitAndTrim, findIndexByProp, findItemByProp, which, isArrowFunc, isASyncFunc, sieve,
            deepMerge, getLoadedScript, b64EncodeUnicode, b64DecodeUnicode } = flair.utils;
    
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
    AppDomain.loadPathOf('flair.vue', __currentPath);
    
    // settings of this assembly
    let settings = JSON.parse('{"extensions":[]}');
    let settingsReader = flair.Port('settingsReader');
    if (typeof settingsReader === 'function') {
        let externalSettings = settingsReader('flair.vue');
        if (externalSettings) { settings = deepMerge([settings, externalSettings], false); }
    }
    settings = Object.freeze(settings);
    
    // config of this assembly
    let config = JSON.parse('{}');
    config = Object.freeze(config);
    
    /* eslint-enable no-unused-vars */
    // assembly closure init (end)
    
    // assembly global functions (start)
    // (not defined)
    // assembly global functions (end)
    
    // set assembly being loaded
    AppDomain.context.current().currentAssemblyBeingLoaded('./flair.vue{.min}.js');
    
    // assembly types (start)
        
    await (async () => { // type: ./src/flair.vue/flair.ui.vue/@1-VueComponentMembers.js
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
        
                // merge html and style
                if (this.html && this.style) { // merge style as scoped style
                    this.html = '<div><style scoped>' + this.style.trim() +'</style>' + this.html.trim() + '</div>';
                } else if (this.style) {
                    this.html = '<div><style scoped>' + this.style.trim() +'</style></div>';
                }
        
                // local i18n resources
                // each i18n resource file is defined as:
                // "ns": "json-file-name"
                // when loaded, each ns will convert into JSON object from defined file
                if(this.i18n) {
                    let i18ResFile = '';
                    for(let i18nNs in this.i18n) {
                        if (this.i18n.hasOwnProperty(i18nNs)) {
                            i18ResFile = this.$Type.getAssembly().getLocaleFilePath(this.locale(), this.i18n[i18nNs]);
                            this.i18n[i18nNs] = await clientFileLoader(i18ResFile); // this will load defined json file as json object here
                        }
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
                // e.g., {{ path('abc/:xyz', { xyz: 1}) }} will give: '/#/en/abc/1'
                component.methods = component.methods || {};
                component.methods['path'] = (path, params) => { return _this.path(path, params); };
        
                // supporting built-in method: route
                // this helps in using path from route settings itself
                // e.g., {{ route('home') }} will give: '/#/en/'
                component.methods = component.methods || {};
                component.methods['route'] = (routeName, params) => { return _this.route(routeName, params); };
        
                // i18n specific built-in methods
                if (this.i18n) {
                    // supporting built-in method: locale 
                    // e.g., {{ locale() }} will give: 'en'
                    component.methods['locale'] = (value) => { return _this.locale(value); };
        
                    // supporting built-in method: i18n 
                    // e.g., {{ i18n('shared', 'OK', 'Ok!') }} will give: 'Ok' if this was the translation added in shared.json::OK key
                    component.methods['i18n'] = (ns, key, defaultValue) => {  
                        if (env.isDebug && defaultValue) { defaultValue = ':' + defaultValue + ':'; } // so it becomes visible that this is default value and string is not found
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
                        componentObj = null;
                    for(let item of this.components) {
                        if (!item.name) { throw Exception.OperationFailed(`Component name cannot be empty. (${item.type})`); }
                        if (!item.type) { throw Exception.OperationFailed(`Component type cannot be empty. (${item.name})`); }
        
                        // check for duplicate (global)
                        if (Vue.options.components[item.name]) { throw Exception.Duplicate(`Component already registered. (${item.name})`); }
                        
                        ComponentType = as(await include(item.type), VueComponent);
                        if (ComponentType) {
                            try {
                                componentObj = new ComponentType();
        
                                // check for duplicate (local)
                                if (component.components && component.components[item.name]) { throw Exception.Duplicate(`Component already registered. (${item.name})`); }
        
                                // register locally
                                component.components = component.components || {};
                                component.components[item.name] = await componentObj.factory();
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
            this.path = (path, params) => { return AppDomain.host().pathToUrl(path, params); }
            
            $$('protected');
            this.route = (routeName, params) => { return AppDomain.host().routeToUrl(routeName, params); }
        
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
    await (async () => { // type: ./src/flair.vue/flair.boot.vue/VueSetup.js
        const { Bootware } = ns('flair.app');
        
        /**
         * @name VueSetup
         * @description Vue initializer
         */
        $$('ns', 'flair.boot.vue');
        Class('VueSetup', Bootware, function() {
            $$('override');
            this.construct = (base) => {
                base('Vue Setup');
            };
        
            $$('override');
            this.boot = async (base) => {
                base();
        
                const Vue = await include('vue/vue{.min}.js');
                const { VueComponent, VueDirective, VueFilter, VueMixin, VuePlugin } = ns('flair.ui.vue');
                
                // setup Vue configuration, if any
                // TODO: (if any)
        
                // load Vue extensions
                // each plugin in array is defined as:
                // { "name": "name", "type": "ns.typeName", "options": {} }
                let extensions = settings.extensions,
                    ExtType = null,
                    ext = null;
                for (let item of extensions) {
                    if (!item.name) { throw Exception.OperationFailed(`Extension name cannot be empty. (${item.type})`); }
                    if (!item.type) { throw Exception.OperationFailed(`Extension type cannot be empty. (${item.name})`); }
                    
                    ExtType = await include(item.type);
                    if (as(ExtType, VueComponent)) {
                        try {
                            ext = new ExtType();
                            if (Vue.options.components[item.name]) { throw Exception.Duplicate(`Component already registered. (${item.name})`); } // check for duplicate
                            Vue.component(item.name, await ext.factory()); // register globally
                        } catch (err) {
                            throw Exception.OperationFailed(`Component registration failed. (${item.type})`, err);
                        }
                    } else if (as(ExtType, VueDirective)) {
                        try {
                            ext = new ExtType();
                            Vue.directive(item.name, await ext.factory()); // register globally
                        } catch (err) {
                            throw Exception.OperationFailed(`Directive registration failed. (${item.type})`, err);
                        }
                    } else if (as(ExtType, VueFilter)) {
                        try {
                            ext = new ExtType();
                            // TODO: prevent duplicate filter registration, as done for components
                            Vue.filter(item.name, await ext.factory());
                        } catch (err) {
                            throw Exception.OperationFailed(`Filter registration failed. (${item.type})`, err);
                        }                
                    } else if (as(ExtType, VueMixin)) {
                        try {
                            ext = new ExtType();
                            Vue.mixin(await ext.factory());
                        } catch (err) {
                            throw Exception.OperationFailed(`Mixin registration failed. (${item.type})`, err);
                        }
                    } else if (as(ExtType, VuePlugin)) {
                        try {
                            ext = new ExtType(item.name);
                            Vue.use(await ext.factory(), item.options || {});
                        } catch (err) {
                            throw Exception.OperationFailed(`Plugin registration failed. (${item.type})`, err);
                        }
                    } else {
                        throw Exception.InvalidArgument(item.type);
                    }
                }
            };   
        });
        
    })();    
    await (async () => { // type: ./src/flair.vue/flair.ui.vue/VueComponent.js
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
                let component = await this.define();
        
                // template
                // https://vuejs.org/v2/api/#template
                // built from html and css settings
                if (this.html) {
                    component.template = this.html.trim();
                }
        
                // props
                // https://vuejs.org/v2/guide/components-props.html
                // https://vuejs.org/v2/api/#props
                // these names can then be defined as attribute on component's html node
                if (this.props && Array.isArray(this.props)) {
                    component.props = this.props;
                }
        
                // data
                // https://vuejs.org/v2/api/#data
                if (this.data) { 
                    let _this = this;
                    if (typeof this.data === 'function') {
                        component.data = function() { return _this.data(); }
                    } else {
                        component.data = function() { return _this.data; }
                    }
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
        
            $$('protectedSet');
            this.name = '';
        
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
    await (async () => { // type: ./src/flair.vue/flair.ui.vue/VueDirective.js
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
    await (async () => { // type: ./src/flair.vue/flair.ui.vue/VueFilter.js
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
    await (async () => { // type: ./src/flair.vue/flair.ui.vue/VueLayout.js
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
            // "area" is the placeholder-text where the component needs to be placed
            // "area" placeholder can be defined as: [[area_name]]
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
        
                // merge html and style
                if (this.html && this.style) { // merge style as scoped style
                    this.html = '<div><style scoped>' + this.style.trim() +'</style>' + this.html.trim() + '</div>';
                } else if (this.style) {
                    this.html = '<div><style scoped>' + this.style.trim() +'</style></div>';
                }        
                
                // inject components
                let layoutHtml = this.html;
                if (this.areas && Array.isArray(this.areas)) {
                    for(let area of this.areas) {
                        layoutHtml = replaceAll(layoutHtml, `[[${area.area}]]`, `<component is="${area.component}"></component>`);
                    }
                }       
        
                // inject view 
                layoutHtml = layoutHtml.replace(`[[${this.viewArea}]]`, viewHtml);
        
                // done
                return layoutHtml;
            };
        });
        
    })();    
    await (async () => { // type: ./src/flair.vue/flair.ui.vue/VueMixin.js
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
    await (async () => { // type: ./src/flair.vue/flair.ui.vue/VuePlugin.js
        /**
         * @name VuePlugin
         * @description Vue Plugin
         */
        $$('ns', 'flair.ui.vue');
        Class('VuePlugin', function() {
            $$('virtual');
            $$('async');
            this.factory = noop;
        });
        
    })();    
    await (async () => { // type: ./src/flair.vue/flair.ui.vue/VueView.js
        const { ViewHandler } = ns('flair.ui');
        const { VueComponentMembers } = ns('flair.ui.vue');
        
        /**
         * @name VueView
         * @description Vue View
         */
        $$('ns', 'flair.ui.vue');
        Class('VueView', ViewHandler, [VueComponentMembers], function() {
            let isLoaded = false;
        
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
                        // each component array item is: { "name": "name", "type": "ns.typeName" }
                        this.components.push({ name: area.component, type: area.type });
                    }
                }
        
                // shared between view and component both
                // coming from VueComponentMembers mixin
                let component = await this.define();
        
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
                if (this.data) {
                    if (typeof this.data === 'function') {
                        component.data = this.data();
                    } else {
                        component.data = this.data;
                    }
                }
        
                // done
                return component;
            };    
            
            $$('protected');
            $$('override');
            $$('sealed');
            this.onView = async (base, ctx, el) => {
                if (!isLoaded) {
                    isLoaded = true;
                    base();
        
                    const Vue = await include('vue/vue{.min}.js');
        
                    // custom load op
                    await this.beforeLoad(ctx, el);            
        
                    // get component
                    let component = await this.factory();
        
                    // set view Html
                    let viewHtml = this.html || '';
                    if (this.layout) {
                        el.innerHTML = await this.layout.merge(viewHtml);
                    } else {
                        el.innerHTML = viewHtml;
                    }            
        
                    // custom load op
                    await this.afterLoad(ctx, el);
        
                    // setup Vue view instance
                    new Vue(component);
                }
            };
        
            $$('protected');
            $$('virtual');
            $$('async');
            this.beforeLoad = noop;
        
            $$('protected');
            $$('virtual');
            $$('async');
            this.afterLoad = noop;
        
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
    AppDomain.registerAdo('{"name":"flair.vue","file":"./flair.vue{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.8.82","lupdate":"Sun, 23 Jun 2019 23:32:57 GMT","builder":{"name":"flairBuild","version":"1","format":"fasm","formatVersion":"1","contains":["init","func","type","vars","reso","asst","rout","sreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.ui.vue.VueComponentMembers","flair.boot.vue.VueSetup","flair.ui.vue.VueComponent","flair.ui.vue.VueDirective","flair.ui.vue.VueFilter","flair.ui.vue.VueLayout","flair.ui.vue.VueMixin","flair.ui.vue.VuePlugin","flair.ui.vue.VueView"],"resources":[],"assets":[],"routes":[]}');
    
    // assembly load complete
    if (typeof onLoadComplete === 'function') { 
        onLoadComplete();   // eslint-disable-line no-undef
    }
    
    // return settings and config
    return Object.freeze({
        name: 'flair.vue',
        settings: settings,
        config: config
    });
});