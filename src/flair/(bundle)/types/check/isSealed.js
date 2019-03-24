/**
 * @name isSealed
 * @description Checks if given flair class type is sealed.
 * @example
 *  isSealed(type)
 * @params
 *  Type: class - flair class type that needs to be checked
 * @returns boolean - true/false
 */ 
const _isSealed = (Type) => {
    // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
    if (_typeOf(Type) !== 'class') { throw _Exception.InvalidArgument('Type', _isSealed); }

    return Type[meta].isSealed();
}; 

// attach to flair
a2f('isSealed', _isSealed);
