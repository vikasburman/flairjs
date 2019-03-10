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
    // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
    if (!obj) { throw _Exception.InvalidArgument('obj', _isComplies); }
    if (_typeOf(intf) !== 'interface') { throw _Exception.InvalidArgument('intf', _isComplies); }
    
    let complied = true;
    for(let member in intf) {
        if (intf.hasOwnProperty(member) && member !== meta) {
            if (!obj[member]) { complied = false; break; } // member not available
            if (typeof intf[member] === 'function') { // function or event
                if (typeof obj[member] !== 'function') { complied = false; break; } // member is not a function or event
            } // else property, just presence was to be checked
        }
    }
    return complied;
};

// attach to flair
a2f('isComplies', _isComplies);
