/**
 * @name isDeprecated
 * @description Checks if given flair class type is deprecated.
 * @example
 *  isDeprecated(type)
 * @params
 *  Type: class - flair class type that needs to be checked
 * @returns {boolean} - true/false
 */ 
const _isDeprecated = (Type) => {
    // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
    if (_typeOf(Type) !== 'class') { throw _Exception.InvalidArgument('Type', _isDeprecated); }

    return Type[meta].isDeprecated();
}; 

// attach to flair
a2f('isDeprecated', _isDeprecated);
