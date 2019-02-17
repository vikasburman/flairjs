/**
 * @name using
 * @description Ensures the dispose of the given object instance is called, even if there was an error 
 *              in executing processor function
 * @example
 *  using(obj, fn)
 * @params
 *  obj: object - object that needs to be processed by processor function
 *                If a disposer is not defined for the object, it will not do anything
 *  fn: function - processor function
 * @returns any - returns anything that is returned by processor function, it may also be a promise
 */ 
const _using = (obj, fn) => {
    if (_typeOf(obj) !== 'instance') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
    if (_typeOf(fn) !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (fn)'); }

    let result = null,
        isDone = false,
        isPromiseReturned = false,
        doDispose = () => {
            if (!isDone && typeof obj._.dispose === 'function') {
                isDone = true; obj._.dispose();
            }
        };
    try {
        result = fn(obj);
        if(result && typeof result.finally === 'function') { // a promise is returned
            isPromiseReturned = true;
            result = result.finally((args) => {
                doDispose();
                return args;
            });
        }
    } finally {
        if (!isPromiseReturned) { doDispose(); }
    }

    // return
    return result;
};

// attach
flair.using = Object.freeze(_using);
flair.members.push('using');