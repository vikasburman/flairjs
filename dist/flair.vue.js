/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.vue
 *     File: ./flair.vue.js
 *  Version: 0.51.64
 *  Mon, 06 May 2019 13:50:07 GMT
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
        root['flair.vue'] = factory;
    }
})(this, async function() {
    'use strict';
    
    // assembly closure init (start)
    /* eslint-disable no-unused-vars */
    
    // flair object
    const flair = (typeof global !== 'undefined' ? require('flairjs') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));
    
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
    const __currentFile = (env.isServer ? __filename : window.document.currentScript.src.replace(window.document.location.href, './'));
    const __currentPath = __currentFile.substr(0, __currentFile.lastIndexOf('/') + 1);
    AppDomain.loadPathOf('flair.vue', __currentPath);

    // settings of this assembly
    let settings = JSON.parse('{}');
    let settingsReader = flair.Port('settingsReader');
    if (typeof settingsReader === 'function') {
        let externalSettings = settingsReader('flair.vue');
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
    AppDomain.context.current().currentAssemblyBeingLoaded('./flair.vue{.min}.js');

    // assembly types (start)
    
    await (async () => { // type: ./src/flair.vue/flair.ui.vue/@1-VueComponentMembers.js
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
                for(let item in this.components) {
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
                for(let item in this.mixins) {
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
                for(let item in this.directives) {
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
                for(let item in this.filters) {
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
    
    await (async () => { // type: ./src/flair.vue/flair.ui.vue/VueSetup.js
    const { Bootware } = ns('flair.app');
    const Vue = await include('vue/vue{.min}.js');
    const { VueComponent, VueFilter, VueDirective, VuePlugin, VueMixin } = ns('flair.ui.vue');
    
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
            
            // setup Vue configuration
            // TODO:
    
            // load Vue global plugins
            // each plugin in array is defined as:
            // { "name": "name", "type": "ns.typeName" }
            let plugins = settings.plugins,
                PluginType = null,
                plugin = null;
            for(let item in plugins) {
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
            for(let item in mixins) {
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
            for(let item in directives) {
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
            for(let item in filters) {
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
            for(let item in components) {
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
    
    await (async () => { // type: ./src/flair.vue/flair.ui.vue/VueView.js
    const { ViewHandler } = ns('flair.ui');
    const { VueComponentMembers } = ns('flair.ui.vue');
    const Vue = await include('vue/vue{.min}.js');
    
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
    AppDomain.registerAdo('{"name":"flair.vue","file":"./flair.vue{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.51.64","lupdate":"Mon, 06 May 2019 13:50:07 GMT","builder":{"name":"flairBuild","version":"1","format":"fasm","formatVersion":"1","contains":["init","func","type","vars","reso","asst","rout","sreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.ui.vue.VueComponentMembers","flair.ui.vue.VueComponent","flair.ui.vue.VueDirective","flair.ui.vue.VueFilter","flair.ui.vue.VueLayout","flair.ui.vue.VueMixin","flair.ui.vue.VuePlugin","flair.ui.vue.VueSetup","flair.ui.vue.VueView"],"resources":[],"assets":[],"routes":[{"name":"flair.ui.vue.test2","mount":"main","index":101,"verbs":[],"path":"test/:id","handler":"abc.xyz.Test"},{"name":"flair.ui.vue.exit2","mount":"main","index":103,"verbs":[],"path":"exit","handler":"abc.xyz.Exit"}]}');

    // assembly load complete
    if (typeof onLoadComplete === 'function') { 
        onLoadComplete();   // eslint-disable-line no-undef
    } 
});