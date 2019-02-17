
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
    let _this = new Error();
    switch(typeof arg1) {
        case 'string':
            _this.name = arg1;
            switch(typeof arg2) {
                case 'string': 
                    _this.message = arg2;
                    _this.error = (typeof arg3 === 'object' ? arg3 : null);
                    break;
                case 'object': 
                    _this.message = arg2.message || '';
                    _this.error = arg2;
                    break;
            }
            break;
        case 'object':
            _this.name = arg1.name || 'Unknown';
            _this.message = arg1.message || '';
            _this.error = arg1;
            break;
    }

    _this.name =  _this.name || 'Undefined';
    if (!_this.name.endsWith('Exception')) { _this.name += 'Exception'; }

    // return
    return Object.freeze(_this);
};

// all inbuilt exceptions
_Exception.InvalidArgument = (name) => { return new _Exception('InvalidArgument', `Argument type is invalid. (${name})`); }

// attach to flair
a2f('Exception', _Exception);
