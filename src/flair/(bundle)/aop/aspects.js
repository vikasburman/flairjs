// Aspects API: start

let Exception = _Exception, ns = _ns, as = _as; // TODO: Remove this list when all refactored

/**
 * List of registered aspects
 * @private
 * @const {AspectListItem[]}
 */
const aspectsList = [];

/**
 * Aspect list item
 * @private
 * @constructor
 * @param {RegExp} rex - pointcut definition regular expression
 * @param {string[]} modifiers - list of modifiers for pointcut
 * @param {IAspect} type - Aspect type
 */
const AspectListItem = function(rex, modifiers, type) {
    this.rex = rex;
    this.modifiers = modifiers || [];
    this.Aspect = type;
};

/**
 * Builds an id for given context that can be matched with aspectContextIdPattern
 * @private
 * @param {string} typeName - qualified type name
 * @param {string} funcName - function name
 * @returns {RegExp} - aspectContextId
 */
const buildAspectContextId = (typeName, funcName) => {
    let _ns = '',
    _class = '',
    _func = funcName.trim();

    if (typeName.includes('.')) {
        _ns = typeName.substr(0, typeName.lastIndexOf('.')).trim();
        _class = typeName.substr(typeName.lastIndexOf('.') + 1).trim(); 
    } else {
        _ns = ''; // no namespace
        _class = typeName.trim();
    }
    
    return _ns + '/' + _class + ':' + _func;
};

/**
 * Builds a pattern for given pointcut, that can be matched with aspectContextId
 * @private
 * @param {string} pointcut - pointcut identifier pattern string as -> namespace.class:func (except modifiers)
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
    if(pc.includes(':')) {
        items = pc.split(':');
        pc = items[0].trim();
        _func = items[1].trim() || '';
        if (!_func) { throw _Exception.InvalidArgument('pointcut'); }
    } else {
        throw _Exception.InvalidArgument('pointcut');
    }

    // extract namespace and class
    if (pc.includes('.')) {
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
 * Get matching aspects for given context
 * @private
 * @param {string} typeName - qualified type name
 * @param {string} funcName - function name
 * @param {function} modifiers - modifiers probe function for this context
 * @returns {IAspect[]} - matching aspects
 */
const getAspects = (typeName, funcName, modifiers) => {
    // note: no type checking, as this is an internal call

    // collect and return matching aspects
    let funcAspects = [],
        isMatched = false,
        aspectContextId = buildAspectContextId(typeName, funcName);
    aspectsList.forEach(item => {
        isMatched = item.rex.test(aspectContextId); // pattern match
        if (isMatched) { // if pattern matched
            if (item.modifiers.length > 0) { // modifiers match is required (all listed modifiers must match)
                for(let modifier of item.modifiers) {
                    isMatched = modifiers(modifier);
                    if (!isMatched) { break; }
                }
            }
            if (isMatched) { funcAspects.push(item.Aspect); }
        }
    });
    return funcAspects;
};

/**
 * Attach given aspects to given function
 * @private
 * @param {string} typeName - qualified type name
 * @param {regex} funcName - function name
 * @param {IAspect[]} funcAspects - meta for function aspects to attach
 * @param {function} fn - function to wrap
 * @param {boolean} isASync - is async wrapper is required
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
 * Dispose aspects api internals
 * @private
 * @returns {void}
 */
const aspectsDisposer = () => {
    aspectsList.length = 0;
};

// internals: end

// main api: start

/**
 * Aspects api root
 * @public
 * @namespace Aspects
 * @property {function} register - Register given aspect type against given pointcut pattern
 */
const Aspects = {};

/**
 * Register given aspect type against given pointcut pattern
 * @public
 * @param {string} pointcut - pointcut identifier pattern string as -> namespace.class:func#modifier1,modifier2,...
 *                            wildcard characters ? or * can be used in any or all parts of the three (namespace, class, func)
 *                            classes can be of any type: static, sealed, singleton, or normal
 *                            funcs can be of any type: async, static, public, protected or private, unless speicific modifiers are provided via #
 * 
 * @example
 * // all methods of all classes of all namespaces (EXPENSIVE!)
 * '*'                                  
 * '*.*'                                
 * '*.*:*'
 * // all public async functions with matching name for specific className
 * '*.className:func*#public,async'  
 * // at root namespace for specified class and function name
 * 'className:funcName'
 * // all public methods of specified className under specified namespace
 * 'namespace.className:*#public'
 * // others
 * '*.class?:func?'
 * 'namespace.*:funcName'
 * 'name*.*:func*'
 * '?amespace.class*:?uncName'
 * 
 * @param {IAspect} aspectType - flair class type that implements IAspect
 * @return {void} nothing
 * @throws {InvalidArgumentException}
 */
Aspects.register = (pointcut, aspectType) => {
    if (typeof pointcut !== 'string') { throw Exception.InvalidArgument('pointcut'); }

    const { IAspect } = ns(); // sync call for root namespace
    if (!as(aspectType, IAspect)) { throw Exception.InvalidArgument('aspectType'); }

    // extract modifiers, which are stored separately
    let modifiers = [];
    if (pointcut.includes('#')) {
        let items = pointcut.split('#');
        pointcut = items[0].trim();
        modifiers = splitAndTrim(items[0], ',');
    }

    // get pattern (regex)
    let aspectContextIdPattern = buildAspectContextIdPattern(pointcut);

    // register
    aspectsList.push(new AspectListItem(aspectContextIdPattern, modifiers, aspectType));
};

// main api: end

// expose
a2f('Aspects', Aspects, aspectsDisposer);

// Aspects API: end
