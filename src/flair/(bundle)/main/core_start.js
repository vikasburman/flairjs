let flair = async (arg1, arg2) => {
    let ADO = null,
        options = null;
    if (typeof arg1 === 'string') { // just the  entry point is specified
        options = { main: arg1 };
    } else if (arg1.main && arg1.module && arg1.engine) { // this is start options object
        options = arg1;
    } else {
        ADO = arg1;
    }
    
    if (options) {
        if (typeof arg2 === 'string') { options.config = arg2; } // config is also given
        if (!isAppStarted) {
            // boot
            isAppStarted = await flair.AppDomain.boot(options);
        }

        // return
        return flair.AppDomain.app();
    } else if (ADO) {
        flair.AppDomain.registerAdo(ADO);
    }
};

flair.members = [];
flair.options = Object.freeze(options);
flair.env = flair.options.env; // direct env access as well   
    

/**
 * @description Attach API to flair instance
 * @param {string} name - name of the member
 * @param {object} obj - member API instance
 * @param {function} disposer - member API internals disposer
 * @returns {void}
 */
const a2f = (name, obj, disposer) => {
    if (typeof disposer === 'function') { disposers.push(disposer); }

    // expose freezed object
    flair[name] = Object.freeze(obj);

    // add to list
    flair.members.push(name);
};