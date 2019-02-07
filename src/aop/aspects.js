// Aspects
let allAspects = [],
    regExpEscape = (s) => { return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'); },
    wildcardToRegExp = (s) => { return new RegExp('^' + s.split(/\*+/).map(regExpEscape).join('.*') + '$'); };
flair.Aspects = {};
flair.Aspects.raw = () => { return allAspects; }
flair.Aspects.register = (pointcut, Aspect) => {
    // pointcut: [namespace.]class[:func][/attr1[,attr2[,...]]]
    //      namespace/class/func:
    //          ~ - any
    //          *<text> - any name that ends with <text> 
    //          <text>* - any name that starts with <text>
    //          <text>  - exact name
    //      attribute:
    //          <text>  - exact name
    //
    //      Examples:
    //          ~                   - on all functions of all classes in all namespaces
    //          abc                 - on all functions of all classes names abc in root namespace (without any namespace)
    //          ~.abc               - on all functions of all classes names abc in all namespaces
    //          ~.abc:~             - on all functions of all classes names abc in all namespaces
    //          xyz.*               - on all functions of all classes in xyz namespace
    //          xyz.abc             - on all functions of class abc under xyz namespace
    //          xyz.abc:*           - on all functions of class abc under xyz namespace
    //          xyz.abc:f1          - on func f1 of class abc under xyz namespace
    //          xyz.abc:f*          - on all funcs that starts with f in class abc under xyz namespace
    //          xyz.xx*.abc         - on functions of all classes names abc under namespaces where pattern matches xyz.xx* (e.g., xyz.xx1 and xyz.xx2)
    //          xy*.xx*.abc         - on functions of all classes names abc under namespaces where pattern matches xyz.xx* (e.g., xy1.xx1 and xy2.xx1)
    //          abc/service         - on all functions of abc class in root namespace which has service attribute applied
    //          ~/service           - on all functions of all classes in all namespaces which has service attribute applied
    //          /service            - on all functions of all classes which has service attribute applied
    //          /service*           - on all functions of all classes which has service* attribute name pattern applied


    // split name and attributes
    let nm = pointcut || '~',
        ns = '',
        cls = '',
        fnc = '',
        attr = '~',     
        bucket = '';    
    if (nm.indexOf('/') !== -1) {
        let items = nm.split('/');
        nm = items[0].trim();
        attr = items[1].trim();
    }

    // get bucket to store in
    if (nm === '~') { 
        ns = '~';
        cls = '~';
        fnc = '~';
    } else if (nm === '') {
        ns = '^';
        cls = '~';
        fnc = '~';
    } else if (nm.indexOf('.') === -1) {
        ns = '^';
        if (nm.indexOf(':') === -1) {
            cls = nm;
            fnc = '~';
        } else {
            let itms = nm.split(':');
            cls = itms[0].trim();
            fnc = itms[1].trim();
        }
    } else {
        ns = nm.substr(0, nm.lastIndexOf('.'));
        nm = nm.substr(nm.lastIndexOf('.') + 1);
        if (nm.indexOf(':') === -1) {
            cls = nm;
            fnc = '~';
        } else {
            let itms = nm.split(':');
            cls = itms[0].trim();
            fnc = itms[1].trim();
        }        
    }
    if (ns === '*' || ns === '') { ns = '~'; }
    if (cls === '*' || cls === '') { cls = '~'; }
    if (fnc === '*' || fnc === '') { fnc = '~'; }
    if (attr === '*' || attr === '') { attr = '~'; }
    bucket = `${ns}=${cls}=${fnc}=${attr}`;

    // add bucket if not already there
    allAspects[bucket] = allAspects[bucket] || [];
    allAspects[bucket].push(Aspect);
};
flair.Aspects.get = (className, funcName, attrs) => {
    // get parts
    let funcAspects = [],
        ns = '',
        cls = '',
        fnc = funcName.trim();

    if (className.indexOf('.') !== -1) {
        ns = className.substr(0, className.lastIndexOf('.')).trim();
        cls = className.substr(className.lastIndexOf('.') + 1).trim(); 
    } else {
        ns = '^';
        cls = className.trim();
    }

    for(let bucket in allAspects) {
        let items = bucket.split('='),
            thisNS = items[0],
            rxNS = wildcardToRegExp(thisNS),
            thisCls = items[1],
            rxCls = wildcardToRegExp(thisCls),
            thisFnc = items[2],
            rxFnc = wildcardToRegExp(thisFnc),
            thisAttr = items[3],
            rxAttr = wildcardToRegExp(thisAttr),
            isMatched = (thisAttr === '~');
        
        if (((ns === thisNS || rxNS.test(ns)) &&
            (cls === thisCls || rxCls.test(cls)) &&
            (fnc === thisFnc || rxFnc.test(fnc)))) {
            if (!isMatched) {
                for(let attr of attrs) {
                    if (attr.name === thisAttr || rxAttr.test(attr.name)) {
                        isMatched = true;
                        break; // matched
                    }
                }
            }
            if (isMatched) {
                for(let aspect of allAspects[bucket]) {
                    if (funcAspects.indexOf(aspect) === -1) {
                        funcAspects.push(aspect);
                    }
                }                  
            }
        }
    }

    // return
    return funcAspects;
};
flair.Aspects.apply = () => {
    if (funcAspects.length > 0) {
        meta[memb].aspects = funcAspects.slice();
        Object.defineProperty(obj, memb, {
            configurable: true,
            enumerable: true,
            value: funcs.applyAspects(memb, funcAspects)
        });
    }



    applyAspects = (funcName, funcAspects) => {
        let fn = obj[funcName],
            before = [],
            after = [],
            around = [],
            instance = null,
            _fn = null;

        // collect all advices
        for(let funcAspect of funcAspects) {
            instance = new funcAspect();
            _fn = instance.before(); if (typeof _fn === 'function') { before.push(_fn); }
            _fn = instance.around(); if (typeof _fn === 'function') { around.push(_fn); }
            _fn = instance.after(); if (typeof _fn === 'function') { after.push(_fn); }
        }

        // around weaving
        if (around.length > 0) { around.reverse(); }

        // weaved function
        let weavedFn = function(...args) {
            let error = null,
                result = null,
                ctx = {
                    obj: () => { return obj; },
                    typeName: () => { return typeName; },
                    funcName: () => { return funcName; },
                    error: (err) => { if (err) { error = err; } return error;  },
                    result: (value) => { if (typeof value !== 'undefined') { result = value; } return result; },
                    args: () => { return args; },
                    data: {}
                };
            
            // run before functions
            for(let beforeFn of before) {
                try {
                    beforeFn(ctx);
                } catch (err) {
                    error = err;
                }
            }

            // after functions executor
            const runAfterFn = (_ctx) =>{
                for(let afterFn of after) {
                    try {
                        afterFn(_ctx);
                    } catch (err) {
                        ctx.error(err);
                    }
                }
            };

            // run around func
            let newFn = fn,
                isASync = false, // eslint-disable-line no-unused-vars
                _result = null;
            for(let aroundFn of around) { // build a nested function call having each wrapper calling an inner function wrapped inside advices' functionality
                newFn = aroundFn(ctx, newFn);
            }                    
            try {
                _result = newFn(...args);
                if (_result && typeof _result.then === 'function') {
                    isASync = true,
                    ctx.result(new Promise((__resolve, __reject) => {
                        _result.then((value) => {
                            ctx.result(value);
                            runAfterFn(ctx);
                            __resolve(ctx.result());
                        }).catch((err) => {
                            ctx.error(err);
                            runAfterFn(ctx);
                            __reject(ctx.error());
                        });
                    }));
                } else {
                    ctx.result(_result);
                    runAfterFn(ctx);
                }
            } catch (err) {
                ctx.error(err);
            }

            // return
            return ctx.result();
        }.bind(obj);

        // done
        return weavedFn;
    }; 

};
// TODO: MOVE get method as Aspects() itself - this is how it is used in weave function