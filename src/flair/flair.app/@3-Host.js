const { IDisposable } = ns();
const { Bootware } = ns('flair.app');

/**
 * @name App
 * @description App base class
 */
$$('ns', '(auto)');
Class('(auto)', Bootware, [IDisposable], function() {
    $$('privateSet');
    this.isStarted = false;

    $$('virtual');
    this.start = async () => {
        this.isStarted = true;
    };

    $$('virtual');
    this.stop = async () => {
        this.isStarted = false;
    };

    this.restart = async () => {
        await this.stop();
        await this.start();
    };

    this.error = event((err) => {
        return { error: err };
    });
    
    this.raiseError = (err) => {
        this.error(err);
    };
});
