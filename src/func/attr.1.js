/**
 * @name attr
 * @description Decorator function to apply attributes on type and member definitions
 * @example
 *  attr(attrName)
 *  attr(attrName, ...args)
 * @params
 *  attrName: string/type - Name of the attribute, it can be an internal attribute or namespaced attribute name
 *                          It can also be the Attribute flair type itself
 *  args: any - Any arguments that may be needed by attribute
 * @returns void
 */ 
const _attr = (name, ...args) => {
    if (!name || ['string', 'class'].indexOf(_typeOf(name) === -1)) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
    if (name && typeof name !== 'string' && !_isDerivedFrom(name, 'Attribute')) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }

    let Attr = null,
        attrInstance = null,
        cfg = null;
    if (typeof name === 'string') {
        cfg = _attr.inbuilt[name] || null;
        if (!cfg) { // not an inbuilt attr
            Attr = _Namespace.getType(name);
            if (!Attr) { throw new _Exception('NotFound', `Attribute is not found. (${name})`); }
            name = Attr._.name;
        }
    } else {
        Attr = name; // the actual Attribute type
        name = Attr._.name;
    }

    // duplicate check
    if (findIndexByProp(_attr._.bucket, 'name', name) !== -1) { throw new _Exception('Duplicate', `Duplicate attributes are not allowed. (${name})`); }

    // custom attribute instance
    if (Attr) {
        attrInstance = new Attr(...args);
        cfg = attrInstance.config;
    }

    // store
    _attr._.bucket.push({name: name, cfg: cfg, attr: attrInstance, args: args});
};
_attr._ = Object.freeze({
    bucket: []
});
_attr.collect = () => {
    let attrs = _attr._.bucket.slice();
    _attr.clear();
    return attrs;
}
_attr.has = (name) => {
    return (_attr._.bucket.findIndex(item => item.name === name) !== -1);
};
_attr.clear = () => {
    _attr._.bucket.length = 0; // remove all
};

/**
 * @name attr.Config
 * @description Attribute definition configuration
 * @example
 *  attr(targets)
 *  attr(isModifier, targets)
 *  attr(targets, constraints)
 *  attr(isModifier, targets, constraints)
 * @params
 *  isModifier: boolean - if this is actually a modifier
 *  targets: string - Comma delimited strings having possible target names: 
 *                  prop, func, construct, dispose, event -- if can be applied on these given member types
 *                  class, struct, enum, interface, mixin, resource -- if can be applied on these given flair types
 *                  when not found any of the above, it will be treated as name of the type - to help in scenarios
 *                  where certain attributes are applicable only on certain types, like Assembly or Attribute, etc.
 *
 *                  NOTE: This is an 'AnyOneMustMatch' check (Allowed Only On These)
 *  constraints: string - Expression of names same names as above with constraint prefixes as:
 *                  <name> -- must be present at current level
 *                  !<name> -- must not be present at current level
 *                  @<name> -- must be inherited 
 *                  !@<name> -- must not be inherited
 *                  $<name> -- must be present anywhere 
 *                  !$<name> -- must not be present anywhere
 *                  
 *                  NOTE: Constraints are processed as logical boolean expressions and 
 *                        can be grouped, ANDed or ORed as:
 * 
 *                        AND: <name1> && <name2> && ...
 *                        OR: <name1> || <name2>
 *                        GROUPING: ((<name1> || <name2>) && (<name1> || <name2>))
 *                                  (((<name1> || <name2>) && (<name1> || <name2>)) || <name3>)
 * 
 * @constructs Constructs attribute configuration object
 */ 
const _attrConfig = function(isModifier, targets, constraints) {
    if (typeof isModifier === 'string') {
        if (typeof targets === 'string') { constraints = targets; }
        targets = isModifier;
        isModifier = false;
    }
    if (typeof targets !== 'string') { throw new _Exception.InvalidArgument('targets'); }
    if (constraints && typeof constraints !== 'string') { throw new _Exception.InvalidArgument('constraints'); }
    targets = targets.split(',');
    constraints = constraints.split(',');

    const _Set = function() {
        this.types = [];
        this.typeNames = [];
        this.members = [];
    };
    const sortAndStore = (set, name) => {
        let bucket = null;
        if (['class', 'struct', 'enum', 'interface', 'mixin', 'resource'].indexOf(name) !== -1) { bucket = set.types;
        } else if (['prop', 'func', 'event', 'construct', 'dispose'].indexOf(name) !== -1) { bucket = set.members;
        } else { bucket = set.typeNames; }
        if (bucket.indexOf(name) !== -1) { throw new _Exception('Duplicate', `Duplicate definitions are not allowed. (${name})`); }
        bucket.push(name);
    };

    // config object
    let _this = {
        isModifier: isModifier
    };

    // targets
    _this.targets = new _Set();    
    for(let target of targets) {
        if (typeof target !== 'string') { throw new _Exception.InvalidArgument('targets'); }
        sortAndStore(_this.targets, target.trim());
    }

    // constraints
    _this.constraints = {
        anywhere: {
            must: new _Set(),
            mustNot: new _Set()
        },
        current: {
            must: new _Set(),
            mustNot: new _Set()
        },
        inherited: {
            must: new _Set(),
            mustNot: new _Set()
        }
    };    
    if (constraints) {
        let prefix = '',
            set = null;
        for(let constraint of constraints) {
            if (typeof constraint !== 'string') { throw new _Exception.InvalidArgument('constraints'); }
            constraint = constraint.trim();
            prefix = constraint.substr(0, 2);
            if (prefix === '!@') { 
                set = _this.constraints.inherited.mustNot;
                constraint = constraint.substr(2);
            } else if (prefix === '!$') {
                set = _this.constraints.anywhere.mustNot;
                constraint = constraint.substr(2);
            else {
                prefix = constraint.substr(0, 1);
                if (prefix === '!') {
                    set = _this.constraints.current.mustNot; 
                    constraint = constraint.substr(1);
                } else if (prefix === '@') {
                    set = _this.constraints.inherited.must; 
                    constraint = constraint.substr(1);
                } else if (prefix === '$') {
                    set = _this.constraints.anywhere.must; 
                    constraint = constraint.substr(1);
                else { // any other character - which is part of the name itself
                    set = _this.constraints.current.must; 
                }
            }
            sortAndStore(set, constraint);
            set = null;
        }    
    }

    // return
    return _this;
};
_attr.Config = _attrConfig;
_attr.inbuilt = { 
    static: new _attrConfig(true, 'class, struct, prop, func', '!virtual, !@virtual, !abstract, !@abstract'),
    abstract: new _attrConfig(true, 'class, prop, func, event', '!sealed, !@sealed, !virtual, !@virtual, !override, !@override'),
    sealed: new _attrConfig(true, 'class, prop, func, event', '!new, @virtual'),
    virtual: new _attrConfig(true, 'prop, func, event, construct, dispose', '!abstract, !@virtual, @abstract'),
    override: new _attrConfig(true, 'prop, func, event, construct, dispose', '!@sealed, !@static, @virtual'),
    private: new _attrConfig(true, 'prop, func ,event', '!protected, !@protected'),
    protected: new _attrConfig(true, 'prop, func, event', '!private, !@private'),
    readonly: new _attrConfig(true, 'prop', '!abstract'),
    async: new _attrConfig(true, 'func'),

    singleton: new _attrConfig('class', '!abstract, !@abstract, !static'),
    serialize: new _attrConfig('class, struct, prop', '!abstract, !@abstract, !static'),
    deprecate: new _attrConfig('class, struct, enum, interface, mixin, resource, prop, func, event'),
    session: new _attrConfig('prop', '!static, !@static, !state, !@state, !readonly, !@readonly, !abstract, !virtual'),
    state: new _attrConfig('prop', '!static, !@static, !session, !@session, !readonly, !@readonly, !abstract, !virtual'),
    conditional: new _attrConfig('prop, func, event'),
    noserialize: new _attrConfig('prop'),

    mixed: new _attrConfig('prop, func, event'),
    event: new _attrConfig('func')
};

// attach
flair.attr = _attr;
flair.members.push('attr');