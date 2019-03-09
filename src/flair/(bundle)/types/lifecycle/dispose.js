/**
 * @name dispose
 * @description Call dispose of given flair object
 * @example
 *  dispose(obj)
 * @params
 *  obj: object - flair object that needs to be disposed
 *       boolean - if passed true, it will clear all of flair internal system
 * @returns void
 */ 
const _dispose = (obj) => {
    if (typeof obj === 'boolean' && obj === true) { // special call to dispose flair
        // dispose anything that builder engine might need to do
        builder_dispose();

        // dispose each member
        disposers.forEach(disposer => { disposer(); });
        disposers.length = 0;        
    } else { // regular call
        if (_typeOf(obj) !== 'instance') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }

        // call disposer
        obj[meta].dispose();
    }
};

// attach to flair
a2f('dispose', _dispose);