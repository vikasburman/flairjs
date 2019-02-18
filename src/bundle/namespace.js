/**
 * @name Namespace
 * @description Namespace registration and type locator functionality.
 * @example
 *  .getType(qualifiedName)     // - flair type if registered or null
 * @params
 * qualifiedName: string - qualified type name which is to be looked for.
 */ 
let ns_types = {};
const _Namespace = {
    // get registered type
    getType: (qualifiedName) => {
        return ns_types[qualifiedName] || null;
    }
};
const _NSRegister = (Type) => { // registration support -- needed by builder
    // any type name can be in this format:
    // .name <-- means, no namespace is given but still register this with root namespace (this is generally for flair system's core type's use only)
    // name <-- means, no namespace is given but since it is not forced, do not register this with root namespace (this helps in creating adhoc types without registering anywhere)
    // namespace.name
    
    // check if need not to process
    let name = Type._.name,
        ns = '';
    if (name.indexOf('.') === -1) { // no namespace is given, neither forced, go back
        return;
    } else if (name.startsWith('.')) { // forced
        name = name.substr(1); // remove .
    }
    ns = name.substr(0, name.lastIndexOf('.'));

    // only valid types are allowed
    if (['class', 'enum', 'interface', 'mixin', 'struct'].indexOf(_typeOf(Type)) === -1) { throw new _Exception('InvalidArgument', `Type cannot be placed in a namespace. (${name})`); }

    // only unattached types are allowed
    if (Type._.namespace) { throw `Type (${name}) is already contained in a namespace.`; }

    // check if already registered
    if (ns_types[name]) { throw `Type (${name}) is already registered.`; }

    // register
    ns_types[name] = Type;

    // update
    Type._.namespace = ns;
    Type._.name = name;
};

// attach to flair
a2f('Namespace', _Namespace, () => {
    // clear registry
    ns_types = {};
});
