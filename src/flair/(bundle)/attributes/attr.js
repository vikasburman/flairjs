/**
 * @name attr / $$
 * @description Decorator function to apply attributes on type and member definitions
 * @example
 *  $$(name)
 * @params
 *  attrName: string/type - Name of the attribute, it can be an internal attribute or namespaced attribute name
 *                          It can also be the Attribute flair type itself
 *  attrArgs: any - Any arguments that may be needed by attribute
 * @returns void
 */ 
const _$$ = (name, ...attrArgs) => {
    let args = _Args('name: string',
                     'name: Attribute')(name); args.throwOnError(_$$);

    let AttrType = null,
        attrInstance = null, // for inbuilt, this will remain null
        cfg = null;
    if (args.index === 0) { // name = string
        cfg = _attrMeta.inbuilt[name] || null;
        if (!cfg) { // not an inbuilt attr
            AttrType = _getType(name);
            if (!AttrType) { throw _Exception.NotFound(name, _$$); }
            name = AttrType[meta].name;
        }
    } else {
        AttrType = name; // the actual Attribute type
        name = AttrType[meta].name;
    }

    // duplicate check
    if (findIndexByProp(_attrMeta.bucket, 'name', name) !== -1) { throw _Exception.Duplicate(name, _$$); }

    // custom attribute instance
    if (AttrType) {
        try {
            attrInstance = new AttrType(...attrArgs);
        } catch (err) {
            throw new _Exception(err, _$$);
        }
        cfg = new _attrConfig(attrInstance.constraints);
    }

    // store
    _attrMeta.bucket.push({name: name, cfg: cfg, isCustom: (attrInstance !== null), attr: attrInstance, args: attrArgs});
};

/**
 * @name attr.Config
 * @description Attribute definition configuration
 * @example
 *  attr(constraints)
 *  attr(isModifier, constraints)
 * @params
 *  isModifier: boolean - if this is actually a modifier
 *  constraints: string - An expression that defined the constraints of applying this attribute 
 *                        using NAMES, PREFIXES, SUFFIXES and logical Javascript operator
 * 
 *                  NAMES can be: 
 *                      type names: class, struct, enum, interface, mixin, resource
 *                      type member names: prop, func, construct, dispose, event
 *                      inbuilt modifier names: static, abstract, sealed, virtual, override, private, protected, readonly, async, etc.
 *                      inbuilt attribute names: promise, singleton, serialize, deprecate, session, state, conditional, noserialize, etc.
 *                      custom attribute names: any registered custom attribute name
 *                      type names itself: e.g., Assembly, Attribute, etc. (any registered type name is fine)
 *                          SUFFIX: A typename must have a suffix (^) e.g., Assembly^, Attribute^, etc. Otherwise this name will be treated as custom attribute name
 *                  
 *                  PREFIXES can be:
 *                      No Prefix: means it must match or be present at the level where it is being defined
 *                      @: means it must be inherited from or present at up in hierarchy chain
 *                      $: means it either must be present at the level where it is being defined or must be present up in hierarchy chain
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
 * 
 * @constructs Constructs attribute configuration object
 */ 
const _attrConfig = function(isModifier, constraints) {
    let args = _Args('isModifier: boolean, constraints: string',
                     'constraints: string',
                     'isModifier: boolean,')(isModifier, constraints); args.throwOnError(_attrConfig);

    // config object
    let _this = {
        isModifier: args.values.isModifier || false,
        constraints: args.values.constraints
    };

    // return
    return _this;
};

const _attr = (name, ...attrArgs) => { // _attr is for internal use only, so collect/clear etc. are not exposed out)
    return _$$(name, ...attrArgs);
};
const _attrMeta = _attr[meta] = Object.freeze({
    bucket: [],
    inbuilt: Object.freeze({ 
        static: new _attrConfig(true, '(class && !$abstract) || ((class && (prop || func)) && !($abstract || $virtual || $override))'),
    
        abstract: new _attrConfig(true, '(class && !$sealed && !$static) || ((class && (prop || func || event)) && !($override || $sealed || $static))'),
        virtual: new _attrConfig(true, 'class && (prop || func || construct || dispose || event) && !($abstract || $override || $sealed || $static)'),
        override: new _attrConfig(true, '(class && (prop || func || construct || dispose || event) && ((@virtual || @abstract) && !(virtual || abstract)) && !($sealed || $static))'),
        sealed: new _attrConfig(true, '(class || ((class && (prop || func || event)) && override))'), 
    
        private: new _attrConfig(true, '(class || struct) && (prop || func || event) && !($protected || @private || $static)'),
        protected: new _attrConfig(true, '(class || struct) && (prop || func || event) && !($private|| $static)'),
        readonly: new _attrConfig(true, '(class || struct) && prop && !abstract'),
        async: new _attrConfig(true, '(class || struct) && func'),
    
        enumerate: new _attrConfig('(class || struct) && prop || func || event'),
        dispose: new _attrConfig('class && prop'),
        post: new _attrConfig('(class || struct) && event'),
        on: new _attrConfig('class && func && !(event || $async || $args || $inject || $static)'),
        timer: new _attrConfig('class && func && !(event || $async || $args || $inject || @timer || $static)'),
        type: new _attrConfig('(class || struct) && prop'),
        args: new _attrConfig('(class || struct) && (func || construct) && !$on'),
        inject: new _attrConfig('class && (prop || func || construct) && !(static || session || state)'),
        resource: new _attrConfig('class && prop && !(session || state || inject || asset)'),
        asset: new _attrConfig('class && prop && !(session || state || inject || resource)'),
        singleton: new _attrConfig('(class && !(prop || func || event) && !($abstract || $static)'),
        serialize: new _attrConfig('((class || struct) || ((class || struct) && prop)) && !($abstract || $static || noserialize)'),
        deprecate: new _attrConfig('!construct && !dispose'),
        session: new _attrConfig('(class && prop) && !($static || $state || $readonly || $abstract || $virtual)'),
        state: new _attrConfig('(class && prop) && !($static || $session || $readonly || $abstract || $virtual)'),
        conditional: new _attrConfig('(class || struct) && (prop || func || event)'),
        noserialize: new _attrConfig('(class || struct) && prop'),
        ns: new _attrConfig('(class || struct || mixin || interface || enum) && !(prop || func || event || construct || dispose)'),
    
        mixin: new _attrConfig('class && (prop || func || event)'),
        interface: new _attrConfig('class && (prop || func || event)')
    })
});

_attr.collect = () => {
    let attrs = _attrMeta.bucket.slice(); _attr.clear();
    return attrs;
};
_attr.has = (name) => {
    if (typeof name !== 'string') { throw _Exception.InvalidArgument('name'); }
    
    return (_attrMeta.bucket.findIndex(item => item.name === name) !== -1);
};
_attr.get = (name) => {
    if (typeof name !== 'string') { throw _Exception.InvalidArgument('name'); }

    let idx = _attrMeta.bucket.findIndex(item => item.name === name);
    if (idx !== -1) { return _attrMeta.bucket[idx]; }
    return null;
};
_attr.clear = () => {
    _attrMeta.bucket.length = 0; // remove all
};

// attach to flair
a2f('$$', _$$);
