/**
 * @name getAttr
 * @description Gets the attributes for specific member of given object.
 * @example
 *  getAttr(obj, memberName, attributeName)
 * @params
 *  obj: object - flair object instance that needs to be checked
 *  memberName: string/null - member name for which attributes are to be read
 *              if null, it will read attributes of constructor
 *  attributeName: string/null - if any specific attribute needs to be read   
 *              if null or undefined, it will read all attributes
 * @returns array of attributes information objects { name, isCustom, args, type }
 *          name: name of the attribute
 *          isCustom: true/false - if this is a custom attribute
 *          args: attribute arguments
 *          type: name of the Type (in inheritance hierarchy) where this attribute comes from (when a type is inherited, attributes can be applied anywhere in hierarchy)
 */ 
const _getAttr = (obj, memberName, attributeName) => {
    if (!_is(obj, 'flair')) { throw new _Exception.InvalidArgument('obj'); }
    if (!memberName) { memberName = '_construct'; }
    let result = [];

    if (!attributeName) { // all
        let found_attrs = obj._.attrs.members.all(memberName).anywhere();
        if (found_attrs) { result.push(...sieve(found_attrs, 'name, isCustom, args, type', true)); }
    } else { // specific
        let found_attr = obj._.attrs.members.probe(attributeName, memberName).anywhere();
        if (found_attr) { result.push(sieve(found_attr, 'name, isCustom, args, type', true)); }
    }

    // return
    return result;
};

// attach
flair.getAttr = Object.freeze(_getAttr);
flair.members.push('getAttr');