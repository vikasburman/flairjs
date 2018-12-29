// Interface
// Interface(interfaceName, function() {})
flair.Interface = (interfaceName, factory) => {
    let meta = {},
        _this = {};

    // definition helpers
    const isSpecialMember = (member) => {
        return ['constructor', 'dispose', '_constructor', '_dispose', '_'].indexOf(member) !== -1;
    };     
    _this.func = (name) => {
        if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
        if (isSpecialMember(name)) { throw `${interfaceName}.${name} can only be defined for a class.`; }
        meta[name] = [];
        meta[name].type = 'func';
    };
    _this.prop = (name) => {
        if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
        if (isSpecialMember(name)) { throw `${interfaceName}.${name} can only be defined as a function for a class.`; }
        meta[name] = [];
        meta[name].type = 'prop';
    };
    _this.event = (name) => {
        if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
        if (isSpecialMember(name)) { throw `${interfaceName}.${name} can only be defined as a function for a class.`; }
        meta[name] = [];
        meta[name].type = 'event';
    };

    // run factory
    factory.apply(_this);

    // add name
    meta._ = {
        name: interfaceName,
        type: 'interface',
        namespace: '',
        assembly: null        
    };

    // return
    return meta;
};
