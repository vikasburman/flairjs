// Resource
// Resource(resName, resFile)
flair.Resource = (resName, resFile, data) => {
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
    
    let resData = data; // data is base64 encoded string, added by build engine
    let resType = resFile.substr(resFile.lastIndexOf('.') + 1).toLowerCase(),
        textTypes = ['txt', 'xml', 'js', 'json', 'md', 'css', 'html', 'svg'];
    
    // decode
    if (textTypes.indexOf(resType) !== -1) { // text
        if (flair.options.env.isServer) {
            let buff = new Buffer(resData).toString('base64');
            resData = buff.toString('utf8');
        } else { // client
            resData = b64DecodeUnicode(resData); 
        }
    } else { // binary
        if (flair.options.env.isServer) {
            resData = new Buffer(resData).toString('base64');
        } else { // client
            // no change, leave it as is
        }        
    }

    let _res = {
        file: () => { return resFile; },
        type: () => { return resType; },
        get: () => { return resData; },
        load: (...args) => {
            if (flair.options.env.isClient) {
                if (!_res._.isLoaded) {
                    _res._.isLoaded = true;
                    if (['gif', 'jpeg', 'jpg', 'png'].indexOf(resType) !== -1) { // image types
                        // args:    node
                        let node = args[0];
                        if (node) {
                            let image = new Image();
                            image.src = 'data:image/png;base64,' + data; // use base64 version itself
                            node.appendChild(image);
                            _res._.isLoaded = true;
                        }
                    } else { // css, js, html or others
                        let css, js, node, position = null;
                        switch(resType) {
                            case 'css':     // args: ()
                                css = flair.options.env.global.document.createElement('style');
                                css.type = 'text/css';
                                css.name = resFile;
                                css.innerHTML = resData;
                                flair.options.env.global.document.head.appendChild(css);
                                break;
                            case 'js':      // args: (callback)
                                js = flair.options.env.global.document.createElement('script');
                                js.type = 'text/javascript';
                                js.name = resFile;
                                js.src = resData;
                                if (typeof cb === 'function') {
                                    js.onload = args[0]; // callback
                                    js.onerror = () => { _res._.isLoaded = false; }
                                }
                                flair.options.env.global.document.head.appendChild(js);
                                break;           
                            case 'html':    // args: (node, position)
                                // position can be: https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
                                // if empty, it will replace node html
                                node = args[0];
                                position = args[1] || '';
                                if (node) {
                                    if (position) {
                                        node.innerHTML = resData;
                                    } else {
                                        node.insertAdjacentHTML(position, resData);
                                    }
                                }
                                break;
                            default:
                                // load not supported for all other types
                                break;
                        }
                    }
                }
            }
            return _res._.isLoaded;
        }
    };
    _res._ = {
        name: resName,
        type: 'resource',
        namespace: null,
        file: resFile,
        isLoaded: false,
        data: () => { return resData; }
    };

    // set json 
    _res.JSON = null;
    if (_res.type() === 'json') {
        try {
            _res.JSON = Object.freeze(JSON.parse(resData));
        } catch (e) {
            // ignore
        }
    }

    // register type with namespace
    flair.Namespace(_res);

    // return
    return Object.freeze(_res);
};
flair.Resource.get = (resName) => {
    let resObj = flair.Namespace.getType(resName);
    if (resObj._ && resObj._.type === 'resource') {
       return resObj.get();
    }
    return null;
};
