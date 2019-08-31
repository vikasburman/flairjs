/**
 * @name ns
 * @description Gets the registered namespace from default assembly load context of default appdomain
 * @example
 *  ns(name)
 *  ns(name, scan)
 * @params
 *  name: string - name of the namespace
 *  scan: string (optional) - can be:
 *      absent/empty: no assemblies will be scanned, namespace will be picked whatever is loaded
 *      *: all registered ADOs will be scanned for this namespace and any unloaded assemblies will be loaded, before returning the namespace
 *         Note: This is time consuming and if there are cyclic conditions - it is unpredictable (TODO: Check and fix this scenario)
 *      <assembly-file-name>: all registered ADOs will be scanned for this registered assembly and if this assembly is not loaded yet, it will be loaded before returning the namespace
 *          Note: In general, cyclic conditions should be avoided as best practice - although this code will take care of this
 *          <assembly-file-name> can be xyz.js | xyz.min.js | ./<path>/xyz.js | ./<path>/xyz.min.js 
 *              no need to use .min. in file name here, it will pick whatever is applicable for the environment
 *              but if this is added, it will be ignored
 * @returns object if no name is passed to represents root-namespace OR promise that resolves with namespace object for specified namespace name
 */ 
const _ns = (name, scan) => { 
    if (!name) {
        return _AppDomain.context.namespace.root(); // sync version
    } else {
        return _AppDomain.context.namespace(name, scan); // async version
    }
};

// attach to flair
a2f('ns', _ns);
