/**
 * @name getResource
 * @description Gets the registered resource rom default assembly load context of default appdomain
 * @example
 *  getResource(qualifiedName)
 * @params
 *  qualifiedName: string - qualified resource name
 * @returns object - resource object
 */ 
const _getResource = (qualifiedName) => { 
    if (typeof qualifiedName !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (qualifiedName)'); }
    return _AppDomain.context.getResource(qualifiedName);
};

// attach to flair
a2f('getResource', _getResource);