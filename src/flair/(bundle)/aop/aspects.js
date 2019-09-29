// Aspects API: start

/**
 * @description List of registered aspects
 * @type {AspectListItem[]}
 */
const aspectsList = [];

/**
 * @type {AspectListItem}
 * @description Aspect list item
 * @param {string} pc - pointcut definition
 * @param {regex} rex - pointcut definition regular expression
 * @param {IAspect} type - Aspect type
 */
const AspectListItem = function(pc, rex, type) {
    this.pointcut = pc;
    this.rex = rex;
    this.Aspect = type;
};

/**
 * @description Builds an id for given context that can be matched with aspectContextIdPattern
 * @param {string} typeName - qualified type name
 * @param {regex} funcName - function name
 * @returns {string} - aspectContextId
 */
const buildAspectContextId = (typeName, funcName) => {
    let _ns = '',
    _class = '',
    _func = funcName.trim();

    if (typeName.indexOf('.') !== -1) {
        _ns = typeName.substr(0, typeName.lastIndexOf('.')).trim();
        _class = typeName.substr(typeName.lastIndexOf('.') + 1).trim(); 
    } else {
        _ns = ''; // no namespace
        _class = typeName.trim();
    }
    
    return _ns + '/' + _class + ':' + _func;
};

/**
 * @description Builds a pattern for given pointcut, that can be matched with aspectContextId
 * @param {string} pointcut - pointcut identifier pattern string as -> namespace.class:func
 * @returns {regex} - aspectContextIdPattern
 * @throws {InvalidArgument}
 */
const buildAspectContextIdPattern = (pointcut) => {
    let pc = pointcut,
        _ns = '',
        _class = '',
        _func = '',
        items = null,
        _identifier = '';

    // extract func
    if(pc.indexOf(':') !== -1) {
        items = pc.split(':');
        pc = items[0].trim();
        _func = items[1].trim() || '';
        if (!_func) { throw _Exception.InvalidArgument('pointcut'); }
    } else {
        throw _Exception.InvalidArgument('pointcut');
    }

    // extract namespace and class
    if (pc.indexOf('.') !== -1) {
        _ns = pc.substr(0, pc.lastIndexOf('.')).trim();
        _class = pc.substr(pc.lastIndexOf('.') + 1).trim(); 
    } else {
        _ns = '';
        _class = pc;
    }
    if (!_class) { throw _Exception.InvalidArgument('pointcut'); }

    // only 1 section can have *, not more than one
    if (_ns === '*') { if (_class === '*' || _func === '*') { throw _Exception.InvalidArgument('pointcut'); } }
    if (_class === '*') { if (_ns === '*' || _func === '*') { throw _Exception.InvalidArgument('pointcut'); } }
    if (_func === '*') { if (_ns === '*' || _class === '*') { throw _Exception.InvalidArgument('pointcut'); } }

    // make regex
    _identifier = _ns + '\/' + _class + ':' + _func; // eslint-disable-line no-useless-escape
    _identifier = replaceAll(_identifier, '.', '[.]');    // . -> [.]
    _identifier = replaceAll(_identifier, '?', '.');      // ? -> .
    _identifier = replaceAll(_identifier, '*', '.*');     // * -> .*

    return new RegExp(_identifier);
};

/**
* @description Attach given aspects to given function
* @param {string} typeName - qualified type name
* @param {regex} funcName - function name
* @param {IAspect[]} funcAspects - function aspects to attach
* @param {function} fn - function to wrap
* @param {boolean} isASync - if fn is async
* @returns {function} - sync or async wrapped function
*/
const attachAspects = (typeName, funcName, funcAspects, fn, isASync) => {
    // note: no type checking, as this is an internal call
    let before = [],
        after = [],
        around = [],
        beforeSq = [],
        afterSq = [],
        instance = null;

    // collect all advices
    for(let Aspect of funcAspects) {
        instance = new Aspect();
        if (instance.before && instance.after) { // around type advises
            around.push(instance); 
        } else if (instance.before) { // before type
            before.push(instance); 
        } else if (instance.after) { // after type
            after.push(instance); 
        }
    }

    // build sequence of execution
    // for this case: 
    //      before1, before2, around1, around2, after1, after2
    // sequence would be: 
    //      before2, before1, around2.before, around1.before, MAIN_FN, around1.after, around2.after, after1, after2
    if (before.length > 0) { before.reverse(); } // reverse, so that first added ones execute close to main function
    for(let item of before) { beforeSq.push(item.before); }

    // first add after of around without reverse, so that after of first added ones execute close to main function
    for(let item of around) { afterSq.push(item.after); }

    if (around.length > 0) { around.reverse(); } // reverse, so that before of first added ones execute close to main function
    for(let item of around) { beforeSq.push(item.before); }
    
    // no reverse for this, so that first added ones execute close to main function
    for(let item of after) { afterSq.push(item.after); }

    // clean
    before = null; after = null; around = null;

    // context
    const FuncRunHelper = function(typeName, funcName, fn, beforeSq, afterSq, ...args) {
        let error = null,
            result = null,
            fnArgs = args,
            stage = -1, // -1: before, 0: main, 1: after
            ctx = {
                typeName: () => { return typeName; },
                funcName: () => { return funcName; },
                error: (err) => { if (err) { error = err; } return error;  },
                result: (value) => { if (stage >= 0 && typeof value !== 'undefined') { result = value; } return result; }, // can be set only after main func is executed and by after advises
                args: (...changedArgs) => { if (stage < 0 && changedArgs) { fnArgs = changedArgs; } return fnArgs; }, // can be set only before main func is executed and by before advises
                data: {} // data bag
            };
        
        this.runBeforeSq = () => {
            stage = -1; // before
            for(let beforeFn of beforeSq) {
                try {
                    beforeFn(ctx); // can update args
                } catch (err) {
                    ctx.error(err);
                }
            } 
        };
        this.runMainSync = () => {
            this.runBeforeSq();            
            try {
                stage = 0;
                ctx.result(fn(...ctx.args()));
            } catch (err) {
                ctx.error(err);
            }
            this.runAfterSq();
            return this.throwOrGiveResult();
        };
        this.runMainAsync = async () => {
            this.runBeforeSq();            
            try {
                stage = 0;
                ctx.result(await fn(...ctx.args()));
            } catch (err) {
                ctx.error(err);
            }
            this.runAfterSq();
            return this.throwOrGiveResult();
        };
        this.runAfterSq = () => {
            stage = 1; // after
            for(let afterFn of afterSq) {
                try {
                    afterFn(ctx); // can update result
                } catch (err) {
                    ctx.error(err);
                }
            }  
        };        
        this.throwOrGiveResult = () => {
            if (ctx.error()) {
                throw ctx.error();
            } else {
                return ctx.result();
            }
        };
    };

    if (isASync) { // async
        return async function (...args) {
            let fnHelper = new FuncRunHelper(typeName, funcName, fn, beforeSq, afterSq, ...args);
            return await fnHelper.runMainAsync();
        };   
    } else { // sync
        return function (...args) {
            let fnHelper = new FuncRunHelper(typeName, funcName, fn, beforeSq, afterSq, ...args);
            return fnHelper.runMainSync();
        };
    }
};

/**
 * @description Dispose aspects api internals
 * @returns {void}
 */
const aspectsDisposer = () => {
    aspectsList.length = 0;
};

// internals: end

// main api: start

/**
 * Finds matching aspects for given context
 * @param {string} typeName - qualified type name
 * @param {string} funcName - function name
 * @returns {IAspect[]} - matching aspects
 */
const Aspects = (typeName, funcName) => {
    if (typeof typeName !== 'string' || !typeName) { throw Exception.InvalidArgument('typeName'); }
    if (typeof funcName !== 'string' || !funcName) { throw Exception.InvalidArgument('funcName'); }

    // collect and return matching aspects
    let funcAspects = [],
        aspectContextId = buildAspectContextId(typeName, funcName);
    aspectsList.forEach(item => {
        if (item.rex.test(aspectContextId)) { funcAspects.push(item.Aspect); }
    });
    return funcAspects;
};

/**
 * Register given aspect type against given pointcut pattern
  * @param {string} pointcut - pointcut identifier pattern string as -> namespace.class:func
 *                            wildcard characters ? or * can be used in any or all parts of the three (namespace, class, func)
 *                            providing all three parts are necessary in any definition
 *                            using just wildcard (when the whole set name is *) is not allowed on more than one sections to prevent misuse of this feature
 * 
 *                            examples of valid and invalid strings are:
 *                              valid: *.className:funcName 
 *                              valid: *.class?:func?
 *                              valid: className:funcName  <-- root namespace
 *                              valid: namespace.*:funcName
 *                              valid: name*.*:func*
 *                              valid: namespace.className:*
 *                              valid: ?amespace.class*:?uncName
 *                              invalid: *.*:funcName
 *                              invalid: namespace.*:*
 *                              invalid: *.className:*
 * 
 *                            funcs can be of any type: static, public, protected or private
 *                            classes can be of any type: static, sealed, singleton, or normal
 * @param {string} aspectType - flair class type that implements IAspect
 * @returns {void}
 * @throws {InvalidArgument}
 */
Aspects.register = (pointcut, aspectType) => {
    if (typeof pointcut !== 'string') { throw Exception.InvalidArgument('pointcut'); }

    const { IAspect } = ns(); // sync call for root namespace
    if (!as(aspectType, IAspect)) { throw Exception.InvalidArgument('aspectType'); }

    // get pattern (regex)
    let aspectContextIdPattern = buildAspectContextIdPattern(pointcut);

    // register
    aspectsList.push(new AspectListItem(pointcut, aspectContextIdPattern, aspectType));
};

// main api: end

// expose
a2f('Aspects', Aspects, aspectsDisposer);

// Aspects API: end
