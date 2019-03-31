/**
 * @name getAssemblyOf
 * @description Gets the assembly file of a given flair type
 * @example
 *  _getAssemblyOf(Type)
 * @params
 *  Type: string - qualified type name, if it is needed to know in which assembly file this exists
 *                               
 * @returns string - assembly file name which contains this type
 */ 
const _getAssemblyOf = (Type) => { 
    let args = _Args('Type: string')(Type); args.throwOnError(_getAssemblyOf);

    return _AppDomain.resolve(Type);
};

// attach to flair
a2f('getAssemblyOf', _getAssemblyOf);
