/**
 * @name is
 * @description Checks if given object is of a given type.
 * @example
 *  is(obj, type)
 * @params
 *  obj: object - object that needs to be checked
 *  type: string OR type - type to be checked for, it can be following:
 *                         > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
 *                         > any 'flair' object or type
 *                         > inbuilt flair object types like 'class', 'structure', 'enum', etc.
 *                         > custom flair object instance types which are checked in following order:
 *                           >> for class instances: 
 *                              isInstanceOf given as type
 *                              isImplements given as interface 
 *                              isMixed given as mixin
 *                           >> for structure instances:
 *                              isInstance of given as structure type
 * @returns boolean - true/false
 */ 
flair.is = _is;

// add to members list
flair.members.push('is');