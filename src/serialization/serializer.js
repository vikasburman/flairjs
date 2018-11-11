// Serializer
oojs.Serializer = {};
oojs.Serializer.serialize = (instance) => { 
    return instance._.serialize(); 
};
oojs.Serializer.deserialize = (Type, json) => {
    let instance = new Type();
    instance._.deserialize(json);
    return instance;
};
