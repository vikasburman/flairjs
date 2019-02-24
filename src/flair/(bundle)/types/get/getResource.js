/**
 * @name getResource
 * @description Gets the registered resource rom default assembly load context of default appdomain
 * @example
 *  getResource(qualifiedName)
 * @params
 *  qualifiedName: string - qualified resource name
 * @returns object - resource object's data
 */ 
const _getResource = (qualifiedName) => { 
    if (typeof qualifiedName !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (qualifiedName)'); }
    let res = _AppDomain.context.getResource(qualifiedName) || null;
    return (res ? res.data : null);
};

// attach to flair
a2f('getResource', _getResource);