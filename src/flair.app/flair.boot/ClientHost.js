const { IDisposable, Bootware, LifeCycleHandler } = ns();

/**
 * @name ClientHost
 * @description Client host base class
 */
$$('ns', '(auto)');
Class('(auto)', Bootware, [LifeCycleHandler, IDisposable], function() {
    $$('virtual');
    this.dispose = noop;
});
