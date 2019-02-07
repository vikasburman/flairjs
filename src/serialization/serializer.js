// Serializer
flair.Serializer = {};
flair.Serializer.serialize = (instance) => { 
    if (instance._.type === 'instance') {
        return instance._.serialize(); 
    }
    return null;
};
flair.Serializer.deserialize = (Type, json) => {
    let instance = new Type();
    if (instance._.type === 'instance') {
        instance._.deserialize(json);
        return instance;
    }
    return null;
};


