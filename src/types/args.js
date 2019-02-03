/**
 * @name Args
 * @description Lightweight args pattern processor proc that returns a validator function to validate arguments against given arg patterns
 * @example
 *  Args(...patterns)
 * @params
 *  patterns: string(s) - multiple pattern strings, each representing one pattern set
 *                        each pattern set can take following forms:
 *                        'type, type, type, ...' OR 'name: type, name: type, name: type, ...'
 *                          type: can be following:
 *                              > expected native javascript data types like 'string', 'number', 'function', 'array', etc.
 *                              > inbuilt flair object types like 'class', 'struct', 'enum', etc.
 *                              > custom flair object instance types which are checked in following order:
 *                                  >> for class instances: 
 *                                     isInstanceOf given as type
 *                                     isImplements given as interface 
 *                                     isMixed given as mixin
 *                                  >> for struct instances:
 *                                     isInstance of given as struct type
 *                          name: argument name which will be used to store extracted value by parser
 * @returns function - validator function that is configured for specified patterns
 * @throws
 *  InvalidArgumentException 
 */ 
flair.Args = _Args;

// add to members list
flair.members.push('Args');