// Mixin
// Mixin(mixinName, function() {})
flair.Mixin = (mixinName, factory) => {
    // add name
    factory._ = {
        name: mixinName,
        type: 'mixin',
        package: null        
    };

    // register type with package
    flair.Package(factory);

    // return
    return factory;
};
