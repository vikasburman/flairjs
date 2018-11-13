// as
// as(object, intf)
//  intf: can be an interface reference or 'public', 'protected', 'private'
oojs.as = (obj, intf) => {
    if (typeof intf === 'string') {
        switch(intf) {
            case 'public': 
                return obj._.pu; break;
            case 'protected': 
            case 'private':
                return obj._.pr; break;
            default:
                throw 'unknown interface type: ' + intf;
        }
    } else {
        if (obj._.isImplements(intf._.name)) { return obj; }
    }
    return null;
};
