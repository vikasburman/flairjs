import { throws } from "assert";

// Exception
// Exception(code, msg, error)
flair.Exception = (code, msg, error) => {
    let _ex = Object.freeze({
        code: code || '',
        message: msg || '',
        error: error || null
    });

    // return
    return _ex;
};
