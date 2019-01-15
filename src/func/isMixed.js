// isMixed
// isMixed(objOrCls, mix)
//  objOrCls: object or class to check for mixin
//  mix: Mixed type for which mixin is to be checked
flair.isMixed = (objOrCls, mix) => {
    if (objOrCls._ && (objOrCls._.type === 'class' || objOrCls._.type === 'instance') && mix._ && mix._.type === 'mixin') {
        if (objOrCls._.isMixed(mix._.name)) { return true; }
        return false;
    } else {
        throw 'Invalid arguments.';
    }
};