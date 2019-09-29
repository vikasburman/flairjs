/**
 * @name isMixed
 * @description Checks if given flair class/struct instance or class/struct has mixed with given mixin
 * @example
 *  isMixed(obj, mixin)
 * @params
 *  obj: object - flair object instance or type that needs to be checked
 *  mixin: string OR mixin - mixin to be checked for, it can be following:
 *                           > fully qualified mixin name
 *                           > mixin type reference
 * @returns {boolean} - true/false
 */ 
const _isMixed = (obj, mixin) => {
    // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
    if (['class', 'instance'].indexOf(_typeOf(obj)) === -1) { throw _Exception.InvalidArgument('obj', _isMixed); }
    if (['string', 'mixin'].indexOf(_typeOf(mixin)) === -1) {  throw _Exception.InvalidArgument('mixin', _isMixed); }

    return obj[meta].isMixed(mixin);
};

// attach to flair
a2f('isMixed', _isMixed);
