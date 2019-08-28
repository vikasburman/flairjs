
/**
 * @name Exception
 * @description Lightweight Exception class that extends Error object and serves as base of all exceptions
 * @example
 *  Exception()
 *  Exception(type)
 *  Exception(type, stStart)
 *  Exception(error)
 *  Exception(error, stStart)
 *  Exception(type, message)
 *  Exception(type, message, stStart)
 *  Exception(type, error)
 *  Exception(type, error, stStart)
 *  Exception(type, message, error)
 *  Exception(type, message, error, stStart)
 * @params
 *  type: string - error name or type
 *  message: string - error message
 *  error: object - inner error or exception object
 *  stStart: function - hide stack trace before this function
 * @constructs Exception object
 */  
const _Exception = function(arg1, arg2, arg3, arg4) {
    let _this = new Error(),
        stStart = _Exception;
    switch(typeof arg1) {
        case 'string':
            _this.name = arg1;
            switch(typeof arg2) {
                case 'string': 
                    _this.message = arg2;
                    switch(typeof arg3) {
                        case 'object':
                            _this.error = arg3;
                            if (typeof arg4 === 'function') { stStart = arg4; }
                            break;
                        case 'function':
                            stStart = arg3;
                            break;
                    } 
                    break;
                case 'object': 
                    _this.message = arg2.message || '';
                    _this.error = arg2;
                    if (typeof arg3 === 'function') { stStart = arg3; }
                    break;
                case 'function': 
                    stStart = arg2;
                    break;
            }
            break;
        case 'object':
            _this.name = arg1.name || 'Unknown';
            _this.message = arg1.message || '';
            _this.error = arg1;
            if (typeof arg2 === 'function') { stStart = arg2; }
            break;
    }

    _this.name =  _this.name || 'Undefined';
    if (!_this.name.endsWith('Exception')) { _this.name += 'Exception'; }

    // limit stacktrace
    if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(_this, stStart);
    }

    // add hint of error
    if (_this.error) {
        _this.message += '[' + _this.error + ']';
    }

    // return
    return Object.freeze(_this);
};

// all inbuilt exceptions
_Exception.InvalidArgument = (name, stStart = _Exception.InvalidArgument) => { return new _Exception('InvalidArgument', `Argument type is invalid. (${name})`, stStart); }
_Exception.OperationFailed = (name, error, stStart = _Exception.OperationFailed) => { return new _Exception('OperationFailed', `Operation failed with error. (${name})`, error, stStart); }
_Exception.Duplicate = (name, stStart = _Exception.Duplicate) => { return new _Exception('Duplicate', `Item already exists.(${name})`, stStart); }
_Exception.NotFound = (name, stStart = _Exception.NotFound) => { return new _Exception('NotFound', `Item not found. (${name})`, stStart); }
_Exception.InvalidDefinition = (name, stStart = _Exception.InvalidDefinition) => { return new _Exception('InvalidDefinition', `Item definition is invalid. (${name})`, stStart); }
_Exception.InvalidOperation = (name, stStart = _Exception.InvalidOperation) => { return new _Exception('InvalidOperation', `Operation is invalid in current context. (${name})`, stStart); }
_Exception.Circular = (name, stStart = _Exception.Circular) => { return new _Exception('Circular', `Circular calls found. (${name})`, stStart); }
_Exception.NotImplemented = (name, stStart = _Exception.NotImplemented) => { return new _Exception('NotImplemented', `Member is not implemented. (${name})`, stStart); }
_Exception.NotDefined = (name, stStart = _Exception.NotDefined) => { return new _Exception('NotDefined', `Member is not defined or is not accessible. (${name})`, stStart); }
_Exception.NotAvailable = (name, stStart = _Exception.NotAvailable) => { return new _Exception('NotAvailable', `Feature is not available. (${name})`, stStart); }
_Exception.NotSupported = (name, stStart = _Exception.NotSupported) => { return new _Exception('NotSupported', `Operation is not supported. (${name})`, stStart); }

// attach to flair
a2f('Exception', _Exception);
