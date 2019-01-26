const _Exception = function(type, msg, error) {
    let _ex = this;
    if (type && !type.endsWith('Exception')) { type += 'Exception'; }

    _ex.type = type || 'UndefinedException';
    _ex.message = msg || '';
    _ex.error = error || null;

    // flarized (in-place)
    _ex._ = Object.freeze({
        inherits: _Exception,
        type: 'exception',
        id: guid(),
        __: {}
    });

    // return freezed
    return Object.freeze(_ex);
};