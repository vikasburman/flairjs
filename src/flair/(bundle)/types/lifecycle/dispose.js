/**
 * @name dispose
 * @description Call dispose of given flair object
 * @example
 *  dispose(obj)
 * @params
 *  obj: object - flair object that needs to be disposed
 *       boolean - if passed true, it will clear all of flair internal system
 * @returns {void}
 */ 
const _dispose = (obj) => {
    let args = _Args('obj: instance', 
                     'obj: boolean')(obj); args.throwOnError(_dispose);

    if (args.index === 1 && obj === true) { // special call to dispose flair
        // dispose anything that builder engine might need to do
        builder_dispose();

        // dispose each member
        disposers.forEach(disposer => { disposer(); });
        disposers.length = 0;        
    } else { // regular call
        if (typeof obj[meta].dispose === 'function') { // call disposer
            obj[meta].dispose();
        }
    }
};

// attach to flair
a2f('dispose', _dispose);