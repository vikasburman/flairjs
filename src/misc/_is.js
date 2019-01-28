const _is = (obj, type) => {
    if (!obj && !type) { throw new _Exception('MissingArgument', 'Argument must be defined. (obj, type)'); }
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
        if (!isMatched && _typ && ['instance', 'sinstance'].indexOf(_typ) !== -1) { isMatched = _is.instanceOf(obj, type); }
    }

    // return
    return isMatched;
};
_is.instanceOf = (obj, type) => {
    let _objType = _typeOf(obj),
        _typeType = _typeOf(type),
        isMatched = false;
    if (['instance', 'sinstance'].indexOf(_objType) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
    if (['string', 'class', 'interface', 'structure', 'mixin'].indexOf(_typeType) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (type)'); }

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
                case 'structure':
                    isMatched = obj._.isInstanceOf(type); 
                    break;
            }
            break;
    }

    // return
    return isMatched;
};
_is.derivedFrom = (type, parent) => {
    if (_typeOf(type) !== 'class') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (type)'); }
    if (['string', 'class'].indexOf(_typeOf(parent)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (parent)'); }
    return type._.isDerivedFrom(parent);
}; 
_is.implements = (obj, intf) => {
    if (['instance', 'class'].indexOf(_typeOf(obj)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
    if (['string', 'interface'].indexOf(_typeOf(intf)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (intf)'); }
    return obj._.isImplements(intf);
};
_is.mixed = (obj, mixin) => {
    if (['instance', 'class'].indexOf(_typeOf(obj)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
    if (['string', 'mixin'].indexOf(_typeOf(mixin)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (mixin)'); }
    return obj._.isMixed(mixin);
};