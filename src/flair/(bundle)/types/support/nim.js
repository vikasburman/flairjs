/**
 * @name nim
 * @description Not Implemented Method
 * @example
 *  nim()
 * @params
 * @returns
 */ 
const _nim = () => { throw new _Exception('NotImplemented', 'Method is not implemented.'); };
_nim.ni = true; // a special flag to quick check that this is a not-implemented object

// attach to flair
a2f('nim', _nim);
