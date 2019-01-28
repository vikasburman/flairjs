/**
 * @name as
 * @description Checks if given object can be consumed as an instance of given type.
 * @example
 *  as(obj, type)
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
 * @returns null OR obj - if can be used as specified type, return same object, else null
 */ 
flair.as = (obj, type) => {
    if (_is(obj, type)) { return obj; }
    return null;
};

// add to members list
flair.members.push('as');