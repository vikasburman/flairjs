/**
 * @name dispose
 * @description Call dispose of given flair object
 * @example
 *  dispose(obj)
 * @params
 *  obj: object - flair object that needs to be disposed
 * @returns void
 */ 
const _dispose = (obj) => {
    if (_typeOf(obj) !== 'instance') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
    
    // call disposer
    obj._.dispose();
};

// attach
flair.dispose = Object.freeze(_dispose);
flair.members.push('dispose');