/**
 * @name getAssembly
 * @description Gets the assembly of a given flair type/instance
 * @example
 *  _getAssembly(Type)
 * @params
 *  Type: type/instance/string - flair type or instance whose assembly is required
 *                               qualified type name, if it is needed to know in which assembly this exists
 *                               (if assembly is not loaded, it will )
 * @returns object - assembly which contains this type
 */ 
const _getAssembly = (Type) => { 
    let args = _Args('Type: flairtype',
                     'Type: flairinstance',
                     'Type: string')(Type); args.throwOnError(_getAssembly);

    let result = null,
        asmFile = '';
    switch(args.index) {
        case 0: // type
            result = Type[meta].assembly(); break;
        case 1: // instance
            result = Type[meta].Type[meta].assembly(); break;
        case 2: // qualifiedName
            asmFile = _AppDomain.resolve(Type);
            if (asmFile) { result = _AppDomain.context.getAssembly(asmFile); } break;
    }
    return result;
};

// attach to flair
a2f('getAssembly', _getAssembly);
