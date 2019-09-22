/**
 * @name getResource
 * @description Gets the registered resource from default assembly load context of default appdomain
 * but for possible alias names, it also checks DI container, if resource is not found
 * @example
 *  getResource(qualifiedName)
 * @params
 *  qualifiedName: string - qualified resource name
 * @returns object - resource object's data
 */ 
const _getResource = (qualifiedName) => { 
    let args = _Args('qualifiedName: string')(qualifiedName); args.throwOnError(_getResource);
    
    let res = _AppDomain.context.getResource(qualifiedName) || null;

    // since container registered items are not permitted to have '.' if qualifiedName does not contains '.'
    // they can either be a container item or root namespace item, so check container also, if not found on root namespace
    if (!res && qualifiedName.indexOf('.') === -1) {
        res = _Container.get(qualifiedName, false); // get first only
        if (!(res && res instanceof Resource && res.data)) { res = null; }
    }

    return (res ? res.data : null);
};

// attach to flair
a2f('getResource', _getResource);