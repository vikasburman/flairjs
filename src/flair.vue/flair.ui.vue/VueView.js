const { ViewHandler } = ns('flair.ui');
const { VueComponentMembers } = ns('flair.ui.vue');

/**
 * @name VueView
 * @description Vue View
 */
$$('ns', '(auto)');
Class('(auto)', ViewHandler, [VueComponentMembers], function() {
    let isLoaded = false;

    $$('override');
    this.construct = (base) => {
        base(settings.client.view.el, settings.client.view.title, settings.client.view.transition);
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
