/**
 * @name nie
 * @description Not Implemented Event
 * @example
 *  nie()
 */ 
const _nie = _event(() => { throw _Exception.NotImplemented('event', _nie); });
_nie.ni = true; // a special flag to quick check that this is a not-implemented object

// attach to flair
a2f('nie', _nie);
