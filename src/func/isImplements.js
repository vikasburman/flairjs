// isImplements
// isImplements(objOrCls, intf)
//  objOrCls: object or class to check for interface
//  intf: Interface type for which implementation is to be checked
flair.isImplements = (objOrCls, intf) => {
    if (objOrCls._ && (objOrCls._.type === 'class' || objOrCls._.type === 'instance') && intf._ && intf._.type === 'interface') {
        if (objOrCls._.isImplements(intf._.name)) { return true; }
        return false;
    } else {
        throw 'Invalid arguments.';
    }
};