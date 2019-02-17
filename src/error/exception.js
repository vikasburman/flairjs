
/**
 * @name Exception
 * @description Lightweight Exception class that extends Error object and serves as base of all exceptions
 * @example
 *  Exception()
 *  Exception(type)
 *  Exception(error)
 *  Exception(type, message)
 *  Exception(type, error)
 *  Exception(type, message, error)
 * @params
 *  type: string - error name or type
 *  message: string - error message
 *  error: object - inner error or exception object
 * @constructs Exception object
 */  
const _Exception = function(arg1, arg2, arg3) {
    let typ = '', msg = '', err = null;
    if (arg1) {
        if (typeof arg1 === 'string') { 
            typ = arg1; 
        } else if (typeof arg1 === 'object') {
            typ = arg1.name || 'UnknownException';
            err = arg1;
            msg = err.message;
        } else {
            typ = 'UndefinedException';
        }
    } else {
        typ = 'UndefinedException';
    }
    if (arg2) {
        if (typeof arg2 === 'string') { 
            msg = arg2; 
        } else if (typeof arg2 === 'object') {
            if (!err) { 
                err = arg2; 
                typ = typ || err.name;
                msg = err.message;
            }
        } else {
            typ = 'UndefinedException';
        }               
    } else {
        if (err) { 
            typ = typ || err.name;
            msg = err.message; 
        }
    }
    if (arg3) {
        if (typeof arg3 === 'object') { 
            if (!err) { err = arg3; }
        }
    }
    if (typ && !typ.endsWith('Exception')) { typ+= 'Exception'; }

    let _ex = new Error(msg || '');
    _ex.name = typ || 'UndefinedException';
    _ex.error = err || null;

    // return
    return Object.freeze(_ex);
};

// all inbuilt exceptions
_Exception.InvalidArgument = (name) => { return new _Exception('InvalidArgument', `Argument type is invalid. (${name})`); }


// expose
flair.Exception = _Exception;
flair.members.push('Exception');
