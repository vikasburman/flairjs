/**
 * @name getTypeOf
 * @description Gets the underlying type which was used to construct this object
 * @example
 *  getType(obj)
 * @params
 *  obj: object - object that needs to be checked
 * @returns type - flair type for the given object
 */ 
const _getTypeOf = (obj) => {
    return (obj._ && obj._.Type) || null;
};

// expose
flair.getTypeOf = _getTypeOf;
flair.members.push('getTypeOf');