/**
 * @name Test
 * @description testing platform base class.
 */
$$('ns', '(auto)');
Class('(auto)', function() {
    $$('resource', 'hello');
    this.resProp = null;

    $$('asset', './ab/index.html');
    this.astProp = null;
});
