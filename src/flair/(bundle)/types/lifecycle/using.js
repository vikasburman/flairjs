/**
 * @name using
 * @description Ensures the dispose of the given object instance is called, even if there was an error 
 *              in executing processor function
 * @example
 *  using(obj, fn)
 * @params
 *  obj: object/string - object that needs to be processed by processor function or qualified name for which object will be created
 *                If a disposer is not defined for the object, it will not do anything
 *  fn: function - processor function
 * @returns {any} - returns anything that is returned by processor function, it may also be a promise
 */ 
const _using = (obj, fn) => {
    let args = _Args('obj: instance, fn: afunction', 
                     'obj: string, fn: afunction')(obj, fn); args.throwOnError(_using);

    // create instance, if need be
    if (args.index === 1) { // i.e., obj = string
        let Type = _getType(obj);
        if (!Type) { throw _Exception.NotFound(obj, _using); }
        obj = new Type(); // this does not support constructor args, for ease of use only.
    }

    let result = null,
        isDone = false,
        isPromiseReturned = false,
        doDispose = () => {
            if (!isDone && typeof obj[meta].dispose === 'function') {
                isDone = true; obj[meta].dispose();
            }
        };
    try {
        result = fn(obj);
        if (result && typeof result.finally === 'function') { // a promise is returned
            isPromiseReturned = true;
            result = result.finally(() => {
                doDispose();
            });
        }
    } finally {
        if (!isPromiseReturned) { doDispose(); }
    }

    // return
    return result;
};

// attach to flair
a2f('using', _using);