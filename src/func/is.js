// is
// is(object, intf)
//  intf: can be a reference
flair.is = (obj, intf) => {
    if (typeof intf !== 'string') {
        return flair.as(obj) !== null;
    } else {
        throw new flair.Exception('IS01', `Scope types are not supported: ${intf}`);
    }
};