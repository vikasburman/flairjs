/**
 * @name LifecycleHandler 
 * @description LifecycleHandle functions
 */
$$('ns', '(auto)');
Mixin('(auto)', function() {
    $$('virtual');
    $$('async');
    this.start = noop;

    $$('virtual');
    $$('async');
    this.stop = noop;

    this.restart = async () => {
        await this.stop();
        await this.start();
    };
});
