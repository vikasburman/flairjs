// Container
let container = {};
flair.Container = {};

// register(type)
// register(alias, type)
//  alias: type alias to register a type with
//  type: actual type to register against alias OR
//        qualifiedName of the type to resolve with OR
//        a JS file name that needs to be resolved 
//        When qualifiedName of a JS file is being defined, it can also be defined using contextual format
//        <serverContent> | <clientContext>
flair.Container.register = (alias, type) => {
    if (typeof alias === 'function') {
        type = alias;
        alias = type._.name;
    }
    if (typeof alias === 'string' && typeof type === 'string') {
        // get contextual type
        type = flair.which(type);
        
        // get actual type
        type = flair.Namespace.getType(type); // type is qualifiedNane here, if not found it will throw error
    }
    if (!container[alias]) { container[alias] = []; }
    container[alias].push(type);
};
flair.Container.isRegistered = (alias) => {
    return typeof container[alias] !== 'undefined';
};
flair.Container.get = (alias) => {
    return (container[alias] || []).slice();
};
flair.Container.resolve = (alias, isMultiResolve, ...args) => {
    let result = null,
        getResolvedObject = (Type) => {
            let obj = Type; // whatever it was
            if (Type._ && Type._.type && ['class', 'structure'].indexOf(Type._.type) !== -1) { 
                obj = new Type(...args); // only class and structure need a new instance
            }
            return obj;
        }
    if (container[alias] && container[alias].length > 0) { 
        if (isMultiResolve) {
            result = [];
            for(let Type of container[alias]) {
                result.push(getResolvedObject(Type));
            }
        } else {
            let Type = container[alias][0];
            result = getResolvedObject(Type);
        }
    }
    return result;
};
