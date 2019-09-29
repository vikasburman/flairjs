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
    
    let complied = true,
        isOptionalMember = false;
    //if (isOptionalMember) { memberName = memberName.substr(0, memberName.length - 1); } // remove _ suffix

    // TODO: this shoudl also check for sync and async type functions

    for(let member in intf) {
        if (intf.hasOwnProperty(member) && member !== meta) {
            isOptionalMember = member.endsWith('_');  
            if (isOptionalMember) { member = member.substr(0, member.length - 1); } // remove _ suffix
            if (!obj[member] && !isOptionalMember) { complied = false; break; } // member not available
            if (typeof intf[member] === 'function') { // function or event
                if (typeof obj[member] !== 'function') { complied = false; break; } // member is not a function or event
            } // else property, just presence was to be checked
        }
    }
    return complied;
};

// attach to flair
a2f('isComplies', _isComplies);
