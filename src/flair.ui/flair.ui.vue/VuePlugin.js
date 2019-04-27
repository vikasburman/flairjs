/**
 * @name VuePlugin
 * @description Vue Plugin
 */
$$('ns', '(auto)');
Class('(auto)', function() {
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
