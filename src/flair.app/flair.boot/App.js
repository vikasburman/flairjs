const { IDisposable, Bootware, LifeCycleHandler } = ns();

/**
 * @name App
 * @description App base class
 */
$$('ns', '(auto)');
Class('(auto)', Bootware, [LifeCycleHandler, IDisposable], function() {
    $$('override');
    this.construct = (base) => {
        // set info
        let asm = getAssembly(this);
        base(asm.title, asm.version);
    };

    $$('virtual');
    this.dispose = noop;

    $$('virtual');
    this.onError = (err) => {
        throw Exception.OperationFailed(err, this.onError);
    };
});
