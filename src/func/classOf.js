// classOf
// classOf(obj)
//  obj: object instance for which class type is required
flair.classOf = (obj) => {
    if (obj._ && obj._.type === 'instance') {
        return obj._.inherits;
    } else {
        throw 'Invalid arguments.';
    }
};