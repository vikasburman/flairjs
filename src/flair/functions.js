// assembly globals
const onLoadComplete = (asm) => {
    // register custom attributes
    const registerCustomAttribute = (customAttrName, qualifiedTypeName) => { // eslint-disable-line no-unused-vars
        let customAttrType = asm.getType(qualifiedTypeName);
        if (customAttrType) { Container.register(customAttrName, customAttrType); }
    };
    
    // TODO: Move all possible inbuilt attributes as custom attributes and
    // register them here
    // each of these can reside in flair.attr namespace
    // Also, all which can be moved to flairjs-fabric - that is good
};