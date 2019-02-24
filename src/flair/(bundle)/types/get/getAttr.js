/**
 * @name getAttr
 * @description Gets the attributes for given object or Type.
 * @example
 *  getAttr(obj, name, attrName)
 * @params
 *  obj: object - flair object instance of flair Type that needs to be checked
 *  name: string - when passed is flair object instance - member name for which attributes are to be read 
 *                 when passed is flair type - attribute name - if any specific attribute needs to be read (it will read all when this is null)
 *  attrName: string - if any specific attribute needs to be read (it will read all when this is null)
 * @returns array of attributes information objects { name, isCustom, args, type }
 *          name: name of the attribute
 *          isCustom: true/false - if this is a custom attribute
 *          args: attribute arguments
 *          type: name of the Type (in inheritance hierarchy) where this attribute comes from (when a type is inherited, attributes can be applied anywhere in hierarchy)
 */ 
const _getAttr = (obj, name, attrName) => {
    if (!_is(obj, 'flair')) { throw new _Exception.InvalidArgument('obj'); }
    let isType = (flairTypes.indexOf(_typeOf(obj) !== -1));
    if (isType && name) { attrName = name; name = ''; }
    if (!isType && name === 'construct') { name = '_construct'; }
    let result = [],
        attrHostItem = (isType ? 'type' : 'members');

    if (!attrName) { // all
        let found_attrs = obj._.attrs[attrHostItem].all(name).anywhere();                           // NOTE: name will be ignored in case of type call, so no harm
        if (found_attrs) { result.push(...sieve(found_attrs, 'name, isCustom, args, type', true)); }
    } else { // specific
        let found_attr = obj._.attrs[attrHostItem].probe(attrName, name).anywhere();                // NOTE: name will be ignored in case of type call, so no harm
        if (found_attr) { result.push(sieve(found_attr, 'name, isCustom, args, type', true)); }
    }

    // return
    return result;
};

// attach to flair
a2f('getAttr', _getAttr);
