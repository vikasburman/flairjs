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
        targets = [];
    if (typeof name === 'string') {
        if (typeof _attr.inbuilt[name] === 'undefined') { // not an inbuilt attr
            Attr = _Namespace.getType(name);
            if (!Attr) { throw new _Exception('NotFound', `Attribute is not found. (${name})`); }
        } else { // inbuilt attribute
            targets = _attr.inbuilt[name];
        }
    } else {
        Attr = name;
        name = Attr._.name;
    }

    // push in its own bucket TODO: Check for duplicate - duplicate not allowed
    _attr._.bucket.push({name: name, targets: targets, Attr: Attr, args: args});
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
 *  attr(targets, constraints)
 * @params
 *  targets: string - Comma delimited strings having possible target names:
 *                  prop, func, construct, dispose, event -- if can be applied on these given member types
 *                  class, struct, enum, interface, mixin, resource -- if can be applied on these given flair types
 *                  when not found any of the above, it will be treated as name of the type - to help in scenarios
 *                  where certain attributes are applicable only on certain types, like Assembly or Attribute, etc.
 *  constraints: string - Comma delimited strings having same names as above with constraint prefixes as:
 *                  <name> -- must be present together
 *                  !<name> -- must not be present together
 *                  @<name> -- must be active 
 *                  !@<name> -- must not be active
 * @constructs Constructs attribute configuration object
 */ 
const _attrConfig = function(targets, constraints) {
    if (typeof targets !== 'string') { throw new _Exception.InvalidArgument('targets'); }
    if (constraints && typeof constraints !== 'string') { throw new _Exception.InvalidArgument('constraints'); }
    targets = targets.split(',');
    constraints = constraints.split(',');

    // configuration object
    let _Set = function() {
        this.types = [];
        this.typeNames = [];
        this.members = [];
    };
    let _this = new _Set();
    _this.constraints = {
        together: {
            must: new _Set(),
            mustNot: new _Set()
        },
        active: {
            must: new _Set(),
            mustNot: new _Set()
        }
    };

    const sortAndStore = (set, name) => {
        let bucket = null;
        if (['class', 'struct', 'enum', 'interface', 'mixin', 'resource'].indexOf(name) !== -1) { bucket = set.types;
        } else if (['prop', 'func', 'event', 'construct', 'dispose'].indexOf(name) !== -1) { bucket = set.members;
        } else { bucket = set.typeNames; }
        if (bucket.indexOf(name) !== -1) { throw new _Exception('Duplicate', `Duplicate definitions are not allowed. (${name})`); }
        bucket.push(name);
    };

    // targets
    for(let target of targets) {
        if (typeof target !== 'string') { throw new _Exception.InvalidArgument('targets'); }
        sortAndStore(_this, target.trim());
    }

    // constraints
    if (constraints) {
        let prefix = '',
            set = null;
        for(let constraint of constraints) {
            if (typeof constraint !== 'string') { throw new _Exception.InvalidArgument('constraints'); }
            constraint = constraint.trim();
            prefix = constraint.substr(0, 2);
            if (prefix === '!@') { 
                set = _this.constraints.active.mustNot;
                constraint = constraint.substr(2);
            } else {
                prefix = constraint.substr(0, 1);
                if (prefix === '!') {
                    set = _this.constraints.together.mustNot; 
                    constraint = constraint.substr(1);
                } else if (prefix === '@') {
                    set = _this.constraints.active.must; 
                    constraint = constraint.substr(1);
                } else { // any other character - which is part of the name itself
                    set = _this.constraints.together.must; 
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
    new: new _attrConfig('prop, func, event'),
    static: new _attrConfig('class, struct, prop, func', '!virtual, !@virtual, !abstract, !@abstract'),
    abstract: new _attrConfig('class, prop, func, event', '!sealed, !@sealed, !virtual, !@virtual, !override, !@override'),
    virtual: new _attrConfig('prop, func, event, construct, dispose', '!abstract, !@virtual, @abstract'),
    override: new _attrConfig('prop, func, event, construct, dispose', '!@sealed, !@static, @virtual'),
    sealed: new _attrConfig('class, prop, func, event', '!new, @virtual'),
    singleton: new _attrConfig('class', '!abstract, !@abstract, !static'),
    mixed: new _attrConfig('prop, func, event'),
    session: new _attrConfig('prop', '!static, !@static, !state, !@state, !readonly, !@readonly, !abstract, !virtual'),
    state: new _attrConfig('prop', '!static, !@static, !session, !@session, !readonly, !@readonly, !abstract, !virtual'),
    readonly: new _attrConfig('prop', '!abstract'),
    once: new _attrConfig('prop', '!abstract'),
    conditional: new _attrConfig('prop, func, event'),
    serialize: new _attrConfig('class, struct, prop', '!abstract, !@abstract'),
    noserialize: new _attrConfig('prop'),
    private: new _attrConfig('prop, func ,event', '!protected, !@protected'),
    protected: new _attrConfig('prop, func, event', '!private, !@private'),
    publish: new _attrConfig('event', '!@publish'),
    fetch: new _attrConfig('func', 'async, !abstract'),
    deprecate: new _attrConfig('class, struct, enum, interface, mixin, resource, prop, func, event'),
    enumerate: new _attrConfig('prop, func, event'),
    async: new _attrConfig('func'),
    event: new _attrConfig('func')
};

// attach
flair.attr = _attr;
flair.members.push('attr');