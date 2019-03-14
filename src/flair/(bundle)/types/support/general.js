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
            if (item === 'x') { item = ''; } // special case to explicitly mark absence of a type
            return item;
        }            
    }
    return def; // as is
};
const isArrow = (fn) => {
    return (!(fn).hasOwnProperty('prototype'));
};
const isASync = (fn) => {
    return (fn.constructor.name === 'AsyncFunction');
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
const shallowCopy = (target, source, overwrite, except) => {
    if (!except) { except = []; }
    for(let item in source) {
        if (source.hasOwnProperty(item) && except.indexOf(item) === -1) { 
            if (!overwrite) { if (item in target) { continue; }}
            target[item] = source[item];
        }
    }
    return target;
};
const loadFile = (file) => { // text based file loading operation - not a general purpose fetch of any url (it assumes it is a phycical file)
    return new Promise((resolve, reject) => {
        let loader = null;
        if (isServer) {
            loader = _Port('serverFile');
        } else { // client
            loader = _Port('clientFile');
        }
        loader(file).then(resolve).catch(reject);
    });
};
const loadModule = (module) => {
    return new Promise((resolve, reject) => {
        if (isServer) {
            _Port('serverModule').require(module).then(resolve).catch(reject);
        } else { // client
            _Port('clientModule').require(module).then(resolve).catch(reject);
        }
    });
};
const sieve = (obj, props, isFreeze, add) => {
    let _props = props ? splitAndTrim(props) : Object.keys(obj); // if props are not give, pick all
    const extract = (_obj) => {
        let result = {};
        if (_props.length > 0) { // copy defined
            for(let prop of _props) { result[prop] = _obj[prop]; } 
        } else { // copy all
            for(let prop in obj) { 
                if (obj.hasOwnProperty(prop)) { result[prop] = obj[prop]; }
            }            
        }
        if (add) { for(let prop in add) { result[prop] = add[prop]; } }
        if (isFreeze) { result = Object.freeze(result); }
        return result;
    };
    if (Array.isArray(obj)) {
        let result = [];
        for(let item of obj) { result.push(extract(item)); }
        return result;
    } else {
        return extract(obj);
    }
};
const b64EncodeUnicode = (str) => { // eslint-disable-line no-unused-vars
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
};
const b64DecodeUnicode = (str) => {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}; 
const uncacheModule = (module) => {
    if (isServer) {
        _Port('serverModule').undef(module);
    } else { 
        _Port('clientModule').undef(module);
    }
};
const forEachAsync = (items, asyncFn) => {
    return Promise((resolve, reject) => {
        const processItems = (items) => {
            if (!items || items.length === 0) { resolve(); return; }
            Promise((_resolve, _reject) => {
                asyncFn(_resolve, _reject, items.shift());
            }).then(() => { processItems(items); }).catch(reject); // process one from top
        };

        // start
        processItems(items.slice());
    });
};