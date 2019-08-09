/**
 * @name Attribute
 * @description Attribute base class.
 */
$$('abstract');
$$('ns', '(auto)');
Class('(auto)', function() {
    $$('virtual');
    this.construct = (...args) => {
        this.args = Object.freeze(args);
    };

   /** 
    *  @name args: array - arguments as defined where attribute is applied e.g., ('text', 012, false, Reference)
    */
    $$('readonly');
    this.args = [];

   /** 
    *  @name constraints: string - An expression that defined the constraints of applying this attribute 
    *                     using NAMES, PREFIXES, SUFFIXES and logical Javascript operator
    * 
    *                  NAMES can be: 
    *                      type names: class, struct, enum, interface, mixin
    *                      type member names: prop, func, construct, dispose, event
    *                      inbuilt modifier names: static, abstract, sealed, virtual, override, private, protected, readonly, async, etc.
    *                      inbuilt attribute names: promise, singleton, serialize, deprecate, session, state, conditional, noserialize, etc.
    *                      custom attribute names: any registered custom attribute name
    *                      type names itself: e.g., Aspect, Attribute, etc. (any registered type name is fine)
    *                          SUFFIX: A typename must have a suffix (^) e.g., Aspect^, Attribute^, etc. Otherwise this name will be treated as custom attribute name
    *                  
    *                  PREFIXES can be:
    *                      No Prefix: means it must match or be present at the level where it is being defined
    *                      @: means it must be inherited from or present at up in hierarchy chain
    *                      $: means it either must ne present at the level where it is being defined or must be present up in hierarchy chain
    *                  <name> 
    *                  @<name>
    *                  $<name>
    * 
    *                  BOOLEAN Not (!) can also be used to negate:
    *                  !<name>
    *                  !@<name>
    *                  !$<name>
    *                  
    *                  NOTE: Constraints are processed as logical boolean expressions and 
    *                        can be grouped, ANDed or ORed as:
    * 
    *                        AND: <name1> && <name2> && ...
    *                        OR: <name1> || <name2>
    *                        GROUPING: ((<name1> || <name2>) && (<name1> || <name2>))
    *                                  (((<name1> || <name2>) && (<name1> || <name2>)) || <name3>)
    * 
    **/
    $$('readonly');
    this.constraints = '';

    /** 
     * @name decorateProperty
     * @description Property decorator
     * @example
     *  decorateProperty(typeName, memberName, member)
     * @arguments
     *  typeName: string - typeName
     *  memberName: string - member name
     *  member - object - having get: getter function and set: setter function
     *          both getter and setter can be applied attribute functionality on
     * @returns
     *  object - having decorated { get: fn, set: fn }
     *           Note: decorated get must call member's get
     *                 decorated set must accept value argument and pass it to member's set with or without processing
     */  
    $$('virtual');
    this.decorateProperty = nim;

    /** 
     * @name decorateFunction
     * @description Function decorator
     * @example
     *  decorateFunction(typeName, memberName, member)
     * @arguments
     *  typeName: string - typeName
     *  memberName: string - member name
     *  member - function - function to decorate
     * @returns
     *  function - decorated function
     *             Note: decorated function must accept ...args and pass-it on (with/without processing) to member function
     */  
    $$('virtual');
    this.decorateFunction = nim;    

    /** 
     * @name decorateEvent
     * @description Event decorator
     * @example
     *  decorateEvent(typeName, memberName, member)
     * @arguments
     *  typeName: string - typeName
     *  memberName: string - member name
     *  member - function - event argument processor function
     * @returns
     *  function - decorated function
     *             Note: decorated function must accept ...args and pass-it on (with/without processing) to member function
     */  
    $$('virtual');
    this.decorateEvent = nim;
});

