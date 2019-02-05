/**
 * @name attr
 * @description Decorator function to apply attributes on type and member definitions
 * @example
 *  attr(attrName)
 *  attr(attrName, ...args)
 * @params
 *  attrName: string - Name of the attribute, it can be an internal attribute or a DI container registered attribute name
 *  args: any - Any arguments that may be needed by attribute
 * @returns void
 * @throws
 *  InvalidArgumentException 
 */ 
flair.attr = _attr;

// add to members list
flair.members.push('attr');