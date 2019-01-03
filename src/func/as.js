// as
// as(object, intf)
//  intf: can be a reference or 'public', 'protected', 'private'
flair.as = (obj, intf) => {
    if (typeof intf === 'string') {
        switch(intf) {
            case 'public': 
                return obj._.pu; break;
            case 'protected': 
            case 'private':
                return obj._.pr; break;
            default:
                throw `Unknown scope: ${intf}`;
        }
    } else {
        switch(intf._.type) {
            case 'interface':
                if (obj._.isImplements(intf._.name)) { return obj; }; break;
            case 'mixin':
                if (obj._.isMixed(intf._.name)) { return obj; }; break;
            case 'class':
                if (obj._.isInstanceOf(intf._.name)) { return obj; }; break;
            default:
                throw `Unknown/unsupported interface type: ${intf}`;
        }
    }
    return null;
};