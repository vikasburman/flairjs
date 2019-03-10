/**
 * @name Serializer
 * @description Serializer/Deserialize object instances
 * @example
 *  .serialiaze(instance)
 *  .deserialize(json)
 * @params
 *  instance: object - supported flair type's object instance to serialize
 *  json: object - previously serialized object by the same process
 * @returns
 *  string: json string when serialized
 *  object: flair object instance, when deserialized
 */ 
const serializer_process = (source, isDeserialize) => {
    let result = null,
        memberNames = null,
        src = (isDeserialize ? JSON.parse(source) : source),
        Type = (isDeserialize ? null : source[meta].Type),
        TypeMeta = Type[meta];
    const getMemberNames = (obj, isSelectAll) => {
        let objMeta = obj[meta],
            attrRefl = objMeta.attrs,
            modiRefl = objMeta.modifiers,
            props = [],
            isOK = false;
        for(let memberName in obj) {
            if (obj.hasOwnProperty(memberName) && memberName !== meta) {
                isOK = modiRefl.members.isProperty(memberName);
                if (isOK) {
                    if (isSelectAll) {
                        isOK = !attrRefl.members.probe('noserialize', memberName).anywhere(); // not marked as noserialize when type itself is marked as serialize
                    } else {
                        isOK = attrRefl.members.probe('serialize', memberName).anywhere(); // marked as serialize when type is not marked as serialize
                    }
                    if (isOK) {
                        isOK = (!modiRefl.members.is('private', memberName) &&
                                !modiRefl.members.is('protected', memberName) &&
                                !modiRefl.members.is('static', memberName) &&
                                !modiRefl.members.is('readonly', memberName) &&
                                !attrRefl.members.probe('resource', memberName).anywhere() && 
                                !attrRefl.members.probe('asset', memberName).anywhere() && 
                                !attrRefl.members.probe('inject', memberName).anywhere());
                    }
                }
                if (isOK) { props.push(memberName); }
            }
        }
        return props;
    }; 

    if (isDeserialize) {
        // validate 
        if (!src.type && !src.data) { throw _Exception.InvalidArgument('json'); }

        // get base instance to load property values
        Type = _getType(src.type);
        if (!Type) { throw _Exception.NotFound(src.type, _Serializer.deserialize); }
        try {
            result = new Type(); // that's why serializable objects must be able to create themselves without arguments 
        } catch (err) {
            throw _Exception.OperationFailed(`Object could not be deserialized. (${src.type})`, err, _Serializer.deserialize); 
        }
        
        // get members to deserialize
        if (TypeMeta.attrs.type.probe('serialize').anywhere()) {
            memberNames = getMemberNames(result, true);
        } else {
            memberNames = getMemberNames(result, false);
        }
        
        // deserialize
        for(let memberName of memberNames) { result[memberName] = src.data[memberName]; }
    } else {
        // get members to serialize
        if (TypeMeta.attrs.type.probe('serialize').anywhere()) {
            memberNames = getMemberNames(src, true);
        } else {
            memberNames = getMemberNames(src, false);
        }

        // serialize
        result = {
            type: src[meta].Type[meta].name,
            data: {}
        };
        for(let memberName of memberNames) { result.data[memberName] = src[memberName]; }
        try {
            result = JSON.stringify(result);
        } catch (err) {
            throw _Exception.OperationFailed(`Object could not be serialized. (${src[meta].Type[meta].name})`, err, _Serializer.serialize); 
        }
    }

    // return
    return result;
};
const _Serializer = {
    // serialize given supported flair type's instance
    serialize: (instance) => { 
        if (flairInstances.indexOf(_typeOf(instance) === -1)) { throw _Exception.InvalidArgument('instance', _Serializer.serialize); }
        return serializer_process(instance);
    },

    // deserialize last serialized instance
    deserialize: (json) => {
        if (!json || typeof json !== 'string') { throw _Exception.InvalidArgument('json', _Serializer.deserialize); }
        return serializer_process(json, true);
    }
};

// attach to flair
a2f('Serializer', _Serializer);
