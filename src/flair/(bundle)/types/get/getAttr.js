/**
 * @name getAttr
 * @description Gets the attributes for given object or Type.
 * @example
 *  getAttr(obj, name, attrName)
 * @params
 *  obj: object - flair object instance or flair Type that needs to be checked
 *  memberName: string - when passed is flair object instance - member name for which attributes are to be read 
 *                 when passed is flair type - attribute name - if any specific attribute needs to be read (it will read all when this is null)
 *  attrName: string - if any specific attribute needs to be read (it will read all when this is null)
 * @returns array of attributes information objects { name, isCustom, args, type }
 *          name: name of the attribute
 *          isCustom: true/false - if this is a custom attribute
 *          args: attribute arguments
 *          type: name of the Type (in inheritance hierarchy) where this attribute comes from (when a type is inherited, attributes can be applied anywhere in hierarchy)
 */ 
const _getAttr = (obj, memberName, attrName) => {
    let args = _Args('obj: flairinstance, memberName: string',
                     'obj: flairinstance, memberName: string, attrName: string',
                     'obj: flairtype',
                     'obj: flairtype, attrName: string')(obj, memberName, attrName); args.throwOnError(_getAttr);

    let result = [],
        objMeta = obj[meta],
        found_attrs = null,
        found_attr = null;

    if (!args.values.attrName) { // all
        if (args.index > 1) { // type
            found_attrs = objMeta.attrs.type.all().current();
        } else { // instance
            found_attrs = objMeta.attrs.members.all(args.values.memberName).current();
        }
        if (found_attrs) { result.push(...sieve(found_attrs, 'name, isCustom, args, type', true)); }
    } else { // specific
        if (args.index > 1) { // type
            found_attr = objMeta.attrs.type.probe(args.values.attrName).current();
        } else { // instance
            found_attr = objMeta.attrs.members.probe(args.values.attrName, args.values.memberName).current();
        }
        if (found_attr) { result.push(sieve(found_attr, 'name, isCustom, args, type', true)); }
    }

    // return
    return result;
};

// attach to flair
a2f('getAttr', _getAttr);
