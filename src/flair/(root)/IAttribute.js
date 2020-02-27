/**
 * @type Attribute definition
 * @remarks
 *  TODO:
 * @example
 *  TODO: example
 */
Interface('', function() {
    /** 
    * @prop {string} name - Name of the custom attribute
    */    
    this.name = nip;

    /** 
    * @prop {string} constraints - An expression that defined the constraints of applying this attribute 
    * @remarks
    *   Using NAMES, SUFFIXES, PREFIXES, and logical Javascript operator
    * 
    *   NAMES can be: 
    *       type names: class, struct, enum, interface, mixin
    *       type member names: prop, func, construct, dispose, event
    *       inbuilt modifier names: static, abstract, sealed, virtual, override, private, protected, readonly, async, etc.
    *       inbuilt attribute names: promise, singleton, serialize, deprecate, session, state, conditional, noserialize, etc.
    *       custom attribute names: any registered custom attribute name
    *       type names itself: e.g., Aspect, Attribute, etc. (any registered type name is fine)
    * 
    *  SUFFIX: A typename must have a suffix (^) e.g., Aspect^, Attribute^, etc. Otherwise this name will be treated as custom attribute name
    *                  
    *  PREFIXES can be:
    *       No Prefix: means it must match or be present at the level where it is being defined
    *       @: means it must be inherited from or present at up in hierarchy chain
    *       $: means it either must ne present at the level where it is being defined or must be present up in hierarchy chain
    *          <name> | @<name> | $<name>
    *          BOOLEAN Not (!) can also be used to negate:
    *          !<name> | !@<name> | !$<name>
    *                  
    *  NOTE: Constraints are processed as logical boolean expressions and can be grouped, ANDed or ORed as:
    *        AND: <name1> && <name2> && ...
    *        OR: <name1> || <name2>
    *        GROUPING: ((<name1> || <name2>) && (<name1> || <name2>))
    *                  (((<name1> || <name2>) && (<name1> || <name2>)) || <name3>)
    */          
    this.constraints = nip;

    /** 
     * @func decorateProperty - Property decorator
     * @param {string} typeName - Name of the type
     * @param {string} memberName - Name of the member
     * @param {object} member - Member descriptor's getter, setter functions
     * @returns {object} Returns decorated getter, setter functions
     * @optional
     * @remarks
     *  Decorated get must call member's get function and decorated set must accept `value` argument and pass it to member's set with or without processing
     * @example
     *  decorateProperty(typeName, memberName, member)
     */     
     this.decorateProperty_ = nim; 

    /** 
     * @func decorateFunction - Function decorator
     * @param {string} typeName - Name of the type
     * @param {string} memberName - Name of the member
     * @param {function} member - Member function to decorate
     * @returns {function} Returns decorated function
     * @optional
     * @deprecated hshshs
     * @remarks
     *  TODO: decorated function must accept ...args and pass-it on (with/without processing) to member function
     * @example
     *  decorateFunction(typeName, memberName, member)
     */  
    this.decorateFunction_ = nim;

    /** 
     * @func decorateEvent - Event decorator
     * @param {string} typeName - Name of the type
     * @param {string} memberName - Name of the member
     * @param {function} member - Event argument processor function
     * @returns {function} Returns decorated function
     * @optional
     * @remarks
     *  TODO: decorated function must accept ...args and pass-it on (with/without processing) to member function
     * @example
     *  decorateEvent(typeName, memberName, member)
     */  
    this.decorateEvent_ = nim;
});
