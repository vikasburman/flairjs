/**
 * @name isDerivedFrom
 * @description Checks if given flair class type is derived from given class type, directly or indirectly
 * @example
 *  isDerivedFrom(type, parent)
 * @params
 *  Type: class - flair class type that needs to be checked
 *  Parent: string OR class - class type to be checked for being in parent hierarchy, it can be following:
 *                            > fully qualified class type name
 *                            > class type reference
 * @returns boolean - true/false
 */ 
const _isDerivedFrom = (Type, Parent) => {
    // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
    if (_typeOf(Type) !== 'class') { throw _Exception.InvalidArgument('Type', _isDerivedFrom); }
    if (['string', 'class'].indexOf(_typeOf(Parent)) === -1) { throw _Exception.InvalidArgument('Parent', _isDerivedFrom); }

    return Type[meta].isDerivedFrom(Parent);
}; 

// attach to flair
a2f('isDerivedFrom', _isDerivedFrom);
