/**
 * @name getRoute
 * @description Gets the registered route from default assembly load context of default appdomain
 * @example
 *  getRoute(qualifiedName)
 * @params
 *  qualifiedName: string - qualified route name
 * @returns object - route's data
 */ 
const _getRoute= (qualifiedName) => { 
    let args = _Args('qualifiedName: string')(qualifiedName); args.throwOnError(_getRoute);
    
    _AppDomain.context.getRoute(qualifiedName);
};

// attach to flair
a2f('getRoute', _getRoute);