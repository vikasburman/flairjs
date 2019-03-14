/**
 * @name BootHandler 
 * @description Bootware functions
 */
$$('ns', '(auto)');
Mixin('(auto)', function() {
    $$('virtual');
    $$('async');
    this.boot = noop;

    $$('virtual');
    $$('async');
    this.ready = noop;
});
