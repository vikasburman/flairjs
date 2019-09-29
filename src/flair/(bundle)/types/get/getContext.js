/**
 * @name getContext
 * @description Gets the assembly load context where a given flair type is loaded
 * @example
 *  _getContext(Type)
 * @params
 *  Type: type - flair type whose context is required
 * @returns {object} - assembly load context object where this type is loaded
 */ 
const _getContext = (Type) => {
    let args = _Args('Type: flairtype')(Type); args.throwOnError(_getContext);

    return Type[meta].context;
};

// attach to flair
a2f('getContext', _getContext);
