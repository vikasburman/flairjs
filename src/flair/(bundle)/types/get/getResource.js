/**
 * @name getResource
 * @description Gets the registered resource from default assembly load context of default appdomain
 * @example
 *  getResource(qualifiedName)
 * @params
 *  qualifiedName: string - qualified resource name
 * @returns object - resource object's data
 */ 
const _getResource = (qualifiedName) => { 
    let args = _Args('qualifiedName: string')(qualifiedName); args.throwOnError(_getResource);
    
    let res = _AppDomain.context.getResource(qualifiedName) || null;
    return (res ? res.data : null);
};

// attach to flair
a2f('getResource', _getResource);