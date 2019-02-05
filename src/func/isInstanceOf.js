/**
 * @name isInstanceOf
 * @description Checks if given flair class/struct instance is an instance of given class/struct type or
 *              if given class instance implements given interface or has given mixin mixed somewhere in class 
 *              hierarchy
 * @example
 *  isInstanceOf(obj, type)
 * @params
 *  obj: object - flair object that needs to be checked
 *  type: string OR class OR struct OR interface OR mixin - type to be checked for, it can be following:
 *                         > fully qualified type name
 *                         > type reference
 * @returns boolean - true/false
 * @throws
 *  InvalidArgumentException
 */ 
const _isInstanceOf = (obj, type) => {
    let _objType = _typeOf(obj),
        _typeType = _typeOf(type),
        isMatched = false;
    if (['instance', 'sinstance'].indexOf(_objType) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
    if (['string', 'class', 'interface', 'struct', 'mixin'].indexOf(_typeType) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (type)'); }

    switch(_objType) {
        case 'instance':
            switch(_typeType) {
                case 'class':
                    isMatched = obj._.isInstanceOf(type); break;
                case 'interface':
                    isMatched = obj._.isImplements(type); break;
                case 'mixin':
                    isMatched = obj._.isMixed(type); break;
                case 'string':
                    isMatched = obj._.isInstanceOf(type);
                    if (!isMatched) { isMatched = obj._.isImplements(type); }
                    if (!isMatched) { isMatched = obj._.isMixed(type); }
                    break;
            }
            break;
        case 'sinstance':
            switch(_typeType) {
                case 'string':
                case 'struct':
                    isMatched = obj._.isInstanceOf(type); 
                    break;
            }
            break;
    }

    // return
    return isMatched;
};

// attach
flair.isInstanceOf = _isInstanceOf;
flair.members.push('isInstanceOf');