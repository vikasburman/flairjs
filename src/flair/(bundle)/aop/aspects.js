/**
 * @name Aspects
 * @description Aspect orientation support.
 * @example
 *  .register(pointcut, Aspect)             // - void
 * @params
 *  pointcut: string - pointcut identifier string as -> [namespace.]class[:func]
 *      namespace/class/func: use wildcard characters ? or * to build the pointcut identifier
 *     
 *      Examples:
 *          abc                 - on all functions of all classes named abc in root namespace (without any namespace)
 *          *.abc               - on all functions of all classes named abc in all namespaces
 *          xyz.*               - on all functions of all classes in xyz namespace
 *          xyz.abc             - on all functions of class abc under xyz namespace
 *          xyz.abc:*           - on all functions of class abc under xyz namespace
 *          xyz.abc:f1          - on func f1 of class abc under xyz namespace
 *          xyz.abc:f?test      - on all funcs that are named like f1test, f2test, f3test, etc. in class abc under xyz namespace
 *          xyz.xx*.abc         - on functions of all classes names abc under namespaces where pattern matches xyz.xx* (e.g., xyz.xx1 and xyz.xx2)
 *          *xyx.xx*.abc        - on functions of all classes names abc under namespaces where pattern matches *xyz.xx* (e.g., 1xyz.xx1 and 2xyz.xx1)
 *     
 * Aspect: type - flair Aspect type
 */ 
const allAspects = [];
const _Aspects = {
    // register Aspect against given pointcut definition
    register: (pointcut, Aspect) => {
        if (typeof pointcut !== 'string') { throw new _Exception.InvalidArgument('pointcut'); }
        if (!_is(Aspect, 'Aspect')) { throw new _Exception.InvalidArgument('Aspect'); }
        
        // add new entry
        let pc = pointcut,
            __ns = '',
            __class = '',
            __func = '',
            __identifier = '',
            items = null;

        if (pc.indexOf(':') !== -1) { // extract func
            items = pc.split(':');
            pc = items[0].trim();
            __func = items[1].trim() || '*';
        }

        if (pc.indexOf('.') !== -1) { // extract class and namespace
            __ns = pc.substr(0, pc.lastIndexOf('.'));
            __class = pc.substr(pc.lastIndexOf('.') + 1);
        } else {
            __ns = ''; // no namespace
            __class = pc;
        }    

        // build regex
        __identifier = __ns + '\/' +__class + ':' + __func; // eslint-disable-line no-useless-escape
        __identifier = replaceAll(__identifier, '.', '[.]');    // . -> [.]
        __identifier = replaceAll(__identifier, '?', '.');      // ? -> .
        __identifier = replaceAll(__identifier, '*', '.*');     // * -> .*

        // register
        allAspects.push({rex: new RegExp(__identifier), Aspect: Aspect});
    }
};
const _get_Aspects = (typeName, funcName) => {
    // get parts
    let funcAspects = [],
        __ns = '',
        __class = '',
        __func = funcName.trim(),
        __identifier = ''

    if (typeName.indexOf('.') !== -1) {
        __ns = typeName.substr(0, typeName.lastIndexOf('.')).trim();
        __class = typeName.substr(typeName.lastIndexOf('.') + 1).trim(); 
    } else {
        __ns = ''; // no namespace
        __class = typeName.trim();
    }
    __identifier = __ns + '/' + __class + ':' + __func;

    allAspects.forEach(item => {
        if (item.rex.test(__identifier)) { 
            if (funcAspects.indexOf(item.Aspect) === -1) {
                funcAspects.push(item.Aspect);
            }
        }
    });

    // return
    return funcAspects;
};
const _attach_Aspects = (fn, typeName, funcName, funcAspects) => {
    let before = [],
        after = [],
        around = [],
        instance = null;

    // collect all advices
    for(let funcAspect of funcAspects) {
        instance = new funcAspect();
        if (instance.before !== _noop) { before.push(instance.before); }
        if (instance.around !== _noop) { around.push(instance.around); }
        if (instance.after !== _noop) { after.push(instance.after); }
    }

    // around weaving
    if (around.length > 0) { around.reverse(); }

    // weaved function
    let weavedFn = function(...args) {
        let error = null,
            result = null,
            ctx = {
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
            _result = null;
        for(let aroundFn of around) { // build a nested function call having each wrapper calling an inner function wrapped inside advices' functionality
            newFn = aroundFn(ctx, newFn);
        }                    
        try {
            _result = newFn(...args);
            if (_result && typeof _result.then === 'function') { // async function
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
    };

    // done
    return weavedFn;
};

// attach to flair
a2f('Aspects', _Aspects, () => {
    allAspects.length = 0;
});
