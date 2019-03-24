/**
 * @name isStatic
 * @description Checks if given flair class type is static.
 * @example
 *  isStatic(type)
 * @params
 *  Type: class - flair class type that needs to be checked
 * @returns boolean - true/false
 */ 
const _isStatic = (Type) => {
    // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
    if (_typeOf(Type) !== 'class') { throw _Exception.InvalidArgument('Type', _isStatic); }

    return Type[meta].isStatic();
}; 

// attach to flair
a2f('isStatic', _isStatic);
