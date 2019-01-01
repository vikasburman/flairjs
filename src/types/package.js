// Package
// Package(Type)
flair.Package = (Type) => {
    // any type name can be in this format:
    // name
    // namespace.name
    
    // only valid types are allowed
    if (['class', 'enum', 'interface', 'mixin', 'structure'].indexOf(Type._.type) === -1) { throw `Type (${Type._.type}) cannot be placed in a package.`; }

    // only unpackaged types are allowed
    if (Type._.package) { throw `Type (${Type._.name}) is already contained in a package.`; }

    // merge/add type in package tree
    let nextLevel = flair.Package.root,
        nm = Type._.name,
        pkgName = '',
        ns = nm.substr(0, nm.lastIndexOf('.'));
    nm = nm.substr(nm.lastIndexOf('.') + 1);
    if (ns) {
        nsList = ns.split('.');
        for(nsItem of nsList) {
            if (nsItem) {
                // special name not allowed
                if (nsItem === '_') { throw `Special name "_" is used as namespace in ${Type._.name}.`; }
                nextLevel[nsItem] = nextLevel[nsItem] || {};
                pkgName = nsItem;

                // check if this is not a type itself
                if (nextLevel[nsItem]._ && nextLevel[nsItem]._.type !== 'package') { throw `${Type._.name} cannot be packaged in another type (${nextLevel[nsItem]._.name})`; }

                // pick it
                nextLevel = nextLevel[nsItem];
            }
        }
    }
    // add type at the bottom, if not already exists
    if (nextLevel[nm]) { throw `Type ${nm} already contained at ${ns}.`; }
    nextLevel[nm] = Type;

    // add package
    Type._.package = nextLevel;

    // define package meta
    nextLevel._ = nextLevel._ || {};
    nextLevel._.name = nextLevel._.name || pkgName;
    nextLevel._.type = nextLevel._.type || 'package';
    nextLevel._.types = nextLevel._.types || [];
    
    // add to package
    nextLevel._.types.push(Type);

    // attach package functions
    let getTypes = () => { 
        return nextLevel._.types.slice(); 
    }
    let getType = (qualifiedName) => {
        let _Type = null,
            level = nextLevel;
        if (qualifiedName.indexOf('.') !== -1) { // if a qualified name is given
            let items = qualifiedName.split('.');
            for(item of items) {
                if (item) {
                    // special name not allowed
                    if (item === '_') { throw `Special name "_" is used as name in ${qualifiedName}.`; }
    
                    // pick next level
                    level = level[item];
                    if (!level) { break; }
                }
            }
            _Type = level;
        } else {
            _Type = level[qualifiedName];
        }
        if (!_Type || !_Type._ || ['class', 'enum', 'interface', 'mixin', 'structure'].indexOf(_Type._.type) === -1) { return null; }
        return _Type;
    };
    let createInstance = (qualifiedName, ...args) => {
        let _Type = nextLevel.getType(qualifiedName);
        if (_Type && _Type._.type != 'class') { throw `${name} is not a class.`; }
        if (_Type) { return new _Type(...args); }
        return null;
    };   
    nextLevel.getTypes = nextLevel.getTypes || getTypes;
    nextLevel.getType = nextLevel.getType || getType;
    nextLevel.createInstance = nextLevel.createInstance || createInstance;
};
flair.Package.root = {};
flair.Package.getType = (qualifiedName) => { 
    if (flair.Package.root.getType) {
        return flair.Package.root.getType(qualifiedName);
    }
    return null;
};
flair.Package.getTypes = () => {
    if (flair.Package.root.getTypes) {
        return flair.Package.root.getTypes();
    }
    return [];
};
flair.Package.createInstance = (qualifiedName, ...args) => {
    if (flair.Package.root.createInstance) {
        return flair.Package.root.createInstance(qualifiedName, ...args);
    }
    return null;
};
