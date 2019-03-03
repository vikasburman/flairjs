/**
 * @name nie
 * @description Not Implemented Event
 * @example
 *  nie()
 * @params
 * @returns
 */ 
const _nie = _event(() => { throw new _Exception('NotImplemented', 'Event is not implemented.'); });
_nie.ni = true; // a special flag to quick check that this is a not-implemented object

// attach to flair
a2f('nie', _nie);
