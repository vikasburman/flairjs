/**
 * @name ns
 * @description Gets the registered namespace from default assembly load context of default appdomain
 * @example
 *  ns(name)
 * @params
 *  name: string - name of the namespace
 * @returns object - namespace object
 */ 
const _ns = (name) => { 
    let args = _Args('name: undefined', 
                     'name: string')(name); args.throwOnError(_ns);
    
    return _AppDomain.context.namespace(name);
};

// attach to flair
a2f('ns', _ns);
