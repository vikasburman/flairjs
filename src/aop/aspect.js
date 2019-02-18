/**
 * @name Aspect
 * @description Aspect base class.
 */
_$$('abstract');
_Class('.Aspect', function() { // registered at root namespace (can be get as: getType('Aspect'))
    /** 
     * @name before
     * @description Before advise
     * @example
     *  before(ctx)
     * @arguments
     * ctx: object - context object that is shared across all weavings
     *  typeName()      - gives the name of the type
     *  funcName()      - gives the name of the function
     *  error(err)      - store new error to context, or just call error() to get last error
     *  result(value)   - store new result to context, or just call result() to get last stored result
     *  args()          - get original args passed to main call
     *  data: {}        - an object to hold context data for temporary use, e.g., storing something in before advise and reading back in after advise
     */  
    _$$('virtual');
    this.before = this.noop;

    /** 
     * @name around
     * @description Around advise
     * @example
     *  around(ctx, fn)
     * @arguments
     * ctx: object - context object that is shared across all weavings
     *  typeName()      - gives the name of the type
     *  funcName()      - gives the name of the function
     *  error(err)      - store new error to context, or just call error() to get last error
     *  result(value)   - store new result to context, or just call result() to get last stored result
     *  args()          - get original args passed to main call
     *  data: {}        - an object to hold context data for temporary use, e.g., storing something in before advise and reading back in after advise
     * fn: function - function which is wrapped, it should be called in between pre and post actions
     */  
    _$$('virtual');
    this.around = this.noop;

    /** 
     * @name after
     * @description After advise
     * @example
     *  after(ctx)
     * @arguments
     * ctx: object - context object that is shared across all weavings
     *  typeName()      - gives the name of the type
     *  funcName()      - gives the name of the function
     *  error(err)      - store new error to context, or just call error() to get last error
     *  result(value)   - store new result to context, or just call result() to get last stored result
     *  args()          - get original args passed to main call
     *  data: {}        - an object to hold context data for temporary use, e.g., storing something in before advise and reading back in after advise
     */  
    _$$('virtual');
    this.after = this.noop;
});
