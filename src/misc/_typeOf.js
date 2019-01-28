const _typeOf = (obj) => {
    let _type = '';

    // undefined
    if (typeof obj === 'undefined') { _type = 'undefined'; }

    // null
    if (!_type && obj === null) { _type = 'null'; }

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