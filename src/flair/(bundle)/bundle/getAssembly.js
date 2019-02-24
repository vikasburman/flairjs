/**
 * @name getAssembly
 * @description Gets the assembly of a given flair type
 * @example
 *  _getAssembly(Type)
 * @params
 *  Type: type - flair type whose assembly is required
 * @returns object - assembly object which contains this type
 */ 
const _getAssembly = (Type) => { 
    if (!_is(Type, 'flair')) { throw new _Exception('InvalidArgument', 'Argument type is not valid. (Type)'); }
    return Type._.assembly();
};

// attach to flair
a2f('getAssembly', _getAssembly);
