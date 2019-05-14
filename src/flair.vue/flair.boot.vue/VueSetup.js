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
