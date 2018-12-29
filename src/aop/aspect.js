// Aspect
flair.Aspect = flair.Class('Aspect', function() {
    let beforeFn = null,
        afterFn = null,
        aroundFn = null;
    this.func((...args) => {
        this.args = args;
    });
    this.prop('args', []);
    this.func('before', (fn) => {
        if (typeof fn === 'function') {
            beforeFn = fn;
        }
        return beforeFn;
    });
    this.func('after', (fn) => {
        if (typeof fn === 'function') {
            afterFn = fn;
        }
        return afterFn;
    });
    this.func('around', (fn) => {
        if (typeof fn === 'function') {
            aroundFn = fn;
        }
        return aroundFn;
    });
});
