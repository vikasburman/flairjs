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
 * @throws
 *  InvalidArgumentException
 */ 
flair.isDerivedFrom = _is.derivedFrom;

// add to members list
flair.members.push('isDerivedFrom');
