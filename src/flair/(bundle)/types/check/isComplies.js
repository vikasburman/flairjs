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
    if (!obj) { throw _Exception.InvalidArgument('obj', _isComplies); }
    if (_typeOf(intf) !== 'interface') { throw _Exception.InvalidArgument('intf', _isComplies); }
    
    let complied = true;
    for(let member in intf) {
        if (intf.hasOwnProperty(member) && member !== meta) {
            if (typeof obj[member] !== typeof intf[member]) { // TODO: check, how it is happening, this seems a bug - Interface type might not have members
                complied = false; break;
            }
        }
    }

    return complied;
};

// attach to flair
a2f('isComplies', _isComplies);
