/**
 * @name IBootware
 * @description IBootware interface
 */
$$('ns', '(auto)');
Interface('(auto)', function() {
    // boot - async
    this.boot = nim;

    // ready - async
    this.ready = nim;
});
