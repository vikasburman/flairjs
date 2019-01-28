const _Exception = function(arg1, arg2, arg3) {
    let typ = '', msg = '',
        err = null;
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

    // return freezed
    return Object.freeze(_ex);
};