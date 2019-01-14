// Resource
// Resource(resName, resFile)
flair.Resource = (resName, resFile, data) => {
    // start: this will be processed by build engine
    let resData = data || '';

    let isLoaded = false;
    let _res = {
        file: () => { return resFile; },
        type: () => { return resFile.substr(resFile.lastIndexOf('.') + 1).toLowerCase(); },
        get: () => { return resData; },
        load: Object.freeze({
            asJSON: () => {
                return JSON.parse(resData);
            },
            asCSS: () => {
                if (flair.options.env.isClient) {
                    if (!isLoaded) {
                        let css = flair.options.env.global.document.createElement('style');
                        css.type = 'text/css';
                        css.name = resFile;
                        css.innerHTML = resData;
                        flair.options.env.global.document.head.appendChild(css);
                        isLoaded = true;
                    }
                    return isLoaded;
                }
                return false;
            },
            asHTML: (node, position = '') => {
                // position can be: https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
                // if empty, it will replace node html
                if (flair.options.env.isClient) {
                    if (node) {
                        if (!isLoaded) {
                            if (position) {
                                node.innerHTML = resData;
                            } else {
                                node.insertAdjacentHTML(position, resData);
                            }
                            isLoaded = true;
                        }
                        return isLoaded;
                    }
                }
                return false;
            },
            asJS: (cb) => {
                if (flair.options.env.isClient) {
                    if (!isLoaded) {
                        let js = flair.options.env.global.document.createElement('script');
                        js.type = 'text/javascript';
                        js.name = resFile;
                        js.src = resData;
                        if (typeof cb === 'function') {
                            js.onload = cb;
                            js.onerror = () => { isLoaded = false; }
                        }
                        flair.options.env.global.document.head.appendChild(js);
                        isLoaded = true;
                    }
                    return isLoaded;                    
                }
                return false;
            }
        })
    };
    _res._ = {
        name: resName,
        type: 'resource',
        namespace: null,
        file: resFile,
        data: (data) => { 
            if (data && !resData) { 
                resData = data; // set only once
            }
            return resData;
        }
    };

    // set JSON automatically
    _res.JSON = {};
    try {
        _res.JSON = Object.freeze(_res.load.asJSON());
    } catch (e) {
        // ignore
    };

    // register type with namespace
    flair.Namespace(_res);

    // return
    return Object.freeze(_res);
};
flair.Resource.load = (resObj, ...args) => {
    if (resObj._ && resObj._.type === 'resource') {
        let type = resObj.type();
        switch(type) {
            case 'json':
                return resObj.load.asJSON(); break;
            case 'css':
                return resObj.load.asCSS(); break;
            case 'js':
                return resObj.load.asJS(...args); break;
            case 'html':
                return resObj.load.asHTML(...args); break;
            default:
                throw `Unknown resource type: ${type}.`;
        }
    }
    resName = ((resObj._ && resObj._.name) ? resObj._.name : 'unknown');
    throw `${resName} is not a Resource.`;
};
flair.Resource.get = (resName) => {
    let resObj = flair.Namespace.getType(resName);
    if (resObj._ && resObj._.type === 'resource') {
       return resType.get();
    }
    return null;
};
