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
    let name = Type._.name, // namespace name is already attached to it, and for all '(root)' marked types' no namespace is added, so it will automatically go to root
        ns = name.substr(0, name.lastIndexOf('.'));

    // only valid types are allowed
    if (['class', 'enum', 'interface', 'mixin', 'struct'].indexOf(_typeOf(Type)) === -1) { throw new _Exception('InvalidArgument', `Type cannot be placed in a namespace. (${name})`); }

    // check if already registered
    if (ns_types[name]) { throw `Type (${name}) is already registered.`; }

    // register
    ns_types[name] = Type;

    // update
    Type._.namespace = ns;
};

// attach to flair
a2f('Namespace', _Namespace, () => {
    // clear registry
    ns_types = {};
});


// TODO: don't allow '(auto)' or '(root)' names, actually don;t allow any names with special characters