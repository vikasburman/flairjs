/**
 * @name ns
 * @description Gets the registered namespace from default assembly load context of default appdomain
 * @example
 *  ns(name)
 *  ns(name, where)
 * @params
 *  name: string - name of the namespace
 *  asInType: string - qualified name of any type which exists in this namespace
 *          this will look for correct assembly to load before returning namespace object
 * @returns object/promise - namespace object (if only namespace was passed) OR promise object (if asInType name was also passed)
 */ 
const _ns = (name, asInType) => { 
    let args = _Args('name: undefined', 
                     'name: string',
                     'name: string, asInType: string')(name, asInType); args.throwOnError(_ns);
    
    if (typeof asInType === 'string') {
        return new Promise((resolve, reject) => {
            // include the type, this will load corresponding assembly, if not already loaded
            _include(asInType).then(() => {
                resolve(_AppDomain.context.namespace(name)); // now resolve with the namespace object
            }).catch(reject);
        });
    } else {
        return _AppDomain.context.namespace(name);
    }
};

// attach to flair
a2f('ns', _ns);
