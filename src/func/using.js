// using
// using(object, scopeFn)
flair.using = (obj, scopeFn) => {
    try {
        scopeFn(obj);
    } finally {
        if (obj._ && typeof obj._.dispose === 'function') {
            obj._.dispose();
        }
    }
};
