/**
 * @name ns
 * @description Gets the registered namespace from default assembly load context of default appdomain
 * @example
 *  ns(name)
 * @params
 *  name: string - name of the namespace
 * @returns object if no name is passed to represents root-namespace OR promise that resolves with namespace object for specified namespace name
 */ 
const _ns = (name) => { 
    if (!name) {
        return _AppDomain.context.namespace.root();
    } else {
        return _AppDomain.context.namespace(name);
    }
};

// attach to flair
a2f('ns', _ns);
