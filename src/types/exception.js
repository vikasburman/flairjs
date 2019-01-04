import { throws } from "assert";

// Exception
// Exception(code, msg, error)
flair.Exception = function(code, msg, error) => {
    let _ex = this;
    
    this.code = code || '';
    this.message = msg || '';
    this.error = error || null;

    // return
    return Object.freeze(_ex);
};
