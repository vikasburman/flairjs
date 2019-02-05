/**
 * @preserve
 * FlairJS
 * True Object Oriented JavaScript
 * Version 0.15.27
 * Tue, 05 Feb 2019 20:26:06 GMT
 * (c) 2017-2019 Vikas Burman
 * MIT
 * https://flairjs.com
 */

// eslint-disable-next-line for-direction
(function(factory) { // eslint-disable-line getter-return
    'use strict';

    // add factory extensions for server-side CLI processing
    let isServer = (typeof global !== 'undefined');
    if (isServer) { factory.build = require('./flair.build.js'); }
    
    // freeze factory
    let _factory = Object.freeze(factory);
    
    // expose as module and globally
    if (typeof define === 'function' && define.amd) { // AMD support
        define(function() { return _factory; });
    } else if (typeof exports === 'object') { // CommonJS and Node.js module support
        if (module !== undefined && module.exports) {
            exports = module.exports = _factory; // Node.js specific `module.exports`
        }
        module.exports = exports = _factory; // CommonJS
    } else if (!isServer) {
        window.Flair = _factory; // expose factory as global
    }

}).call((new Function("try {return global;}catch(e){return window;}"))(), (opts) => {
    'use strict';

    // locals
    let isServer = (new Function("try {return this===global;}catch(e){return false;}"))(),
        _global = (isServer ? global : window),
        flair = {}, 
        noop = () => {},
        options = {};   

    // reset, if already initialized
    if(_global.flair) {
        // reset all globals
        let fn = null;
        for(let name of _global.flair.members) {
            fn = _global.flair[name]._ ? _global.flair[name]._.reset : null;
            if (typeof fn === 'function') { fn(); }
            delete _global[name];
        }

        // delete main global
        delete _global.flair;

        // continue to load or end
        if (typeof opts === 'string' && opts === 'END') { return; }
    }

    // process options
    if (!opts) { 
        opts = {};
    } else if (typeof opts === 'string') { // only symbols can be given as comma delimited string
        opts = { symbols: opts.split(',').map(item => item.trim()) };
    }
    options.symbols = Object.freeze(opts.symbols || []);
    options.env = Object.freeze({
        type: (isServer ? 'server' : 'client'),
        global: _global,
        isTesting: (options.symbols.indexOf('TEST') !== -1),
        isServer: ((options.symbols.indexOf('TEST') === -1) ? isServer : (options.symbols.indexOf('SERVER') !== -1 ? true : isServer)),
        isClient: ((options.symbols.indexOf('TEST') === -1) ? !isServer : (options.symbols.indexOf('CLIENT') !== -1 ? true : !isServer)),
        isProd: (options.symbols.indexOf('DEBUG') === -1 && options.symbols.indexOf('PROD') !== -1),
        isDebug: (options.symbols.indexOf('DEBUG') !== -1),
        suppressGlobals: (typeof suppressGlobals !== 'undefined' ? opts.suppressGlobals : options.symbols.indexOf('SUPPRESS') !== -1),
        args: (isServer ? process.argv : new window.URLSearchParams(window.location.search))
    });

    // flair information
    flair.info = Object.freeze({
        name: 'FlairJS',
        version: '0.15.27',
        copyright: '(c) 2017-2019 Vikas Burman',
        license: 'MIT',
        link: 'https://flairjs.com',
        lupdate: new Date('Tue, 05 Feb 2019 20:26:06 GMT')
    });
    flair.members = [];
    flair.options = Object.freeze(options);

    // members
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
                if (item === 'x') { item = ''; } // special case to explicitely mark absence of a type
                return item;
            }            
        }
        return def; // as is
    };
    
    
    /**
     * @name Exception
     * @description Lightweight Exception class that extends Error object and serves as base of all exceptions
     * @example
     *  Exception()
     *  Exception(type)
     *  Exception(error)
     *  Exception(type, message)
     *  Exception(type, error)
     *  Exception(type, message, error)
     * @params
     *  type: string - error name or type
     *  message: string - error message
     *  error: object - inner error or exception object
     * @constructs Exception object
     * @throws
     *  None
     */  
    const _Exception = function(arg1, arg2, arg3) {
        let typ = '', msg = '', err = null;
        if (arg1) {
            if (typeof arg1 === 'string') { 
                typ = arg1; 
            } else if (typeof arg1 === 'object') {
                typ = arg1.name || 'UnknownException';
                err = arg1;
                msg = err.message;
            } else {
                typ = 'UndefinedException';
            }
        } else {
            typ = 'UndefinedException';
        }
        if (arg2) {
            if (typeof arg2 === 'string') { 
                msg = arg2; 
            } else if (typeof arg2 === 'object') {
                if (!err) { 
                    err = arg2; 
                    typ = typ || err.name;
                    msg = err.message;
                }
            } else {
                typ = 'UndefinedException';
            }               
        } else {
            if (err) { 
                typ = typ || err.name;
                msg = err.message; 
            }
        }
        if (arg3) {
            if (typeof arg3 === 'object') { 
                if (!err) { err = arg3; }
            }
        }
        if (typ && !typ.endsWith('Exception')) { typ+= 'Exception'; }
    
        let _ex = new Error(msg || '');
        _ex.name = typ || 'UndefinedException';
        _ex.error = err || null;
    
        // return
        return Object.freeze(_ex);
    };
    
    // expose
    flair.Exception = _Exception;
    flair.members.push('Exception');
    
    /**
     * @name Args
     * @description Lightweight args pattern processor proc that returns a validator function to validate arguments against given arg patterns
     * @example
     *  Args(...patterns)
     * @params
     *  patterns: string(s) - multiple pattern strings, each representing one pattern set
     *                        each pattern set can take following forms:
     *                        'type, type, type, ...' OR 'name: type, name: type, name: type, ...'
     *                          type: can be following:
     *                              > expected native javascript data types like 'string', 'number', 'function', 'array', etc.
     *                              > inbuilt flair object types like 'class', 'struct', 'enum', etc.
     *                              > custom flair object instance types which are checked in following order:
     *                                  >> for class instances: 
     *                                     isInstanceOf given as type
     *                                     isImplements given as interface 
     *                                     isMixed given as mixin
     *                                  >> for struct instances:
     *                                     isInstance of given as struct type
     *                          name: argument name which will be used to store extracted value by parser
     * @returns function - validator function that is configured for specified patterns
     * @throws
     *  InvalidArgumentException 
     */ 
    const _Args = (...patterns) => {
        if (patterns.length === 0) { throw new _Exception('InvalidArgument', 'Argument must be defined. (patterns)'); }
    
        /**
         * @description Args validator function that validates against given patterns
         * @example
         *  (...args)
         * @params
         *  args: any - multiple arguments to match against given pattern sets
         * @returns object - result object, having:
         *  raw: (array) - original arguments as passed
         *  index: (number) - index of pattern-set that matches for given arguments, -1 if no match found
         *                    if more than one patterns may match, it will stop at first match
         *  isInvalid: (function) - function to check if any match could not be achieved
         *  <name(s)>: <value(s)> - argument name as given in pattern having corresponding argument value
         *                          if a name was not given in pattern, a default unique name will be created
         *                          special names like 'raw', 'index' and 'isInvalid' cannot be used.
         * @throws
         *   InvalidArgumentException
         */    
        let _args = (...args) => {
            // process each pattern - exit with first matching pattern
            let types = null, items = null,
                name = '', type = '',
                pIndex = -1, aIndex = -1,
                matched = false,
                mCount = 0,
                result = {
                    raw: args || [],
                    index: -1,
                    isInvalid: () => { return result.index === -1; }
                };
            if (patterns) {
                for(let pattern of patterns) {
                    pIndex++; aIndex=-1; matched = false; mCount = 0;
                    types = pattern.split(',');
                    for(let item of types) {
                        aIndex++;
                        items = item.split(':');
                        if (items.length !== 2) { 
                            name = `_${pIndex}_${aIndex}`; // e.g., _0_0 or _1_2, etc.
                            type = item.trim() || '';
                        } else {
                            name = items[0].trim() || '',
                            type = items[1].trim() || '';
                        }
                        if (['raw', 'index', 'isInvalid'].indexOf(name) !== -1) { throw new _Exception('InvalidArgument', `Argument name cannot be a reserved name. (${name})`); }
                        if (aIndex > result.raw.length) { matched = false; break; }
                        if (!_is(result.raw[aIndex], type)) { matched = false; break; }
                        result[name] = result.raw[aIndex]; matched = true; mCount++;
                    }
                    if (matched && mCount === result.raw.length) {result.index = pIndex; break; }
                }
            }
    
            // return
            return result;
        };
    
        // return freezed
        return Object.freeze(_args);
    };
    
    // attach
    flair.Args = _Args;
    flair.members.push('Args');
    /**
     * @name typeOf
     * @description Finds the type of given object
     * @example
     *  typeOf(obj)
     * @params
     *  obj: object - object that needs to be checked
     * @returns string - type of the given object
     *                   it can be following:
     *                    > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
     *                    > inbuilt flair object types like 'class', 'struct', 'enum', etc.
     * @throws
     *  None
     */ 
    const _typeOf = (obj) => {
        let _type = '';
    
        // undefined
        if (typeof obj === 'undefined') { _type = 'undefined'; }
    
        // null
        if (!_type && obj === null) { _type = 'null'; }
    
        // array
        if (!_type && Array.isArray(obj)) { _type = 'array'; }
    
        // date
        if (!_type && (obj instanceof Date)) { _type = 'date'; }
    
        // flair types
        if (!_type && obj._ && obj._.type) { _type = obj._.type; }
    
        // native javascript types
        if (!_type) { _type = typeof obj; }
    
        // return
        return _type;
    };
    
    // expose
    flair.typeOf = _typeOf;
    flair.members.push('typeOf');
    /**
     * @name isInstanceOf
     * @description Checks if given flair class/struct instance is an instance of given class/struct type or
     *              if given class instance implements given interface or has given mixin mixed somewhere in class 
     *              hierarchy
     * @example
     *  isInstanceOf(obj, type)
     * @params
     *  obj: object - flair object that needs to be checked
     *  type: string OR class OR struct OR interface OR mixin - type to be checked for, it can be following:
     *                         > fully qualified type name
     *                         > type reference
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    const _isInstanceOf = (obj, type) => {
        let _objType = _typeOf(obj),
            _typeType = _typeOf(type),
            isMatched = false;
        if (['instance', 'sinstance'].indexOf(_objType) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
        if (['string', 'class', 'interface', 'struct', 'mixin'].indexOf(_typeType) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (type)'); }
    
        switch(_objType) {
            case 'instance':
                switch(_typeType) {
                    case 'class':
                        isMatched = obj._.isInstanceOf(type); break;
                    case 'interface':
                        isMatched = obj._.isImplements(type); break;
                    case 'mixin':
                        isMatched = obj._.isMixed(type); break;
                    case 'string':
                        isMatched = obj._.isInstanceOf(type);
                        if (!isMatched) { isMatched = obj._.isImplements(type); }
                        if (!isMatched) { isMatched = obj._.isMixed(type); }
                        break;
                }
                break;
            case 'sinstance':
                switch(_typeType) {
                    case 'string':
                    case 'struct':
                        isMatched = obj._.isInstanceOf(type); 
                        break;
                }
                break;
        }
    
        // return
        return isMatched;
    };
    
    // attach
    flair.isInstanceOf = _isInstanceOf;
    flair.members.push('isInstanceOf');
    /**
     * @name is
     * @description Checks if given object is of a given type
     * @example
     *  is(obj, type)
     * @params
     *  obj: object - object that needs to be checked
     *  type: string OR type - type to be checked for, it can be following:
     *                         > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
     *                         > any 'flair' object or type
     *                         > inbuilt flair object types like 'class', 'struct', 'enum', etc.
     *                         > custom flair object instance types which are checked in following order:
     *                           >> for class instances: 
     *                              isInstanceOf given as type
     *                              isImplements given as interface 
     *                              isMixed given as mixin
     *                           >> for struct instances:
     *                              isInstance of given as struct type
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    const _is = (obj, type) => {
        // obj may be undefined or null or false, so don't check
        if (_typeOf(type) !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (type)'); }
        let isMatched = false, 
            _typ = '';
    
        if (obj) {
            // array
            if (type === 'array' || type === 'Array') { isMatched = Array.isArray(obj); }
    
            // date
            if (!isMatched && (type === 'date' || type === 'Date')) { isMatched = (obj instanceof Date); }
    
            // flair
            if (!isMatched && (type === 'flair' && obj._ && obj._.type)) { isMatched = true; }
    
            // native javascript types
            if (!isMatched) { isMatched = (typeof obj === type); }
    
            // flair types
            if (!isMatched) {
                if (obj._ && obj._.type) { 
                    _typ = obj._.type;
                    isMatched = _typ === type; 
                }
            }
            
            // flair custom types
            if (!isMatched && _typ && ['instance', 'sinstance'].indexOf(_typ) !== -1) { isMatched = _isInstanceOf(obj, type); }
        }
    
        // return
        return isMatched;
    };
    
    // attach
    flair.is = _is;
    flair.members.push('is');
    /**
     * @name isDerivedFrom
     * @description Checks if given flair class type is derived from given class type, directly or indirectly
     * @example
     *  isDerivedFrom(type, parent)
     * @params
     *  type: class - flair class type that needs to be checked
     *  parent: string OR class - class type to be checked for being in parent hierarchy, it can be following:
     *                            > fully qualified class type name
     *                            > class type reference
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    const _isDerivedFrom = (type, parent) => {
        if (_typeOf(type) !== 'class') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (type)'); }
        if (['string', 'class'].indexOf(_typeOf(parent)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (parent)'); }
        return type._.isDerivedFrom(parent);
    }; 
    
    // attach
    flair.isDerivedFrom = _isDerivedFrom;
    flair.members.push('isDerivedFrom');
    
    /**
     * @name isImplements
     * @description Checks if given flair class instance or class implements given interface
     * @example
     *  isImplements(obj, intf)
     * @params
     *  obj: object - flair object that needs to be checked
     *  intf: string OR interface - interface to be checked for, it can be following:
     *                              > fully qualified interface name
     *                              > interface type reference
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    const _isImplements = (obj, intf) => {
        if (['instance', 'class'].indexOf(_typeOf(obj)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
        if (['string', 'interface'].indexOf(_typeOf(intf)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (intf)'); }
        return obj._.isImplements(intf);
    };
    
    // attach
    flair.isImplements = _isImplements;
    flair.members.push('isImplements');
    /**
     * @name isMixed
     * @description Checks if given flair class instance or class has mixed with given mixin
     * @example
     *  isMixed(obj, mixin)
     * @params
     *  obj: object - flair object that needs to be checked
     *  mixin: string OR mixin - mixin to be checked for, it can be following:
     *                           > fully qualified mixin name
     *                           > mixin type reference
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    const _isMixed = (obj, mixin) => {
        if (['instance', 'class'].indexOf(_typeOf(obj)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
        if (['string', 'mixin'].indexOf(_typeOf(mixin)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (mixin)'); }
        return obj._.isMixed(mixin);
    };
    
    // attach
    flair.isMixed = _isMixed;
    flair.members.push('isMixed');
    /**
     * @name as
     * @description Checks if given object can be consumed as an instance of given type
     * @example
     *  as(obj, type)
     * @params
     *  obj: object - object that needs to be checked
     *  type: string OR type - type to be checked for, it can be following:
     *                         > expected native javascript data types like 'string', 'number', 'function', 'array', 'date', etc.
     *                         > any 'flair' object or type
     *                         > inbuilt flair object types like 'class', 'struct', 'enum', etc.
     *                         > custom flair object instance types which are checked in following order:
     *                           >> for class instances: 
     *                              isInstanceOf given as type
     *                              isImplements given as interface 
     *                              isMixed given as mixin
     *                           >> for struct instances:
     *                              isInstance of given as struct type
     * @returns object - if can be used as specified type, return same object, else null
     * @throws
     *  InvalidArgumentException
     */ 
    const _as = (obj, type) => {
        if (_is(obj, type)) { return obj; }
        return null;
    };
    
    // attach
    flair.as = _as;
    flair.members.push('as');
    /**
     * @name using
     * @description Ensures the dispose of the given object instance is called, even if there was an error 
     *              in executing processor function
     * @example
     *  using(obj, fn)
     * @params
     *  obj: object - object that needs to be processed by processor function
     *                If a disposer is not defined for the object, it will not do anything
     *  fn: function - processor function
     * @returns any - returns anything that is returned by processor function, it may also be a promise
     * @throws
     *  InvalidArgumentException
     *  Any exception that is raised in given function, is passed as is
     */ 
    const _using = (obj, fn) => {
        if (_typeOf(obj) !== 'instance') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (obj)'); }
        if (_typeOf(fn) !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (fn)'); }
    
        let result = null,
            isDone = false,
            isPromiseReturned = false,
            doDispose = () => {
                if (!isDone && typeof obj._.dispose === 'function') {
                    isDone = true; obj._.dispose();
                }
            };
        try {
            result = fn(obj);
            if(result && typeof result.finally === 'function') { // a promise is returned
                isPromiseReturned = true;
                result = result.finally((args) => {
                    doDispose();
                    return args;
                });
            }
        } finally {
            if (!isPromiseReturned) { doDispose(); }
        }
    
        // return
        return result;
    };
    
    // attach
    flair.using = _using;
    flair.members.push('using');
    /**
     * @name attr
     * @description Decorator function to apply attributes on type and member definitions
     * @example
     *  attr(attrName)
     *  attr(attrName, ...args)
     * @params
     *  attrName: string - Name of the attribute, it can be an internal attribute or a DI container registered attribute name
     *  args: any - Any arguments that may be needed by attribute
     * @returns void
     * @throws
     *  InvalidArgumentException 
     */ 
    const _attr = (name, ...args) => {
        if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
    
        let Attr = null;
        if (typeof name === 'string') {
            Attr = flair.Container(name); // gets the first one
        } else {
            Attr = name;
            name = Attr._.name;
        }
    
        // push in its own bucket
        _attr._.bucket.push({name: name, Attr: Attr, args: args});
    };
    _attr._ = Object.freeze({
        bucket: []
    });
    _attr.collect = () => {
        let attrs = _attr._.bucket.slice();
        _attr.clear();
        return attrs;
    }
    _attr.has = (name) => {
        return (_attr._.bucket.findIndex(item => item.name === name) !== -1);
    };
    _attr.clear = () => {
        _attr._.bucket.length = 0; // remove all
    };
    
    // attach
    flair.attr = _attr;
    flair.members.push('attr');
    const copyMembers = (sources, dest) => {
        for(let src of sources) {
            if (src) {
                for(let item in src) {
                    if (src.hasOwnProperty(item)) { dest[item] = src[item]; }
                }
            }
        }
        return dest;
    };
    const extractMixinsAndInterfaces = (mixinsAndInterfaces) => {
        let result = {
            mixins: [],
            interfaces: []
        };
        for(let item of mixinsAndInterfaces) {
            switch (item._.type) {
                case 'mixin': result.mixins.push(item); break;
                case 'interface': result.interfaces.push(item); break;
            }
        }
        return result;
    };
    const buildTypeInstance = (type, Type, typeName, mex, inherits, mixinsAndInterfaces, cfg, obj, factory, params) => {
        // singleton instance, if already created
        if (cfg.singleton && Type._.singleInstance()) {
            return Type._.singleInstance();
        }
    
        // define vars
        let _noop = noop,
            exposed_obj = {},
            mixin_being_applied = null,
            mixins = [],
            interfaces = [],
            typeArgs = [],
            staticInterface = Type, // Type itself is the static interface
            isNeedProtected = false,
            theFlag = '__flag__',
            _typeMetaMemberName = '____type',
            _constructName = '_construct',
            _disposeName = '_dispose',
            def = {},
            meta = null,
            props = null,
            events = null,
            proxy = null,
            isBuildingObj = false;
    
        const member = {
            isSpecial: (memberName) => {
                return [_constructName, _disposeName, _typeMetaMemberName, '_'].indexOf(memberName) !== -1;
            },
            isConditional: (memberName) => {
                return attrs.has('conditional', memberName);
            },
            isDefined: (memberName) => {
                let result = false,
                    i = 0,
                    hierarchy = obj._.instanceOf.slice().reverse(); // start looking from last item first
                for(let item of hierarchy) {
                    if (i !== 0) { // skip first item, which is current level
                        if (item.meta[memberName]) { result = true; break; }
                    }
                    i++;
                }
                return result;
                // NOTE: Consideration pending - what if a private/protected member defined with same name in some parent type?
            },
            isOwn: (memberName) => {
                return typeof meta[memberName] !== 'undefined';
            },
            type: (memberName) => {
                let result = '';
                if (typeof meta[memberName] !== 'undefined') {
                    result = meta[memberName].type;
                } else {
                    for(let instance of obj._.instanceOf) {
                        if (instance.meta[memberName]) {
                            result = instance.meta[memberName].type;
                            break;
                        }
                    }
                }
                return result;                        
            },
            isProperty: (memberName) => {
                return member.type(memberName) === 'prop';
            },
            isEvent: (memberName) => {
                return member.type(memberName) === 'event';
            },
            isFunction: (memberName) => {
                return member.type(memberName) === 'func';
            },
            attrs: (memberName) => {
                if (meta[memberName]) {
                    return meta[memberName].slice();
                }
                return [];
            },
            meta: (memberName) => {
                return meta[memberName] || [];
            },
            isSerializable: (memberName) => {
                return attrs.has('serialize', memberName);
            },
            isReadOnly: (memberName) => {
                return attrs.has('readonly', memberName);
            },
            isStatic: (memberName) => {
                return attrs.has('static', memberName);
            },
            isSealed: (memberName) => {
                return attrs.has('sealed', memberName);
            },
            isPrivate: (memberName) => {
                return attrs.has('private', memberName);
            },
            isProtected: (memberName) => {
                return attrs.has('protected', memberName);
            },
            isDerived: (memberName) => {
                if (member.isOwn(memberName)) { return false; }
                return (obj._.instanceOf.findIndex((item) => {
                    return (item.meta[memberName] ? true : false);
                }) !== -1);
            },
            isHidden: (memberName) => {
                return attrs.has('hide', memberName);
            }
        };
        const attrs = {
            get: (attrName, memberName, isDeepCheck, isIgnoreCurrent) => {
                let foundAttr = null,
                    hierarchy = obj._.instanceOf.slice().reverse(); // start looking from last item first
                if (isDeepCheck) {
                    if (isIgnoreCurrent) { hierarchy.shift(); } // remove top (current) one
                } else {
                    hierarchy = [hierarchy[0]]; // current meta
                }
                for(let item of hierarchy) {
                    if (item.meta[memberName]) {
                        for(let attrItem of item.meta[memberName]) {
                            if (attrItem.name === attrName) {
                                foundAttr = attrItem;
                                break;
                            }
                        }
                        if (foundAttr) { break; }
                    }
                }
                return foundAttr; 
            },
            has: (attrName, memberName, isDeepCheck, isIgnoreCurrent) => {
                return (attrs.get(attrName, memberName, isDeepCheck, isIgnoreCurrent) ? true : false);
            },
            getArgs: (attrName, memberName, isDeepCheck, isIgnoreCurrent) => {
                let foundAttr = attrs.get(attrName, memberName, isDeepCheck, isIgnoreCurrent);
                return (foundAttr ? foundAttr.args : []);
            }
        };
        const funcs = {
            getParentMeta: (memberName) => {
                let item = obj._.instanceOf[obj._.instanceOf.length - 1]; // immediate parent
                return item.meta[memberName] || null;
            },
            isConditionalOK: (memberName) => {
                let isOK = true,
                    attrArgs = attrs.getArgs('conditional', memberName, false),
                    condition = (attrArgs.length > 0 ? attrArgs[0] : '');
                if (condition) {
                    switch(condition) {
                        case 'server':
                            isOK = (options.env.isServer === true); break;
                        case 'client':
                            isOK = (options.env.isServer === false); break;
                        default:
                            isOK = options.symbols.indexOf(condition) !== -1; break;
                    }
                } 
                return isOK;
            },    
            collectTypeAttributes: () => {
                meta[_typeMetaMemberName] = _attr.collect(); // collect and clear for next bunch on next member
            },         
            applyAttrs: (memberName) => {
                let Attr = null,
                    targetType = meta[memberName].type,
                    attrArgs = null,
                    attrInstance = null,
                    decorator = null;
                for(let info of meta[memberName]) {
                    Attr = info.Attr;
                    if (Attr) {
                        attrArgs = info.args || [];
                        attrInstance = new Attr(...attrArgs);
                        decorator = attrInstance.decorator(); // get decorator function
                        if (typeof decorator === 'function') {
                            let desc = Object.getOwnPropertyDescriptor(obj, memberName);
                            decorator(obj, targetType, memberName, desc);
                            Object.defineProperty(obj, memberName, desc);
                        } else {
                            throw new _Exception('NotDefined', `Decorator is not defined for applied attribute. (${info.name})`);
                        }
                    } else {
                        // this could be an inbuilt attribute which are handled differently
                    }
                }
            },
            isArrow: (fn) => {
                return (!(fn).hasOwnProperty('prototype'));
            },
            guid: guid,
            addInstanceMeta: () => {
                // general meta information   
                obj._ = funcs.copyMembers([obj._, mex], {}); 
                obj._.type = type;
                obj._.Type = () => { return obj._.instanceOf[obj._.instanceOf.length - 1].type; };
                obj._.namespace = null;
                obj._.assembly = () => { return flair.Assembly.get(typeName) || null; };
                obj._.id = funcs.guid();
    
                // hierarchy information (even if inheritance is not configured)
                // when inheritance is not supported, it will have only two entries - one for Object and second for the type itself
                obj._.instanceOf = obj._.instanceOf || [];
                if (obj._.instanceOf.length === 0) { // nothing is defined as yet
                    obj._.instanceOf.push(funcs.topLevelObjectDef()); // everything inherits from Object
                }
                obj._.instanceOf.push(def); // whatever is defined
                obj._.isInstanceOf = (name) => {
                    if (!name) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                    if (name._ && name._.name) { name = name._.name; } 
                    return (obj._.instanceOf.findIndex((item) => { return item.name === name; }) !== -1);
                };
                
                // serialization support
                if (cfg.serialize) {
                    obj._.serialize = () => {
                        return funcs.processJson(obj, {});
                    };
                    obj._.deserialize = (json) => {
                        funcs.processJson(json, obj, true);
                    };    
                }
    
                // mixins support
                if (cfg.mixins) {
                    obj._.isMixed = (name) => {
                        if (!name) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                        if (name._ && name._.name) { name = name._.name; } 
                        let result = false;
                        for (let item of obj._.instanceOf) {
                            for(let _mixin of item.mixins) {
                                if (_mixin._.name === name) {
                                    result = true; break;
                                }
                                if (result) { break; }
                            }
                        }
                        return result;                    
                    };        
                }
    
                // interface support
                if (cfg.interfaces) {
                    obj._.isImplements = (name) => {
                        if (!name) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                        if (name._ && name._.name) { name = name._.name; } 
                        let result = false;
                        for (let item of obj._.instanceOf) {
                            for(let _interface of item.interfaces) {
                                if (_interface._.name === name) {
                                    result = true; break;
                                }
                                if (result) { break; }
                            }
                        }
                        return result;                    
                    };        
                }
    
                // for internal member's and attrs reflector support
                obj._._ = {};
                obj._._.raw = (name) => {
                    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                    if (meta[name] && meta[name].raw) { return meta[name].raw; }
                    return null;
                };  
                obj._._.member = member;
                obj._._.attrs = attrs;
                obj._._.type = types;
    
            },
            buildDef: () => {
                def = { 
                    name: typeName,
                    type: Type,
                    meta: {},
                    mixins: mixins,
                    interfaces: interfaces,
                    props: {},
                    events: []
                };
                
                // handy shortcuts for current definition
                meta = def.meta;
                props = def.props;
                events = def.events;
            },
            topLevelObjectDef: () => {
                return { 
                    name: 'Object',
                    type: Object,
                    meta: {},
                    mixins: mixins,
                    interfaces: interfaces,
                    props: {},
                    events: []
                };
            },
            extractMixinsAndInterfaces: () => {
                let result = extractMixinsAndInterfaces(mixinsAndInterfaces);
                mixins = result.mixins;
                interfaces = result.interfaces;
            },
            copyMembers: copyMembers,
            processJson: (source, target, isDeserialize) => {
                let mappedName = '';
                for(let memb in obj) {
                    if (obj.hasOwnProperty(memb)) {
                        if ((member.type(memb) === 'prop') &&
                            member.isSerializable(memb) &&
                            !member.isReadOnly(memb) && 
                            !member.isStatic(memb) && 
                            !member.isPrivate(memb) && 
                            !member.isProtected(memb) && 
                            !member.isSpecial(memb)) {
                                mappedName = attrs.getArgs('serialize', memb, true)[0] || memb;
                                if (isDeserialize) {
                                    target[memb] = source[mappedName] || target[memb];
                                } else {
                                    target[mappedName] = source[memb];
                                }
                        }
                    }
                }
            },
            applyAspects: (funcName, funcAspects) => {
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
            },       
            weave: () => {
                // validate
                if (['Attribute', 'Aspect'].indexOf(typeName) !== -1) { return; } // these are base types related to this functionality
                if (obj._.isInstanceOf('Attribute') || obj._.isInstanceOf('Aspect')) { return; }
    
                let funcAspects = [];
                for(let memb in meta) {
                    if (meta.hasOwnProperty(memb) && meta[memb].type === 'func' && !member.isSpecial(memb)) {
                        funcAspects = flair.Aspects(typeName, memb, meta[memb]);
                        if (funcAspects.length > 0) {
                            meta[memb].aspects = funcAspects.slice();
                            Object.defineProperty(obj, memb, {
                                configurable: true,
                                enumerable: true,
                                writable: true,
                                value: funcs.applyAspects(memb, funcAspects)
                            });
                        }
                    }
                }
            },
            constructObj: () => {
                // construction logic
                typeArgs = params.args;
                if (cfg.inheritance) {
                    if (params._flag && params._flag === theFlag) {
                        isNeedProtected = true;
                        if (cfg.static) {
                            staticInterface = params._static; // redefine to being the same type of parent class
                        }                    
                    }
                    // create parent instance
                    let Parent = Type._.inherits;
                    if (Parent) {
                        if (Parent._.isSealed() || Parent._.isSingleton()) {
                            throw new _Exception('InvalidOperation', `Cannot inherit from a sealed/singleton type. (${Parent._.name})`); 
                        }
                        if (Parent._.type !== Type._.type) {
                            throw new _Exception('InvalidOperation', `Cannot inherit from another type. (${Parent._.name})`); 
                        }
                        obj = new Parent(theFlag, staticInterface, ...typeArgs); // obj reference is now parent object
                    }
                }
            },
            buildObj: () => {
                // building started
                isBuildingObj = true;
    
                // clean syntax definition approach using proxy
                // trapping all set definitions and routing them to relevant
                // handlers
                proxy = new Proxy({}, {
                    get: (_obj, prop) => {
                        return obj[prop];
                    },
                    set: (_obj, prop, value) => {
                        if (isBuildingObj) {
                            if (prop === 'construct') {
                                obj.construct(value);
                            } else if (prop === 'dispose') {
                                obj.dispose(value);
                            } else if (['func', 'prop', 'event'].indexOf(prop) !== -1) {
                                throw new _Exception('InvalidOperation', `Inbuilt helper functions cannot be reassigned. (${prop})`);
                            } else {
                                if (typeof value === 'function') { // function or event
                                    if (_attr.has('event')) {
                                        obj.event(prop, value);
                                    } else { // function
                                        obj.func(prop, value);
                                    }
                                } else { // property
                                    obj.prop(prop, value);
                                }
                            }
                        } else {
                            if (typeof obj[prop] === 'function' && typeof value === 'function') { // a function or event is being redefined
                                throw new _Exception('InvalidOperation', `Redefinition of members at runtime is not allowed. (${prop})`);
                            }
    
                            // allow setting property values
                            obj[prop] = value;
                        }
                        return true;
                    }
                });
    
                // attach definition helpers
                if (cfg.func) { obj.func = helpers._func; }
                if (cfg.prop) { obj.prop = helpers._prop; }
                if (cfg.event) { obj.event = helpers._event; }
                if (cfg.construct) { obj.construct = helpers._construct; }
                if (cfg.dispose) { obj.dispose = helpers._dispose; }
    
                // construct using factory
                factory.apply(proxy);
    
                // abstract consideration
                if (cfg.inheritance) {
                    if (params._flag !== theFlag && types.isAbstract()) {
                        throw new _Exception('InvalidOperation', `Cannot create instance of an abstract type. (${typeName})`); 
                    }            
                }
    
                // apply mixins
                if (cfg.mixins) {
                    for(let mixin of mixins) {
                        if (mixin._.type === 'mixin') {
                            mixin_being_applied = mixin;
                            mixin.apply(proxy);
                            mixin_being_applied = null;
                        }
                    }            
                }    
                
                // detach definition helpers
                if (cfg.func) { delete obj.func; }
                if (cfg.prop) { delete obj.prop; }
                if (cfg.event) { delete obj.event; }
                if (cfg.construct) { delete obj.construct; }
                if (cfg.dispose) { delete obj.dispose; }
     
                // building ends
                isBuildingObj = false;
            },
            processConstructor: () => {
                if (typeof obj[_constructName] === 'function') {
                    obj._.constructing = true;
                    obj[_constructName](...typeArgs);
                    obj._.construct = obj[_constructName];
                    delete obj[_constructName];
                    delete obj._.constructing;
                }
            },
            processDestructor: () => {
                if (typeof obj[_disposeName] === 'function') {
                    obj._.dispose = obj[_disposeName];
                    delete obj[_disposeName];
                }
            },
            buildExposedObj: () => {
                // build
                let isCopy = false,
                    doCopy = (memberName) => {
                        Object.defineProperty(exposed_obj, memberName, Object.getOwnPropertyDescriptor(obj, memberName));
                    };
    
                // copy system member
                doCopy('_');
                
                // copy other members
                for(let memberName in obj) {
                    isCopy = false;
                    if (obj.hasOwnProperty(memberName)) {
                        isCopy = true;
                        if (member.isOwn(memberName)) {
                            if (member.isPrivate(memberName)) { isCopy = false; }
                            if (isCopy && (member.isProtected(memberName) && !isNeedProtected)) { isCopy = false; }
                        } else {  // some derived member (protected or public) OR some directly added member
                            if (member.isProtected(memberName) && !isNeedProtected) { isCopy = false; }
                            if (isCopy && !member.isDerived(memberName)) { isCopy = false; } // some directly added member
                        }
                    }
                    if (cfg.hide) { if (isCopy && member.isHidden(memberName)) { isCopy = false; } }
                    if (isCopy) { doCopy(memberName); }
    
                    // rewire event definition when at the top level object creation step
                    if (isCopy && !isNeedProtected && member.isEvent(memberName)) {
                        exposed_obj[memberName].rewire(exposed_obj);
                    }
                }
    
                // sealed attribute for members are handled at the end
                for(let memberName in exposed_obj) {
                    if (!member.isSpecial(memberName) && member.isOwn(memberName) && member.isSealed(memberName)) {
                        Object.defineProperty(exposed_obj, memberName, {
                            configurable: false
                        });
                    }
                }            
            },
            validateInterfaces: () => {
                for(let _interface of interfaces) {
                    for(let _memberName in _interface) {
                        if (_interface.hasOwnProperty(_memberName) && _memberName !== '_') {
                            let _member = _interface[_memberName],
                                _type = typeof exposed_obj[_memberName];
                            if (_type === 'undefined') { throw new _Exception('NotDefined', `Interface (${_interface._.name}) member is not defined. (${_memberName})`); }
                            switch(_member.type) {
                                case 'func':
                                    if (_type !== 'function') { throw new _Exception('NotDefined', `Interface (${_interface._.name}) member is not defined as a function. (${_memberName})`); } 
                                    if (meta[_memberName].interfaces.indexOf(_interface) === -1) { meta[_memberName].interfaces.push(_interface); }
                                    break;
                                case 'prop':
                                    if (_type === 'function') { throw new _Exception('NotDefined', `Interface (${_interface._.name}) member is not defined as a property. (${_memberName})`); }
                                    if (meta[_memberName].interfaces.indexOf(_interface) === -1) { meta[_memberName].interfaces.push(_interface); }
                                    break;
                                case 'event':
                                    if (_type !== 'function' || typeof exposed_obj[_memberName].subscribe !== 'function') { throw new _Exception('NotDefined', `Interface (${_interface._.name}) member is not defined as an event. (${_memberName})`); }
                                    if (meta[_memberName].interfaces.indexOf(_interface) === -1) { meta[_memberName].interfaces.push(_interface); }
                                    break;
                            }
                        }
                    }
                }
            },
            storeObjects: () => {
                obj._.pu = (isNeedProtected ? null : exposed_obj);
                obj._.pr = (isNeedProtected ? null : obj);
            },
            storeInstance: () => {
                Type._.isSingleton = () => { return true; };
                Type._.singleInstance = () => { return Object.freeze(exposed_obj); }; // assume it sealed as well
                Type._.singleInstance.clear = () => { 
                    Type._.singleInstance = () => { return null; };
                    Type._.isSingleton = () => { return false; };
                };
            },
            setTypeSealed: () => {
                Type._.isSealed = () => { return true; };
            }
        };
        const types = {
            isSingleton: () => {
                return attrs.has('singleton', _typeMetaMemberName);
            },
            isAbstract: () => {
                return attrs.has('abstract', _typeMetaMemberName);
            },
            isSealed: () => {
                return attrs.has('sealed', _typeMetaMemberName);
            }
        };
        const helpers = {
            _func: (name, fn) => {
                if (!name) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                if (typeof name === 'function') { fn = name; name = _constructName; } // constructor shorthand definition
                if (name === '_') { new _Exception('InvalidName', `Name is not valid. (${name})`); }
    
                if (!fn) { fn = _noop; } // just a placeholder function
    
                // pick mixin being applied at this time
                if (cfg.mixins) {        
                    if (mixin_being_applied !== null) {
                        _attr('mixed', mixin_being_applied);
                    }
                }
    
                // collect attributes
                meta[name] = _attr.collect(); // collect and clear for next bunch on next member
                meta[name].type = 'func';
                if (cfg.aop) {
                    meta[name].aspects = []; // which all aspects are applied to this func
                }
                if (cfg.interfaces) {
                    meta[name].interfaces = []; // to which all interfaces this func complies to
                }        
    
                // constructor check
                if (!cfg.construct && name === _constructName) {
                    throw new _Exception('InvalidOperation', `A constructor function cannot be defined on this type. (${name})`);
                }
    
                // destructor check
                if (!cfg.dispose && name === _disposeName) {
                    throw new _Exception('InvalidOperation', `A destructor function cannot be defined on this type. (${name})`);
                }
    
                // conditional check
                if (cfg.conditional) {
                    if (!funcs.isConditionalOK(name)) { delete meta[name]; return; }
                }
    
                // override check
                let isDefinedHere = false,
                    _theFn = null;
                if (cfg.inheritance) {
                    if (attrs.has('override', name)) {
                        // check to find what to override
                        let desc = Object.getOwnPropertyDescriptor(obj, name);
                        if (!desc || typeof desc.value !== 'function') { 
                            throw new _Exception('InvalidOperation', `Function is not found to override. (${name})`); 
                        }
    
                        // double check that it is actually defined in hierarchy
                        if (!member.isDefined(name)) {
                            throw new _Exception('InvalidOperation', `Function is not found to override. (${name})`); 
                        }
    
                        // check if in parent it is not sealed
                        if (attrs.has('sealed', name, true, true)) {
                            throw new _Exception('InvalidOperation', `Cannot override a sealed function. (${name})`); 
                        }
            
                        // check for static
                        if (cfg.static) {
                            if (attrs.has('static', name, true, true)) {
                                throw new _Exception('InvalidOperation', `Cannot override a static function. (${name})`); 
                            }
                        }
    
                        // redefine
                        let base = obj[name].bind(obj);
                        _theFn = function(...args) {
                            let fnArgs = [base].concat(args); // run fn with base as first parameter
                            if (funcs.isArrow(fn)) { // arrow function
                                return fn(...fnArgs);
                            } else { // normal func
                                return fn.apply(obj, fnArgs);
                            }
                        }.bind(obj);
                        isDefinedHere = true;
                    } 
                } else {
                    // duplicate check
                    if (cfg.duplicate) {
                        if (member.isDefined(name)) { 
                            throw new _Exception('InvalidOperation', `A member with this name is already defined. (${name})`); 
                        }
                    }
                }
                
                // define fresh if not already defined
                if (!isDefinedHere) {
                    if (cfg.static) {
                        if (attrs.has('static', name)) {
                            // shared (static) copy bound to staticInterface
                            // so with 'this' it will be able to access only static properties
                            if (funcs.isArrow(fn)) {
                                throw new _Exception('InvalidOperation', `Static functions must not be defined as arrow function. (${name})`);
                            }
                            _theFn = function(...args) {
                                return fn.apply(staticInterface, args);
                            }.bind(staticInterface);
                            
                            // define
                            if (!staticInterface[name]) {
                                staticInterface[name] = _theFn;
                            }
                            isDefinedHere = true;
                        }
                    }
                }
                if (!isDefinedHere) { // normal func
                    _theFn = function(...args) {
                        if (funcs.isArrow(fn)) {
                            return fn(...args);
                        } else { // function
                            return fn.apply(obj, args);
                        }
                    }.bind(obj);
                }
    
                // define on object, even if this is static func, this will
                // ensure consistency, the only diff is that static function runs in context of
                // static interface as 'this' as opposed to obj being 'this' for instance func
                Object.defineProperty(obj, name, {
                    configurable: true,
                    enumerable: true,
                    value: _theFn
                });
    
                // apply custom attributes
                if (cfg.customAttrs) {
                    funcs.applyAttrs(name);
                }
                
                // finally hold the references for reflector
                meta[name].ref = obj[name];
                meta[name].raw = fn;
            },
            _construct: (fn) => {
                helpers._func(_constructName, fn);
            },
            _dispose: (fn) => {
                helpers._func(_disposeName, fn);
            },
            _prop: (name, valueOrGetterOrGetSetObject, setter) => {
                if (!name || typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                if (member.isSpecial(name)) { throw new _Exception('NotAllowed', `Special names are now allowed as property name. (${name})`); }
                if (typeof valueOrGetterOrGetSetObject === 'undefined' && typeof setter === 'undefined') { valueOrGetterOrGetSetObject = null; } // default value is null
    
                // pick mixin being applied at this time
                if (cfg.mixins) {        
                    if (mixin_being_applied !== null) {
                        _attr('mixed', mixin_being_applied);
                    }
                }
    
                // collect attributes
                meta[name] = _attr.collect(); // collect and clear for next bunch on next member
                meta[name].type = 'prop';
                if (cfg.aop) {
                    meta[name].aspects = []; // which all aspects are applied to this prop
                }
                if (cfg.interfaces) {
                    meta[name].interfaces = []; // to which all interfaces this prop complies to
                }        
    
                // conditional check
                if (cfg.conditional) {
                    if (!funcs.isConditionalOK(name)) { delete meta[name]; return; }
                }
    
                // check for abstract
                if (cfg.inheritance) {
                    if (attrs.has('abstract', name)) {
                        throw new _Exception('InvalidOperation', `A property cannot be defined as abstract. (${name})`); 
                    }
                }
    
                // override check
                // when overriding a property, it can only be redefined completely
                if (cfg.inheritance) {
                    if (attrs.has('override', name)) {
                        // check to find what to override
                        let desc = Object.getOwnPropertyDescriptor(obj, name);
                        if (!desc || typeof desc.value !== 'function') { 
                            throw new _Exception('InvalidOperation', `Property is not found to override. (${name})`); 
                        }
    
                        // double check that it is actually defined in hierarchy
                        if (!member.isDefined(name)) {
                            throw new _Exception('InvalidOperation', `Property is not found to override. (${name})`); 
                        }
    
                        // check if in parent it is not sealed
                        if (attrs.has('sealed', name, true, true)) {
                            throw new _Exception('InvalidOperation', `Cannot override a sealed property. (${name})`); 
                        }
                        
                        // check for static
                        if (cfg.static) {
                            if (attrs.has('static', name, true, true)) {
                                throw new _Exception('InvalidOperation', `Cannot override a static property. (${name})`); 
                            }
                        }
                    }
                } else {
                    // duplicate check
                    if (cfg.duplicate) {
                        if (member.isDefined(name)) { 
                            throw new _Exception('InvalidOperation', `A member with this name is already defined. (${name})`); 
                        }
                    }
                }
                
                // define or redefine
                if (valueOrGetterOrGetSetObject && (typeof valueOrGetterOrGetSetObject === 'function' || typeof valueOrGetterOrGetSetObject.get === 'function')) { // getter function
                    if (cfg.static) {
                        if (attrs.has('static', name)) { throw new _Exception('InvalidOperation', `Static properties cannot be defined with a custom getter/setter. (${name})`); }
                    }
                    if (cfg.storage) {
                        if (attrs.has('session', name) || attrs.has('state', name)) { throw new _Exception('InvalidOperation', `Session/State properties cannot be defined with a custom getter/setter. (${name})`); }
                    }
                    
                    // getter/setters
                    let _getter = null,
                        __setter = null,
                        _setter = null;
                    if (typeof valueOrGetterOrGetSetObject === 'function') { 
                        _getter = valueOrGetterOrGetSetObject; 
                    } else {
                        _getter = valueOrGetterOrGetSetObject.get; 
                    }
                    if (typeof setter === 'function') { 
                        __setter = setter; 
                    } else if (valueOrGetterOrGetSetObject.set && typeof valueOrGetterOrGetSetObject.set === 'function') {
                        __setter = valueOrGetterOrGetSetObject.set; 
                    } else {
                        __setter = _noop;
                    }
                    if (cfg.readonly) {            
                        if (attrs.has('readonly', name)) {
                            _setter = (value) => {
                                // readonly props can be set only - either when object is being constructed 
                                // OR if 'once' is applied, and value is not already set
                                if (obj._.constructing || (attrs.has('once', name) && !_getter())) { return __setter(value); }
                                throw new _Exception('InvalidOperation', `Property is readonly. (${name})`); 
                            };
                        } else {
                            _setter = __setter;
                        }
                    } else {
                        _setter = __setter;
                    }
                    
                    // define
                    Object.defineProperty(obj, name, { 
                        configurable: true,
                        enumerable: true,
                        get: _getter,
                        set: _setter
                    });
                } else { // some direct value
                    let propHost = null,
                        uniqueName = '',
                        isStorageHost = false,
                        _getter = null,
                        _setter = null;
                    
                    if (cfg.static) {
                        if (attrs.has('static', name)) { 
                            uniqueName = name;
                            if (cfg.storage) {
                                if (attrs.has('session', name, true) || attrs.has('state', name, true)) {
                                    throw new _Exception('InvalidOperation', `A static property cannot be stored in session/state. (${name})`); 
                                }
                            }
                            propHost = staticInterface;
                            if (!propHost[uniqueName]) { 
                                propHost[uniqueName] = valueOrGetterOrGetSetObject; // shared (static) copy
                            }
                        }
                    } 
    
                    if (cfg.storage) {
                        if (attrs.has('session', name, true) && attrs.has('state', name, true)) {
                            throw new _Exception('InvalidOperation', `Both session and state attributes cannot be applied together. (${name})`); 
                        }
                        uniqueName = typeName + '_' + name;
    
                        if (attrs.has('session', name, true)) {
                            if (flair.options.env.isServer) {
                                throw new _Exception('NotSupported', `Session storage is not supported on server. (${name})`); 
                            } else {
                                if (!window.sessionStorage) {
                                    throw new _Exception('NotSupported', `Session storage API is not supported by current browser. (${name})`); 
                                }
                            }
                            propHost = window.sessionStorage; // here it comes only when running on client
                            isStorageHost = true;
                        } 
                        if (attrs.has('state', name, true)) {
                            if (flair.options.env.isServer) {
                                throw new _Exception('NotSupported', `State storage is not supported on server. (${name})`); 
                            } else {
                                if (!window.localStorage) {
                                    throw new _Exception('NotSupported', `State storage API is not supported by current browser. (${name})`); 
                                }
                            }
                            propHost = window.localStorage; // here it comes only when running on client
                            isStorageHost = true;
                        }                
                        if (typeof propHost[uniqueName] === 'undefined') { // define only when not already defined (may be by some other instance of same type)
                            propHost[uniqueName] = JSON.stringify({value: valueOrGetterOrGetSetObject}); 
                        }
                    }
    
                    if (!propHost) { // regular property
                        uniqueName = name;
                        propHost = props;
                        propHost[uniqueName] = valueOrGetterOrGetSetObject; // private copy
                    }
    
                    // getter/setter
                    _getter = () => {
                        if (isStorageHost) { return JSON.parse(propHost[uniqueName]).value; }
                        return propHost[uniqueName];
                    };
                    if (attrs.has('readonly', name, true)) {
                        _setter = (value) => {
                            // readonly props can be set only - either when object is being constructed 
                            // OR if 'once' is applied, and value is not already set
                            if (obj._.constructing || (attrs.has('once', name, false) && !_getter())) { 
                                if (isStorageHost) {
                                    propHost[uniqueName] = JSON.stringify({value: value});
                                } else {
                                    propHost[uniqueName] = value;
                                }
                            } else {
                                throw new _Exception('InvalidOperation', `Property is readonly. (${name})`); 
                            }
                        };                
                    } else {
                        _setter = (value) => {
                            if (isStorageHost) { 
                                propHost[uniqueName] = JSON.stringify({value: value});
                            } else {
                                propHost[uniqueName] = value;
                            }
                        };
                    }
                    
                    // define
                    Object.defineProperty(obj, name, {
                        configurable: true,
                        enumerable: true,
                        get: _getter,
                        set: _setter
                    });
                }
    
                // apply custom attributes
                if (cfg.customAttrs) {
                    funcs.applyAttrs(name);
                }
    
                // finally hold the references for reflector
                meta[name].ref = {
                    get: () => { return obj[name]; },
                    set: (value) => { obj[name] = value; }
                };
            },
            _event: (name, argsProcessor) => {
                if (!name || typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                if (argsProcessor && typeof argsProcessor !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (argsProcessor)'); }
                if (member.isSpecial(name)) { throw new _Exception('NotAllowed', `Special names are now allowed as event name. (${name})`); }
    
                // pick mixin being applied at this time
                if (cfg.mixins) {        
                    if (mixin_being_applied !== null) {
                        funcs.attr('mixed', mixin_being_applied);
                    }
                }
    
                // collect attributes
                meta[name] = _attr.collect(); // collect and clear for next bunch on next member
                meta[name].type = 'event';
                if (cfg.aop) {
                    meta[name].aspects = []; // which all aspects are applied to this event
                }
                if (cfg.interfaces) {
                    meta[name].interfaces = []; // to which all interfaces this event complies to
                }
    
                // conditional check
                if (cfg.conditional) {
                    if (!funcs.isConditionalOK(name)) { delete meta[name]; return; }
                }
    
                // check for static
                if (cfg.static) {
                    if (attrs.has('static', name)) {
                        throw new _Exception('InvalidOperation', `An event cannot be defined as static. (${name})`); 
                    }
                }
    
                // check for abstract
                if (cfg.inheritance) {
                    if (attrs.has('abstract', name)) {
                        throw new _Exception('InvalidOperation', `An event cannot be defined as abstract. (${name})`); 
                    }
                }
    
                // args processor
                meta[name].argsProcessor = argsProcessor || null; // store as is
    
                // override check
                if (cfg.inheritance) {
                    if (attrs.has('override', name)) {
                        // check to find what to override
                        let desc = Object.getOwnPropertyDescriptor(obj, name);
                        if (!desc || typeof desc.value !== 'function') { 
                            throw new _Exception('InvalidOperation', `Event is not found to override. (${name})`); 
                        }
    
                        // double check that it is actually defined in hierarchy
                        if (!member.isDefined(name)) {
                            throw new _Exception('InvalidOperation', `Event is not found to override. (${name})`); 
                        }
    
                        // check if in parent it is not sealed
                        if (attrs.has('sealed', name, true, true)) {
                            throw new _Exception('InvalidOperation', `Cannot override a sealed event. (${name})`); 
                        }
    
                        // override args processor of immediate parent, if available
                        let parentMeta = funcs.getParentMeta(name),
                            base = parentMeta ? parentMeta.argsProcessor : null;
                        if (base) {
                            if (argsProcessor) {
                                meta[name].argsProcessor = function(...args) { // redefine as wrapped
                                    let fnArgs = [base].concat(args); // run fn with base as first parameter
                                    if (funcs.isArrow(argsProcessor)) { // arrow function
                                        return argsProcessor(...fnArgs);
                                    } else { // normal func
                                        return argsProcessor.apply(obj, fnArgs);
                                    }
                                };
                            } else {
                                meta[name].argsProcessor = base; // use base args processor itself
                            }
                        }
                }
                } else {
                    // duplicate check
                    if (cfg.duplicate) {
                        if (member.isDefined(name)) { 
                            throw new _Exception('InvalidOperation', `A member with this name is already defined. (${name})`); 
                        }
                    }
                }
    
                // current argsProcessor (overridden, base or normal)
                argsProcessor = meta[name].argsProcessor;
    
                // define or redefine
                let _event = {};
                _event._ = Object.freeze({
                    subscribers: []
                });
                _event.subscribe = (fn) => {
                    if (typeof fn !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (fn)'); }
                    _event._.subscribers.push(fn);
                };
                _event.subscribe.all = () => {
                    return _event._.subscribers.slice();
                };
                _event.unsubscribe = (fn) => {
                    if (typeof fn !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (fn)'); }
                    let index = _event._.subscribers.indexOf(fn);
                    if (index !== -1) { _event._.subscribers.splice(index, 1); }
                };
                _event.unsubscribe.all = () => {
                    _event._.subscribers.length = 0; // remove all
                };
                _event.raise = (...args) => {
                    // preprocess args
                    let processedArgs = {};
                    if (typeof argsProcessor === 'function') { processedArgs = argsProcessor(...args); }
            
                    // define event arg
                    let e = {
                        name: name,
                        args: Object.freeze(processedArgs),
                        stop: false
                    };
            
                    // raise event
                    for(let handler of _event._.subscribers) {
                        handler(e);
                        if (e.stop) { break; }
                    }
                };
                _event.rewire = (targetObj) => {
                    // internal method that does not make outside, this is called
                    // during exposed object building process to rewire event either as an object
                    // or as a function - for external world it is an object without the ability of being
                    // called, while for internal world (or derived types), it is a function, which can
                    // be called to raise the event
                    // this is self destructing method, and delete itself as well
    
                    let eventAsFn = targetObj[name].raise;
                    eventAsFn._ = targetObj[name]._;
                    eventAsFn.subscribe = targetObj[name].subscribe; // .all comes with it
                    eventAsFn.unsubscribe = targetObj[name].unsubscribe; // .all comes with it
                    obj[name] = eventAsFn; // updating this internal object itself
    
                    // on target object
                    delete targetObj[name].raise;
                    delete targetObj[name].rewire;
                }
                events.push(_event);
    
                // define
                Object.defineProperty(obj, name, {
                    configurable: true,
                    enumerable: true,
                    writable: true,
                    value: _event
                });
    
                // apply custom attributes
                if (cfg.customAttrs) {
                    funcs.applyAttrs(name);
                }            
    
                // finally hold the reference for reflector
                meta[name].ref = obj[name];
            }
        };
    
        // build def object
        funcs.buildDef();
    
        // separate mixins and interfaces
        if (cfg.mixins || cfg.interfaces) {
            funcs.extractMixinsAndInterfaces();
        }
    
        // collect type level attributes
        funcs.collectTypeAttributes();
    
        // add instance meta
        funcs.addInstanceMeta();
        
        // construct base object
        funcs.constructObj();
    
        // build object
        funcs.buildObj();
    
        // weave advices from aspects
        if (cfg.aop) {
            funcs.weave();
        }
    
        // prepare object to expose
        funcs.buildExposedObj();
    
        // validate interfaces
        if (cfg.interfaces) {
            funcs.validateInterfaces();                
        }
    
        // when on top level instance
        if (!isNeedProtected) {
            if (cfg.construct) {
                funcs.processConstructor();
            }
            if (cfg.dispose) {
                funcs.processDestructor();
            }
        }
    
        // public and (protected+private) instance interface
        if (cfg.inheritance) {
            funcs.storeObjects();
        }
    
        // set sealed type
        if (cfg.inheritance && types.isSealed()) { 
            funcs.setTypeSealed();
        }
    
        // clear any (by error left out) attributes, so that are not added by mistake elsewhere
        _attr.clear();
    
        // return
        if (cfg.singleton && types.isSingleton()) { 
            funcs.storeInstance(); // store for next use
            return Type._.singleInstance();
        } else {
            return exposed_obj;
        }
    };
    const buildType = (type, Type, typeName, mex, inherits, mixinsAndInterfaces, cfg) => {
        let result = extractMixinsAndInterfaces(mixinsAndInterfaces);
    
        Type._ = copyMembers([Type._, mex], {});
        if (cfg.inheritance) {
            Type._.inherits = inherits || null;
        }
        Type._.name = typeName;
        Type._.type = type;
        Type._.namespace = null;
        Type._.assembly = () => { return flair.Assembly.get(typeName) || null; };
        Type._.id = guid();
    
        // hierarchy check
        if (cfg.inheritance) {
            Type._.isDerivedFrom = (name) => {
                if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                if (name._ && name._.name) { name = name._.name; }
                let result = (name === 'Object'),
                    prv = inherits;
                if (!result) {
                    // eslint-disable-next-line no-constant-condition
                    while(true) {
                        if (prv === null) { break; }
                        if (prv._.name === name) { result = true; break; }
                        prv = prv._.inherits;
                    }
                }
                return result;
            };
            Type._.isSealed = () => { return false; }
        }
    
        if (cfg.singleton) {
            Type._.singleInstance = () => { return null; }
            Type._.isSingleton = () => { return false; }
            Type._.singleInstance.clear = () => {};
        }
         
        if (cfg.mixins) {
            Type._.isMixed = (name) => {
                if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                if (name._ && name._.name) { name = name._.name; }
    
                let result = false,
                    prv = Type,
                    _mixins = [];
                // eslint-disable-next-line no-constant-condition
                while(true) {
                    if (prv === null) { break; }
                    _mixins = prv._._.mixins;
                    for(let mixin of _mixins) {
                        if (mixin._.name === name) {
                            result = true; break;
                        }
                    }
                    if (result) { 
                        break;
                    } else {
                        prv = prv._.inherits; 
                    }
                }
                return result;
            };
        }
    
        if (cfg.interfaces) {
            Type._.isImplements = (name) => {
                if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                if (name._ && name._.name) { name = name._.name; }
    
                let result = false,
                    prv = Type,
                    _interfaces = [];
                // eslint-disable-next-line no-constant-condition
                while(true) {
                    if (prv === null) { break; }
                    _interfaces = prv._._.interfaces;
                    for(let intf of _interfaces) {
                        if (intf._.name === name) {
                            result = true; break;
                        }
                    }
                    if (result) { 
                        break;
                    } else {
                        prv = prv._.inherits; 
                    }
                }
                return result;
            };                
        }
    
        if (cfg.static) {
            Type._.static = {};
        }
    
        // reflector only items
        Type._._ = Type._._ || {};
        if (cfg.mixins) {
            Type._._.mixins = result.mixins || [];
        }
        if (cfg.interfaces) {
            Type._._.interfaces = result.interfaces || [];        
        }
    
        // register type with namespace
        flair.Namespace(Type);
    
        // return
        return Type;
    };
    const builder = (cfg) => {
        let _cfg = {};
        _cfg.config = cfg.config || {};
        _cfg.config.mixins = cfg.config.mixins || false;
        _cfg.config.interfaces = cfg.config.interfaces || false;
        _cfg.config.inheritance = cfg.config.inheritance || false;
            _cfg.config.singleton = cfg.config.singleton || false;
            _cfg.config.static = cfg.config.static || false;
        _cfg.config.func = cfg.config.func || false;
            _cfg.config.construct = cfg.config.construct || false;
            _cfg.config.dispose = cfg.config.dispose || false;
        _cfg.config.prop = cfg.config.prop || false;
            _cfg.config.storage = cfg.config.storage || false;
            _cfg.config.readonly = cfg.config.readonly || false;
        _cfg.config.event = cfg.config.event || false;
        _cfg.config.aop = cfg.config.aop || false;
        _cfg.config.conditional = cfg.config.conditional || false;
        _cfg.config.duplicate = cfg.config.duplicate || false;
        _cfg.config.customAttrs = cfg.config.customAttrs || false;
        _cfg.config.hide = cfg.config.hide || false;
    
        _cfg.params = cfg.params || {};
        _cfg.params.typeName = cfg.params.typeName || '';
        _cfg.params.inherits = cfg.params.inherits || null;
        _cfg.params.mixinsAndInterfaces = cfg.params.mixinsAndInterfaces || null;
        _cfg.params.factory = cfg.params.factory || null;
    
        _cfg.instance = cfg.instance || {};
        _cfg.instance.type = cfg.instance.type || '';
        _cfg.instance.mex = cfg.instance.mex || {};
        
        _cfg.type = cfg.type || {};
        _cfg.type.type = cfg.type.type || '';
        _cfg.type.mex = cfg.type.mex || {};
    
        // resolve conflicting configurations
        if (!_cfg.config.func) {
            _cfg.config.construct = false;
            _cfg.config.dispose = false;
        }
        if (!_cfg.config.prop) {
            _cfg.config.storage = false;
            _cfg.config.readonly = false;
        }
        if (!_cfg.config.inheritance) {
            _cfg.config.singleton = false;
        }
        if (!_cfg.config.func && !_cfg.config.prop && !_cfg.config.event) {
            _cfg.config.aop = false;
            _cfg.config.conditional = false;
            _cfg.config.duplicate = false;
            _cfg.config.customAttrs = false;
            _cfg.config.hide = false;
        }
    
        // base type
        let _Object = function(_flag, _static, ...args) {
            // parameters
            let params = {};
            if (_cfg.config.inheritance) {
                if (_cfg.config.static) {
                    params._flag = _flag;
                    params._static = _static;
                    params.args = args;
                } else {
                    params._flag = _flag;
                    params.args = [_static].concat(args); // treat static as args
                }
            } else {
                params.args = [_flag, _static].concat(args); // treat all as args
            }
            // base object
            let _this = {};
    
            // build instance
            return buildTypeInstance(
                _cfg.instance.type,
                _Object, 
                _cfg.params.typeName, 
                _cfg.instance.mex, 
                _cfg.params.inherits, 
                _cfg.params.mixinsAndInterfaces, 
                _cfg.config, 
                _this, 
                _cfg.params.factory, 
                params
            );
        };
    
        // build type
        return buildType(
            _cfg.type.type, 
            _Object, 
            _cfg.params.typeName, 
            _cfg.type.mex, 
            _cfg.params.inherits, 
            _cfg.params.mixinsAndInterfaces, 
            _cfg.config
        );
    };
    
    /**
     * @name Struct
     * @description Constructs a Struct type.
     * @example
     *  Struct(name, factory)
     *  Struct(name, applications, factory)
     * @params
     *  name: string - name of the struct
     *                 it can take following forms:
     *                 >> simple, e.g.,
     *                    MyStruct
     *                 >> qualified, e.g., 
     *                    com.myCompany.myProduct.myFeature.MyStruct
     *                 >> special, e.g.,
     *                    ~MyStruct
     *                 >> super special. e.g.,
     *                    MyNewType<NewTypeName>
     *         NOTE: Qualified names are automatically registered with Namespace while simple names are not.
     *               to register simple name on root Namespace, use special naming technique, it will register
     *               this with Namespace and will still keep the name without '~'
     *              
     *               'NewTypeName' will be tha type of the structure instance created from this structure instead of
     *               'sinstance' This is generally used to create additional flair types or flair objects and should
     *               be avoided when using for normal application development
     *  applications: array - An array of mixin and/or interface types which needs to be applied to this struct type
     *                        mixins will be applied in order they are defined here
     *  factory: function - factory function to build struct definition
     * @returns type - constructed flair struct type
     * @throws
     *  InvalidArgumentException
     */
    const _Struct = (name, mixinsAndInterfaces, factory) => {
        if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
        if (_typeOf(mixinsAndInterfaces) === 'array') {
            if (typeof factory !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (factory)'); }
        } else if (typeof mixinsAndInterfaces !== 'function') {
            throw new _Exception('InvalidArgument', 'Argument type is invalid. (factory)');
        } else {
            factory = mixinsAndInterfaces;
            mixinsAndInterfaces = [];
        }
    
        // extract custom type instance name, if specified 
        let instanceType = 'sinstance';
        if (name.indexOf('<') !== -1 && name.indexOf('>') !== -1) {
            instanceType = name.substr(name.indexOf('<') + 1)
            instanceType = instanceType.substr(0, instanceType.indexOf('>')).trim();
            name = name.substr(0, name.indexOf('<')).trim();
        }
    
        // builder config
        let cfg = {};
        cfg.config = {
            mixins: true,
            interfaces: true,
            static: true,
            func: true,
                construct: true,
            prop: true,
                readonly: true,
            event: true,
            conditional: true,
            duplicate: true,
            customAttrs: true,
            hide: true
        };
        cfg.params = {
            typeName: name,
            inherits: null,
            mixinsAndInterfaces: mixinsAndInterfaces,
            factory: factory
        };
        cfg.instance = {
            type: instanceType
        };
        cfg.type = {
            type: 'struct'
        };
        cfg.instance.mex = {
        };
        cfg.type.mex = {
        }; 
    
        // return built type
        return builder(cfg);
    };
    
    // attach
    flair.Struct = _Struct;
    flair.members.push('Struct');
    let asmFiles = {},
        asmTypes = {};
    
    /**
     * @name Assembly
     * @description Constructs an Assembly object
     * @example
     *  Assembly(ado)
     * @params
     *  ado: object - An ADO is an object that defines assembly definition as:
     *      name: string - name
     *      file: string - file name and path
     *      desc: string - description
     *      version: string - version
     *      copyright: string - copyright message
     *      license: - string - license
     *      types: - array - list of all type names that reside in this assembly
     *      assets: - array - list of all assets that are available outside this assembly but deployed together
     *      settings: - assembly settings
     * @returns object - flair assembly object
     * @throws
     *  InvalidArgumentException
     */ 
    flair.Assembly = (ado) => {
        if (typeof ado !== 'object') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (ado)'); }
        if (_typeOf(ado.types) !== 'array' || 
            _typeOf(ado.assets) !== 'array' ||
            typeof ado.name !== 'string' ||
            typeof ado.file !== 'string') {
            throw new _Exception('InvalidArgument', 'Argument type is invalid. (ado)');
        }
      
        // define assembly structure
        let _Assembly = flair.Struct('Assembly<assembly>', function() {
            this.construct((ado) => {
                this.ado = ado;
                this.name = ado.name;
                this.file = which(ado.file, true); // min/dev contextual pick
                this.desc = ado.desc || '';
                this.version = ado.version || '';
                this.copyright = ado.copyright || '';
                this.license = ado.license || '';
                this.types = ado.types.slice() || [];
                this.settings = ado.settings || {};
                this.assets = ado.assets.slice() || [];
                this.hasAssets = (ado.assets.length > 0);
            });
            
            /// TODO: props is no longer supported
            this.props(['readonly'], ['ado', 'name', 'file', 'desc', 'version', 'copyright', 'license', 'types', 'hasAssets']);
            
            this.prop('isLoaded', false);
            this.func('load', () => {
                return flair.Assembly.load(this.file);
            });
            this.func('getType', (name) => {
                if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                if (!this.isLoaded) { throw new _Exception('NotLoaded', `Assembly is not yet loaded. (${this.file})`); }
                if(this.types.indexOf(name) === -1) { throw new _Exception('NotFound', `Type is not found in this assembly. (${name})`); }
                let Type = flair.Namespace.getType(name);
                if (!Type) { throw new _Exception('NotRegistered', `Type is not registered. (${name})`); }
                return Type;
            });
            this.func('createInstance', (name, ...args) => {
                if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                let Type = flair.Assembly.get(name),
                    obj = null;
                if (args) {
                    obj = new Type(...args);
                } else {
                    obj = new Type();
                }
                return obj;
            });
        });
    
        // return
        return new _Assembly(ado);
    };
    
    /**
     * @name register
     * @description Register one or more assemblies as per given Assembly Definition Objects
     * @example
     *  register(...ados)
     * @params
     *  ados: object - An ADO is an object that defines assembly definition as:
     *      name: string - name
     *      file: string - file name and path
     *      desc: string - description
     *      version: string - version
     *      copyright: string - copyright message
     *      license: - string - license
     *      types: - array - list of all type names that reside in this assembly
     *      assets: - array - list of all assets that are available outside this assembly but deployed together
     *      settings: - assembly settings
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     *  DuplicateNameException
     */ 
    flair.Assembly.register = (...ados) => { 
        if (!ados) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (ados)'); }
    
        let success = false;
        for(let ado of ados) {
            let asm = flair.Assembly(ado),
                asmFile = asm.file;
            if (asmFiles[asmFile]) {
                throw new _Exception('DuplicateName', `Assembly is already registered. (${asmFile})`);
            } else {
                // register
                asmFiles[asmFile] = asm;
    
                // load types
                for(let type of asm.types) {
                    // qualified names across anywhere should be unique
                    if (asmTypes[type]) {
                        throw new _Exception('DuplicateName', `Type is already registered. (${type})`);
                    } else {
                        asmTypes[type] = asm; // means this type can be loaded from this assembly
                    }
                }
    
                // success
                success = true;
            }
        }
    
        // returns
        return success;
    };
    
    /**
     * @name load
     * @description Loads an assembly file
     * @example
     *  load(file)
     * @params
     *  file: string - Assembly file to be loaded
     * @returns object - promise object
     * @throws
     *  InvalidArgumentException
     *  NotFoundException
     *  FileLoadException
     */
    flair.Assembly.load = (file) => {
        return new Promise((resolve, reject) => {
            if (typeof file !== 'string') { reject(new _Exception('InvalidArgument', 'Argument type is invalid. (file)')); return; }
            if (!flair.Assembly.isRegistered(file)) { reject(new _Exception('NotFound', `Assembly is not registered. (${file})`)); return; }
    
            if (asmFiles[file].isLoaded) { resolve(); return; }
                
            if (isServer) {
                try {
                    require(file);
                    asmFiles[file].markLoaded();
                    resolve();
                } catch (e) {
                    reject(new _Exception('FileLoad', `File load operation failed. (${file})`, e));
                }
            } else {
                const script = flair.options.env.global.document.createElement('script');
                script.onload = () => {
                    asmFiles[file].isLoaded = true;
                    resolve();
                };
                script.onerror = (e) => {
                    reject(new _Exception('FileLoad', `File load operation failed. (${file})`, e));
                };
                script.async = true;
                script.src = file;
                flair.options.env.global.document.body.appendChild(script);
            }
        });
    };
    
    /**
     * @name isRegistered
     * @description Checks to see if given assembly file is registered
     * @example
     *  isRegistered(file)
     * @params
     *  file: string - full path and name of the assembly file to check for
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    flair.Assembly.isRegistered = (file) => {
        if (typeof file !== 'string') { throw new _Exception('InvalidArgument', 'Argument type if not valid. (file)'); }
        return typeof asmFiles[file] !== 'undefined';
    };
    
    /**
     * @name isLoaded
     * @description Checks to see if given assembly file is loaded
     * @example
     *  isLoaded(file)
     * @params
     *  file: string - full path and name of the assembly file to check for
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    flair.Assembly.isLoaded = (file) => {
        if (typeof file !== 'string') { throw new _Exception('InvalidArgument', 'Argument type if not valid. (file)'); }
        return typeof asmFiles[file] !== 'undefined' && asmFiles[file].isLoaded;
    };
    
    /**
     * @name get
     * @description Returns assembly object that is associated with given flair type name
     * @example
     *  get(name)
     * @params
     *  name: string - qualified type name of the flair type whose assembly is to be located
     * @returns object - flair assembly type object
     * @throws
     *  InvalidArgumentException
     */ 
    flair.Assembly.get = (name) => {
        if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type if not valid. (name)'); }
        return asmTypes[name] || null;
    };
    
    /**
     * @name all
     * @description Returns all registered assembly files
     * @example
     *  all()
     * @params
     *  None
     * @returns array - registered assemblies list
     * @throws
     *  None
     */ 
    flair.Assembly.all = () => { 
        return Object.values(asmFiles).slice();
    };
    
    /**
     * @name allTypes
     * @description Returns all registered types
     * @example
     *  allTypes()
     * @params
     *  None
     * @returns array - registered types list
     * @throws
     *  None
     */ 
    flair.Assembly.allTypes = () => { 
        return Object.keys(asmTypes).slice();
    };
    
    // reset api
    flair.Assembly._ = {
        reset: () => { asmFiles = {}; asmTypes = {}; }
    };
    
    // add to members list
    flair.members.push('Assembly');
    
    // Namespace
    // Namespace(Type)
    flair.Namespace = (Type) => {
        // any type name can be in this format:
        // ~name <-- means, no namespace is given but still register this with root namespace
        // name <-- means, no namespace is given but since it is not forced, do not register this with root namespace
        // namespace.name
        
        // only valid types are allowed
        if (['class', 'enum', 'interface', 'mixin', 'struct', 'resource', 'proc'].indexOf(Type._.type) === -1) { throw `Type (${Type._.type}) cannot be placed in a namespace.`; }
    
        // only unattached types are allowed
        if (Type._.namespace) { throw `Type (${Type._.name}) is already contained in a namespace.`; }
    
        // remove force register symbol (~) from name and also fix name
        let isForced = false;
        if (Type._.name.startsWith('~')) {
            Type._.name = Type._.name.substr(1); // remove ~
            isForced = true;
        }
    
        // merge/add type in namespace tree
        let nextLevel = flair.Namespace.root,
            nm = Type._.name,
            nsName = '',
            ns = nm.substr(0, nm.lastIndexOf('.'));
        nm = nm.substr(nm.lastIndexOf('.') + 1);
        if (ns) {
            let nsList = ns.split('.');
            for(let nsItem of nsList) {
                if (nsItem) {
                    // special name not allowed
                    if (nsItem === '_') { throw `Special name "_" is used as namespace in ${Type._.name}.`; }
                    nextLevel[nsItem] = nextLevel[nsItem] || {};
                    nsName = nsItem;
    
                    // check if this is not a type itself
                    if (nextLevel[nsItem]._ && nextLevel[nsItem]._.type !== 'namespace') { throw `${Type._.name} cannot be contained in another type (${nextLevel[nsItem]._.name})`; }
    
                    // pick it
                    nextLevel = nextLevel[nsItem];
                }
            }
        } else {
            if (!isForced) {
                return; // don't do anything
            }
        }
    
            // add type at the bottom, if not already exists
        if (nextLevel[nm]) { throw `Type ${nm} already contained at ${ns}.`; }
        nextLevel[nm] = Type;
    
        // add namespace
        Type._.namespace = nextLevel;
    
        // define namespace meta
        nextLevel._ = nextLevel._ || {};
        nextLevel._.name = nextLevel._.name || nsName;
        nextLevel._.type = nextLevel._.type || 'namespace';
        nextLevel._.types = nextLevel._.types || [];
        
        // add to Namespace
        nextLevel._.types.push(Type);
    
        // attach Namespace functions
        let getTypes = () => { 
            return nextLevel._.types.slice(); 
        }
        let getType = (qualifiedName) => {
            let _Type = null,
                level = nextLevel; // TODO: This is problem, in this case it is b and I am finding from root .....
            if (qualifiedName.indexOf('.') !== -1) { // if a qualified name is given
                let items = qualifiedName.split('.');
                for(let item of items) {
                    if (item) {
                        // special name not allowed InvalidNameException
                        if (item === '_') { throw `Special name "_" is used as name in ${qualifiedName}.`; }
        
                        // pick next level
                        level = level[item];
                        if (!level) { break; }
                    }
                }
                _Type = level;
            } else {
                _Type = level[qualifiedName];
            }
            if (!_Type || !_Type._ || ['class', 'enum', 'interface', 'mixin', 'struct'].indexOf(_Type._.type) === -1) { return null; }
            return _Type;
        };
        let createInstance = (qualifiedName, ...args) => {
            let _Type = nextLevel.getType(qualifiedName);
            if (_Type && _Type._.type != 'class') { throw `${name} is not a class.`; }
            if (_Type) { return new _Type(...args); }
            return null;
        };   
        nextLevel.getTypes = nextLevel.getTypes || getTypes;
        nextLevel.getType = nextLevel.getType || getType;
        nextLevel.createInstance = nextLevel.createInstance || createInstance;
    };
    flair.Namespace.root = {};
    flair.Namespace.getType = (qualifiedName) => { 
        if (flair.Namespace.root.getType) {
            return flair.Namespace.root.getType(qualifiedName);
        }
        return null;
    };
    flair.Namespace.getTypes = () => {
        if (flair.Namespace.root.getTypes) {
            return flair.Namespace.root.getTypes();
        }
        return [];
    };
    flair.Namespace.createInstance = (qualifiedName, ...args) => {
        if (flair.Namespace.root.createInstance) {
            return flair.Namespace.root.createInstance(qualifiedName, ...args);
        }
        return null;
    };
    
    // reset api
    flair.Namespace._ = {
        reset: () => { 
            // flair.Namespace.root = {}; 
        }
    };
    
    // In Reset func, clean all static and singleton flags as well for all registered classes
    
    // add to members list
    flair.members.push('Namespace');
    /**
     * @name Types
     * @description Get reference to a registered type definition
     * @example
     *  Types(name)
     * @params
     *  name: string - qualified type name whose reference is needed
     * @returns object - if assembly which contains this type is loaded, it will return flair type object OR will return null
     * @throws
     *  InvalidArgumentException
     *  InvalidNameException
     */ 
    flair.Types = (name) => { 
        if (_typeOf(name) !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
        return flair.Namespace.getType(name); 
    }
    
    // add to members list
    flair.members.push('Types');
    /**
     * @name Class
     * @description Constructs a Class type.
     * @example
     *  Class(name, factory)
     *  Class(name, inherits, factory)
     *  Class(name, applications, factory)
     *  Class(name, inherits, applications, factory)
     * @params
     *  name: string - name of the class
     *                 it can take following forms:
     *                 >> simple, e.g.,
     *                    MyClass
     *                 >> qualified, e.g., 
     *                    com.myCompany.myProduct.myFeature.MyClass
     *                 >> special, e.g.,
     *                    ~MyClass
     *         NOTE: Qualified names are automatically registered with Namespace while simple names are not.
     *               to register simple name on root Namespace, use special naming technique, it will register
     *               this with Namespace and will still keep the name without '~'
     *  inherits: type - A flair class type from which to inherit this class
     *  applications: array - An array of mixin and/or interface types which needs to be applied to this class type
     *                        mixins will be applied in order they are defined here
     *  factory: function - factory function to build class definition
     * @returns type - constructed flair class type
     * @throws
     *  InvalidArgumentException
     */
    flair.Class = (name, inherits, mixinsAndInterfaces, factory) => {
        if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
        switch(_typeOf(inherits)) {
            case 'function':
                factory = inherits;
                inherits = null;
                mixinsAndInterfaces = [];
                break;
            case 'array':
                if (typeof mixinsAndInterfaces !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (factory)'); }
                factory = mixinsAndInterfaces;
                mixinsAndInterfaces = inherits;
                inherits = null;
                break;
            case 'class':
                if (['array', 'function'].indexOf(_typeOf(mixinsAndInterfaces)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (factory)'); }
                if (typeof mixinsAndInterfaces === 'function') {
                    factory = mixinsAndInterfaces;
                    mixinsAndInterfaces = [];
                } else {
                    if (typeof factory !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (factory)'); }
                }
                break;
            default:
                throw new _Exception('InvalidArgument', 'Argument type is invalid. (factory)'); 
        }
    
        // builder config
        let cfg = {};
        cfg.config = {
            mixins: true,
            interfaces: true,
            inheritance: true,
                singleton: true,
            static: true,
            func: true,
                construct: true,
                dispose: true,
            prop: true,
                storage: true,
                readonly: true,
            event: true,
            aop: true,
            conditional: true,
            duplicate: true,
            customAttrs: true,
            hide: true
        };
        cfg.params = {
            typeName: name,
            inherits: inherits,
            mixinsAndInterfaces: mixinsAndInterfaces,
            factory: factory
        };
        cfg.instance = {
            type: 'instance'
        };
        cfg.type = {
            type: 'class'
        };
        cfg.instance.mex = {
        };
        cfg.type.mex = {
        }; 
    
        // return built type
        return builder(cfg);
    };
    
    // add to members list
    flair.members.push('Class');
    // Mixin
    // Mixin(mixinName, function() {})
    flair.Mixin = (mixinName, factory) => {
        // add name
        factory._ = {
            name: mixinName,
            type: 'mixin',
            namespace: null        
        };
    // TODO: check that mixin either can be defined as struct or should have at least basic class definition approach or allow mixing classes itself
    
    
        // register type with namespace
        flair.Namespace(factory);
    
        // return
        return factory;
    };
    
    // add to members list
    flair.members.push('Mixin');
    // Interface
    // Interface(interfaceName, function() {})
    flair.Interface = (interfaceName, factory) => {
        let meta = {},
            _this = {};
    
        // definition helpers
        const isSpecialMember = (member) => {
            return ['constructor', 'dispose', '_constructor', '_dispose', '_'].indexOf(member) !== -1;
        };     
        _this.func = (name) => {
            if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
            if (isSpecialMember(name)) { throw `${interfaceName}.${name} can only be defined for a class.`; }
            meta[name] = [];
            meta[name].type = 'func';
        };
        _this.prop = (name) => {
            if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
            if (isSpecialMember(name)) { throw `${interfaceName}.${name} can only be defined as a function for a class.`; }
            meta[name] = [];
            meta[name].type = 'prop';
        };
        _this.event = (name) => {
            if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
            if (isSpecialMember(name)) { throw `${interfaceName}.${name} can only be defined as a function for a class.`; }
            meta[name] = [];
            meta[name].type = 'event';
        };
    
        // add name
        meta._ = {
            name: interfaceName,
            type: 'interface',
            namespace: null        
        };
    
        // register type with namespace
        flair.Namespace(meta);
    
        // run factory
        factory.apply(_this);
    
        // remove definition helpers
        delete _this.func;
        delete _this.prop;
        delete _this.event;
    
        // return
        return meta;
    };
    
    // add to members list
    flair.members.push('Interface');
    // Enum
    // Enum(name, def)
    //  name: name of the enum
    //  def: object with key/values or an array of values
    flair.Enum = (name, data) => {
        'use strict';
    
        // args validation
        if (!(typeof data === 'object' || Array.isArray(data))) { throw flair.Exception('ENUM01', 'Invalid enum data.'); }
    
        // // enum type
        // let _Enum = data;
        // if (Array.isArray(data)) {
        //     let i = 0,
        //         _Enum = {};
        //     for(let value of data) {
        //         _Enum[i] = value; i++;
        //     }
        // } 
    
        // // meta extensions
        // let mex = {
        //     keys: () => {
        //         let keys = [];
        //         for(let key in _Enum) {
        //             if (_Enum.hasOwnProperty(key) && key !== '_') {
        //                 keys.push(key);
        //             }
        //         }
        //         return keys;
        //     },
        //     values: () => {
        //         let values = [];
        //         for(let key in _Enum) {
        //             if (_Enum.hasOwnProperty(key) && key !== '_') {
        //                 values.push(_Enum[key]);
        //             }
        //         }
        //         return values;
        //     }
        // };
    
        // return
        //return flarizedType('enum', name, _Enum, mex);
    };
    flair.Enum.getKeys = (obj) => {
        try {
            return obj._.keys();
        } catch (e) {
            throw flair.Exception('ENUM02', 'Object is not an Enum.', e);
        }
    };
    flair.Enum.getValues = (obj) => {
        try {
            return obj._.values();
        } catch (e) {
            throw flair.Exception('ENUM02', 'Object is not an Enum.', e);
        }
    };
    flair.Enum.isDefined = (obj, keyOrValue) => {
        return (flair.Enum.getKeys().indexOf(keyOrValue) !== -1 || flair.Enum.getValues().indexOf(keyOrValue) !== -1);
    };
    
    // add to members list
    flair.members.push('Enum');
    // Proc
    // Proc(procName, fn)
    flair.Proc = (procName, isASync, fn) => {
        if (typeof isASync === 'function') {
            fn = isASync;
            isASync = false;
        }
        let _fn = fn;
        _fn.isASync = () => { return isASync; };
        _fn._ = {
            name: procName,
            type: 'proc',
            namespace: null,        
            invoke: (...args) => {
                fn(...args);
            }
        };
    
        // register type with namespace
        flair.Namespace(_fn);
    
        // return
        return Object.freeze(_fn);
    };
    
    
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
    
    let container = {};
    
    /**
     * @name Container
     * @description Returns registered types associated with given alias
     * @example
     *  Container(alias)
     *  Container(alias, isAll)
     * @params
     *  alias: string - name of alias to return registered items for
     *  isAll: boolean - whether to return all items or only first item
     * @returns array/item - depending upon the value of isAll, return only first or all registered items
     *                        returns null, if nothing is registered for given alias
     * @throws
     *  InvalidArgumentException
     */ 
    flair.Container = (alias, isAll) => {
        if (typeof alias !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (alias)'); }
        if (isAll) {
            return (container[alias] || []).slice();
        } else {
            if (container[alias] && container[alias].length > 0) {
                return container[alias][0]; 
            } else {
                return null;
            }
        }
    };
    
    /**
     * @name isRegistered
     * @description Checks if given alias is registered with container
     * @example
     *  isRegistered(alias)
     * @params
     *  alias: string - name of alias to check
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    flair.Container.isRegistered = (alias) => {
        if (typeof alias !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (alias)'); }
        return (typeof container[alias] !== 'undefined' &&  container[alias].length > 0);
    };
    
    /**
     * @name register
     * @description Register an actual type object OR a qualified name of a type OR a file, to resolve against given alias
     * @example
     *  register(alias, type)
     * @params
     *  alias: string - name of alias to register given type or qualified name
     *  type: object/string - it can be following:
     *      object - actual flair type or any non-primitive object
     *      string - qualified name of flair type OR path/name of a .js/.mjs file
     *      
     *      NOTE: Each type definition can also be defined for contextual consideration as:
     *      '<typeA> | <typeB>'
     *      when running on server, <typeA> would be considered, and when running on client <typeB> will be used* 
     * @returns boolean - true/false
     * @throws
     *  InvalidArgumentException
     */ 
    flair.Container.register = (alias, type) => {
        if (typeof alias !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (alias)'); }
        if (!type) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (type)'); }
    
        // get what is being registered
        if (_is(type, 'flair')) {
            // flair type
        } else if (typeof type === 'object') {
            // some object
        } else if (typeof type === 'string') {
            // get contextual type for Server/Client scenario
            type = which(type);
    
            if (type.endsWith('.js') || type.endsWith('.mjs')) { 
                // its a JS file
            } else { 
                // qualified name
                // or it can be some other type of file as well like css, jpeg, anything and it is allowed
            }
        } else { // unknown type
            throw new _Exception('InvalidArgument', `Argument type is invalid. (${_typeOf(type)})`);
        }
    
        // register
        if (!container[alias]) { container[alias] = []; }
        container[alias].push(type);
    
        // return
        return true;
    };
    
    /**
     * @name resolve
     * @description Returns registered type(s) or associated with given alias
     * @example
     *  resolve(alias)
     *  resolve(alias, isMultiResolve)
     *  resolve(alias, isMultiResolve, ...args)
     * @params
     *  alias: string - name of alias to resolve
     *  isMultiResolve: boolean - should it resolve with all registered types or only first registered
     *  args: any - any number of arguments to pass to instance created for registered class or struct type
     * @returns array - having list of resolved types, qualified names or urls or created instances
     * @throws
     *  InvalidArgumentException
     *  Any exception that is generated by constructor while creating instance of a Type is passed as is
     */ 
    flair.Container.resolve = (alias, isMultiResolve, ...args) => {
        if (typeof alias !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (alias)'); }
        if (typeof isMultiResolve !== 'boolean') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (isMultiResolve)'); }
    
        let result = null,
            getResolvedObject = (Type) => {
                let obj = Type; // whatever it was
                if (typeof Type === 'string') {
                    if (Type.endsWith('.js') || Type.endsWith('.mjs')) { 
                        // file, leave it as is
                    } else { // try to resolve it from a loaded type
                        let _Type = flair.Namespace.getType(Type); 
                        if (_Type) { Type = _Type; }
                    }
                }
    
                if (['class', 'struct'].indexOf(_typeOf(Type)) !== -1) { // only class and struct need a new instance
                    if (args) {
                        obj = new Type(...args); 
                    } else {
                        obj = new Type(); 
                    }
                }
                return obj;
            };
        
        if (container[alias] && container[alias].length > 0) {
            if (isMultiResolve) {
                result = [];
                for(let Type of container[alias]) {
                    result.push(getResolvedObject(Type));
                }
            } else {
                let Type = container[alias][0]; // pick first
                result = getResolvedObject(Type);
            }
        }
    
        // resolved
        return result;
    };
    
    // reset api
    flair.Container._ = {
        reset: () => { container = {}; }
    };
    
    // add to members list
    flair.members.push('Container');
    // Attribute
    flair.Attribute = flair.Class('Attribute', function(attr) {
        let decoratorFn = null;
        
        attr('abstract');
        this.construct((...args) => {
            // args can be static or dynamic or settings
            // static ones are defined just as is, e.g.,
            //  ('text', 012, false, Reference)
            // dynamic ones are defined as special string
            //  ('[publicPropOrFuncName]', 012, false, Reference)
            // when string is defined as '[...]', this argument is replaced by a 
            // function which can be called (with binded this) to get dynamic value of the argument
            // the publicPropName is the name of a public property or function
            // name of the same object where this attribute is applied
            // settings ones are defined as another special string
            this.args = [];
            for(let arg of args) {
                if (typeof arg === 'string') {
                    if (arg.startsWith('[') && arg.endsWith(']')) {
                        let fnName = arg.replace('[', '').replace(']', ''),
                            fn = function() {
                                let member = this[fnName]; // 'this' would change because of binding call when this function is called
                                if (typeof member === 'function') {
                                    return member();
                                } else {
                                    return member;
                                }
                            };
                            this.args.push(fn);
                    } else {
                        this.args.push(arg);
                    }
                } else {
                    this.args.push(arg);
                }
            }
        });
        
        this.prop('args', []);
        this.func('decorator', (fn) => {
            if (typeof fn === 'function') {
                decoratorFn = fn;
            }
            return decoratorFn;
        });
        this.func('resetEventInterface', (source, target) => {
            target.subscribe = source.subscribe;
            target.unsubscribe = source.unsubscribe;
            delete source.subscribe;
            delete source.unsubscribe;
        });
    });
    
    // async
    // async() 
    flair.Container.register('async', flair.Class('async', flair.Attribute, function() {
        this.decorator((obj, type, name, descriptor) => {
            // validate
            if (['func'].indexOf(type) === -1) { throw `async attribute cannot be applied on ${type} members.`; }
            if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `async attribute cannot be applied on special function.`; }
    
            // decorate
            let fn = descriptor.value;
            descriptor.value = function(...args) {
                return new Promise((resolve, reject) => {
                    let fnArgs = [resolve, reject].concat(args);
                    fn(...fnArgs);
                });
            }.bind(obj);
        });
    }));
    
    // deprecate
    // deprecate([message])
    //  - message: any custom message
    flair.Container.register('deprecate', flair.Class('deprecate', flair.Attribute, function() {
        this.decorator((obj, type, name, descriptor) => {
            // validate
            if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `deprecate attribute cannot be applied on special function.`; }
    
            // decorate
            let msg = `${name} is deprecated.`;
            let _get, _set, fn, ev = null;
            if (typeof this.args[0] !== 'undefined') { msg += ' ' + this.args[0] }
            switch(type) {
                case 'prop':
                    if (descriptor.get) {
                        _get = descriptor.get;                                
                        descriptor.get = function() {
                            // eslint-disable-next-line no-console
                            console.warn(msg);
                            return _get();
                        }.bind(obj);
                    }
                    if (descriptor.set) {
                        _set = descriptor.set;
                        descriptor.set = function(value) {
                            // eslint-disable-next-line no-console
                            console.warn(msg);
                            return _set(value);
                        }.bind(obj);
                    }   
                    break;
                case 'func':
                    fn = descriptor.value;
                    descriptor.value = function(...args) {
                        // eslint-disable-next-line no-console
                        console.warn(msg);
                        fn(...args);
                    }.bind(obj);
                    break;
                case 'event':
                    ev = descriptor.value;
                    descriptor.value = function(...args) {
                        // eslint-disable-next-line no-console
                        console.warn(msg);
                            ev(...args);
                    }.bind(obj);
                    this.resetEventInterface(fn, descriptor.value);
                    break;
            }
        });
    }));
    
    // enumerate
    // enumerate(flag)
    //  - flag: true/false
    flair.Container.register('enumerate', flair.Class('enumerate', flair.Attribute, function() {
        this.decorator((obj, type, name, descriptor) => {
            // validate
            if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `enumerate attribute cannot be applied on special function.`; }
    
            // decorate
            let flag = this.args[0];
            descriptor.enumerable = flag;
        });
    }));
    
    let incCycle = [];
    /**
     * @name include
     * @description Fetch, load and/or resolve an external dependency for required context
     * @example
     *  include(deps, fn)
     * @params
     *  deps: array - array of strings, each defining a dependency to fetch/load or resolve
     *      >> each dep definition string should be defined using following syntax:
     *          'name: definition'
     *          e.g., fs: fs OR MyClass: my.namespace.MyClass
     * 
     *          >> Each definition can take following form:
     *          >> <namespace>.<name>
     *              >> e.g., 'my.namespace.MyClass'
     *              >> this will be looked in given namespace first, so an already loaded type will be picked first
     *              >> if not found in given namespace, it will look for the assembly where this type might be registered
     *              >> if found in a registered assembly, it will load that assembly and again look for it in given namespace
     *          >> [<name>]
     *              >> e.g., '[IBase]'
     *              >> this can be a registered alias to any type and is resolved via DI container
     *              >> if resolved type is an string, it will again pass through <namespace>.<name> resolution process
     *          >> <name>
     *              >> e.g., 'fs'
     *              >> this can be a NodeJS module name (on server side) or a JavaScript module name (on client side)
     *              >> it will be loaded using configured moduleLoaderFn
     *              >> if no moduleLoaderFn is configured, it will throw an error if could not be resolved using default module loaders
     *          >> <path>/<file>.js|.mjs
     *              >> e.g., '/my/path/somefile.js'
     *              >> this can be a bare file to load to, it will be resolved using configured fileLoaderFn
     *              >> path is always treated in context of the root path - full, relative paths from current place are not supported
     *              >> to handle PRODUCTION and DEBUG scenarios automatically, use <path>/<file>{.min}.js|.mjs format. 
     *              >> it PROD symbol is available, it will use it as <path>/<file>.min.js otherwise it will use <path>/<file>.js
     *          >> <path>/<file.css|json|html|...>
     *              >> e.g., '/my/path/somefile.css'
     *              >>  if ths is not a js|mjs file, it will treat it as a resource file and will use fetch/require, as applicable
     *      
     *          NOTE: Each dep definition can also be defined for contextual consideration as:
     *          '<depA> | <depB>'
     *          when running on server, <depA> would be considered, and when running on client <depB> will be used
     * 
     *          IMPORTANT: Each dependency is resolved with a Resolved Object
     *  fn: function - function where to pass resolved dependencies
     *          >> this func is passed an extractor function (generally named as deps) and if there was any error in deps definitions
     *           (<name>) returns null if failed or not defined, or the dependency, if loaded
     *           (<name>, true) returns dependency or throw actual exception that caused dependency load to fail
     * @returns void
     * @throws
     *  None
     */ 
    flair.include = (deps, fn) => {
        let _depsType = _typeOf(deps),
            _depsError = null;
        if (_depsType !== 'string' && _depsType !== 'array') { _depsError = new _Exception('InvalidArgument', 'Argument type is invalid. (deps)'); }
        if (!_depsError && _depsType === 'string') { deps = [deps]; }
        if (!_depsError && typeof fn !== 'function') { _depsError = new _Exception('InvalidArgument', 'Argument type is invalid. (fn)'); }
    
        let resolvedItems = {},
            _deps = (_depsError ? null : deps.slice());
    
        let loader = (isServer, isModule, file) => {
            let loaders = flair.options.loaders,
                loaderOverrides = flair.options.loaderOverrides,
                loader = null;
            return new Promise((resolve, reject) => {
                let ext = file.substr(file.lastIndexOf('.') + 1).toLowerCase();
                if (isServer) {
                    if (isModule) {
                        loader = loaders.module.server || loaderOverrides.moduleLoaderServer || null;
                        if (typeof loader === 'function') {
                            loader(file).then(resolve).catch(reject);
                        } else {
                            try {
                                resolve(require(file));
                            } catch(e) {
                                reject(e);
                            }
                        }
                    } else { // file
                        loader = loaders.file.server || loaderOverrides.fileLoaderServer || null;
                        if (typeof loader === 'function') {
                            loader(file).then(resolve).catch(reject);
                        } else {
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
                        }
                    }
                } else { // client
                    if (isModule) {
                        loader = loaders.module.client || loaderOverrides.moduleLoaderClient || null;
                        if (typeof loader === 'function') {
                            loader(file).then(resolve).catch(reject);
                        } else { 
                            try {
                                if (typeof require !== 'undefined') { // if requirejs type library having require() is available to load modules / files on client
                                    require([file], resolve, reject);
                                } else { // load it as file on browser, this could be a problem for module types // TODO: this needs to be changed, when there is a case
                                    let js = flair.options.env.global.document.createElement('script');
                                    js.type = 'text/javascript';
                                    js.name = file;
                                    js.src = file;
                                    js.onload = resolve;
                                    js.onerror = reject;
                                    flair.options.env.global.document.head.appendChild(js);
                                }
                            } catch(e) {
                                reject(e);
                            }
                        }
                    } else { // file
                        loader = loaders.file.client || loaderOverrides.fileLoaderClient || null;
                        if (typeof loader === 'function') {
                            loader(file).then(resolve).catch(reject);
                        } else {
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
                    }
                }
            });
        };
    
        /**
         * @description Dependency extractor function that helps in extracting dependencies by name
         * @example
         *  (name)
         *  (name, isThrow)
         * @params
         *  name: string - name of the dependency to extract
         *  isThrow: bool - if dependency could not be loaded, whether to re-throw the actual exception that made it failed to load
         * @returns dependency object or null
         */
        let _dep_extract = (name, isThrow) => {
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            if (!resolvedItems[name]) { throw new _Exception('InvalidName', `Name is not valid. (${name})`); }
            if (resolvedItems[name].error && isThrow) { throw resolvedItems[name].error; }
            return resolvedItems[name].dep;
        };
    
        let processedAll = () => {
            if (typeof fn === 'function') {
                fn(_dep_extract, _depsError); 
            }
        };
    
        let resolveNext = () => {
            if (_depsError || _deps.length === 0) {
                processedAll(); return;
            } else {
                let _dep = _deps.shift().trim(),
                    _depName = '',
                    _resolved = null,
                    _error = null;
    
                // get dep name
                if (_dep === '') { _depsError = new _Exception('InvalidArgument', `Argument type is invalid. (deps)`); processedAll(); return; }
                let _items = _dep.split(':');
                if (_items.length !== 2) { _depsError = new _Exception('InvalidArgument', `Argument type is invalid. (${_dep})`); processedAll(); return; }
                _depName = _items[0].trim();
                _dep = _items[1].trim();
                if (resolvedItems[_depName]) { _depsError = new _Exception('DuplicateName', `Duplicate names are not allowed. (${_depName})`); processedAll(); return; }
                resolvedItems[_depName] = {
                    error: null,
                    dep: null
                };
    
                // pick contextual dep
                _dep = which(_dep);
    
                // check if this is an alias registered on DI container
                let option1 = (done) => {
                    if (_dep.startsWith('[') && _dep.endsWith(']') && _dep.indexOf('.') === -1) {
                        let _dep2 = _dep.substr(1, _dep.length -2).trim(); // remove [ and ]
                        if (flair.Container.isRegistered(_dep2)) {
                            _resolved = flair.Container(_dep2); // first registered item
                            if (typeof _resolved === 'string') { // this was an alias to something else, treat it as not resolved
                                _dep = _resolved; // instead continue resolving with this new redirected _dep 
                                _resolved = null;
                            }
                        }
                    }
                    done();
                };            
    
                // check if it is available in any namespace
                let option2 = (done) => {
                    _resolved = flair.Namespace.getType(_dep); done();
                };
    
                // check if it is available in any unloaded assembly
                let option3 = (done) => {
                    let asm = flair.Assembly.get(_dep);
                    if (asm) { // if type exists in an assembly
                        if (!asm.isLoaded()) {
                            asm.load().then(() => {
                                _resolved = flair.Namespace.getType(_dep); done();
                            }).catch((e) => {
                                _error = new _Exception('AssemblyLoad', `Assembly load operation failed with error: ${e}. (${asm.file()})`); done();
                            });
                        } else {
                            _resolved = flair.Namespace.getType(_dep); done();
                        }
                    } else {
                        done();
                    }
                };
    
                // check if this is a file
                let option4 = (done) => {
                    let ext = _dep.substr(_dep.lastIndexOf('.') + 1).toLowerCase();
                    if (ext) {
                        if (ext === 'js' || ext === 'mjs') {
                            // pick contextual file for DEBUG/PROD
                            _dep = which(_dep, true);
                            
                            // this will be loaded as module in next option as a module
                            done();
                        } else { // some other file (could be json, css, html, etc.)
                            loader(flair.options.env.isServer, false, _dep).then((content) => {
                                _resolved = content; done();
                            }).catch((e) => {
                                _error = new _Exception('FileLoad', `File load failed. (${_dep})`, e); done();
                            });
                        }
                    } else { // not a file
                        done();
                    }
                };
    
                // check if this is a module
                let option5 = (done) => {
                    loader(flair.options.env.isServer, true, _dep).then((content) => { // as last option, try to load it as module
                        _resolved = content; done();
                    }).catch((e) => {
                        _error = new _Exception('ModuleLoad', `Module load operation failed with error: ${e}. (${_dep})`); done();
                    });                
                };
    
                // done
                let resolved = (isExcludePop) => {
                    resolvedItems[_depName].error = _error;
                    resolvedItems[_depName].dep = _resolved; 
                    if (!isExcludePop) { incCycle.pop(); } // removed the last added dep
                    resolveNext();
                };
    
                // process
                if (_dep === '') { // nothing is defined to process
                    resolved(true); return;
                } else {
                    // cycle break check
                    if (incCycle.indexOf(_dep) !== -1) {
                        _error = new _Exception('CircularDependency', `Circular dependency identified. (${_dep})`);
                        resolved(true); return;
                    } else {
                        incCycle.push(_dep);
                    }
    
                    // run
                    option1(() => {
                        if (!_resolved) { option2(() => {
                            if (!_resolved) { option3(() => {
                                if (!_resolved) { option4(() => {
                                    if (!_resolved) { option5(() => {
                                        if (!_resolved) {
                                            _error = new _Exception('DependencyResolution', `Failed to resolve dependency. ${_dep}`);
                                            resolved(); return;
                                        } else { resolved(); }
                                    }) } else { resolved(); }
                                }) } else { resolved(); }
                            }) } else { resolved(); }
                        }) } else { resolved(); }
                    }); 
                }
            }
        }
    
        // start processing
        resolveNext();
    };
    
    // reset api
    flair.include._ = {
        reset: () => { incCycle = []; }
    };
    
    // add to members list
    flair.members.push('include');
    // inject
    // inject(type, [typeArgs])
    //  - type: 
    //      type class itself to inject, OR
    //      type class name, OR
    //      type class name on server | type class name on client
    //  - typeArgs: constructor args to pass when type class instance is created
    // NOTE: types being referred here must be available in container so sync resolve can happen
    flair.Container.register('inject', flair.Class('inject', flair.Attribute, function() {
        this.decorator((obj, type, name, descriptor) => {
            // validate
            if (['func', 'prop'].indexOf(type) === -1) { throw `inject attribute cannot be applied on ${type} members.`; }
            if (['_constructor', '_dispose'].indexOf(name) !== -1) { throw `inject attribute cannot be applied on special function.`; }
    // TODO: allow on constructor as well
            // decorate
            let Type = this.args[0],
                typeArgs = this.args[1],
                instance = null,
                fn = null;
            if (!Array.isArray(typeArgs)) { typeArgs = [typeArgs]; }
            if (typeof Type === 'string') { 
                // get contextual type
                Type = which(Type);
    
                // get instance
                instance = flair.Container.resolve(Type, false, ...typeArgs)
            } else {
                instance = new Type(...typeArgs);
            }
            switch(type) {
                case 'func':
                    fn = descriptor.value;
                    descriptor.value = function(...args) {
                        fn(instance, ...args); // TODO: push at the end
                    }.bind(obj);
                    break;
                case 'prop':
                    obj[name] = instance;                        
                    break;
            }
        });
    }));
    
    // multiinject
    // multiinject(type, [typeArgs])
    //  - type: 
    //      type class name, OR
    //      type class name on server | type class name on client
    //  - typeArgs: constructor args to pass when type class instance is created
    // NOTE: types being referred here must be available in container so sync resolve can happen
    flair.Container.register('multiinject', flair.Class('multiinject', flair.Attribute, function() {
        this.decorator((obj, type, name, descriptor) => {
            // validate
            if (['func', 'prop'].indexOf(type) === -1) { throw `multiinject attribute cannot be applied on ${type} members.`; }
            if (['_constructor', '_dispose'].indexOf(name) !== -1) { throw `multiinject attribute cannot be applied on special function.`; }
    
            // decorate
            let Type = this.args[0],
                typeArgs = this.args[1],
                instance = null,
                fn = null;
            if (!Array.isArray(typeArgs)) { typeArgs = [typeArgs]; }
            if (typeof Type === 'string') {
                // get contextual type
                Type = which(Type);
    
                // get instance
                instance = flair.Container.resolve(Type, true, ...typeArgs)
            } else {
                throw `multiinject attribute does not support direct type injections.`;
            }
            switch(type) {
                case 'func':
                    fn = descriptor.value;
                    descriptor.value = function(...args) {
                        fn(instance, ...args);
                    }.bind(obj);
                    break;
                case 'prop':
                    obj[name] = instance;                        
                    break;
            }
        });
    }));
    
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
    
    // TODO: MOVE get method as Aspects() itself - this is how it is used in weave function
    // Aspect
    flair.Aspect = flair.Class('Aspect', function(attr) {
        let beforeFn = null,
            afterFn = null,
            aroundFn = null;
        attr('abstract');
        this.construct((...args) => {
            this.args = args;
        });
        
        this.prop('args', []);
        this.func('before', (fn) => {
            if (typeof fn === 'function') {
                beforeFn = fn;
            }
            return beforeFn;
        });
        this.func('after', (fn) => {
            if (typeof fn === 'function') {
                afterFn = fn;
            }
            return afterFn;
        });
        this.func('around', (fn) => {
            if (typeof fn === 'function') {
                aroundFn = fn;
            }
            return aroundFn;
        });
    });
    
    // Serializer
    flair.Serializer = {};
    flair.Serializer.serialize = (instance) => { 
        if (instance._.type === 'instance') {
            return instance._.serialize(); 
        }
        return null;
    };
    flair.Serializer.deserialize = (Type, json) => {
        let instance = new Type();
        if (instance._.type === 'instance') {
            instance._.deserialize(json);
            return instance;
        }
        return null;
    };
    
    // Reflector
    flair.Reflector = function (forTarget) {
        // define
        const CommonTypeReflector = function(target) {
            this.getType = () => { return target._.type; };
            this.getName = () => { return target._.name || ''; };
            this.getNamespace = () => { 
                let _Namespace = target._.namespace;
                if (_Namespace) { return new NamespaceReflector(_Namespace); }
                return null; 
            };
            this.getAssembly = () => {
                let _Assembly = flair.Assembly.get(target._.name);
                if (_Assembly) { return new AssemblyReflector(_Assembly); }
                return null;
            }
            this.getTarget = () => { return target; };
            this.isInstance = () => { return target._.type === 'instance'; };
            this.isClass = () => { return target._.type === 'class'; };
            this.isEnum = () => { return target._.type === 'enum'; };
            this.isProc = () => { return target._.type === 'proc'; };
            this.isStruct = () => { return target._.type === 'struct'; };
            this.isStructInstance = () => { return target._.type === 'sinstance'; };
            this.isNamespace = () => { return target._.type === 'namespace'; };
            this.isResource = () => { return target._.type === 'resource'; };
            this.isAssembly = () => { return target._.type === 'assembly'; };
            this.isMixin = () => { return target._.type === 'mixin'; };
            this.isInterface = () => { return target._.type === 'interface'; };
        };
        const CommonMemberReflector = function(type, target, name) {
            this.getType = () => { return 'member'; }
            this.getMemberType = () => { return type; }
            this.getTarget = () => { return target; }
            this.getTargetType = () => { return target._.type; }
            this.getName = () => { return name; }
        };
        const AttrReflector = function(Attr, name, args, target) {
            this.getType = () => { return 'attribute'; }
            this.getName = () => { return name; }
            this.getTarget = () => { return target; }
            this.getArgs = () => { return args.slice(); }
            this.getClass = () => { 
                if (Attr) { return new ClassReflector(Attr); }
                return null;
                }
        };
        const AspectReflector = function(Aspect, target) {
            this.getType = () => { return 'aspect'; }
            this.getName = () => { return Aspect._.name; }
            this.getTarget = () => { return target; }
            this.getClass = () => { 
                if (Aspect) { return new ClassReflector(Aspect); }
                return null;
                }
        };
        const CommonInstanceMemberReflector = function(type, target, name, ref) {
            let refl = new CommonMemberReflector(type, target, name);
            refl.getRef = () => { return ref; };
            refl.getAttributes = () => {
                let items = [],
                    attrs = [];
                for (let item of target._.instanceOf) {
                    if (item.meta[name]) {
                        attrs = item.meta[name];
                        for(let attr of attrs) {
                            items.push(new AttrReflector(attr.Attr, attr.name, attr.args, target));
                        }
                    }
                }
                return items;
            };
            refl.hasAttribute = (attrName) => {
                let isOk = false,
                    attrs = [];
                for (let item of target._.instanceOf) {
                    if (item.meta[name]) {
                        attrs = item.meta[name];
                        for(let attr of attrs) {
                            if (attr.name == attrName) {
                                isOk = true; break;
                            }
                        }
                    }
                    if (isOk) { break; }
                }
                return isOk;                 
            };
            refl.getAttribute = (attrName) => {
                let attrInfo = null;
                for (let item of target._.instanceOf) {
                    if (item.meta[name]) {
                        let attrs = item.meta[name];
                        for(let attr of attrs) {
                            if (attr.name === attrName) {
                                attrInfo = new AttrReflector(attr.Attr, attr.name, attr.args, target);
                                break;
                            }
                        }
                    }
                    if (attrInfo !== null) { break; }
                }
                return attrInfo;
            };
            refl.isEnumerable = () => {
                if (target[name]) { 
                    return Object.getOwnPropertyDescriptor(target, name).enumerable;
                }
                return false;
            };
            // TODO: Update these as per new API ._.member and ._.attrs
            refl.isDeprecated = () => { return target._._.hasAttrEx('deprecate', name); };
            refl.isConditional = () => { return target._._.hasAttrEx('conditional', name); };
            refl.isOverridden = () => { return target._._.hasAttrEx('override', name); };
            refl.isOwn = () => { return target._.isOwnMember(name); };
            refl.isDerived = () => { return target._._.isDerivedMember(name); };
            refl.isPrivate = () => { return target._._.hasAttrEx('private', name); };
            refl.isProtected = () => { return target._._.isProtectedMember(name); };
            refl.isPublic = () => { return (!refl.isPrivate && !refl.isProtected); };
            refl.isSealed = () => { return target._._.isSealedMember(name); };
            refl.isMixed = () => { return target._._.hasAttrEx('mixed', name); };
            refl.getMixin = () => { 
                if (refl.isMixed()) {
                    let mixin = refl.getAttribute('mixed').getArgs()[0];
                    return new MixinReflector(mixin);
                }
                return null;
            };
            refl.isInterfaceEnforced = () => { return refl.getInterfaces().length > 0; };
            refl.getInterfaces = () => {
                let items = [],
                    interfaces = [];
                for (let item of target._.instanceOf) {
                    if (item.meta[name]) {
                        interfaces = item.meta[name].interfaces;
                        for(let iface of interfaces) {
                            items.push(new InterfaceReflector(iface, target));
                        }
                    }
                }
                return items;                    
            };        
            refl.isProp = () => { return type === 'prop'; }
            refl.isFunc = () => { return type === 'func'; }
            refl.isEvent = () => { return type === 'event'; }
            return refl;
        };
        const PropReflector = function(target, name, ref) {
            let refl = new CommonInstanceMemberReflector('prop', target, name, ref);
            refl.getValue = () => { return target[name]; };
            refl.setValue = (value) => { return target[name] = value; };
            refl.getRaw = () => { return ref; };
            refl.isReadOnly = () => { return target._._.hasAttrEx('readonly', name); };
            refl.isSetOnce = () => { return target._._.hasAttrEx('readonly', name) && target._._.hasAttrEx('once', name); };
            refl.isStatic = () => { return target._._.hasAttrEx('static', name); };
            refl.isSerializable = () => { return target._._.isSerializableMember(name); }
            return refl;
        };
        const FuncReflector = function(target, name, ref, raw) {
            let refl = new CommonInstanceMemberReflector('func', target, name, ref);
            refl.invoke = (...args) => { return target[name](...args); };
            refl.getAspects = () => {
                let items = [],
                    aspects = [];
                for (let item of target._.instanceOf) {
                    if (item.meta[name]) {
                        aspects = item.meta[name].aspects;
                        for(let aspect of aspects) {
                            items.push(new AspectReflector(aspect, target));
                        }
                    }
                }
                return items;                    
            };
            refl.getRaw = () => { return raw; };
            refl.isASync = () => { return target._._.hasAttrEx('async', name); }
            refl.isConstructor = () => { return name === '_constructor'; }
            refl.isDisposer = () => { return name === '_dispose'; }
            return refl;
        };
        const EventReflector = function(target, name, ref) {
            let refl = new CommonInstanceMemberReflector('event', target, name, ref);
            refl.raise = (...args) => { return ref(...args); }
            refl.isSubscribed = () => { return ref.subscribe.all().length > 0; }
            return refl;
        };
        const KeyReflector = function(target, name) {
            let refl = new CommonMemberReflector('key', target, name);
            refl.getValue = () => { return target[name]; }
            return refl;
        };
        const InstanceReflector = function(target) {
            let refl = new CommonTypeReflector(target),
                filterMembers = (members, type, attrs) => {
                    if (type === '' && attrs.length === 0) { return members.slice(); }
                    let filtered = [],
                        hasAllAttrs = true;
                    for(let member of members) {
                        if (member.getType() !== 'member') { continue; }
                        if (type !== '' && member.getMemberType() !== type) { continue; }
                        hasAllAttrs = true;
                        if (attrs.length !== 0) {
                            for(let attrName of attrs) {
                                if (!member.hasAttribute(attrName)) {
                                    hasAllAttrs = false;
                                    break; 
                                }
                            }
                        }
                        if (hasAllAttrs) {
                            filtered.push(member);
                        }
                    }
                    return filtered;
                },
                getMembers = (oneMember) => {
                    let members = [],
                        attrs = [], // eslint-disable-line no-unused-vars
                        lastMember = null,
                        member = null;
                    for(let instance of target._.instanceOf) {
                        for(let name in instance.meta) {
                            if (instance.meta.hasOwnProperty(name)) {
                                attrs = instance.meta[name];
                                switch(instance.meta[name].type) {
                                    case 'func':
                                        lastMember = new FuncReflector(target, name, instance.meta[name].ref, instance.meta[name].raw);
                                        members.push(lastMember);
                                        break;
                                    case 'prop':
                                        lastMember = new PropReflector(target, name, instance.meta[name].ref);
                                        members.push(lastMember);
                                        break;
                                    case 'event':
                                        lastMember = new EventReflector(target, name, instance.meta[name].argNames, instance.meta[name].ref);
                                        members.push(lastMember);
                                        break;
                                    default:
                                        throw 'Unknown member type';
                                }
                                if (typeof oneMember !== 'undefined' && name === oneMember) { 
                                    members = [];
                                    member = lastMember;
                                }
                            }
                            if (member !== null) { break; }
                        }
                        if (member !== null) { break; }
                    }
                    if (member !== null) { return member; }
                    return {
                        all: (...attrs) => { 
                            return filterMembers(members, '', attrs);
                        },
                        func: (...attrs) => { 
                            return filterMembers(members, 'func', attrs);
                        },
                        prop: (...attrs) => {
                            return filterMembers(members, 'prop', attrs);
                        },
                        event: (...attrs) => {
                            return filterMembers(members, 'event', attrs);
                        }
                    };                  
                };
            refl.getClass = () => { 
                if (target._.inherits !== null) {
                    return new ClassReflector(target._.inherits);
                }
                return null;
            };
            refl.getFamily = () => {
                let items = [],
                    prv = target._.inherits;
                // eslint-disable-next-line no-constant-condition
                while(true) {
                    if (prv === null) { break; }
                    items.push(new ClassReflector(prv));
                    prv = prv._.inherits;
                }
                return items;
            };
            refl.getMixins = () => { 
                let items = [],
                    family = refl.getFamily();
                for(let cls of family) {
                    items = items.concat(cls.getMixins());
                }
                return items;
            };
            refl.getInterfaces = () => { 
                let items = [],
                    family = refl.getFamily();
                for(let cls of family) {
                    items = items.concat(cls.getInterfaces());
                }
                return items;
            };
            refl.getMembers = (...attrs) => { 
                let members = getMembers();
                if (attrs.length !== 0) {
                    return members.all(...attrs);
                }
                return members;
            };
            refl.getMember = (name) => { return getMembers(name); };
            refl.isSingleton = () => { return refl.getClass().isSingleton(); };                       
            refl.isInstanceOf = (name) => { return target._.isInstanceOf(name); };
            refl.isMixed = (name) => { return target._.isMixed(name); };
            refl.isImplements = (name) => { return target._.isImplements(name); };
            return refl;              
        };
        const StructInstanceReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            refl.getStruct = () => { 
                if (target._.inherits !== null) {
                    return new StructReflector(target._.inherits);
                }
                return null;
            };
            refl.getMembers = () => { 
                let keys = Object.keys(target),
                    _At = keys.indexOf('_');
                if (_At !== -1) {
                    keys.splice(_At, 1);
                }
                return keys;
            };
            refl.getMember = (name) => { return target[name]; };
            refl.invoke = (...args) => { return target[name](...args); };
            refl.isInstanceOf = (name) => { return target._.inherits._.name === name; };
            return refl;              
        };    
        const ClassReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            refl.getParent = () => { 
                if (target._.inherits !== null) {
                    return new ClassReflector(target._.inherits);
                }
                return null;
            };
            refl.getFamily = () => {
                let items = [],
                    prv = target._.inherits;
                // eslint-disable-next-line no-constant-condition    
                while(true) {
                    if (prv === null) { break; }
                    items.push(new ClassReflector(prv));
                    prv = prv._.inherits;
                }
                return items;
            };       
            refl.getMixins = () => {
                let items = [];
                for(let mixin of target._.mixins) {
                    items.push(new MixinReflector(mixin));
                }
                return items;
            };
            refl.getInterfaces = () => {
                let items = [];
                for(let _interface of target._.interfaces) {
                    items.push(new InterfaceReflector(_interface));
                }
                return items;
            };
            refl.isSingleton = () => { return target._.isSingleton(); };                       
            refl.isSingleInstanceCreated = () => { return target._.singleInstance() !== null; };
            refl.isSealed = () => { return target._.isSealed(); }
            refl.isDerivedFrom = (name) => { return target._.isDerivedFrom(name); }
            refl.isMixed = (name) => { return target._.isMixed(name); }
            refl.isImplements = (name) => { return target._.isImplements(name); }
            return refl;                
        };
        const EnumReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            refl.getMembers = () => { 
                let keys = target._.keys(),
                    members = [];
                for(let key of keys) {
                    members.push(new KeyReflector(target, key));
                }
                return members;
            };
            refl.getMember = (name) => {
                if (typeof target[name] === 'undefined') { throw `${name} is not defined.`; }
                return new KeyReflector(target, name);
            };
            refl.getKeys = () => { return target._.keys(); }
            refl.getValues = () => { return target._.values(); }
            return refl;
        };
        const ProcReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            refl.isASync = () => { target.isASync(); };
            refl.invoke = (...args) => { return target._.invoke(...args); }
            return refl;
        };    
        const ResourceReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            refl.getFile = () => { return target.file(); };
            refl.getResType = () => { return target.type(); };
            refl.getContent = () => { return target.get(); };
            return refl;
        };
        const StructReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            return refl;
        };            
        const NamespaceReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            refl.getMembers = () => { 
                let types = target.getTypes(),
                    members = [];
                if (types) {
                    for(let type of types) {
                        switch(type._.type) {
                            case 'class': members.push(new ClassReflector(type)); break;
                            case 'enum': members.push(new EnumReflector(type)); break;
                            case 'struct': members.push(new StructReflector(type)); break;
                            case 'mixin': members.push(new MixinReflector(type)); break;
                            case 'interface': members.push(new InterfaceReflector(type)); break;                    
                        }
                    }
                }
                return members;
            };
            refl.getMember = (qualifiedName) => {
                let Type = target.getType(qualifiedName),
                    member = null;
                if (Type) {
                    switch(Type._.type) {
                        case 'class': member = new ClassReflector(Type); break;
                        case 'enum': member = new EnumReflector(Type); break;
                        case 'struct': member = new StructReflector(Type); break;
                        case 'mixin': member = new MixinReflector(Type); break;
                        case 'interface': member = new InterfaceReflector(Type); break;                    
                    }
                }
                return member;
            };
            refl.createInstance = (qualifiedName, ...args) => {
                return target.createInstance(qualifiedName, ...args);
            };
            return refl;
        };
        const AssemblyReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            refl.getTypes = () => { 
                return target.types;
            };
            refl.getAssets = () => { 
                return target.assets;
            };
            refl.getADO = () => { return target._.ado; }
            refl.load = () => {
                return target.load();
            };
            return refl;
        };    
        const MixinReflector = function(target) {
            let refl = new CommonTypeReflector(target);
            return refl;
        };
        const InterfaceReflector = function(target) {
            let refl = new CommonTypeReflector(target),
                getMembers = () => {
                    let members = [];
                    for(let _memberName in target) {
                        if (target.hasOwnProperty(_memberName) && _memberName !== '_') {
                            members.push(new CommonMemberReflector(target[_memberName].type, target, _memberName));
                        }
                    }
                    return members;                     
                };
            refl.getMembers = () => { 
                return getMembers();
            }
            refl.getMember = (name) => {
                if (typeof target[name] === 'undefined') { throw `${name} is not defined.`; }
                return new CommonMemberReflector(target[name].type, target, name);
            };
            return refl;
        };
    
        // get
        let ref = null;
        switch(forTarget._.type) {
            case 'instance': ref = new InstanceReflector(forTarget); break;
            case 'sinstance': ref = new StructInstanceReflector(forTarget); break;
            case 'class': ref = new ClassReflector(forTarget); break;
            case 'enum': ref = new EnumReflector(forTarget); break;
            case 'proc': ref = new ProcReflector(forTarget); break;
            case 'resource': ref = new ResourceReflector(forTarget); break;
            case 'struct': ref = new StructReflector(forTarget); break;
            case 'namespace': ref = new NamespaceReflector(forTarget); break;
            case 'assembly': ref = new AssemblyReflector(forTarget); break;
            case 'mixin': ref = new MixinReflector(forTarget); break;
            case 'interface': ref = new InterfaceReflector(forTarget); break;
            default:
                throw `Unknown type ${forTarget._.type}.`;
        }
    
        // return
        return ref;
    };
    
    // add to members list
    flair.members.push('Reflector');    
  
    // set global
    if (!options.env.suppressGlobals) {
        for(let name of flair.members) {
            _global[name] = Object.freeze(flair[name]);
        }
    }
    flair.members = Object.freeze(flair.members);
    _global.flair = Object.freeze(flair); // this is still exposed, so can be used globally

    // return
    return _global.flair;
});