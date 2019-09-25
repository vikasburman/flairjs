/**
 * @name is
 * @description Checks if given object is of a given type
 * @example
 *  is(obj, type)
 * @params
 *  obj: object - object that needs to be checked
 *  type: string OR type - type to be checked for, it can be following:
 *                         > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
 *                         > 'function' - any function, cfunction' - constructor function and 'afunction - arrow function
 *                         > any 'flair' object or type, 'flairtype' - only flair types and 'flairinstance' - only flair instances
 *                         > inbuilt flair object types like 'class', 'struct', 'enum', etc.
 *                         > custom flair object instance types which are checked in following order:
 *                           >> for class instances: 
 *                              isInstanceOf given as type
 *                              isImplements given as interface 
 *                              isMixed given as mixin
 *                           >> for struct instances:
 *                              isInstance of given as struct type
 * @returns boolean - true/false
 */ 
const _is = (obj, type) => {
    // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself

    // obj may be undefined or null or false, so don't check for validation of that here
    if (type[meta]) { type = type[meta].name || type[meta].Type.getName(); } // since it can be a type as well
    if (_typeOf(type) !== 'string') { throw _Exception.InvalidArgument('type', _is); }
    
    let isMatched = false;

    if (obj) {
        switch(type) {
            case 'NaN': 
                isMatched = isNaN(obj); break;
            case 'infinity': 
                isMatched = (typeof obj === 'number' && isFinite(obj) === false); break;
            case 'array':
            case 'Array':
                isMatched = Array.isArray(obj); break;
            case 'date':
            case 'Date':
                isMatched = (obj instanceof Date); break;
            case 'flairtype':
                isMatched = (obj[meta] && flairTypes.indexOf(obj[meta].type) !== -1); break;
            case 'flairinstance':
                isMatched = (obj[meta] && flairInstances.indexOf(obj[meta].type) !== -1); break;
            case 'flair':
                // presence ot meta symbol means it is flair type/instance
                isMatched = typeof obj[meta] !== 'undefined'; break;
            case 'cfunction':
                isMatched = (typeof obj === 'function' && !isArrow(obj)); break;
            case 'afunction':
                isMatched = (typeof obj === 'function' && isArrow(obj)); break;
            default:
                // native javascript types (including simple 'function')
                if (!isMatched) { isMatched = (typeof obj === type); }
    
                if (!isMatched && obj[meta]) {
                    // flair types
                    if (!isMatched) { isMatched = (type === obj[meta].type); }
    
                    // flair instance check (instance)
                    if (!isMatched && flairInstances.indexOf(obj[meta].type) !== -1) { isMatched = _isInstanceOf(obj, type); }
    
                    // flair type check (derived from)
                    if (!isMatched && obj[meta].type === 'class') { isMatched = _isDerivedFrom(obj, type); }
                    
                    // flair type check (direct name)
                    if (!isMatched && flairTypes.indexOf(obj[meta].type) !== -1) { isMatched = (obj[meta].name === type); }
                }
        }
    } else {
        switch(type) {
            case 'undefined': 
                isMatched = (typeof obj === 'undefined'); break;
            case 'null': 
                isMatched = (obj === null); break;
            case 'NaN': 
                isMatched = isNaN(obj); break;
        }
    }

    // return
    return isMatched;
};

// attach to flair
a2f('is', _is);
