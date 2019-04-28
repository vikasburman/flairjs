/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.ui
 *     File: ./flair.ui.js
 *  Version: 0.30.93
 *  Sun, 28 Apr 2019 17:40:01 GMT
 * 
 * (c) 2017-2019 Vikas Burman
 * Licensed under MIT
 */
(() => {
'use strict';

/* eslint-disable no-unused-vars */
const flair = (typeof global !== 'undefined' ? require('flairjs') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));
const { Class, Struct, Enum, Interface, Mixin, Aspects, AppDomain, $$, attr, bring, Container, include, Port, on, post, telemetry,
				Reflector, Serializer, Tasks, as, is, isComplies, isDerivedFrom, isAbstract, isSealed, isStatic, isSingleton, isDeprecated,
				isImplements, isInstanceOf, isMixed, getAssembly, getAttr, getContext, getResource, getRoute, getType, ns, getTypeOf,
				getTypeName, typeOf, dispose, using, Args, Exception, noop, nip, nim, nie, event } = flair;
const { TaskInfo } = flair.Tasks;
const { env } = flair.options;
const DOC = (env.isServer ? null : window.document);
const { forEachAsync, replaceAll, splitAndTrim, findIndexByProp, findItemByProp, which, guid, isArrowFunc, isASyncFunc, sieve,
				b64EncodeUnicode, b64DecodeUnicode } = flair.utils;
const { $$static, $$abstract, $$virtual, $$override, $$sealed, $$private, $$privateSet, $$protected, $$protectedSet, $$readonly, $$async,
				$$overload, $$enumerate, $$dispose, $$post, $$on, $$timer, $$type, $$args, $$inject, $$resource, $$asset, $$singleton, $$serialize,
				$$deprecate, $$session, $$state, $$conditional, $$noserialize, $$ns } = $$;

// define current context name
const __currentContextName = AppDomain.context.current().name;

// define loadPathOf this assembly
let __currentFile = (env.isServer ? __filename : window.document.currentScript.src.replace(window.document.location.href, './'));
let __currentPath = __currentFile.substr(0, __currentFile.lastIndexOf('/') + 1);
AppDomain.loadPathOf('flair.ui', __currentPath)

// assembly level error handler
const __asmError = (err) => { AppDomain.onError(err); };
/* eslint-enable no-unused-vars */

//load assembly settings from config file
let settings = JSON.parse('{"el":"main","title":"","viewTransition":"","components":[],"transitions":[],"filters":[],"mixins":[],"plugins":[],"pluginOptions":{}}'); // eslint-disable-line no-unused-vars
let settingsReader = flair.Port('settingsReader');
if (typeof settingsReader === 'function') {
let externalSettings = settingsReader('flair.ui');
if (externalSettings) { settings = Object.assign(settings, externalSettings); }}
settings = Object.freeze(settings);
AppDomain.context.current().currentAssemblyBeingLoaded('./flair.ui{.min}.js');

(async () => { // ./src/flair.ui/flair.ui.vue/VueComponent.js
try{
const { ViewHandler } = ns('flair.ui');

/**
 * @name VueComponent
 * @description Vue Component
 */
$$('ns', 'flair.ui.vue');
Class('VueComponent', ViewHandler, function() {
    $$('override');
    this.construct = (base) => {
        base(settings.el, settings.title, settings.viewTransition);
    };

    this.factory = (el) => {
       let component = {};

        // el OR template
        if (el) { // this is a view
            component.el = '#' + el; // its always id
        } else { // this is a component
            if (this.style) {
                component.template = '<div><style scoped>' + this.style.trim() +'</style></div><div>' + this.html.trim() + '</div>';
            } else {
                component.template = this.html.trim();
            }
        }

        // TODO: rest all properties



        // done
        return component;
    };

    $$('protected');
    this.inheritAttrs = true;

    $$('protected');
    this.functional = false;

    $$('protected');
    this.model = null;

    $$('protected');
    this.data = null;

    $$('protected');
    this.template = null;

    $$('protected');
    this.props = null;

    $$('protected');
    this.computed = null;

    $$('protected');
    this.methods = null;

    $$('protected');
    this.watch = null;

    // each component in array is defined as:
    // { "name": "name", "type": "ns.typeName" }
    $$('protected');
    this.components = null;

    $$('protected');
    this.mixins = null;

    $$('protected');
    this.transitions = null;

    $$('protected');
    this.handlers = null;   

    $$('protected');
    this.filters = null;
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.ui/flair.ui.vue/VueFilter.js
try{
/**
 * @name VueFilter
 * @description Vue Filter
 */
$$('ns', 'flair.ui.vue');
Class('VueFilter', function() {
    $$('virtual');
    this.factory = noop;
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.ui/flair.ui.vue/VueMixin.js
try{
/**
 * @name VueMixin
 * @description Vue Mixin
 */
$$('ns', 'flair.ui.vue');
Class('VueMixin', function() {
    $$('virtual');
    this.factory = noop;
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.ui/flair.ui.vue/VuePlugin.js
try{
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
    this.factory = noop;

    this.options = null;
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.ui/flair.ui.vue/VueSetup.js
try{
const { Bootware } = ns('flair.app');
const Vue = await include('vue/vue{.min}.js');
const { VueComponent, VueFilter, VuePlugin, VueMixin, VueTransition } = ns('flair.ui.vue');

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
    this.boot = async () => {
        // setup Vue configuration
        // TODO:

        // load Vue plugins
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
                    Vue.use(plugin.factory(), plugin.options || {});
                } catch (err) {
                    throw Exception.OperationFailed(`Plugin registration failed. (${item.type})`, err);
                }
            } else {
                throw Exception.InvalidArgument(item.type);
            }
        }  

        // load Vue mixins
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
                    Vue.mixin(mixin.factory());
                } catch (err) {
                    throw Exception.OperationFailed(`Mixin registration failed. (${item.type})`, err);
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
                    Vue.filter(item.name, filter.factory());
                } catch (err) {
                    throw Exception.OperationFailed(`Filter registration failed. (${item.type})`, err);
                }
            } else {
                throw Exception.InvalidArgument(item.type);
            }
        } 

        // load Vue transitions
        // each transition in array is defined as:
        // { "name": "name", "type": "ns.typeName" }
        let transitions = settings.transitions,
            TransitionType = null,
            transition = null;
        for(let item in transitions) {
            if (!item.name) { throw Exception.OperationFailed(`Transition name cannot be empty. (${item.type})`); }
            if (!item.type) { throw Exception.OperationFailed(`Transition type cannot be empty. (${item.name})`); }

            TransitionType = as(await include(item.type), VueTransition);
            if (TransitionType) {
                try {
                    transition = new TransitionType();
                    Vue.transition(item.name, transition.factory());
                } catch (err) {
                    throw Exception.OperationFailed(`Mixin registration failed. (${item.type})`, err);
                }
            } else {
                throw Exception.InvalidArgument(item.type);
            }
        }         

        // register components
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
                
                    // initialize
                    await component.init();
                
                    // register globally
                    Vue.component(item.name, component.factory());
                    dispose(component); // component is IDisposable
                } catch (err) {
                    throw Exception.OperationFailed(`Component registration failed. (${item.type})`, err);
                }
            } else {
                throw Exception.InvalidArgument(item.type);
            }
        }   
    };   
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.ui/flair.ui.vue/VueTransition.js
try{
/**
 * @name VueTransition
 * @description Vue Transition
 */
$$('ns', 'flair.ui.vue');
Class('VueTransition', function() {
    $$('virtual');
    this.factory = noop;
});
} catch(err) {
	__asmError(err);
}
})();

(async () => { // ./src/flair.ui/flair.ui.vue/VueView.js
try{
const { VueComponent } = ns('flair.ui.vue');
const Vue = await include('vue/vue{.min}.js');

/**
 * @name VueView
 * @description Vue View
 */
$$('ns', 'flair.ui.vue');
Class('VueView', VueComponent, function() {
    $$('protected');
    $$('override');
    $$('sealed');
    this.loadView = async (ctx, el) => {
        // load view context
        await this.loadContext(ctx, el);

        // load view
        new Vue(this.factory(this.name));
    };

    $$('protected');
    $$('virtual');
    $$('async');
    this.loadContext = noop;
});
} catch(err) {
	__asmError(err);
}
})();

AppDomain.context.current().currentAssemblyBeingLoaded('');

AppDomain.registerAdo('{"name":"flair.ui","file":"./flair.ui{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.30.93","lupdate":"Sun, 28 Apr 2019 17:40:01 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","types","enclosureVars","enclosedTypes","resources","assets","routes","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.ui.vue.VueComponent","flair.ui.vue.VueFilter","flair.ui.vue.VueMixin","flair.ui.vue.VuePlugin","flair.ui.vue.VueSetup","flair.ui.vue.VueTransition","flair.ui.vue.VueView"],"resources":[],"assets":[],"routes":[{"name":"flair.ui.vue.test2","mount":"main","index":101,"verbs":[],"path":"test/:id","handler":"abc.xyz.Test"},{"name":"flair.ui.vue.exit2","mount":"main","index":103,"verbs":[],"path":"exit","handler":"abc.xyz.Exit"}]}');

})();
