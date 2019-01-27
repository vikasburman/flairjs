const _Exception = function(type, msg, error) {
    if (type && !type.endsWith('Exception')) { type+= 'Exception'; }

    let _ex = new Error(msg || '');
    _ex.name = type || 'UndefinedException';
    _ex.error = error || null;

    // return freezed
    return Object.freeze(_ex);
};