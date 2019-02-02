/**
 * @name isImplements
 * @description Checks if given flair class instance or class implements given interface
 * @example
 *  isImplements(obj, intf)
 * @params
 *  obj: object - flair object that needs to be checked
 *  intf: string OR interface - interface to be checked for, it can be following:
 *                              > fully qualified interface name
 *                              > interface type reference
 * @returns boolean - true/false
 * @throws
 *  InvalidArgumentException
 */ 
flair.isImplements = _is.implements;

// add to members list
flair.members.push('isImplements');