/**
 * @name getTypeName
 * @description Gets the name of the underlying type which was used to construct this object
 * @example
 *  getTypeName(obj)
 * @params
 *  obj: object - object that needs to be checked
 * @returns {string} - name of the type of given object
 */ 
const _getTypeName = (obj) => {
    let args = _Args('obj: flair')(obj); args.throwOnError(_getTypeName);

    let typeMeta = obj[meta].Type ? obj[meta].Type[meta] : obj[meta];
    return (typeMeta ? (typeMeta.name || '') : '');
};

// attach to flair
a2f('getTypeName', _getTypeName);
