// deprecate
// deprecate([message])
//  - message: any custom message
oojs.Container.register(oojs.Class('deprecate', oojs.Attribute, function() {
    this.decorator((obj, type, name, descriptor) => {
        // validate
        if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `deprecate attribute cannot be applied on special function. (${className}.${name})`; }

        // decorate
        let msg = `${name} is deprecated.`;
        if (typeof this.args[0] !== 'undefined') { msg += ' ' + this.args[0] };
        switch(type) {
            case 'prop':
                if (descriptor.get) {
                    let _get = descriptor.get;                                
                    descriptor.get = function() {
                        console.warn(msg);
                        return _get();
                    }.bind(obj);
                }
                if (descriptor.set) {
                    let _set = descriptor.set;
                    descriptor.set = function(value) {
                        console.warn(msg);
                        return _set(value);
                    }.bind(obj);
                }   
                break;
            case 'func':
                let fn = descriptor.value;
                descriptor.value = function(...args) {
                    console.warn(msg);
                    fn(...args);
                }.bind(obj);
                break;
            case 'event':
                let ev = descriptor.value;
                descriptor.value = function(...args) {
                    console.warn(msg);
                        ev(...args);
                }.bind(obj);
                this.resetEventInterface(fn, descriptor.value);
                break;
        }
    });
}));
