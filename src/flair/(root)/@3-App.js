const { IDisposable } = ns();
const { Bootware } = ns('flair.boot');

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

    $$('virtual');
    this.start = async () => {
        this.isStarted = true;
    };

    $$('virtual');
    this.stop = async () => {
        this.isStarted = false;
    };

    $$('privateSet');
    $$('type', 'boolean');
    this.isStarted = false;

    this.restart = async () => {
        await this.stop();
        await this.start();
    };

    $$('virtual');
    this.onError = (err) => {
        throw Exception.OperationFailed(err, this.onError);
    };

    $$('virtual');
    this.dispose = noop;   
});
