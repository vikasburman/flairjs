// Container
let container = {};
oojs.Container = {};
// register(cls)
// register(typeName, cls)
oojs.Container.register = (typeName, cls) => {
    if (typeof typeName === 'function') {
        cls = typeName;
        typeName = cls._.name;
    }
    if (!container[typeName]) { container[typeName] = []; }
    container[typeName].push(cls);
};
oojs.Container.isRegistered = (typeName) => {
    return typeof container[typeName] !== 'undefined';
};
oojs.Container.get = (typeName) => {
    return (container[typeName] || []).slice();
};
oojs.Container.resolve = (typeName, isMultiResolve, ...args) => {
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
