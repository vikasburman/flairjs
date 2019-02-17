/**
 * @name typeOf
 * @description Finds the type of given object in flair type system
 * @example
 *  typeOf(obj)
 * @params
 *  obj: object - object that needs to be checked
 * @returns string - type of the given object
 *                   it can be following:
 *                    > special ones like 'undefined', 'null', 'NaN', infinity
 *                    > special javascript data types like 'array', 'date', etc.
 *                    > inbuilt flair object types like 'class', 'struct', 'enum', etc.
 *                    > native regular javascript data types like 'string', 'number', 'function', 'symbol', etc.
 */ 
const _typeOf = (obj) => {
    let _type = '';

    // undefined
    if (typeof obj === 'undefined') { _type = 'undefined'; }

    // null
    if (!_type && obj === null) { _type = 'null'; }

    // NaN
    if (!_type && isNaN(obj)) { _type = 'NaN'; }

    // infinity
    if (!_type && typeof obj === 'number' && isFinite(obj) === false) { _type = 'infinity'; }

    // array
    if (!_type && Array.isArray(obj)) { _type = 'array'; }

    // date
    if (!_type && (obj instanceof Date)) { _type = 'date'; }

    // flair types
    if (!_type && obj._ && obj._.type) { _type = obj._.type; }

    // native javascript types
    if (!_type) { _type = typeof obj; }

    // return
    return _type;
};

// attach to flair
a2f('typeOf', _typeOf);