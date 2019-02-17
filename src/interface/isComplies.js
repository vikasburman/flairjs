/**
 * @name isComplies
 * @description Checks if given object complies to given flair interface
 * @example
 *  isComplies(obj, intf)
 * @params
 *  obj: object - any object that needs to be checked
 *  intf: interface - flair interface type to be checked for
 * @returns boolean - true/false
 */ 
const _isComplies = (obj, intf) => {
    if (!obj) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
    if (_typeOf(intf) !== 'interface') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (intf)'); }
    
    let complied = true;
    for(let member in intf) {
        if (intf.hasOwnProperty(member) && member !== '_') {
            if (typeof obj[member] !== typeof intf[member]) {
                complied = false; break;
            }
        }
    }

    return complied;
};

// attach
flair.isComplies = _isComplies;
flair.members.push('isComplies');