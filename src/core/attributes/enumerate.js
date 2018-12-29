// enumerate
// enumerate(flag)
//  - flag: true/false
oojs.Container.register(oojs.Class('enumerate', oojs.Attribute, function() {
    this.decorator((obj, type, name, descriptor) => {
        // validate
        if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `enumerate attribute cannot be applied on special function. (${className}.${name})`; }

        // decorate
        let flag = this.args[0];
        descriptor.enumerable = flag;
    });
}));
