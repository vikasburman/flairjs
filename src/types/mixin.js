// Mixin
// Mixin(mixinName, function() {})
flair.Mixin = (mixinName, factory) => {
    // add name
    factory._ = {
        name: mixinName,
        type: 'mixin',
        namespace: null        
    };
// TODO: check that mixin either can be defined as structure or should have at least basic class definition approach or allow mixing classes itself


    // register type with namespace
    flair.Namespace(factory);

    // return
    return factory;
};

// add to members list
flair.members.push('Mixin');