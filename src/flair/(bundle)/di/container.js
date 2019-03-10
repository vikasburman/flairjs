/**
 * @name Container
 * @description Dependency injection container system
 * @example
 *  .isRegistered(alias)                                // - true/false
 *  .get(alias, isAll)                                  // - item / array of registered unresolved items, as is
 *  .register(alias, item)                              // - void
 *  .resolve(alias, isAll, ...args)                     // - item / array of resolved items
 * @params
 *  alias: string - name of alias for an item
 *  item: type/object/string - either a flair type, any object or a qualified type name or a file name
 *        when giving string, it can be of format 'x | y' for different resolution on server and client
 *  args: arguments to pass to type constructor when created instances for items
 *  isAll: boolean - if resolve with all registered items against given alias or only first
 */ 
let container_registry = {};
const _Container = {
    // if an alias is registered
    isRegistered: (alias) => {
        if (typeof alias !== 'string') { throw _Exception.InvalidArgument('alias', _Container.isRegistered); }
        return (typeof container_registry[alias] !== 'undefined' && container_registry[alias].length > 0);
    },

    // get registered items as is for given alias
    get: (alias, isAll) => {
        if (typeof alias !== 'string') { throw _Exception.InvalidArgument('alias', _Container.get); }

        if (isAll) {
            return (container_registry[alias] ? container_registry[alias].slice() : []);
        } else {
            return (container_registry[alias] ? container_registry[alias][0] : null);
        }
    },

    // register given alias
    register: (alias, item) => {
        if (typeof alias !== 'string') { throw _Exception.InvalidArgument('alias', _Container.register); }
        if (!item) { throw _Exception.InvalidArgument('item', _Container.register); }
        if (alias.indexOf('.') !== -1) { throw _Exception.InvalidArgument('alias', _Container.register); }

        if (typeof item === 'string') { 
            item = which(item); // register only relevant item for server/client
            if (item.endsWith('.js') || item.endsWith('.mjs')) { 
                item = which(item, true); // consider prod/dev scenario as well
            }
        }
        // register (first time or push more with same alias)
        if (!container_registry[alias]) { container_registry[alias] = []; }
        container_registry[alias].push(item);
    },

    // resolve alias with registered item(s)
    resolve: (alias, isAll, ...args) => {
        if (typeof alias !== 'string') { throw _Exception.InvalidArgument('alias', _Container.resolve); }
        if (typeof isAll !== 'boolean') { throw _Exception.InvalidArgument('isAll', _Container.resolve); }
    
        let result = null;
        const getResolvedObject = (Type) => {
            let obj = Type; // whatever it was
            if (typeof Type === 'string') {
                if (Type.endsWith('.js') || Type.endsWith('.mjs')) { 
                    // file, leave it as is
                } else { // try to resolve it from a loaded type
                    let _Type = _getType(Type);
                    if (_Type) { Type = _Type; }
                }
            }
            if (['class', 'struct'].indexOf(_typeOf(Type)) !== -1) { // only class and struct need a new instance
                try {
                    if (args) {
                        obj = new Type(...args); 
                    } else {
                        obj = new Type(); 
                    }
                } catch (err) {
                    throw _Exception.OperationFailed(`Type could not be instantiated. (${Type[meta].name})`, _Container.resolve);
                }
            }
            // any other type of object will be passed through as is

            // return
            return obj;
        };

        if (container_registry[alias] && container_registry[alias].length > 0) {
            if (isAll) {
                result = [];
                container_registry[alias].forEach(Type => { result.push(getResolvedObject(Type)); });
            } else {
                result = getResolvedObject(container_registry[alias][0]); // pick first
            }
        }

        // return
        return result;
    }
};

// attach to flair
a2f('Container', _Container, () => {
    container_registry = {};
});