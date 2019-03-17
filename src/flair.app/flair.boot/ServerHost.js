const { IDisposable, Bootware, LifeCycleHandler } = ns();

/**
 * @name ServerHost
 * @description Server host base class
 */
$$('ns', '(auto)');
Class('(auto)', Bootware, [LifeCycleHandler, IDisposable], function() {
    $$('virtual');
    this.dispose = noop;
});
