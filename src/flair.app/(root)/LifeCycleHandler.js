
/**
 * @name LifeCycleHandler 
 * @description LifeCycleHandler Mixin
 */
$$('ns', '(auto)');
Mixin('(auto)', function() {
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
    this.dispose = noop;    
});
