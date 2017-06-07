/**
 * oojs.js
 * version 1.0.0
 * (C) 2017, Vikas Burman
 * MIT License 
 */
(function() {
    // the definition
    const def = (opts = {}) => {
        let oojs = {},
            isServer = ((typeof global === 'object' && typeof exports === 'object') ? true : false),
            options = {
                env: opts.env || (isServer ? 'server' : 'client'),
                global: (isServer ? global : window),
                supressGlobals: (typeof opts.supressGlobals === 'undefined' ? false : opts.supressGlobals),
                symbols: opts.symbols || []
            };

        // Class
        // Class(className, function() {})
        // Class(className, inherits, function() {})
        // Class(className, mixins, function() {})
        // Class(className, inherits, mixins, function() {})
        oojs.Class = (arg1, arg2, arg3, arg4) => {
            let className = arg1,
                inherits = null,
                mixins = [],
                factory = null;
            if (typeof arg3 === 'function') {
                factory = arg3;
                if (Array.isArray(arg2)) {
                    mixins = arg2;
                } else {
                    inherits = arg2;
                }
            } else if (typeof arg4 === 'function') {
                inherits = arg2;
                mixins = arg3;
                factory = arg4;
            } else if (typeof arg2 === 'function') {
                factory = arg2;
            }

            // build class definition
            let Class = function(_flag, _static, ...args) {
                let Parent = Class._.inherits,
                    _this = {},
                    _exposed_this = {},
                    singleInstance = null,
                    bucket = [],
                    meta = {},
                    props = {},
                    events = [],
                    classArgs = [],
                    isNeedProtected = false,
                    staticInterface = null,
                    theFlag = '__flag__';

                // singleton consideration
                singleInstance = Class._.singleInstance();
                if (singleInstance) { return singleInstance; }

                // classArgs and static
                if (_flag && _flag === theFlag) {
                    staticInterface = _static;
                    isNeedProtected = true;
                    classArgs = args;
                } else {
                    staticInterface = Class._.static;
                    if (_flag) {
                        classArgs = classArgs.concat([_flag]);
                        if (_static) {
                            classArgs = classArgs.concat([_static]);
                            if (args) {
                                classArgs = classArgs.concat(args);
                            }
                        }
                    } else {
                        classArgs = args;
                    }
                }

                // create parent instance
                if (Parent) {
                    _this = new Parent(theFlag, staticInterface, ...classArgs);
                    if (Parent._.isSealed() || Parent._.isSingleton()) {
                        throw `${className} cannot inherit from a sealed/singleton class ${Parent._.name}.`;
                    }
                }

                // definition helper
                const isSingletonClass = () => {
                    return hasAttr('singleton', meta['_constructor']);
                }
                const isSpecialMember = (member) => {
                    return ['constructor', 'dispose', '_constructor', '_dispose', '_'].indexOf(member) !== -1;
                };
                const isOwnMember = (member) => {
                    return typeof meta[member] !== 'undefined';
                };
                const isDerivedMember = (member) => {
                    if (isOwnMember(member)) { return false; }
                    return (_this._.instanceOf.findIndex((item) => {
                        return (item.meta[member] ? true : false);
                    }) !== -1);   
                };
                const isSealedMember = (member) => {
                    return hasAttr('sealed', meta[member]);
                }
                const isStaticMember = (member) => {
                    return hasAttr('static', meta[member]);
                }
                const isPrivateMember = (member) => {
                    return hasAttr('private', meta[member]);
                };
                const isProtectedMember = (member) => {
                    return hasAttrEx('protected', member);
                };
                const isSerializableMember = (member) => {
                    return hasAttrEx('serialize', member);
                };
                const isConditionalMemberOK = (member) => {
                    let isOK = true,
                        _meta = meta[member],
                        condition = '';
                    if (_meta) {
                        for(let item of _meta) {
                            if (item.name === 'conditional') {
                                isOK = false;
                                condition = (item.args && item.args.length > 0 ? item.args[0] : '');
                                switch(condition) {
                                    case 'server':
                                        isOK = (options.env === 'server'); break;
                                    case 'client':
                                        isOK = (options.env === 'client' || options.env === ''); break;
                                    default:
                                        isOK = options.symbols.indexOf(condition) !== -1; break;
                                }
                                break;                       
                            }
                        }
                    }
                    return isOK;
                };
                const doCopy = (member) => {
                    Object.defineProperty(_exposed_this, member, Object.getOwnPropertyDescriptor(_this, member));
                };            
                const isArrowFunction = (fn) => {
                    return (!(fn).hasOwnProperty('prototype'));
                }; 
                const attr = (attrName, ...args) => {
                    attrName = attrName.replace('@', ''); // remove @ from name
                    bucket.push({name: attrName, Attr: getAttr(attrName), args: args});
                };                
                const getAttr = (attrName) => {
                    return allAttributes[attrName];
                };
                const getAttrArgs = (attrName, member) => {
                    let attrArgs = null;
                    for(let item of _this._.instanceOf) {
                        if (item.meta[member]) {
                            for(let attrItem of item.meta[member]) {
                                if (attrItem.name === attrName) {
                                    attrArgs = attrItem.args;
                                    break;
                                }
                            }
                            if (attrArgs) { break; }
                        }
                    }
                    return (attrArgs !== null ? attrArgs : []);
                };
                const applyAttr = (targetName) => {
                   let Attr = null,
                        targetType = meta[targetName].type,
                        attrArgs = null,
                        attrInstance = null,
                        decorator = null;
                    for(let info of meta[targetName]) {
                        Attr = info.Attr;
                        if (Attr) {
                            attrArgs = info.args || [];
                            attrInstance = new Attr(...attrArgs);
                            decorator = attrInstance.decorator();
                            if (typeof decorator === 'function') {
                                let descriptor = Object.getOwnPropertyDescriptor(_this, targetName);
                                decorator(_this, targetType, targetName, descriptor);
                                Object.defineProperty(_this, targetName, descriptor);
                            }
                        }
                    }
                };
                const hasAttr = (attrName, _meta) => {
                    let has = false;
                    if (_meta) {
                        has = (_meta.findIndex((item) => { return item.name === attrName; }) !== -1);
                    }
                    return has;
                };
                const hasAttrEx = (attrName, member) => {
                    return (_this._.instanceOf.findIndex((item) => {
                        if (item.meta[member]) { return hasAttr(attrName, item.meta[member]); }
                        return false;
                    }) !== -1);           
                };              
                const isPatternMatched = (pattern, name) => {
                    let isMatched = (pattern === '*' ? true : false);
                    if (!isMatched) {
                        if (pattern.indexOf('*') !== -1) { // wild card based match (only *abc OR abc* patterns supported)
                            pattern = pattern.replace('*', '[\\w]');
                            pRegEx = new RegExp(pattern);
                            isMatched = pRegEx.test(name); 
                        } else { // full name match
                            isMatched = (pattern === name);
                        }
                    }
                    return isMatched;
                };
                const applyAspects = (funcName, funcAspects) => {
                    let fn = _this[funcName],
                        before = [],
                        after = [],
                        around = [],
                        instance = null,
                        _fn = null;
                    for(let funcAspect of funcAspects) {
                        instance = new funcAspect();
                        _fn = instance.before();
                        if (typeof _fn === 'function') {
                            before.push(_fn);
                        }
                        _fn = instance.around();
                        if (typeof _fn === 'function') {
                            around.push(_fn);
                        }
                        _fn = instance.after();
                        if (typeof _fn === 'function') {
                            after.push(_fn);
                        }
                    }

                    // around weaving
                    if (around.length > 0) { around.reverse(); }

                    // weaved function
                    let weavedFn = function(...args) {
                        let error = null,
                            result = null,
                            ctx = {
                                obj: () => { return _this; },
                                className: () => { return className; },
                                funcName: () => { return funcName; },
                                error: (err) => { 
                                    if (err) { error = err; }
                                    return error; 
                                },
                                result: (value) => { 
                                    if (typeof value !== 'undefined') { result = value; }
                                    return result;
                                },
                                args: () => { return args; },
                                data: {}
                            };
                        // before functions
                        for(let beforeFn of before) {
                            try {
                                beforeFn(ctx);
                            } catch (err) {
                                error = err;
                            }
                        }

                        // around func
                        let newFn = fn;
                        for(let aroundFn of around) {
                            newFn = aroundFn(ctx, newFn);
                        }                    
                        try {
                            ctx.result(newFn(...args));
                        } catch (err) {
                            error = err;
                        }

                        // after func
                        for(let afterFn of after) {
                            try {
                                afterFn(ctx);
                            } catch (err) {
                                error = err;
                            }
                        }

                        // return
                        return ctx.result();
                    }.bind(_this);

                    // done
                    return weavedFn;
                };
                const getClassAspects = () => {
                    let classAspects = {};
                    for(let entry in allAspects) {
                        if (allAspects.hasOwnProperty(entry)) {
                            if (isPatternMatched(entry.split('.')[0], className)) {
                                classAspects[entry] = allAspects[entry];
                            }
                        }
                    }
                    return classAspects;
                };
                const getFuncAspects = (classAspects, funcName) => {
                    let funcAspects = [];
                    for(let entry in classAspects) {
                        if (classAspects.hasOwnProperty(entry)) {
                            if (isPatternMatched(entry.split('.')[1], funcName)) {
                                funcAspects.push(...classAspects[entry]);
                            }
                        }
                    }
                    return funcAspects;
                };
                const weave = () => {
                    // validate
                    if (['Attribute', 'Aspect'].indexOf(className) !== -1) { return; }
                    if (_this._.isInstanceOf('Attribute') || _this._.isInstanceOf('Aspect')) { return; }

                    let classAspects = getClassAspects(),
                        funcAspects = [];
                    for(let entry in meta) {
                        if (meta.hasOwnProperty(entry) && meta[entry].type === 'func' && !isSpecialMember(entry)) {
                            funcAspects = getFuncAspects(classAspects, entry);
                            if (funcAspects.length > 0) {
                                Object.defineProperty(_this, entry, {
                                    value: applyAspects(entry, funcAspects)
                                });
                            }
                        }
                    }
                };
                const processJson = (source, target, isDeserialize) => {
                    let mappedName = '';
                    for(member in _this) {
                        if (_this.hasOwnProperty(member)) {
                            if (_this._.isProp(member) &&
                                isSerializableMember(member) &&
                                !_this._.isReadOnly(member) && 
                                !_this._.isStatic(member) && 
                                !isPrivateMember(member) && 
                                !isProtectedMember(member) && 
                                !isSpecialMember(member)) {
                                    mappedName = getAttrArgs('serialize', member)[0] || member;
                                    if (isDeserialize) {
                                        target[member] = source[mappedName] || target[member];
                                    } else {
                                        target[mappedName] = source[member];
                                    }
                            }
                        }
                    }
                };

                _this.func = (name, fn) => {
                    // validate
                    if (name === '_') { throw `${name} is not allowed.`; }

                    // special names
                    if (isSpecialMember(name)) {
                        name = '_' + name;
                    }
                    
                    // collect attributes
                    meta[name] = [].concat(bucket);
                    meta[name].type = 'func';
                    bucket = [];
                    let attrs = meta[name];

                    // conditional check
                    if (!isConditionalMemberOK(name)) {
                        delete meta[name]; return;
                    }

                    // define
                    if (hasAttr('override', attrs)) {
                        // check
                        let desc = Object.getOwnPropertyDescriptor(_this, name);
                        if (typeof desc.value !== 'function') {
                            throw `${name} is not a function to override.`;
                        }
                        if (hasAttrEx('sealed', name)) {
                            throw `${name} cannot override a sealed function.`;
                        }

                        // redefine
                        let base = _this[name].bind(_this);
                        Object.defineProperty(_this, name, {
                            value: function(...args) {
                                // run fn with base
                                let fnArgs = [base].concat(args);
                                if (isArrowFunction(fn)) {
                                    return fn(...fnArgs);
                                } else { // normal func
                                    return fn.apply(_this, fnArgs);
                                }
                            }.bind(_this)
                        });
                    } else {
                        // duplicate check
                        if (typeof _this[name] !== 'undefined') { throw `${name} already defined.`; }

                        // define
                        Object.defineProperty(_this, name, {
                            configurable: true,
                            enumerable: true,
                            writable: false,
                            value: function(...args) {
                                if (isArrowFunction(fn)) {
                                    return fn(...args);
                                } else { // normal func
                                    return fn.apply(_this, args);
                                }
                            }.bind(_this)
                        });
                    }

                    // apply attributes in order they are defined
                    applyAttr(name);                    
                };
                _this.prop = (name, valueOrGetter, setter) => {
                    // special names
                    if (isSpecialMember(name)) {  throw `${name} can only be defined as a function.`; }

                    // default value
                    if (typeof valueOrGetter === 'undefined' && typeof setter === 'undefined') { valueOrGetter = null; }

                    // collect attributes
                    meta[name] = [].concat(bucket);
                    meta[name].type = 'prop';
                    bucket = [];
                    let attrs = meta[name];

                    // conditional check
                    if (!isConditionalMemberOK(name)) {
                        delete meta[name]; return;
                    }
                
                    // define
                    if (hasAttr('override', attrs)) {
                        // when overriding a property, it can only be redefined completely
                        // check
                        let desc = Object.getOwnPropertyDescriptor(_this, name);
                        if (typeof desc.get !== 'function') {
                            throw `Not a property to override. (${name})`;
                        }
                        if (hasAttrEx('sealed', name)) {
                            throw `Cannot override a sealed property. (${name})`;
                        }
                        if (hasAttrEx('static', name)) { 
                            throw `Cannot override a static property. (${name})`;
                        }
                    } else {
                        // duplicate check
                        if (typeof _this[name] !== 'undefined') { throw `${name} already defined.`; }
                    }

                    // define or redefine
                    if (typeof valueOrGetter !== 'function') {
                        let propHost = null;
                        if (hasAttrEx('static', name)) { 
                            propHost = staticInterface;
                            if (!propHost[name]) {
                                propHost[name] = valueOrGetter; // shared (static) copy
                            }
                        } else {
                            propHost = props;
                            propHost[name] = valueOrGetter; // private copy
                        }
                        Object.defineProperty(_this, name, {
                            __proto__: null,
                            configurable: true,
                            enumerable: true,
                            get: () => { return propHost[name]; },
                            set: hasAttr('readonly', attrs) ? (value) => { 
                                throw `${name} is readonly.`;
                            } : (value) => {
                                propHost[name] = value;
                            }                            
                        });
                    } else {
                        if (hasAttr('static', attrs)) { throw `Static properties cannot be defined with a getter/setter. (${name})`}
                        Object.defineProperty(_this, name, {
                            __proto__: null,
                            configurable: true,
                            enumerable: true,
                            get: valueOrGetter,
                            set: hasAttr('readonly', attrs) ? (value) => { 
                                throw `${name} is readonly.`;
                            } : (value) => {
                                if (typeof setter === 'function') { setter(value); }
                            }
                        });
                    };       

                    // apply attributes in order they are defined
                    applyAttr(name);
                };
                _this.event = (name) => {
                    // special names
                    if (isSpecialMember(name)) {  throw `${name} can only be defined as a function.`; }

                    // duplicate check
                    if (typeof _this[name] !== 'undefined') { throw `${name} already defined.`; }

                    // add meta
                    meta[name] = [];
                    meta[name].type = 'event';                    

                    // discard attributes
                    if (bucket.length > 0) {
                        console.warn(`Attributes can only be applied to properties or functions. ${name} is an event.`);
                        bucket = []; 
                    }

                    // define event
                    let _event = (...args) => {
                        let e = {
                                name: name,
                                args: args,
                                stop: false
                            };
                        for(let handler of events) {
                            handler(e);
                            if (e.stop) { break; }
                        }
                    };
                    _event.subscribe = (fn) => {
                        events.push(fn);
                    };
                    _event.unsubscribe = (fn) => {
                        let index = events.indexOf(fn);
                        if (index !== -1) {
                            events.splice(index, 1);
                        }
                    };
                    _event.unsubscribe.all = () => {
                        events = [];
                    };
                    Object.defineProperty(_this, name, {
                        configurable: false,
                        enumerable: true,
                        value: _event,
                        writable: false
                    });
                };

                // attach instance reflector
                _this._ = _this._ || {};
                _this._.instanceOf = _this._.instanceOf || [];
                if (!inherits) {
                    _this._.instanceOf.push({name: 'Object', type: Object, meta: [], mixins: []});
                }
                _this._.instanceOf.push({name: className, type: Class, meta: meta, mixins: mixins});
                _this._.inherits = Class;
                _this._.isInstanceOf = (name) => {
                    return (_this._.instanceOf.findIndex((item) => { return item.name === name; }) !== -1);
                };
                _this._.isImplements = (name) => {
                    let result = false;
                    for (let item of _this._.instanceOf) {
                        for(let mixin of item.mixins) {
                            if (mixin._.name === name) {
                                result = true; break;
                            }
                            if (result) { break; }
                        }
                    }
                    return result;                    
                };                
                _this._.isProp = (memberName) => {
                    return _this._.typeOf(memberName) === 'prop';
                };
                _this._.isFunc = (memberName) => {
                    return _this._.typeOf(memberName) === 'func';
                };
                _this._.isEvent = (memberName) => {
                    return _this._.typeOf(memberName) === 'event';
                };
                _this._.isASync = (memberName) => {
                    return hasAttrEx('async', memberName);
                };
                _this._.isReadOnly = (memberName) => {
                    return hasAttrEx('readonly', memberName);
                };
                _this._.isStatic = (memberName) => {
                    return hasAttrEx('static', memberName);
                };
                _this._.isSingleton = () => {
                    return (Class._.singleInstance() !== null);
                };
                _this._.isDeprecated = (memberName) => {
                    return hasAttrEx('deprecate', memberName);
                };
                _this._.isEnumerable = (memberName) => {
                    if (_this[memberName]) { 
                        return Object.getOwnPropertyDescriptor(_this, memberName).enumerable;
                    }
                    return false;
                };
                _this._.typeOf = (memberName) => {
                    let result = '';
                    for(let item of _this._.instanceOf) {
                        if (item.meta[memberName]) {
                            result = item.meta[memberName].type;
                        }
                    }
                    return result;                    
                };
                _this._.serialize = () => {
                    let json = {};
                    processJson(_this, json);
                    return json;
                };
                _this._.deserialize = (json) => {
                    processJson(json, _this, true);
                };

                // run factory
                factory.apply(_this, [attr]);

                // apply mixins
                if (mixins.length !== 0) {
                    for(let mixin of mixins) {
                        mixin.apply(_this, [attr]);
                    }
                }

                // remove definition helpers
                delete _this.func;
                delete _this.prop;
                delete _this.event;

                // constructor
                if (typeof _this._constructor === 'function') {
                    _this._constructor(...classArgs);
                    delete _this._constructor;
                }

                // dispose
                if (typeof _this._dispose === 'function') {
                    _this._.dispose = _this._.dispose || [];
                    let dispose = _this._dispose;
                    _this._.dispose.push(dispose);
                    delete _this._dispose;
                }

                // weave members with configured advises
                weave();

                // get exposable _this
                let isCopy = false;
                doCopy('_'); // '_' is a very special member
                for(let member in _this) {
                    isCopy = false;
                    if (_this.hasOwnProperty(member) && !isSpecialMember(member)) {
                        isCopy = true;
                        if (isOwnMember(member)) {
                            if (isPrivateMember(member)) { isCopy = false; }
                            if (isCopy && (isProtectedMember(member) && !isNeedProtected)) { isCopy = false; }
                        } else {  // some derived member (protected or public) OR some directly added member
                            if (isProtectedMember(member) && !isNeedProtected) { isCopy = false; }
                            if (isCopy && !isDerivedMember(member)) { isCopy = false; } // some directly added member
                        } 
                    }
                    if (isCopy) { doCopy(member); }
                }

                // sealed attribute for properties and functions
                // are handled at the end
                for(let member in _exposed_this) {
                    if (!isSpecialMember(member) && isOwnMember(member) && isSealedMember(member)) {
                        Object.defineProperty(_exposed_this, member, {
                            configurable: false
                        });
                    }
                }

                // singleton
                if (isSingletonClass()) { // store for next use
                    Class._.isSingleton = () => { return true; }
                    Class._.singleInstance = () => { return Object.freeze(_exposed_this); } // assume it sealed as well
                    return Class._.singleInstance();
                } else {
                    if (isSealedMember('_constructor')) { // sealed class consideration
                        Class._.isSealed = () => { return true; };
                        return Object.freeze(_exposed_this);
                    } else {
                        return _exposed_this;
                    }
                }
            };

            // attach class reflector
            Class._ = {
                inherits: inherits,
                mixins: mixins,
                name: className,
                singleInstance: () => { return null; },
                isSingleton: () => { return false; },
                isSealed: () => { return false; },
                isDerivedFrom: (name) => {
                    let result = (name === 'Object'),
                        prv = inherits;
                    if (!result) {
                        while(true) {
                            if (prv === null) { break; }
                            if (prv._.name === name) { result = true; break; }
                            prv = prv._.inherits;
                        }
                    }
                    return result;
                },
                isImplements: (name) => {
                   let result = false;
                   for(let mixin of mixins) {
                       if (mixin._.name === name) {
                           result = true; break;
                       }
                   }
                    return result;                    
                },
                static: {}
            };

            // return
            return Class;
        };

        // Mixin
        // Mixin(mixinName, function() {})
        oojs.Mixin = (mixinName, factory) => {
            // add name
            factory._ = {
                name: mixinName
            };

            // return
            return factory;
        };

        // Enum
        // Enum(enumName, {key: value}})
        oojs.Enum = (enumName, keyValuePairs) => {
            let _enum = keyValuePairs;
            _enum._ = {
                name: enumName,
                keys: () => {
                    let items = [];
                    for(let key in keyValuePairs) {
                        if (keyValuePairs.hasOwnProperty(key) && key !== '_') {
                            items.push(key);
                        }
                    }
                    return items;
                },
                values: () => {
                    let items = [];
                    for(let key in keyValuePairs) {
                        if (keyValuePairs.hasOwnProperty(key) && key !== '_') {
                            items.push(keyValuePairs[key]);
                        }
                    }
                    return items;
                }
            };

            // return
            return Object.freeze(_enum);
        };

        // Namespace
        // ns(namepace, Class/Mixin/Enum)
        oojs.ns = (namespace, whatever) => {
            // validate
            if (typeof whatever._.name === 'undefined') { throw 'Invalid member for a namespace.'; }

            // define whatever under this global namespace
            let items = namespace.split('.'),
                lastItem = options.global;
            for(let item of items) {
                if (typeof lastItem[item] === 'undefined') {
                    lastItem[item] = {};
                }
                lastItem = lastItem[item];
            }

            // define whatever at last item
            lastItem[whatever._.name] = whatever;

            // return as is
            return whatever;
        };

        // using
        // using(object, scope)
        oojs.using = (obj, where) => {
            try {
                where(obj);
            } finally {
                if (obj._ && obj._.dispose && obj._.dispose.length > 0) {
                    obj._.dispose.reverse();
                    for(let dispose of obj._.dispose) {
                        dispose();
                    }
                }
            }
        };

        // attributes
        let allAttributes = {};
        oojs.Attributes = (Attribute) => {
            // register
            if (allAttributes[Attribute._.name]) { throw `${Attribute._.name} already registered.`};

            allAttributes[Attribute._.name] = Attribute;
        };
        oojs.Attribute = oojs.Class('Attribute', function() {
            let decoratorFn = null;
            this.func('constructor', (...args) => {
                this.args = args;
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
        oojs.Attributes(oojs.Class('async', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['func'].indexOf(type) === -1) { throw `@async attribute cannot be applied on ${type} members. (${name})`; }
                if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `@async attribute cannot be applied on special function. (${name})`; }

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
        oojs.Attributes(oojs.Class('deprecate', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `@deprecate attribute cannot be applied on special function. (${name})`; }

                // decorate
                let msg = `${name} is deprecated. ${this.args[0]}` || `${name} is deprecated.`;
                switch(type) {
                    case 'prop':
                        if (descriptor.get) {
                            let _get = descriptor.get;                                
                            descriptor.get = function() {
                                console.warn(msg);
                                return _get();
                            }.bind(obj);
                        }
                        if (descriptor.set) {
                            let _set = descriptor.set;
                           descriptor.set = function(value) {
                                console.warn(msg);
                                return _set(value);
                            }.bind(obj);
                        }   
                        break;
                    case 'func':
                        let fn = descriptor.value;
                        descriptor.value = function(...args) {
                            console.warn(msg);
                            fn(...args);
                        }.bind(obj);
                        break;
                    case 'event':
                        let ev = descriptor.value;
                        descriptor.value = function(...args) {
                            console.warn(msg);
                             ev(...args);
                        }.bind(obj);
                        this.resetEventInterface(fn, descriptor.value);
                        break;
                }
            });
        }));
        oojs.Attributes(oojs.Class('enumerate', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `@enumerate attribute cannot be applied on special function. (${name})`; }

                // decorate
                let flag = this.args[0];
                descriptor.enumerable = flag;
            });
        }));
        oojs.Attributes(oojs.Class('inject', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['func', 'prop'].indexOf(type) === -1) { throw `@inject attribute cannot be applied on ${type} members. (${name})`; }
                if (['_constructor', '_dispose'].indexOf(name) !== -1) { throw `@inject attribute cannot be applied on special function. (${name})`; }

                // decorate
                let Type = this.args[0],
                    typeArgs = this.args[1],
                    instance = null;
                if (!Array.isArray(typeArgs)) { typeArgs = [typeArgs]; }
                if (typeof Type === 'string') { 
                    if (Type.indexOf('|') !== -1) { // condiitonal server/client specific injection
                        let items = Type.split('|');
                        if (options.env === 'server') {
                            Type = items[0].trim(); // left one
                        } else {
                            Type = items[1].trim(); // right one
                        }
                    }
                    instance = oojs.Container.resolve(Type, false, ...typeArgs)
                } else {
                    instance = new Type(...typeArgs);
                }
                switch(type) {
                    case 'func':
                        let fn = descriptor.value;
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
        oojs.Attributes(oojs.Class('multiinject', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['func', 'prop'].indexOf(type) === -1) { throw `@multiinject attribute cannot be applied on ${type} members. (${name})`; }
                if (['_constructor', '_dispose'].indexOf(name) !== -1) { throw `@multiinject attribute cannot be applied on special function. (${name})`; }

                // decorate
                let Type = this.args[0],
                    typeArgs = this.args[1],
                    instance = null;
                if (!Array.isArray(typeArgs)) { typeArgs = [typeArgs]; }
                if (typeof Type === 'string') {
                    if (Type.indexOf('|') !== -1) { // condiitonal server/client specific injection
                        let items = Type.split('|');
                        if (options.env === 'server') {
                            Type = items[0].trim(); // left one
                        } else {
                            Type = items[1].trim(); // right one
                        }
                    }
                    instance = oojs.Container.resolve(Type, true, ...typeArgs)
                } else {
                    throw `@multiinject attribute does not support direct type injections. (${name})`;
                }
                switch(type) {
                    case 'func':
                        let fn = descriptor.value;
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

        // aspects
        let allAspects = {};
        oojs.Aspects = (pointcut, Aspect) => {
            // pointcut: classNamePattern.funcNamePattern
            //      classNamePattern:
            //          * - any class
            //          *<text> - any class name that ends with <text>
            //          <text>* - any class name that starts with <text>
            //          <text>  - exact class name
            //      funcNamePattern:
            //          * - any function
            //          *<text> - any func name that ends with <text>
            //          <text>* - any func name that starts with <text>
            //          <text>  - exact func name
            if (!allAspects[pointcut]) {
                allAspects[pointcut] = [];
            }
            allAspects[pointcut].push(Aspect);
        };
        oojs.Aspect = oojs.Class('Aspect', function() {
            let beforeFn = null,
                afterFn = null,
                aroundFn = null;
            this.func('constructor', (...args) => {
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

        // dependency injection container
        let container = {};
        oojs.Container = (typeName, cls) => {
            if (!container[typeName]) { container[typeName] = []; }
            container[typeName].push(cls);
        };
        oojs.Container.resolve = (typeName, isMultiResolve, ...args) => {
            let result = null;
            if (container[typeName] && container[typeName].length > 0) { 
                if (isMultiResolve) {
                    result = [];
                    for(let Type of container[typeName]) {
                        result.push(new Type(...args));
                    }
                } else {
                    let Type = container[typeName][0];
                    result = new Type(...args);
                }
            }
            return result;
        };
        oojs.Container.request = (typeAMDModuleUrl, ...args) => {
            return new Promise((resolve, reject) => {
                require([typeAMDModuleUrl], (Type) => {
                    resolve(new Type(...args));
                }, reject);
            });
        };

        // serialization
        oojs.Serializer = {
            serialize: (instance) => { 
                return instance._.serialize(); 
            },
            deserialize: (Type, json) => {
                let instance = new Type();
                instance._.deserialize(json);
                return instance;
            }
        };

        // expose to global environment
        if (!options.supressGlobals) { 
            let g = options.global;
            g.Class = oojs.Class; g.using = oojs.using;
            g.Attribute = oojs.Attribute; g.Attributes = oojs.Attributes;
            g.Aspect = oojs.Aspect; g.Aspects = oojs.Aspects;
            g.Container = oojs.Container;
            g.Serializer = oojs.Serializer;
            g.Mixin = oojs.Mixin;
            g.ns = oojs.ns;
            g.Enum = oojs.Enum;
        }

        // return
        return Object.freeze(oojs);
    };

    // export
    if (typeof (typeof module !== 'undefined' && module !== null ? module.exports : void 0) === 'object') {
        module.exports = def;
    } else if (typeof define === 'function' && typeof define.amd !== 'undefined') {
        define(function() { return def; });
    } else {
        this.oojs = def;
    }
}).call(this);