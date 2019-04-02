const { Handler } = ns('flair.app');

/**
 * @name ViewHandler
 * @description GUI View Handler
 */
$$('ns', '(auto)');
Class('(auto)', Handler, function() {
    $$('virtual');
    this.view = noop;
});
