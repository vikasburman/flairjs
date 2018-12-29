// Structure
// Structure(structureName, factory(args) {})
flair.Structure = (structureName, factory) => {
    // build structure definition
    let Structure = function(...args) {
        let _this = this;

        // attach instance reflector
        _this._ = _this._ || {};
        _this._.type = 'sinstance';
        _this._.name = structureName;
        _this._.inherits = Structure;

        // construct using factory
        factory.apply(_this, ...args);

        // return
        return _this;
    };

    // attach structure reflector
    Structure._ = {
        name: structureName,
        type: 'structure'
    };

    // return
    return Structure;
};

