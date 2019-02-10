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


flair.Serializer.process = (ctx, source, target, isDeserialize) => {
    // TODO: Fix as per new things -- consider using noserialize attr on props when serialiaze is put on type itself
    // let mappedName = '',
    //     the_attr = null;
    for(let memberName in ctx) {
    //     if (ctx.hasOwnProperty(memberName) && memberName !== '_') {
    //         if ((member.isProperty(memberName) &&
    //              member.isSerializable(memberName) &&
    //              !member.isReadOnly(memberName) && 
    //              !member.isStatic(memberName) && 
    //              !member.isPrivate(memberName) && 
    //              !member.isProtected(memberName))) {
    //                 the_attr = attrs.get('serialize', memberName);
    //                 mappedName = (the_attr ? (the_attr.args[0] || memberName) : memberName);
                    if (isDeserialize) {
                        target[memberName] = source[memberName] || target[memberName];
                    } else {
                        target[memberName] = source[memberName];
                    }
    //         }
        }
    // }



    // Build flair.Serializer.serialize using lair.Serializer.process locally, as following are removed from object
    // if (cfg.serialize) {
    //     obj._.serialize = () => { return _Serializer.process(exposed_obj, exposed_obj, {}); };
    //     obj._.deserialize = (json) => { return _Serializer.process(exposed_obj, json, exposed_obj, true); };
    // }  
 

};    

//TODO: To fix 
const _Serializer = flair.Serializer; // eslint-disable-line no-unused-vars