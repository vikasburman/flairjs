/**
 * @name is
 * @description Checks if given object has specified member defined
 * @example
 *  isDefined(obj, memberName)
 * @params
 *  obj: object - object that needs to be checked
 *  memberName: string - name of the member to check
 * @returns boolean - true/false
 */ 
const _isDefined = (obj, memberName) => {
    // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself

    let isErrorOccured = false;
    try {
        obj[memberName]; // try to access it, it will throw error if not defined on an object which is a flair-object

        // if error does not occur above, means either member is defined or it was not a flairjs object, in that case check for 'undefined'
        isErrorOccured = (typeof obj[memberName] === 'undefined');
    } catch (err) {
        isErrorOccured = true;
    }
    
    // return
    return !isErrorOccured;
};

// attach to flair
a2f('isDefined', _isDefined);
