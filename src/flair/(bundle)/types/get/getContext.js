/**
 * @name getContext
 * @description Gets the assembly load context where a given flair type is loaded
 * @example
 *  _getContext(Type)
 * @params
 *  Type: type - flair type whose context is required
 * @returns object - assembly load context object where this type is loaded
 */ 
const _getContext = (Type) => { 
    if (!_is(Type, 'flair')) { throw new _Exception('InvalidArgument', 'Argument type is not valid. (Type)'); }
    return Type._.context;
};

// attach to flair
a2f('getContext', _getContext);
