/**
 * @name isMixed
 * @description Checks if given flair class/struct instance or class has mixed with given mixin
 * @example
 *  isMixed(obj, mixin)
 * @params
 *  obj: object - flair object that needs to be checked
 *  mixin: string OR mixin - mixin to be checked for, it can be following:
 *                           > fully qualified mixin name
 *                           > mixin type reference
 * @returns boolean - true/false
 */ 
const _isMixed = (obj, mixin) => {
    if (['instance', 'class', 'sinstance', 'struct'].indexOf(_typeOf(obj)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
    if (['string', 'mixin'].indexOf(_typeOf(mixin)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (mixin)'); }
    return obj._.isMixed(mixin);
};

// attach
flair.isMixed = _isMixed;
flair.members.push('isMixed');