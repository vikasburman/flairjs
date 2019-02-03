/**
 * @name as
 * @description Checks if given object can be consumed as an instance of given type
 * @example
 *  as(obj, type)
 * @params
 *  obj: object - object that needs to be checked
 *  type: string OR type - type to be checked for, it can be following:
 *                         > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
 *                         > any 'flair' object or type
 *                         > inbuilt flair object types like 'class', 'struct', 'enum', etc.
 *                         > custom flair object instance types which are checked in following order:
 *                           >> for class instances: 
 *                              isInstanceOf given as type
 *                              isImplements given as interface 
 *                              isMixed given as mixin
 *                           >> for struct instances:
 *                              isInstance of given as struct type
 * @returns object - if can be used as specified type, return same object, else null
 * @throws
 *  InvalidArgumentException
 */ 
flair.as = (obj, type) => {
    if (_is(obj, type)) { return obj; }
    return null;
};

// add to members list
flair.members.push('as');