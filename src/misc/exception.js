// Exception
// Exception(code, msg, error)
flair.Exception = function(code, msg, error) {
    let _ex = {};
    
    _ex.code = code || '';
    _ex.message = msg || '';
    _ex.error = error || null;

    // return
    return Object.freeze(_ex);
};
