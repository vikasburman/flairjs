// inject
// inject(type, [typeArgs])
//  - type: 
//      type class itself to inject, OR
//      type class name, OR
//      type class name on server | type class name on client
//  - typeArgs: constructor args to pass when type class instance is created
// NOTE: types being referred here must be available in container so sync resolve can happen
flair.Container.register(flair.Class('inject', flair.Attribute, function() {
    this.decorator((obj, type, name, descriptor) => {
        // validate
        if (['func', 'prop'].indexOf(type) === -1) { throw `inject attribute cannot be applied on ${type} members. (${className}.${name})`; }
        if (['_constructor', '_dispose'].indexOf(name) !== -1) { throw `inject attribute cannot be applied on special function. (${className}.${name})`; }

        // decorate
        let Type = this.args[0],
            typeArgs = this.args[1],
            instance = null;
        if (!Array.isArray(typeArgs)) { typeArgs = [typeArgs]; }
        if (typeof Type === 'string') { 
            if (Type.indexOf('|') !== -1) { // condiitonal server/client specific injection
                let items = Type.split('|');
                if (options.env === 'server') {
                    Type = items[0].trim(); // left one
                } else {
                    Type = items[1].trim(); // right one
                }
            }
            instance = flair.Container.resolve(Type, false, ...typeArgs)
        } else {
            instance = new Type(...typeArgs);
        }
        switch(type) {
            case 'func':
                let fn = descriptor.value;
                descriptor.value = function(...args) {
                    fn(instance, ...args);
                }.bind(obj);
                break;
            case 'prop':
                obj[name] = instance;                        
                break;
        }
    });
}));
