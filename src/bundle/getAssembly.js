/**
 * @name getAssembly
 * @description Gets the assembly information of a given object/type
 * @example
 *  _getAssembly(obj)
 * @params
 *  obj: instance/type/string - instance or flair type ir qualified type name whose assembly information is required
 * @returns object - if type is available and registered, its assembly object is returned
 */ 
const _getAssembly = (obj) => { 
    if (!obj) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
    if (typeof obj === 'string') { return _Assembly.get(obj); }
    else if (obj._ && typeof obj._.assembly === 'function') { return obj._.assembly(); }
    else if (obj._ && obj._.Type) { return obj._.Type._.assembly(); }
    return null;
};

// attach to flair
a2f('getAssembly', _getAssembly);
