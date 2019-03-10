/**
 * @name nip
 * @description Not Implemented Property
 * @example
 *  nip()
 * @params
 * @returns
 */ 
const _nip = {
    get: () => { throw _Exception.NotImplemented('prop'); },
    set: () => { throw _Exception.NotImplemented('prop'); }
};
_nip.ni = true; // a special flag to quick check that this is a not-implemented object

// attach to flair
a2f('nip', _nip);
