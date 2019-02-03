const guid = () => {
    return '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
const flarized = (type, name, obj, mex = {}) => {
    // check
    if (!name || typeof name !== 'string') { throw new _Exception('InvalidArgument', `Argument type is invalid. (name)`); }

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
    flair.Namespace(obj); 

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
const which = (def, isFile) => {
    if (isFile) { // debug/prod specific decision
        // pick minified or dev version
        if (def.indexOf('{.min}') !== -1) {
            if (flair.options.env.isProd) {
                return def.replace('{.min}', '.min'); // a{.min}.js => a.min.js
            } else {
                return def.replace('{.min}', ''); // a{.min}.js => a.js
            }
        }
    } else { // server/client specific decision
        if (def.indexOf('|') !== -1) { 
            let items = def.split('|'),
                item = '';
            if (flair.options.env.isServer) {
                item = items[0].trim();
            } else {
                item = items[1].trim();
            }
            if (item === 'x') { item = ''; } // special case to explicitely mark absence of a type
            return item;
        }            
    }
    return def; // as is
};