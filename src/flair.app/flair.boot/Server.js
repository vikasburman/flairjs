const { IDisposable, ILifecycleHandle, LifecycleHandler } = ns();
const { Bootware } = ns('flair.boot');

/**
 * @name Server
 * @description Server base class
 */
$$('ns', '(auto)');
Class('(auto)', Bootware, [IDisposable, ILifecycleHandle, LifecycleHandler], function() {
    $$('virtual');
    this.construct = noop;

    $$('virtual');
    this.dispose = noop;
});
