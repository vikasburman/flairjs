const { ViewHandler } = ns('flair.ui');
const { VueComponentMembers } = ns('flair.ui.vue');
const Vue = await include('vue/vue{.min}.js');

/**
 * @name VueView
 * @description Vue View
 */
$$('ns', '(auto)');
Class('(auto)', ViewHandler, [VueComponentMembers], function() {
    let isLoaded = false;

    $$('override');
    this.construct = (base) => {
        base(settings.el, settings.title, settings.viewTransition);
    };

    $$('private');
    this.factory = async () => {
        // shared between view and component both
        // coming from VueComponentMembers mixin
        let component = this.define(component);

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

        // done
        return component;
    };    
    
    $$('protected');
    $$('override');
    $$('sealed');
    this.loadView = async (ctx, el) => {
        if (!isLoaded) {
            isLoaded = true;

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
});
