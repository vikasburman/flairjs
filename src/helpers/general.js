const guid = () => {
    return '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
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
const isArrow = (fn) => {
    return (!(fn).hasOwnProperty('prototype'));
};
const findIndexByProp = (arr, propName, propValue) => {
    return arr.findIndex((item) => {
        return (item[propName] === propValue ? true : false);
    });
};
const findItemByProp = (arr, propName, propValue) => {
    let idx = arr.findIndex((item) => {
        return (item[propName] === propValue ? true : false);
    });
    if (idx !== -1) { return arr[idx]; }
    return null;
};
const splitAndTrim = (str) => {
    return str.split(',').map((item) => { return item.trim(); });
};
const escapeRegExp = (string) => {
    return string.replace(/([.*+?\^=!:${}()|\[\]\/\\])/g, '\\$1'); // eslint-disable-line no-useless-escape
};
const replaceAll = (string, find, replace) => {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};
const extend = (target, source, overwrite, except) => {
    if (!except) { except = []; }
    for(let item in source) {
        if (source.hasOwnProperty(item) && except.indexOf(item) === -1) { 
            if (!overwrite) { if (item in target) { continue; }}
            target[item] = source[item];
        }
    }
    return target;
};
const loadFile = (file) => {
    // TODO
};
const loadModule = (module) => {
    // TODO
};