// isInstanceOf
// isInstanceOf(obj, cls)
//  obj: object or class to check for class
//  cls: Class type for which instance type to be checked
flair.isInstanceOf = (obj, cls) => {
    if (obj._ && obj._.type === 'instance' && cls._ && cls._.type === 'class') {
        if (obj._.isInstanceOf(cls._.name)) { return true; }
        return false;
    } else {
        throw 'Invalid arguments.';
    }
};