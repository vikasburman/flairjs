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
    let mappedName = '';
    for(let memberName in ctx) {
        if (ctx.hasOwnProperty(memberName) && memberName !== '_') {
            if ((member.isProperty(memberName) &&
                 member.isSerializable(memberName) &&
                 !member.isReadOnly(memberName) && 
                 !member.isStatic(memberName) && 
                 !member.isPrivate(memberName) && 
                 !member.isProtected(memberName))) {
                    the_attr = attrs.get('serialize', memberName);
                    mappedName = (the_attr ? (the_attr.args[0] || memberName) : memberName);
                    if (isDeserialize) {
                        target[memberName] = source[memberName] || target[memberName];
                    } else {
                        target[memberName] = source[memberName];
                    }
            }
        }
    }
};    