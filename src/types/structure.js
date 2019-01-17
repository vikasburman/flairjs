// Structure
// Structure(name, factory)
//  name: name of the structure
//  factory: factory function that take constructor arguments
flair.Structure = (name, factory) => {
    'use strict';

    // args validation
    if (typeof factory !== 'function') { throw flair.Exception('STRU01', 'Invalid structure definition type.'); }


    // structure type
    let _Structure = function(...args) {
        let _obj = {};

        // construct structure using factory
        factory.apply(_obj, ...args);

        // object meta extensions
        let mex = {
            inherits: _Structure
        };

        // return flarized
        return flarizedInstance('sinstance', _obj, mex);
    };

    // meta extensions
    let mex = {};

    // return
    return flarized('structure', name, _Structure, mex)
};

