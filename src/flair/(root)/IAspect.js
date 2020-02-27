/**
 * @type Aspect definition
 * @remarks
 *  TODO: define the before and after relationship for achieving around 
 *  TODO: explain structure and usage of ctx object
 */
Interface('', function() {
    /** 
     * @func before - Before advise
     * @param {object} ctx - Context object that is shared across weaving
     * @static
     */  
    this.before_ = nim;

    /** 
     * @func after - After advise
     * @param {object} ctx - Context object that is shared across weaving
     * @optional
     */  
    this.after_ = nim;
});
