/**
 * @name nip
 * @description Not Implemented Property
 * @example
 *  nip()
 */ 
const _nip = {
    get: () => { throw _Exception.NotImplemented('prop', _nip.get); },
    set: () => { throw _Exception.NotImplemented('prop', _nip.set); }
};
_nip.ni = true; // a special flag to quick check that this is a not-implemented object

// attach to flair
a2f('nip', _nip);
