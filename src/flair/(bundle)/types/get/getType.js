/**
 * @name getType
 * @description Gets the flair Type from default assembly load context of default appdomain
 * @example
 *  getType(qualifiedName)
 * @params
 *  qualifiedName: string - qualified type name whose reference is needed
 * @returns object - if assembly which contains this type is loaded, it will return flair type object OR will return null
 */ 
const _getType = (qualifiedName) => { 
    let args = _Args('qualifiedName: string')(qualifiedName); args.throwOnError(_getType);
    
    return _AppDomain.context.getType(qualifiedName);
};

// attach to flair
a2f('getType', _getType);
