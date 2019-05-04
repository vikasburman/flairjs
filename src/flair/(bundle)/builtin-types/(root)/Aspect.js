/**
 * @name Aspect
 * @description Aspect base class.
 */
$$('abstract');
$$('ns', '(root)');
Class('Aspect', function() {
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
    $$('virtual');
    this.before = nim;

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
    $$('virtual');
    this.around = nim;

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
    $$('virtual');
    this.after = nim;
});
