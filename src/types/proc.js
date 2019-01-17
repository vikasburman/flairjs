// Proc
// Proc(procName, fn)
flair.Proc = (procName, isASync, fn) => {
    if (typeof isASync === 'function') {
        fn = isASync;
        isASync = false;
    }
    let _fn = fn;
    _fn.isASync = () => { return isASync; };
    _fn._ = {
        name: procName,
        type: 'proc',
        namespace: null,        
        invoke: (...args) => {
            fn(...args);
        }
    };

    // register type with namespace
    flair.Namespace(_fn);

    // return
    return Object.freeze(_fn);
};

