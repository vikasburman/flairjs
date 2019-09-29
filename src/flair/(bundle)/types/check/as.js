/**
 * @name as
 * @description Checks if given object can be consumed as an instance of given type
 * @example
 *  as(obj, type)
 * @params
 *  obj: object - object that needs to be checked
 *  type: string OR type - type to be checked for, it can be following:
 *                         > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
 *                         > 'function' - any function, cfunction' - constructor function and 'afunction - arrow function
 *                         > any 'flair' object or type
 *                         > inbuilt flair object types like 'class', 'struct', 'enum', etc.
 *                         > custom flair object instance types which are checked in following order:
 *                           >> for class instances: 
 *                              isInstanceOf given as type
 *                              isImplements given as interface 
 *                              isMixed given as mixin
 *                           >> for struct instances:
 *                              isInstance of given as struct type
 * @returns {object} - if can be used as specified type, return same object, else null
 */ 
const _as = (obj, type) => {
    // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself

    // obj may be undefined or null or false, so don't check for validation of that here
    if (type[meta]) { type = type[meta].name || type[meta].Type.getName(); } // since it can be a type as well
    if (_typeOf(type) !== 'string') { throw _Exception.InvalidArgument('type', _as); }

    if (_is(obj, type)) { return obj; }
    return null;
};

// attach to flair
a2f('as', _as);
