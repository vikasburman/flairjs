const guid = () => {
    return '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
const flarized = (type, name, obj, mex = {}) => {
    // check
    if (!name || typeof name !== 'string') { throw new _Exception('InvalidArgumentException', `Invalid type name ${name}.`); }

    // add meta information
    let _ = mex; // whatever meta extensions are provided
    _.name = name;
    _.type = type;
    _.namespace = null;
    _.assembly = () => { return flair.Assembly.get(name) || null; };
    _.id = guid();
    _.__ = {}; // store any dynamic information here under this unfreezed area

    // attach meta
    obj._ = _;

    // register obj with namespace
    flair.Namespace(obj); // instances are not

    // freeze meta
    obj._ = Object.freeze(obj._);

    // return freezed
    return Object.freeze(obj);
};
const flarizedInstance = (type, obj, mex = {}) => {
    // add meta information
    let _ = mex; // whatever meta extensions are provided
    _.type = type;
    _.id = guid();
    _.__ = {}; // store any dynamic information here under this unfreezed area

    // attach freezed meta
    obj._ = Object.freeze(_);

    // return freezed
    return Object.freeze(obj);
};
