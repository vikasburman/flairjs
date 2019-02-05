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
const _isImplements = (obj, intf) => {
    if (['instance', 'class'].indexOf(_typeOf(obj)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
    if (['string', 'interface'].indexOf(_typeOf(intf)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (intf)'); }
    return obj._.isImplements(intf);
};

// attach
flair.isImplements = _isImplements;
flair.members.push('isImplements');