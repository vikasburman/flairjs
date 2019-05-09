/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.client
 *     File: ./flair.client.js
 *  Version: 0.52.32
 *  Thu, 09 May 2019 03:24:47 GMT
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
        root['flair.client'] = factory;
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
            b64EncodeUnicode, b64DecodeUnicode } = flair.utils;
    
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
    AppDomain.loadPathOf('flair.client', __currentPath);
    
    // settings of this assembly
    let settings = JSON.parse('{"el":"main","title":"","viewTransition":"","components":[],"filters":[],"mixins":[],"directives":[],"plugins":[],"pluginOptions":{},"url":{"404":"/404","home":"/"},"mounts":{"main":"/"},"main-options":[],"main-interceptors":[]}');
    let settingsReader = flair.Port('settingsReader');
    if (typeof settingsReader === 'function') {
    let externalSettings = settingsReader('flair.client');
    if (externalSettings) { settings = Object.assign(settings, externalSettings); }
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
    AppDomain.context.current().currentAssemblyBeingLoaded('./flair.client{.min}.js');
    
    // assembly types (start)
        
    await (async () => { // type: ./src/flair.client/flair.ui/@10-ViewTransition.js
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
    await (async () => { // type: ./src/flair.client/flair.ui/@20-ViewState.js
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
    await (async () => { // type: ./src/flair.client/flair.ui/@30-ViewHandler.js
        const { Handler } = ns('flair.app');
        const { ViewTransition } = ns('flair.ui');
        
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
    await (async () => { // type: ./src/flair.client/flair.ui/@30-ViewInterceptor.js
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
    await (async () => { // type: ./src/flair.client/flair.ui.vue/@90-VueDirective.js
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
    await (async () => { // type: ./src/flair.client/flair.ui.vue/@90-VueFilter.js
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
    await (async () => { // type: ./src/flair.client/flair.ui.vue/@90-VueLayout.js
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
    await (async () => { // type: ./src/flair.client/flair.ui.vue/@90-VueMixin.js
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
    await (async () => { // type: ./src/flair.client/flair.ui.vue/@90-VuePlugin.js
        /**
         * @name VuePlugin
         * @description Vue Plugin
         */
        $$('ns', 'flair.ui.vue');
        Class('VuePlugin', function() {
            this.construct = (name) => {
                // load options, if name and corresponding options are defined
                if (settings.pluginOptions[name]) {
                    this.options = Object.assign({}, settings.pluginOptions[name]); // keep a copy
                }
            };
        
            $$('virtual');
            $$('async');
            this.factory = noop;
        
            this.options = null;
        });
        
    })();    
    await (async () => { // type: ./src/flair.client/flair.ui.vue/@100-VueComponentMembers.js
        const Vue = await include('vue/vue{.min}.js');
        const { ViewState } = ns('flair.ui');
        const { VueFilter, VueMixin, VueDirective } = ns('flair.ui.vue');
        
        /**
         * @name VueComponentMembers
         * @description Vue Component Members
         */
        $$('ns', 'flair.ui.vue');
        Mixin('VueComponentMembers', function() {
            $$('private');
            this.define = async () => {
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
                    const { VueComponent } = ns('flair.ui.vue');
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
    await (async () => { // type: ./src/flair.client/flair.ui.vue/@110-VueComponent.js
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
    await (async () => { // type: ./src/flair.client/flair.ui.vue/@200-VueSetup.js
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
                
                // get Vue objects
                const Vue = await include('vue/vue{.min}.js');
                const { VueComponent, VueFilter, VueDirective, VuePlugin, VueMixin } = ns('flair.ui.vue');
                
                // setup Vue configuration
                // TODO:
        
                // load Vue global plugins
                // each plugin in array is defined as:
                // { "name": "name", "type": "ns.typeName" }
                let plugins = settings.plugins,
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
                let mixins = settings.mixins,
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
                let directives = settings.directives,
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
                let filters = settings.filters,
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
                let components = settings.components,
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
    await (async () => { // type: ./src/flair.client/flair.ui.vue/@200-VueView.js
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
                base(settings.el, settings.title, settings.viewTransition);
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
        
                    // get Vue object
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
    await (async () => { // type: ./src/flair.client/flair.app/ClientHost.js
        const { Host } = ns('flair.app');
        const page = await include('page/page{.min}.js', 'page');
        
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
        
            $$('override');
            this.boot = async (base) => { // mount all page app and pseudo sub-apps
                base();
        
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
                for(let mountName of Object.keys(settings.mounts)) {
                    if (mountName === 'main') {
                        mountPath = '/';
                        mount = mainApp;
                    } else {
                        appOptions = getOptions(mountName);
                        mountPath = settings.mounts[mountName];
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
                    let path = window.location.hash;
                    if (path.substr(0, 3) === '#!/') { path = path.substr(3); }
                    if (path.substr(0, 2) === '#!') { path = path.substr(2); }
                    if (path.substr(0, 2) === '#/') { path = path.substr(2); }
                    if (path.substr(0, 1) === '#') { path = path.substr(1); }
                    
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
    await (async () => { // type: ./src/flair.client/flair.boot/ClientRouter.js
        const { Bootware } = ns('flair.app');
        const { ViewHandler, ViewInterceptor } = ns('flair.ui');
        
        /**
         * @name ClientRouter
         * @description Client Router Configuration Setup
         */
        $$('sealed');
        $$('ns', 'flair.boot');
        Class('ClientRouter', Bootware, function () {
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
    // assembly types (end)
    
    // assembly embedded resources (start)
    // (not defined)
    // assembly embedded resources (end)        
    
    // clear assembly being loaded
    AppDomain.context.current().currentAssemblyBeingLoaded('');

    // register assembly definition object
    AppDomain.registerAdo('{"name":"flair.client","file":"./flair.client{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.52.32","lupdate":"Thu, 09 May 2019 03:24:47 GMT","builder":{"name":"flairBuild","version":"1","format":"fasm","formatVersion":"1","contains":["init","func","type","vars","reso","asst","rout","sreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.ui.ViewTransition","flair.ui.ViewState","flair.ui.ViewHandler","flair.ui.ViewInterceptor","flair.ui.vue.VueDirective","flair.ui.vue.VueFilter","flair.ui.vue.VueLayout","flair.ui.vue.VueMixin","flair.ui.vue.VuePlugin","flair.ui.vue.VueComponentMembers","flair.ui.vue.VueComponent","flair.ui.vue.VueSetup","flair.ui.vue.VueView","flair.app.ClientHost","flair.boot.ClientRouter"],"resources":[],"assets":[],"routes":[{"name":"flair.ui.vue.test2","mount":"main","index":101,"verbs":[],"path":"test/:id","handler":"abc.xyz.Test"},{"name":"flair.ui.vue.exit2","mount":"main","index":103,"verbs":[],"path":"exit","handler":"abc.xyz.Exit"}]}');

    // assembly load complete
    if (typeof onLoadComplete === 'function') { 
        onLoadComplete();   // eslint-disable-line no-undef
    }
});