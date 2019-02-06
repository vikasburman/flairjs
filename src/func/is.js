/**
 * @name is
 * @description Checks if given object is of a given type
 * @example
 *  is(obj, type)
 * @params
 *  obj: object - object that needs to be checked
 *  type: string OR type - type to be checked for, it can be following:
 *                         > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
 *                         > any 'flair' object or type
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
    // obj may be undefined or null or false, so don't check
    if (_typeOf(type) !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (type)'); }
    let isMatched = false, 
        _typ = '';

    if (obj) {
        // array
        if (type === 'array' || type === 'Array') { isMatched = Array.isArray(obj); }

        // date
        if (!isMatched && (type === 'date' || type === 'Date')) { isMatched = (obj instanceof Date); }

        // flair
        if (!isMatched && (type === 'flair' && obj._ && obj._.type)) { isMatched = true; }

        // native javascript types
        if (!isMatched) { isMatched = (typeof obj === type); }

        // flair types
        if (!isMatched) {
            if (obj._ && obj._.type) { 
                _typ = obj._.type;
                isMatched = _typ === type; 
            }
        }
        
        // flair custom types
        if (!isMatched && _typ && ['instance', 'sinstance'].indexOf(_typ) !== -1) { isMatched = _isInstanceOf(obj, type); }
    }

    // return
    return isMatched;
};

// attach
flair.is = _is;
flair.members.push('is');