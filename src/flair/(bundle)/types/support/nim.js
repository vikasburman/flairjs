/**
 * @name nim
 * @description Not Implemented Method
 * @example
 *  nim()
 * @params
 * @returns
 */ 
const _nim = () => { throw _Exception.NotImplemented('func', _nim); };
_nim.ni = true; // a special flag to quick check that this is a not-implemented object

// attach to flair
a2f('nim', _nim);
