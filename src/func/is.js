// is
// is(objOtType, intf)
//  intf: can be a reference
flair.is = (objOtType, intf) => {
// TODO: check for all types as well

    if (typeof intf !== 'string') {
        return flair.as(obj) !== null;
    } else {
        throw new flair.Exception('IS01', `Scope types are not supported: ${intf}`);
    }
};