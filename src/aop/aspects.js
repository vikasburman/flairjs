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
