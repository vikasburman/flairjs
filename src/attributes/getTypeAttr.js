/**
 * @name getTypeAttr
 * @description Gets the attributes for specified Type.
 * @example
 *  getTypeAttr(Type, attributeName)
 * @params
 *  Type: object - flair type reference
 *  attributeName: string/null - if any specific attribute needs to be read   
 *              if null or undefined, it will read all attributes
 * @returns array of attributes information objects { name, isCustom, args, type }
 *          name: name of the attribute
 *          isCustom: true/false - if this is a custom attribute
 *          args: attribute arguments
 *          type: name of the Type (in inheritance hierarchy) where this attribute comes from (when a type is inherited, attributes can be applied anywhere in hierarchy)
 */ 
const _getTypeAttr = (Type, attributeName) => {
    if (!_is(Type, 'flair')) { throw new _Exception.InvalidArgument('Type'); }
    let result = [];

    if (!attributeName) { // all
        let found_attrs = Type._.attrs.type.all().anywhere();
        if (found_attrs) { result.push(...sieve(found_attrs, 'name, isCustom, args, type', true)); }
    } else { // specific
        let found_attr = Type._.attrs.type.probe(attributeName).anywhere();
        if (found_attr) { result.push(sieve(found_attr, 'name, isCustom, args, type', true)); }
    }

    // return
    return result;
};

// attach
flair.getTypeAttr = Object.freeze(_getTypeAttr);
flair.members.push('getTypeAttr');