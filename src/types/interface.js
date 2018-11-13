// Interface
// Interface(interfaceName, function() {})
oojs.Interface = (interfaceName, factory) => {
    let meta = {},
        _this = {};

    // definition helpers
    _this.func = (name) => {
        if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
        meta[name] = [];
        meta[name].type = 'func';
    };
    _this.prop = (name) => {
        if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
        meta[name] = [];
        meta[name].type = 'prop';
    };
    _this.event = (name) => {
        if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
        meta[name] = [];
        meta[name].type = 'event';
    };

    // run factory
    factory.apply(_this);

    // add name
    meta._ = {
        name: interfaceName,
        type: 'interface'
    };

    // return
    return meta;
};
