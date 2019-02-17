/**
 * @name noop
 * @description No Operation function
 * @example
 *  noop()
 * @params
 * @returns
 */ 
const _noop = () => {};

// attach
flair.noop = Object.freeze(_noop);
flair.members.push('noop');