/**
 * @name isInstanceOf
 * @description Checks if given flair class/struct instance is an instance of given class/struct type or
 *              if given class instance implements given interface or has given mixin mixed somewhere in class 
 *              hierarchy
 * @example
 *  isInstanceOf(obj, type)
 * @params
 *  obj: object - flair object that needs to be checked
 *  type: string OR class OR struct OR interface OR mixin - type to be checked for, it can be following:
 *                         > fully qualified type name
 *                         > type reference
 * @returns boolean - true/false
 * @throws
 *  InvalidArgumentException
 */ 
flair.isInstanceOf = _is.instanceOf;

// add to members list
flair.members.push('isInstanceOf');