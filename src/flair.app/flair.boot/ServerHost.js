const { IDisposable, ILifeCycleHandler, Bootware, LifeCycleHandler } = ns();

/**
 * @name ServerHost
 * @description Server host base class
 */
$$('ns', '(auto)');
Class('(auto)', Bootware, [LifeCycleHandler, ILifeCycleHandler, IDisposable], function() {
    $$('virtual');
    this.dispose = noop;
});
