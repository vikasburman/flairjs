// enumerate
// enumerate(flag)
//  - flag: true/false
flair.Container.register('enumerate', flair.Class('enumerate', flair.Attribute, function() {
    this.decorator((obj, type, name, descriptor) => {
        // validate
        if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `enumerate attribute cannot be applied on special function.`; }

        // decorate
        let flag = this.args[0];
        descriptor.enumerable = flag;
    });
}));
