/**
 * @name getResource
 * @description Gets the registered resource
 * @example
 *  getResource(name)
 * @params
 *  name: string - qualified resource name
 * @returns object - resource object
 */ 
const _getResource = (name) => { 
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
    return _Resource.get(name);
};

// attach to flair
a2f('getResource', _getResource);