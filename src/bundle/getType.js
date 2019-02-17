/**
 * @name getType
 * @description Gets the flair Type of a registered type definition
 * @example
 *  getType(name)
 * @params
 *  name: string - qualified type name whose reference is needed
 * @returns object - if assembly which contains this type is loaded, it will return flair type object OR will return null
 */ 
const _getType = (name) => { 
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
    return _Namespace.getType(name);
};

// attach to flair
a2f('getType', _getType);
