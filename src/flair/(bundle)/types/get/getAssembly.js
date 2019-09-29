/**
 * @name getAssembly
 * @description Gets the assembly of a given flair type/instance
 * @example
 *  _getAssembly(Type)
 * @params
 *  Type: type/instance/string - flair type or instance whose assembly is required
 *                               qualified type name, if it is needed to know in which assembly this exists
 *                               assembly name, if assembly is to be looked for by assembly name
 *                               (since this is also string, this must be enclosed in [] to represent this is assembly name and not qualified type name)
 *                               (if assembly is not loaded, it will return null)
 * @returns {object} - assembly object
 */ 
const _getAssembly = (Type) => { 
    let args = _Args('Type: flairtype',
                     'Type: flairinstance',
                     'Type: string')(Type); args.throwOnError(_getAssembly);

    let result = null,
        asmFile = '',
        asmName = '';
    switch(args.index) {
        case 0: // type
            result = Type[meta].assembly(); break;
        case 1: // instance
            result = Type[meta].Type[meta].assembly(); break;
        case 2: // qualifiedName or assembly name
            if (Type.startsWith('[') && Type.endsWith(']')) { // assembly name
                asmName = Type.substr(1, Type.length - 2); // remove [ and ]
                result = _AppDomain.context.getAssemblyByName(asmName);
            } else { // qualified type name
                asmFile = _AppDomain.resolve(Type);
                if (asmFile) { result = _AppDomain.context.getAssembly(asmFile); } 
            }
            break;
    }
    return result;
};

// attach to flair
a2f('getAssembly', _getAssembly);
