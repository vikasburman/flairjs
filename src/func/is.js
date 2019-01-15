// is
// is(objOrType, intf)
//  intf: can be a reference
flair.is = (objOrType, intf) => {
// TODO: check for all types as well

    if (typeof intf !== 'string') {
        return flair.as(objOrType) !== null;
    } else {
        throw new flair.Exception('IS01', `Scope types are not supported: ${intf}`);
    }
};