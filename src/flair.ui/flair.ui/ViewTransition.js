/**
 * @name ViewTransition
 * @description GUI View Transition
 */
$$('ns', '(auto)');
Class('(auto)', function() {
    $$('virtual');
    $$('async');
    this.enter = noop;

    $$('virtual');
    $$('async');
    this.leave = noop;
});
