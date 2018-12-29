// Container
let container = {};
flair.Container = {};
// register(cls)
// register(typeName, cls)
flair.Container.register = (typeName, cls) => {
    if (typeof typeName === 'function') {
        cls = typeName;
        typeName = cls._.name;
    }
    if (!container[typeName]) { container[typeName] = []; }
    container[typeName].push(cls);
};
flair.Container.isRegistered = (typeName) => {
    return typeof container[typeName] !== 'undefined';
};
flair.Container.get = (typeName) => {
    return (container[typeName] || []).slice();
};
flair.Container.resolve = (typeName, isMultiResolve, ...args) => {
    let result = null;
    if (container[typeName] && container[typeName].length > 0) { 
        if (isMultiResolve) {
            result = [];
            for(let Type of container[typeName]) {
                result.push(new Type(...args));
            }
        } else {
            let Type = container[typeName][0];
            result = new Type(...args);
        }
    }
    return result;
};
