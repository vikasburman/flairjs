const Vue = await include('vue/vue{.min}.js');
const { ViewState } = ns('flair.ui');
const { VueFilter, VueMixin, VueDirective } = ns('flair.ui.vue');

/**
 * @name VueComponentMembers
 * @description Vue Component Members
 */
$$('ns', '(auto)');
Mixin('(auto)', function() {
    $$('private');
    this.define = async () => {
        let component = {},
            viewState = new ViewState();

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
                component.template = '<div><style scoped>' + this.style.trim() +'</style></div><div>' + this.html.trim() + '</div>';
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
