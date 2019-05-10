/**
 * @name VuePlugin
 * @description Vue Plugin
 */
$$('ns', '(auto)');
Class('(auto)', function() {
    this.construct = (name) => {
        // load options, if name and corresponding options are defined
        if (settings.vue.pluginOptions[name]) {
            this.options = Object.assign({}, settings.vue.pluginOptions[name]); // keep a copy
        }
    };

    $$('virtual');
    $$('async');
    this.factory = noop;

    this.options = null;
});
