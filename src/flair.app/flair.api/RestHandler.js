const { Handler } = ns('flair.app');

/**
 * @name RestHandler
 * @description Restful API Handler
 */
$$('ns', '(auto)');
Class('(auto)', Handler, function() {
    $$('virtual');
    this.get = noop;

    $$('virtual');
    this.post = noop;

    $$('virtual');
    this.put = noop;

    $$('virtual');
    this.delete = noop;
});
