const _typeOf = (obj) => {
    if (!obj) { throw new _Exception('MissingArgument', 'Argument must be defined. (obj)'); }
    let _type = '';

    // array
    if (Array.isArray(obj)) { _type = 'array'; }

    // date
    if (!_type && (obj instanceof Date)) { _type = 'date'; }

    // flair types
    if (!_type && obj._ && obj._.type) { _type = obj._.type; }

    // native javascript types
    if (!_type) { _type = typeof obj; }

    // return
    return _type;
};