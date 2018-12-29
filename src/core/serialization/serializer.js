// Serializer
oojs.Serializer = {};
oojs.Serializer.serialize = (instance) => { 
    if (instance._.type = 'instance') {
        return instance._.serialize(); 
    }
    return null;
};
oojs.Serializer.deserialize = (Type, json) => {
    let instance = new Type();
    if (instance._.type = 'instance') {
        instance._.deserialize(json);
        return instance;
    }
    return null;
};
