const { IDisposable } = ns();
const { Bootware } = ns('flair.app');

/**
 * @name App
 * @description App base class
 */
$$('ns', '(auto)');
Class('(auto)', Bootware, [IDisposable], function() {
    $$('override');
    this.construct = (base) => {
        // set info
        let asm = getAssembly(this);
        base(asm.title, asm.version);
    };
    
    $$('override');
    this.boot = async (base) => {
        base();
        AppDomain.host().error.add(this.onError); // host's errors are handled here
    };

    $$('virtual');
    $$('async');
    this.start = noop;

    $$('virtual');
    $$('async');
    this.stop = noop;

    $$('virtual');
    this.onError = (e) => {
        throw Exception.OperationFailed(e.error, this.onError);
    };

    $$('virtual');
    this.dispose = () => {
        AppDomain.host().error.remove(this.onError); // remove error handler
    };
});
