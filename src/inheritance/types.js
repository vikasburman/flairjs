/**
 * @name Types
 * @description Get reference to a registered type definition
 * @example
 *  Types(name)
 * @params
 *  name: string - qualified type name whose reference is needed
 * @returns object - if assembly which contains this type is loaded, it will return flair type object OR will return null
 * @throws
 *  InvalidArgumentException
 *  InvalidNameException
 */ 
flair.Types = (name) => { 
    if (_typeOf(name) !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
    return flair.Namespace.getType(name); 
}

// add to members list
flair.members.push('Types');