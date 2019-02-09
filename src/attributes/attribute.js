// Attribute
flair.Attribute = flair.Class('Attribute', function(attr) {
    let decoratorFn = null;
    
    attr('abstract'); // for Attribute type
    this.construct((...args) => {
        // args can be static or dynamic or settings
        // static ones are defined just as is, e.g.,
        //  ('text', 012, false, Reference)
        // dynamic ones are defined as special string
        //  ('[publicPropOrFuncName]', 012, false, Reference)
        // when string is defined as '[...]', this argument is replaced by a 
        // function which can be called (with binded this) to get dynamic value of the argument
        // the publicPropName is the name of a public property or function
        // name of the same object where this attribute is applied
        // settings ones are defined as another special string
        this.args = [];
        for(let arg of args) {
            if (typeof arg === 'string') {
                if (arg.startsWith('[') && arg.endsWith(']')) {
                    let fnName = arg.replace('[', '').replace(']', ''),
                        fn = function() {
                            let member = this[fnName]; // 'this' would change because of binding call when this function is called
                            if (typeof member === 'function') {
                                return member();
                            } else {
                                return member;
                            }
                        };
                        this.args.push(fn);
                } else {
                    this.args.push(arg);
                }
            } else {
                this.args.push(arg);
            }
        }
    });
    
   /** 
    *  constraints: string - An expression that defined the constraints of applying this attribute 
    *                        using NAMES, PREFIXES, SUFFIXES and logical Javascript operator
    * 
    *                  NAMES can be: 
    *                      type names: class, struct, enum, interface, mixin, resource
    *                      type member names: prop, func, construct, dispose, event
    *                      inbuilt modifier names: static, abstract, sealed, virtual, override, private, protected, readonly, async
    *                      inbuilt attribute names: promise, singleton, serialize, deprecate, session, state, conditional, noserialize
    *                      custom attribute names: any registered custom attribute name
    *                      type names itself: e.g., Assembly, Attribute, etc. (any registered type name is fine)
    *                          SUFFIX: A typename must have a suffix (^) e.g., Assembly^, Attribute^, etc. Otherwise this name will be treated as custom attribute name
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
    this.func('constraints', ''); 
    this.prop('args', []);
    this.func('decorate', (fn) => {
        if (typeof fn === 'function') {
            decoratorFn = fn;
        }
        return decoratorFn;
    });

    // TODO: following cannot be name of any custom attributes
    // _supportedMembers = ['prop', 'func', 'construct', 'dispose', 'event'],
    // _supportedTypes = ['class', 'struct', 'enum', 'interface', 'mixin', 'resource'],
    // _supportedModifiers = ['static', 'abstract', 'sealed', 'virtual', 'override', 'private', 'protected', 'readonly', 'async'],


    // TODO: how to decorate prop, func, evebt seperately
    this.func('resetEventInterface', (source, target) => {
        // TODO: this should be outside somewhere when applying attribute to the member
        target.subscribe = source.subscribe;
        target.unsubscribe = source.unsubscribe;
        delete source.subscribe;
        delete source.unsubscribe;
    });
});
