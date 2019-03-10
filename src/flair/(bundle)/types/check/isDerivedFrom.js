/**
 * @name isDerivedFrom
 * @description Checks if given flair class type is derived from given class type, directly or indirectly
 * @example
 *  isDerivedFrom(type, parent)
 * @params
 *  type: class - flair class type that needs to be checked
 *  parent: string OR class - class type to be checked for being in parent hierarchy, it can be following:
 *                            > fully qualified class type name
 *                            > class type reference
 * @returns boolean - true/false
 */ 
const _isDerivedFrom = (type, parent) => {
    if (_typeOf(type) !== 'class') { throw _Exception.InvalidArgument('type', _isDerivedFrom); }
    if (['string', 'class'].indexOf(_typeOf(parent)) === -1) { throw _Exception.InvalidArgument('parent', _isDerivedFrom); }
    return type[meta].isDerivedFrom(parent);
}; 

// attach to flair
a2f('isDerivedFrom', _isDerivedFrom);
