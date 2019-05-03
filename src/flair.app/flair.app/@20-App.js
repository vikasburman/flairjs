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
    this.start = async () => {
        // initialize view state
        if (!env.isServer && !env.isWorker) {
            const { ViewState } = ns('flair.ui');
            new ViewState(); // this initializes the global view state store's persistance via this singleton object
        }
    };

    $$('virtual');
    this.stop = async () => {
        // clear view state
        if (!env.isServer && !env.isWorker) {
            const { ViewState } = ns('flair.ui');
            new ViewState().clear();
        }
    };

    $$('virtual');
    this.onError = (e) => {
        throw Exception.OperationFailed(e.error, this.onError);
    };

    $$('override');
    this.dispose = () => {
        AppDomain.host().error.remove(this.onError); // remove error handler
    };
});
