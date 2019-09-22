/**
 * @name getType
 * @description Gets the flair Type from default assembly load context of default appdomain
 * but for possible alias names, it also checks DI container, if type is not found
 * @example
 *  getType(qualifiedName)
 * @params
 *  qualifiedName: string - qualified type name whose reference is needed
 * @returns object - if assembly which contains this type is loaded, it will return flair type object OR will return null
 */ 
const _getType = (qualifiedName) => { 
    let args = _Args('qualifiedName: string')(qualifiedName); args.throwOnError(_getType);
    
    let theType = _AppDomain.context.getType(qualifiedName);

    // since container registered items are not permitted to have '.' if qualifiedName does not contains '.'
    // they can either be a container item or root namespace item, so check container also, if not found on root namespace
    if (!theType && qualifiedName.indexOf('.') === -1) {
        theType = _Container.get(qualifiedName, false); // get first only
    }
    
    return theType;
};

// attach to flair
a2f('getType', _getType);
