const { IDisposable, ILifeCycleHandler, Bootware, LifeCycleHandler } = ns();

/**
 * @name ClientHost
 * @description Client host base class
 */
$$('ns', '(auto)');
Class('(auto)', Bootware, [LifeCycleHandler, ILifeCycleHandler, IDisposable], function() {
    $$('virtual');
    this.dispose = noop;
});
