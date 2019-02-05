// Enum
// Enum(name, def)
//  name: name of the enum
//  def: object with key/values or an array of values
flair.Enum = (name, data) => {
    'use strict';

    // args validation
    if (!(typeof data === 'object' || Array.isArray(data))) { throw flair.Exception('ENUM01', 'Invalid enum data.'); }

    // // enum type
    // let _Enum = data;
    // if (Array.isArray(data)) {
    //     let i = 0,
    //         _Enum = {};
    //     for(let value of data) {
    //         _Enum[i] = value; i++;
    //     }
    // } 

    // // meta extensions
    // let mex = {
    //     keys: () => {
    //         let keys = [];
    //         for(let key in _Enum) {
    //             if (_Enum.hasOwnProperty(key) && key !== '_') {
    //                 keys.push(key);
    //             }
    //         }
    //         return keys;
    //     },
    //     values: () => {
    //         let values = [];
    //         for(let key in _Enum) {
    //             if (_Enum.hasOwnProperty(key) && key !== '_') {
    //                 values.push(_Enum[key]);
    //             }
    //         }
    //         return values;
    //     }
    // };

    // return
    //return flarizedType('enum', name, _Enum, mex);
};
flair.Enum.getKeys = (obj) => {
    try {
        return obj._.keys();
    } catch (e) {
        throw flair.Exception('ENUM02', 'Object is not an Enum.', e);
    }
};
flair.Enum.getValues = (obj) => {
    try {
        return obj._.values();
    } catch (e) {
        throw flair.Exception('ENUM02', 'Object is not an Enum.', e);
    }
};
flair.Enum.isDefined = (obj, keyOrValue) => {
    return (flair.Enum.getKeys().indexOf(keyOrValue) !== -1 || flair.Enum.getValues().indexOf(keyOrValue) !== -1);
};

// add to members list
flair.members.push('Enum');