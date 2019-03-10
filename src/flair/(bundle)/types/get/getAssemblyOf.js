/**
 * @name getAssemblyOf
 * @description Gets the assembly file of a given flair type
 * @example
 *  _getAssemblyOf(Type)
 * @params
 *  Type: type/instance/string - flair type or instance whose assembly file is required
 *                               qualified type name, if it is needed to know in which assembly file this exists
 * @returns string - assembly file name which contains this type
 */ 
const _getAssemblyOf = (Type) => { 
    let args = _Args('Type: flairtype',
                     'Type: flairinstance',
                     'Type: string')(Type); args.throwOnError(_getAssemblyOf);

    let asm = _getAssembly(Type);
    return (asm ? asm.file : '');
};

// attach to flair
a2f('getAssemblyOf', _getAssemblyOf);
