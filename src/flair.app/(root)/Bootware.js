/**
 * @name Bootware
 * @description Bootware base class
 */
$$('abstract');
$$('ns', '(auto)');
Class('(auto)', function() {
    /**  
     * @name construct
     * @arguments
     *  name: string - name of the bootware
     *  version: string - version number of the bootware
    */
    $$('virtual');
    this.construct = (name, version, isMountSpecific) => {
        let args = Args('name: string, version: string',
                        'name: string, version: string, isMountSpecific: boolean',
                        'name: string, isMountSpecific: boolean',
                        'name: string')(name, version, isMountSpecific); args.throwOnError(this.construct);

        // set info
        this.info = Object.freeze({
            name: args.name || '',
            version: args.version || '',
            isMountSpecific: args.isMountSpecific || false
        });
    };

    /**  
     * @name boot
     * @arguments
     *  mount: object - mount object
    */
    $$('virtual');
    $$('async');
    this.boot = noop;

    $$('readonly');
    this.info = null;

    /**  
     * @name ready
     * @arguments
     *  mount: object - mount object
    */
    $$('virtual');
    $$('async');
    this.ready = noop;
});
