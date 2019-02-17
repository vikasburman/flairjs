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
    if (['instance', 'class', 'sinstance', 'struct'].indexOf(_typeOf(obj)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
    if (['string', 'interface'].indexOf(_typeOf(intf)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (intf)'); }
    return obj._.isImplements(intf);
};

// attach to flair
a2f('isImplements', _isImplements);
