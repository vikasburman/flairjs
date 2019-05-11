const { Bootware } = ns('flair.app');

/**
 * @name VueSetup
 * @description Vue initializer
 */
$$('ns', '(auto)');
Class('(auto)', Bootware, function() {
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
