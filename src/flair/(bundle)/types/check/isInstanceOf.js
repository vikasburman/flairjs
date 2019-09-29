/**
 * @name isInstanceOf
 * @description Checks if given flair class/struct instance is an instance of given class/struct type or
 *              if given class instance implements given interface or has given mixin mixed somewhere in class
 *              hierarchy
 * @example
 *  isInstanceOf(obj, type)
 * @params
 *  obj: object - flair object instance that needs to be checked
 *  Type: flair type of string
 * @returns {boolean} - true/false
 */ 
const _isInstanceOf = (obj, Type) => {
    // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
    let _objType = _typeOf(obj),
        _typeType = _typeOf(Type),
        isMatched = false;
    if (flairInstances.indexOf(_objType) === -1) { throw _Exception.InvalidArgument('obj', _isInstanceOf); }
    if (flairTypes.indexOf(_typeType) === -1 && _typeType !== 'string') { throw _Exception.InvalidArgument('Type', _isInstanceOf); }

    let objMeta = obj[meta];
    switch(_typeType) {
        case 'class':
            isMatched = objMeta.isInstanceOf(Type); 
            if (!isMatched) {
                isMatched = objMeta.Type[meta].isDerivedFrom(Type);
            }
            break;
        case 'struct':
            isMatched = objMeta.isInstanceOf(Type); break;
        case 'interface':
            isMatched = objMeta.isImplements(Type); break;
        case 'mixin':
            isMatched = objMeta.isMixed(Type); break;
        case 'string':
            isMatched = objMeta.isInstanceOf(Type);
            if (!isMatched && typeof objMeta.isImplements === 'function') { isMatched = objMeta.isImplements(Type); }
            if (!isMatched && typeof objMeta.isMixed === 'function') { isMatched = objMeta.isMixed(Type); }
            break;
    }

    // return
    return isMatched;
};

// attach to flair
a2f('isInstanceOf', _isInstanceOf);
