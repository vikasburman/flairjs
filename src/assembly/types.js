// type
// type(qualifiedName)
//  qualifiedName: qualifiedName of type to get


/**
 * @name Types
 * @description Get reference to a registered type definition
 * @example
 *  Types(name)
 * @params
 *  name: string - qualified type name whose reference is needed
 * @returns flair type OR null - if assembly which contains this type is loaded, it will return type or will return null
 */ 
flair.Types = (name) => { 
    if (_typeOf(name) !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is not valid. (name)'); }
    return flair.Namespace.getType(name); 
}

// add to members list
flair.members.push('Types');