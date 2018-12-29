// Mixin
// Mixin(mixinName, function() {})
flair.Mixin = (mixinName, factory) => {
    // add name
    factory._ = {
        name: mixinName,
        type: 'mixin'
    };

    // return
    return factory;
};
