// Mixin
// Mixin(mixinName, function() {})
flair.Mixin = (mixinName, factory) => {
    // add name
    factory._ = {
        name: mixinName,
        type: 'mixin',
        namespace: null        
    };

    // register type with namespace
    flair.Namespace(factory);

    // return
    return factory;
};
