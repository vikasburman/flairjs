const { VueComponent } = ns('flair.ui.vue');
const Vue = await include('vue/vue{.min}.js');

/**
 * @name VueView
 * @description Vue View
 */
$$('ns', '(auto)');
Class('(auto)', VueComponent, function() {
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
