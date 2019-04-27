const { VueComponent } = ns('flair.ui.vue');
const Vue = await include('vue/vue{.min}.js');

/**
 * @name VueView
 * @description Vue View
 */
$$('ns', '(auto)');
Class('(auto)', VueComponent, function() {
    $$('override');
    $$('sealed');
    this.view = async (ctx) => {
        // initialize
        await this.init();

        // load context
        await this.loadContext(ctx);

        // mount view html
        this.mount();

        // setup view
        new Vue(this.factory(this.name));

        // swap views (old one is replaced with this new one)
        await this.swap();
    };

    $$('protected');
    $$('virtual');
    $$('async');
    this.loadContext = noop;
});
