/**
 * @name isMixed
 * @description Checks if given flair class instance or class has mixed with given mixin.
 * @example
 *  isMixed(obj, mixin)
 * @params
 *  obj: object - flair object that needs to be checked
 *  mixin: string OR mixin - mixin to be checked for, it can be following:
 *                           > fully qualified mixin name
 *                           > mixin type reference
 * @returns boolean - true/false
 */ 
flair.isMixed = _is.mixed;

// add to members list
flair.members.push('isMixed');