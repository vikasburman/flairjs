/**
 * @name isImplements
 * @description Checks if given flair class/struct instance or class/struct implements given interface
 * @example
 *  isImplements(obj, intf)
 * @params
 *  obj: object - flair object that needs to be checked
 *  intf: string OR interface - interface to be checked for, it can be following:
 *                              > fully qualified interface name
 *                              > interface type reference
 * @returns boolean - true/false
 */ 
const _isImplements = (obj, intf) => {
    // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
    if (['class', 'struct', 'instance', 'sinstance'].indexOf(_typeOf(obj)) === -1) { throw _Exception.InvalidArgument('obj', _isImplements); }
    if (['string', 'interface'].indexOf(_typeOf(intf)) === -1) {  throw _Exception.InvalidArgument('intf', _isImplements); }
    
    return obj[meta].isImplements(intf);
};

// attach to flair
a2f('isImplements', _isImplements);
