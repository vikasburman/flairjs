/**
 * @name getAssembly
 * @description Gets the assembly of a given flair type
 * @example
 *  _getAssembly(Type)
 * @params
 *  Type: type/string - flair type whose assembly is required
 *                      qualified type name, if it is needed to know in which assembly this exists
 * @returns object/string - assembly object (or file name) which contains this type
 */ 
const _getAssembly = (Type) => { 
    if (['string', 'flair'].indexOf(_typeOf(Type)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is not valid. (Type)'); }
    if (typeof Type === 'string') {
        return _AppDomain.resolve(Type);
    } else {
        return Type[meta].assembly();
    }
};

// attach to flair
a2f('getAssembly', _getAssembly);
