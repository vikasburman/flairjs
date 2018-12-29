// Assembly
// Assembly(asmName, namespace, Type)
flair.Assembly = (asmName, namespaceOrType, Type) => {
    let _namespace = (typeof namespaceOrType === 'string' ? namespaceOrType : ''),
        _Type = (typeof namespaceOrType === 'string' ? Type : namespaceOrType);
    
    // only valid types are allowed
    if (['class', 'enum', 'interface', 'mixin', 'structure'].indexOf(_Type._.type) === -1) { throw `Type (${_Type._.type}) cannot be placed in an assembly.`; }

    // only uncontained types are allowed
    if (_Type._.assembly || _Type._.namespace) { throw `Type (${_Type._.name}) is already contained in another namespace/assembly.`; }

    // build assembly structure
    _Assembly = flair.Assembly.get(asmName);
    if (!_Assembly) { 
        _Assembly = {};

        // attach assembly reflector
        _Assembly._ = {
            name: asmName,
            type: 'assembly',
            types: []
        };

        // attach assembly functions
        _Assembly.getTypes = () => { return flair.Assembly.getTypes(asmName); };
        _Assembly.getType = (qualifiedName) => {
            if (!qualifiedName.startsWith(asmName + '.' )) { throw `Type ${qualifiedName} does not belong to ${asmName} assembly.`; }
            return flair.Assembly.getType(qualifiedName);
        };
        _Assembly.createInstance = (qualifiedName, ...args) => { 
            if (!qualifiedName.startsWith(asmName + '.' )) { throw `Type ${qualifiedName} does not belong to ${asmName} assembly.`; }
            return flair.Assembly.createInstance(qualifiedName, ...args);
        };      

        // store it
        flair.Assembly._[asmName] = _Assembly; 
    }

    // claim type
    _Type._.assembly = _Assembly;
    _Type._.namespace = _namespace;

    // merge/add namespace
    let nsList = _namespace.split('.'),
        nextLevel = _Assembly;
    if (_namespace && nsList.length > 0) {
        for(nsItem of nsList) {
            if (nsItem) {
                // special name not allowed
                if (nsItem === '_') { throw `Special name "_" is used as namespace in ${_Type._.name}.`; }
                nextLevel[nsItem] = nextLevel[nsItem] || {};

                // check if this is not a type itself
                if (nextLevel[nsItem]._) { throw `${_Type._.name} cannot be contained in another type (${nextLevel[nsItem]._.name})`; }

                // pick it
                nextLevel = nextLevel[nsItem];
            }
        }
    }

    // add type at the bottom, if not already exists
    if (nextLevel[_Type._.name]) { throw `Type ${_Type._.name} already contained at ${asmName}.${_namespace}.`; }
    nextLevel[_Type._.name] = _Type;

    // add to list
    _Assembly._.types.push(_Type);

    // return contained type itself and not the assembly
    // assembly is always accessed via static method of Assembly
    return _Type;
};
flair.Assembly._ = {};
flair.Assembly.get = (asmName) => { return flair.Assembly._[asmName]; }
flair.Assembly.getTypes = (asmName) => {
    let _Assembly = flair.Assembly._[asmName];
    if (_Assembly) { return _Assembly._.types.slice(); }
    return [];
};
flair.Assembly.getType = (qualifiedName) => {
    let _Type = null,
        list = qualifiedName.split('.'),
        nextLevel = flair.Assembly._;
    if (qualifiedName && list.length > 0) {
        for(item of list) {
            if (item) {
                // special name not allowed
                if (item === '_') { throw `Special name "_" is used as qualified name in ${qualifiedName}.`; }

                // pick next level
                nextLevel = nextLevel[item];
                if (!nextLevel) { break; }
            }
        }
    }
    if (!nextLevel || !nextLevel._ || ['class', 'enum', 'interface', 'mixin', 'structure'].indexOf(nextLevel._.type) === -1) { return null; }
    return nextLevel;
};
flair.Assembly.createInstance = (qualifiedName, ...args) => {
    let _Type = flair.Assembly.getType(qualifiedName);
    if (_Type && _Type._.type != 'class') { throw `${qualifiedName} is not a class.`; }
    if (_Type) { return new _Type(...args); }
    return null;
}