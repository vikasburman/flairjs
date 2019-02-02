// async
// async() 
flair.Container.register('async', flair.Class('async', flair.Attribute, function() {
    this.decorator((obj, type, name, descriptor) => {
        // validate
        if (['func'].indexOf(type) === -1) { throw `async attribute cannot be applied on ${type} members.`; }
        if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `async attribute cannot be applied on special function.`; }

        // decorate
        let fn = descriptor.value;
        descriptor.value = function(...args) {
            return new Promise((resolve, reject) => {
                let fnArgs = [resolve, reject].concat(args);
                fn(...fnArgs);
            });
        }.bind(obj);
    });
}));
