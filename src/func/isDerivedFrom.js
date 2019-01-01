// isDerivedFrom
// isDerivedFrom(cls, parentCls)
//  cls: Class type to check for hierarchy
//  parentCls: Parent class type to look for
flair.isDerivedFrom = (cls, parentCls) => {
    if (cls._ && cls._.type === 'class' && parentCls._ && parentCls._.type === 'class') {
        if (cls._.isDerivedFrom(parentCls._.name)) { return true; }
        return false;
    } else {
        throw 'Invalid arguments.';
    }
};