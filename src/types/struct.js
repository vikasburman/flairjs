// Structure
// Structure(name, factory)
//  name: name of the structure
//  factory: factory function that take constructor arguments
flair.Struct = (name, factory) => {
    // args validation
    if (typeof factory !== 'function') { throw flair.Exception('STRU01', 'Invalid structure definition type.'); }


    // structure type
    let _Structure = function(...args) {
        let _obj = {};

        // construct structure using factory
        factory.apply(_obj, ...args);

        // object meta extensions
        let mex = {
            inherits: _Structure,
            isInstanceOf: (nm) => {
                if (nm._ && nm._.name) { nm = nm._.name; } // TODO: fix
                return _Structure._.name === nm;
            }
        };

        // return flarized
        return flarizedInstance('sinstance', _obj, mex);
    };

    // meta extensions
    let mex = {};

    // return
    return flarizedType('struct', name, _Structure, mex)
};

// add to members list
flair.members.push('Struct');