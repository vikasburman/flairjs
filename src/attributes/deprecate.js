// deprecate
// deprecate([message])
//  - message: any custom message
flair.Container.register('deprecate', flair.Class('deprecate', flair.Attribute, function() {
    this.decorator((obj, type, name, descriptor) => {
        // validate
        if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `deprecate attribute cannot be applied on special function.`; }

        // decorate
        let msg = `${name} is deprecated.`;
        let _get, _set, fn, ev = null;
        if (typeof this.args[0] !== 'undefined') { msg += ' ' + this.args[0] }
        switch(type) {
            case 'prop':
                if (descriptor.get) {
                    _get = descriptor.get;                                
                    descriptor.get = function() {
                        // eslint-disable-next-line no-console
                        console.warn(msg);
                        return _get();
                    }.bind(obj);
                }
                if (descriptor.set) {
                    _set = descriptor.set;
                    descriptor.set = function(value) {
                        // eslint-disable-next-line no-console
                        console.warn(msg);
                        return _set(value);
                    }.bind(obj);
                }   
                break;
            case 'func':
                fn = descriptor.value;
                descriptor.value = function(...args) {
                    // eslint-disable-next-line no-console
                    console.warn(msg);
                    fn(...args);
                }.bind(obj);
                break;
            case 'event':
                ev = descriptor.value;
                descriptor.value = function(...args) {
                    // eslint-disable-next-line no-console
                    console.warn(msg);
                        ev(...args);
                }.bind(obj);
                this.resetEventInterface(fn, descriptor.value);
                break;
        }
    });
}));
