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
    if (type[meta]) { type = type[meta].name; } // since it can be a type as well
    if (_typeOf(type) !== 'string') { throw _Exception.InvalidArgument('type', _is); }
    
    let isMatched = false, 
        _typ = '';

    // undefined
    if (type === 'undefined') { isMatched = (typeof obj === 'undefined'); }

    // null
    if (!isMatched && type === 'null') { isMatched = (obj === null); }

    // NaN
    if (!isMatched && type === 'NaN') { isMatched = isNaN(obj); }

    // infinity
    if (!isMatched && type === 'infinity') { isMatched = (typeof obj === 'number' && isFinite(obj) === false); }

    // array
    if (!isMatched && (type === 'array' || type === 'Array')) { isMatched = Array.isArray(obj); }

    // date
    if (!isMatched && (type === 'date' || type === 'Date')) { isMatched = (obj instanceof Date); }

    // flair
    if (!isMatched && (type === 'flairtype' && obj[meta] && flairTypes.indexOf(obj[meta].type) !== -1)) { isMatched = true; }
    if (!isMatched && (type === 'flairinstance' && obj[meta] && flairInstances.indexOf(obj[meta].type) !== -1)) { isMatched = true; }
    if (!isMatched && (type === 'flair' && obj[meta])) { isMatched = true; } // presence ot meta symbol means it is flair type/instance

    // special function types
    if (!isMatched && (type === 'cfunction')) { isMatched = (typeof obj === 'function' && !isArrow(obj)); }
    if (!isMatched && (type === 'afunction')) { isMatched = (typeof obj === 'function' && isArrow(obj)); }

    // native javascript types (including simple 'function')
    if (!isMatched) { isMatched = (typeof obj === type); }

    // flair types
    if (!isMatched) {
        if (obj[meta]) { 
            _typ = obj[meta].type;
            isMatched = _typ === type; 
        }
    }
    
    // flair flair types - instance check (i.e., class or struct type names)
    if (!isMatched && _typ && flairInstances.indexOf(_typ) !== -1) { isMatched = _isInstanceOf(obj, type); }

    // flair flair types - type check (i.e., class or names)
    if (!isMatched && _typ && _typ === 'class') { isMatched = _isDerivedFrom(obj, type); }

    // flair flair types - type check (i.e., direct name)
    if (!isMatched && _typ && flairTypes.indexOf(_typ) !== -1) { isMatched = (obj[meta].name === type); }

    // return
    return isMatched;
};

// attach to flair
a2f('is', _is);
