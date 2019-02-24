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
const loadFile = (file) => {
    return new Promise((resolve, reject) => {
        let ext = file.substr(file.lastIndexOf('.') + 1).toLowerCase();
        if (isServer) {
            try {
                let httpOrhttps = null,
                    body = '';
                if (file.startsWith('https')) {
                    httpOrhttps = require('https');
                } else {
                    httpOrhttps = require('http'); // for urls where it is not defined
                }
                httpOrhttps.get(file, (resp) => {
                    resp.on('data', (chunk) => { body += chunk; });
                    resp.on('end', () => { 
                        if (ext === 'json') { 
                            resolve(JSON.parse(body));
                        } else {
                            resolve(body);
                        }
                    });
                }).on('error', reject);
            } catch(e) {
                reject(e);
            }
        } else { // client
            fetch(file).then((response) => {
                if (response.status !== 200) {
                    reject(response.status);
                } else {
                    if (ext === 'json') { // special case of JSON
                        response.json().then(resolve).catch(reject);
                    } else {
                        resolve(response.text());
                    }
                }
            }).catch(reject);
        }
    });
};
const loadModule = (module) => {
    return new Promise((resolve, reject) => {
        if (isServer) {
            try {
                resolve(require(module));
            } catch(e) {
                reject(e);
            }
        } else { // client
            let ext = module.substr(module.lastIndexOf('.') + 1).toLowerCase();
            try {
                if (typeof require !== 'undefined') { // if requirejs type library having require() is available to load modules / files on client
                    require([module], resolve, reject);
                } else { // load it as file on browser
                    let js = flair.options.env.global.document.createElement('script');
                    if (ext === 'mjs') {
                        js.type = 'module';
                    } else {
                        js.type = 'text/javascript';
                    }
                    js.name = module;
                    js.src = module;
                    js.onload = resolve;    // TODO: Check how we can pass the loaded 'exported' object of module to this resolve.
                    js.onerror = reject;
                    flair.options.env.global.document.head.appendChild(js);
                }
            } catch(e) {
                reject(e);
            }
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
        delete require.cache[require.resolve(module)]
        return require(module)
    } else { // eslint-disable-line no-empty
        // TODO:
    }
};
