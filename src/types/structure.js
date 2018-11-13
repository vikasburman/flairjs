// Structure
// Structure(structureName, factoryFn(args) {})
oojs.Structure = (structureName, factoryFn) => {
    let _structure = factoryFn;
    _structure._ = {
        name: structureName,
        type: 'structure'
    };

    // return
    return _structure;
};

