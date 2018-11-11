// using
// using(object, scopeFn)
oojs.using = (obj, scopeFn) => {
    try {
        scopeFn(obj);
    } finally {
        if (obj._ && typeof obj._.dispose === 'function') {
            obj._.dispose();
        }
    }
};
