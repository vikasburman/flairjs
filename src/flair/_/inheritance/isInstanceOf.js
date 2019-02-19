/**
 * @name isInstanceOf
 * @description Checks if given flair class/struct instance is an instance of given class/struct type or
 *              if given class instance implements given interface or has given mixin mixed somewhere in class/struct 
 *              hierarchy
 * @example
 *  isInstanceOf(obj, type)
 * @params
 *  obj: object - flair object that needs to be checked
 *  type: string OR class OR struct OR interface OR mixin - type to be checked for, it can be following:
 *                         > fully qualified type name
 *                         > type reference
 * @returns boolean - true/false
 */ 
const _isInstanceOf = (obj, type) => {
    let _objType = _typeOf(obj),
        _typeType = _typeOf(type),
        isMatched = false;
    if (['instance', 'sinstance'].indexOf(_objType) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
    if (['string', 'class', 'interface', 'struct', 'mixin'].indexOf(_typeType) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (type)'); }

    switch(_typeType) {
        case 'class':
        case 'struct':
            isMatched = obj._.isInstanceOf(type); break;
        case 'interface':
            isMatched = obj._.isImplements(type); break;
        case 'mixin':
            isMatched = obj._.isMixed(type); break;
        case 'string':
            isMatched = obj._.isInstanceOf(type);
            if (!isMatched && typeof obj._.isImplements === 'function') { isMatched = obj._.isImplements(type); }
            if (!isMatched && typeof obj._.isMixed === 'function') { isMatched = obj._.isMixed(type); }
            break;
    }

    // return
    return isMatched;
};

// attach to flair
a2f('isInstanceOf', _isInstanceOf);
