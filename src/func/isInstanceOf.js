/**
 * @name isInstanceOf
 * @description Checks if given flair class/structure instance is an instance of given class/structure type or
 *              if given class instance implements given interface or has given mixin mixed somewhere in class 
 *              hierarchy
 * @example
 *  isInstanceOf(obj, type)
 * @params
 *  obj: object - flair object that needs to be checked
 *  type: string OR class OR structure OR interface OR mixin - type to be checked for, it can be following:
 *                         > fully qualified type name
 *                         > type reference
 * @returns boolean - true/false
 */ 
flair.isInstanceOf = _is.instanceOf;

// add to members list
flair.members.push('isInstanceOf');