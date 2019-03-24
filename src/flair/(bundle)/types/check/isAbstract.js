/**
 * @name isAbstract
 * @description Checks if given flair class type is abstract.
 * @example
 *  isAbstract(type)
 * @params
 *  Type: class - flair class type that needs to be checked
 * @returns boolean - true/false
 */ 
const _isAbstract = (Type) => {
    // NOTE: in all 'check' type functions, Args() is not to be used, as Args use them itself
    if (_typeOf(Type) !== 'class') { throw _Exception.InvalidArgument('Type', _isAbstract); }

    return Type[meta].isAbstract();
}; 

// attach to flair
a2f('isAbstract', _isAbstract);
