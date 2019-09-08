const guid = () => {
    return '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
const which = (def, isFile) => {
    if (isFile) { // debug/prod specific decision
        // pick minified or dev version (Dev version is picked only when isDebug is true)
        if (def.indexOf('{.min}') !== -1) {
            if (options.env.isDebug) {
                return def.replace('{.min}', ''); // a{.min}.js => a.js
            } else {
                return def.replace('{.min}', '.min'); // a{.min}.js => a.min.js
            }
        }
    } else { // server/client specific decision
        if (def.indexOf('|') !== -1) { 
            let items = def.split('|'),
                item = '';
            if (options.env.isServer) {
                item = items[0].trim();
            } else {
                item = items[1].trim();
            }
            if (item === 'x') { item = ''; } // special case to explicitly mark absence of a type

            // worker environment specific pick
            if (item.indexOf('~') !== -1) {
                items = item.split('~');
                if (!options.env.isWorker) { // left is main thread
                    item = items[0].trim();
                } else { // right is worker thread
                    item = items[1].trim(); 
                }
                if (item === 'x') { item = ''; } // special case to explicitly mark absence of a type
            }

            return item;
        }            
    }
    return def; // as is
};
const isArrow = (fn) => {
    return (!(fn).hasOwnProperty('prototype') && fn.constructor.name === 'Function');
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
const splitAndTrim = (str, splitChar) => {
    if (!splitChar) { splitChar = ','; }
    return str.split(splitChar).map((item) => { return item.trim(); });
};
const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");  // eslint-disable-line no-useless-escape
};
const replaceAll = (string, find, replace) => {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};
const stuff = (str, args) => {
    if (typeof str === 'string' && Array.isArray(args) && args.length > 0) {
        let idx = 0;
        for(let arg of args) {
            str = replaceAll(str, `%${++idx}`, arg);
        }
    }
    return str;
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
const loadFile = async (file) => { // text based file loading operation - not a general purpose fetch of any url (it assumes it is a phycical file)
    let loader = null;
    if (isServer) {
        loader = _Port('serverFile');
    } else { // client
        loader = _Port('clientFile');
    }
    return await loader(file);
};
const loadModule = async (module, globalObjName, isDelete) => {
    if (isServer) {
        return await _Port('serverModule').require(module);
    } else { // client
        let obj = await _Port('clientModule').require(module);
        if (!obj && typeof globalObjName === 'string') {
            if (isWorker) {
                obj = WorkerGlobalScope[globalObjName] || null;
                if (isDelete) { delete WorkerGlobalScope[globalObjName]; }
            } else {
                obj = window[globalObjName] || null;
                if (isDelete) { delete window[globalObjName]; }
            }
        }
        if (obj) { return obj; }
    }
};
const lens = (obj, path) => path.split(".").reduce((o, key) => o && o[key] ? o[key] : null, obj);
const globalSetting = (path, defaultValue, asIs) => {
    // any global setting (i.e., outside of a specific assembly setting) can be defined at:
    // "global" root node in appConfig/webConfig file
    //
    // Each setting can be at any depth inside "global" and its generally a good idea to namespace intelligently to
    // avoid picking someone else' setting
    //
    // specialty of global settings, apart from being outside of a specific assembly setting is that the values can
    // be simple values or a special structure having various values for various environments as:
    // 
    // global.flair.api.connections.connection1.host = "something"
    // OR
    // global.flair.api.connections.connection1.host = {
    //    "local": "something1",
    //    "dev": "something2",
    //    "stage": "something3",
    //    "prod": "something4",
    // } 
    // Based on the environment in which this code is running, it will pick relevant value
    // in case a relevant value does not exists, it gives defaultValue
    
    let _globalSettings = _AppDomain.config() ? (_AppDomain.config().global || {}) : {},
        _lensedValue = lens(_globalSettings, path),
        keyValue = '';

    // pick env specific value, if need be
    if (typeof _lensedValue === 'object' && !asIs) {
        if (options.env.isLocal) {
            keyValue = _lensedValue.local;
        } else if (options.env.isStage) {
            keyValue = _lensedValue.stage;
        } else if (options.env.isProd) {
            keyValue = _lensedValue.prod;
        } else if (options.env.isDev) {
            keyValue = _lensedValue.dev;
        }
    } else {
        keyValue = _lensedValue;
    }

    return keyValue || defaultValue;
};
const getEndpointUrl = (connection, url) => {
    // any url can have following keys:
    //  ':host': endpoint host
    //      :host can have: local, dev, test and prod scenario values
    //      this is replaced as first, so it can also have further keys in it
    //  :? anything else
    //      ? must be a unique name
    //          :version
    //          :account
    //          :locale
    //          :project
    //          :geo
    // name can be upper or lowercase, but whatever they are, they must match in connection and wherever they are used
    // e.g. 
    // "example1": {
    //     "host": {
    //         "local": "http://localhost:5001/:project/:geo",
    //         "dev": "https://:geo-:project.cloudfunctions.net",
    //         "stage": "",
    //         "prod": ""
    //     },
    //     "version": "",
    //     "locale": "",
    //     "project": "flairjs-firebase-app",
    //     "geo": "us-east1"
    // }
    // '/:host/api/:version/now' --> https://us-east1-flairjs-firebase-app.cloudfunctions.net/api/v1/now
    // value for each of these :? can be either string OR an object same as for defined above for :host
    // in case any :? is not found in settings, it will be looked for in env.props('api', '?') <-- api namespace for '?' key
    if (connection) {
        let replaceIt = (key, value) => {
            if (value) {
                key = ':' + key;
                if (typeof value !== 'string') {
                    if (options.env.isLocal) {
                        value = value.local || null;
                    } else if (options.env.isStage) {
                        value = value.stage || null;
                    } else if (options.env.isProd) {
                        value = value.prod || null;
                    } else if (options.env.isDev) {
                        value = value.dev || null;
                    }
                }
                if (value) {
                    url = replaceAll(url, key, value);
                }
            }
        };
        
        if (typeof connection === 'string') { // means this is value of the :host
            replaceIt('host', connection);
        } else { // if object -  process all keys of connection
            for(let key in connection) {
                replaceIt(key, connection[key]);
            }
        }

        // process all remaining keys from 'api' namespace in env props
        let apiNS = options.env.props('api');
        for(let key in apiNS) {
            replaceIt(key, apiNS[key]);
        }
    }
    return url;
};
const apiCall = async (url, resDataType, connectionName, reqData) => { 
    let fetchCaller = null,
        connection = (globalSetting(`flair.api.connections.${connectionName}`, null, true) || globalSetting(`flair.api.connections.auto`, null, true)),
        urlToCall = getEndpointUrl(connection, url);
    
    if (isServer) {
        fetchCaller = _Port('serverFetch');
    } else { // client
        fetchCaller = _Port('clientFetch');
    }

    return await fetchCaller(urlToCall, resDataType, reqData);
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
const deepMerge = (objects, isMergeArray = true) => { // credit: https://stackoverflow.com/a/48218209
    const isObject = obj => obj && typeof obj === 'object';
    
    return objects.reduce((prev, obj) => {
        Object.keys(obj).forEach(key => {
            const pVal = prev[key];
            const oVal = obj[key];
        
            if (Array.isArray(pVal) && Array.isArray(oVal)) {
                if (isMergeArray) {
                    prev[key] = pVal.concat(...oVal); // merge array
                } else {
                    prev[key] = [].concat(...oVal); // overwrite as new array
                }
            } else if (isObject(pVal) && isObject(oVal)) {
                prev[key] = deepMerge([pVal, oVal], isMergeArray);
            } else {
                prev[key] = oVal;
            }
        });
        return prev;
    }, {});
};
const getLoadedScript = (...scriptNames) => {
    if (isServer || isWorker) { return ''; }
    let scriptFile = '',
        baseUri = '',
        el = null;
    for(let scriptName of scriptNames) {
        for(let script of window.document.scripts) {
            if (script.src.endsWith(scriptName)) {
                el = window.document.createElement('a');
                el.href = script.src;
                baseUri = el.protocol + '//' + el.host + '/';
                el = null;
                scriptFile = './' + script.src.replace(baseUri, '');
                break;
            }
        }
        if (scriptFile) { break; }
    }
    return scriptFile;
};