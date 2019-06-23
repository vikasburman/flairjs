const { ViewHandler } = ns('flair.ui');
const { VueComponentMembers } = ns('flair.ui.vue');

/**
 * @name VueView
 * @description Vue View
 */
$$('ns', '(auto)');
Class('(auto)', ViewHandler, [VueComponentMembers], function() {
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
