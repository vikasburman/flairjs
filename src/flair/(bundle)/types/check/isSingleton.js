/**
 * @name isSingleton
 * @description Checks if given flair class type is singleton.
 * @example
 *  isSingleton(type)
 * @params
 *  Type: class - flair class type that needs to be checked
 * @returns {boolean} - true/false
 */ 
const _isSingleton = (Type) => {
    // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
    if (_typeOf(Type) !== 'class') { throw _Exception.InvalidArgument('Type', _isSingleton); }

    return Type[meta].isSingleton();
}; 

// attach to flair
a2f('isSingleton', _isSingleton);
