/**
 * @name typeOf
 * @description Finds the type of given object
 * @example
 *  typeOf(obj)
 * @params
 *  obj: object - object that needs to be checked
 * @returns string - type of the given object
 *                   it can be following:
 *                    > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
 *                    > inbuilt flair object types like 'class', 'struct', 'enum', etc.
 * @throws
 *  None
 */ 
flair.typeOf = _typeOf;

// add to members list
flair.members.push('typeOf');