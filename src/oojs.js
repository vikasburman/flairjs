/**
 * oojs.js
 * version 1.0.0
 * (C) 2017, Vikas Burman
 * MIT License 
 */
(function() {
    // the definition
    const def = (opts = {}) => {
        let isServer = (new Function("try {return this===global;}catch(e){return false;}"))(),
            getGlobal = new Function("try {return (this===global ? global : window);}catch(e){return window;}");
        let oojs = {},
            noop = () => {},
            noopAsync = (resolve, reject) => { resolve(); },
            options = {
                env: opts.env || (isServer ? 'server' : 'client'),
                global: getGlobal(),
                supressGlobals: (typeof opts.supressGlobals === 'undefined' ? false : opts.supressGlobals),
                symbols: opts.symbols || []
            };

        // Class
        // Class(className, function() {})
        // Class(className, inherits, function() {})
        // Class(className, [mixins/interfaces], function() {})
        // Class(className, inherits, [mixins/interfaces], function() {})
        oojs.Class = (arg1, arg2, arg3, arg4) => {
            let className = arg1,
                inherits = null,
                mixins = [],
                interfaces = [],
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

            // seperate mixins and interfaces
            let onlyMixins = [];
            for(let mixin of mixins) {
                switch (mixin._.type) {
                    case 'mixin': onlyMixins.push(mixin); break;
                    case 'interface': interfaces.push(mixin); break;
                }
            }
            mixins = onlyMixins;

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
                    theFlag = '__flag__',
                    mixin_being_applied = null;

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
                    if (typeof _flag !== 'undefined') { // as it can be a null value as well
                        classArgs = classArgs.concat([_flag]);
                        if (typeof _static !== 'undefined') { // as it can be a null value as well
                            classArgs = classArgs.concat([_static]);
                            if (typeof args !== 'undefined') { // as it can be a null value as well
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
                const guid = () => {
                    return '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                };
                const isSingletonClass = () => {
                    return hasAttr('singleton', meta['_constructor']);
                }
                const isAbstractClass = () => {
                    return hasAttr('abstract', meta['_constructor']);
                };
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
                const memberType = (member) => {
                    let result = '';
                    if (typeof meta[member] !== 'undefined') {
                        result = meta[member].type;
                    } else {
                        for(let instance of _this._.instanceOf) {
                            if (instance.meta[member]) {
                                result = instance.meta[member].type;
                                break;
                            }
                        }
                    }
                    return result;                        
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
                const isHiddenMember = (member) => {
                    return hasAttr('hide', meta[member]);
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
                    let Attr = null;
                    if (typeof attrName === 'string') {
                        Attr = oojs.Container.get(attrName)[0]; // get the first registered
                    } else {
                        Attr = attrName;
                        attrName = Attr._.name;
                    }
                    bucket.push({name: attrName, Attr: Attr, args: args});
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
                const isDefined = (member, ignoreLast) => {
                    let result = false,
                        last = _this._.instanceOf.length,
                        i = 1;
                    for(let instance of _this._.instanceOf) {
                        if (instance.meta[member]) {
                            if (i !== last) {
                                result = true; break;
                            }
                        }
                        i++;
                    }
                    return result;
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

                        // after functions
                        const runAfterFn = (_ctx) =>{
                            for(let afterFn of after) {
                                try {
                                    afterFn(_ctx);
                                } catch (err) {
                                    ctx.error(err);
                                }
                            }
                        };

                        // around func
                        let newFn = fn,
                            isASync = false,
                            _result = null;
                        for(let aroundFn of around) {
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
                                meta[entry].aspects = funcAspects.slice();
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
                            if ((memberType(member) === 'prop') &&
                                isSerializableMember(member) &&
                                !hasAttrEx('readonly', member) && 
                                !isStaticMember(member) && 
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
                    if (name === '_') { throw `${className}.${name} is not allowed.`; }
                    if (!fn) { fn = noop; }
                    
                    // special names
                    if (isSpecialMember(name)) {
                        name = '_' + name;
                    }

                    // add mixed attr
                    if (mixin_being_applied !== null) {
                        attr('mixed', mixin_being_applied);
                    }

                    // collect attributes
                    meta[name] = [].concat(bucket);
                    meta[name].type = 'func';
                    meta[name].aspects = [];
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
                        if (!desc || typeof desc.value !== 'function') {
                            if (name === '_constructor') { name = 'constructor'; }
                            if (name === '_dispose') { name = 'dispose'; }
                            throw `${className}.${name} is not a function to override.`;
                        }
                        if (hasAttrEx('sealed', name) && !hasAttr('sealed', attrs)) {
                            if (name === '_constructor') { name = 'constructor'; }
                            if (name === '_dispose') { name = 'dispose'; }
                            throw `${className}.${name} cannot override a sealed function.`;
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
                        if (isDefined(name, true)) { 
                            if (name === '_constructor') { name = 'constructor'; }
                            if (name === '_dispose') { name = 'dispose'; }
                            throw `${className}.${name} is already defined.`; 
                        }

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

                    // finally hold the references for reflector
                    meta[name].ref = _this[name];
                    meta[name].raw = fn;
                };
                _this.prop = (name, valueOrGetter, setter) => {
                    // special names
                    if (isSpecialMember(name)) {  throw `${className}.${name} can only be defined as a function.`; }

                    // default value
                    if (typeof valueOrGetter === 'undefined' && typeof setter === 'undefined') { valueOrGetter = null; }

                    // add mixed attr
                    if (mixin_being_applied !== null) {
                        attr('mixed', mixin_being_applied);
                    }

                    // collect attributes
                    meta[name] = [].concat(bucket);
                    meta[name].type = 'prop';
                    meta[name].aspects = [];
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
                        if (!desc || typeof desc.get !== 'function') {
                            throw `Not a property to override. (${className}.${name})`;
                        }
                        if (hasAttrEx('sealed', name) && !hasAttr('sealed', attrs)) {
                            throw `Cannot override a sealed property. (${className}.${name})`;
                        }
                        if (hasAttrEx('static', name) && !hasAttr('static', attrs)) { 
                            throw `Cannot override a static property. (${className}.${name})`;
                        }
                    } else {
                        // duplicate check
                        if (isDefined(name, true)) { throw `${className}.${name} is already defined.`; }
                    }

                    // define or redefine
                    if (typeof valueOrGetter !== 'function') {
                        let propHost = null,
                            uniqueName = '',
                            isStorageHost = false;
                        if (hasAttrEx('static', name)) { 
                            uniqueName = name;
                            if (hasAttrEx('session', name) || hasAttrEx('state', name)) {
                                throw `A static property cannot be stored in session/state. (${className}.${name})`;
                            }
                            propHost = staticInterface;
                            if (!propHost[uniqueName]) { 
                                propHost[uniqueName] = valueOrGetter; // shared (static) copy
                            }
                        } else if (hasAttrEx('session', name)) {
                            uniqueName = className + '_' + name;
                            propHost = sessionStorage;
                            isStorageHost = true;
                            if (typeof propHost[uniqueName] === 'undefined') {
                                propHost[uniqueName] = JSON.stringify({value: valueOrGetter}); 
                            }
                        } else if (hasAttrEx('state', name)) {
                            uniqueName = className + '_' + name;
                            propHost = localStorage;
                            isStorageHost = true;
                            if (typeof propHost[uniqueName] === 'undefined') {
                                propHost[uniqueName] = JSON.stringify({value: valueOrGetter});
                            }
                        } else {
                            uniqueName = name;
                            propHost = props;
                            propHost[uniqueName] = valueOrGetter; // private copy
                        }
                        Object.defineProperty(_this, name, {
                            __proto__: null,
                            configurable: true,
                            enumerable: true,
                            get: () => { 
                                if (isStorageHost) { 
                                    return JSON.parse(propHost[uniqueName]).value;
                                } else {
                                    return propHost[uniqueName]; 
                                }
                            },
                            set: hasAttr('readonly', attrs) ? (value) => {
                                if (_this._.constructing || (hasAttr('once', attrs) && !propHost[uniqueName])) {
                                    if (isStorageHost) {
                                        propHost[uniqueName] = JSON.stringify({value: value});
                                    } else {
                                        propHost[uniqueName] = value;
                                    }
                                } else {
                                    throw `${name} is readonly.`;
                                }
                            } : (value) => {
                                if (isStorageHost) { 
                                    propHost[uniqueName] = JSON.stringify({value: value});
                                } else {
                                    propHost[uniqueName] = value;
                                }
                            }                            
                        });
                    } else {
                        if (hasAttr('static', attrs)) { throw `Static properties cannot be defined with a getter/setter. (${className}.${name})`; }
                        if (hasAttr('session', attrs) || hasAttr('state', attrs)) { throw `Properties defined with a getter/setter cannot be stored in session/state. (${className}.${name})`; }
                        Object.defineProperty(_this, name, {
                            __proto__: null,
                            configurable: true,
                            enumerable: true,
                            get: valueOrGetter,
                            set: hasAttr('readonly', attrs) ? (value) => { 
                                if (_this._.constructing || (hasAttr('once', attrs) && !valueOrGetter())) {
                                    if (typeof setter === 'function') { setter(value); }
                                } else {
                                    throw `${name} is readonly.`;
                                }
                            } : (value) => {
                                if (typeof setter === 'function') { setter(value); }
                            }
                        });
                    };       

                    // apply attributes in order they are defined
                    applyAttr(name);

                    // finally hold the reference for reflector
                    meta[name].ref = {
                        get: () => { return _this[name]; },
                        set: (value) => { _this[name] = value; }
                    };
                };
                _this.event = (name) => {
                    // special names
                    if (isSpecialMember(name)) {  throw `${className}.${name} can only be defined as a function.`; }

                    // duplicate check
                    if (isDefined(name, true)) { throw `${className}.${name} is already defined.`; }

                    // add meta
                    meta[name] = [];
                    meta[name].type = 'event';  
                    meta[name].aspects = [];
                  
                    // discard attributes
                    if (bucket.length > 0) {
                        console.warn(`Attributes can only be applied to properties or functions. ${className}.${name} is an event.`);
                        bucket = []; 
                    }

                    // define event
                    let _event = function(...args) {
                        let e = {
                                name: name,
                                args: args,
                                stop: false
                            };
                        for(let handler of events) {
                            handler(e);
                            if (e.stop) { break; }
                        }
                    }.bind(_this);
                    _event.subscribe = (fn) => {
                        events.push(fn);
                    };
                    _event.subscribe.all = () => {
                        return events.slice();
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

                    // finally hold the reference for reflector
                    meta[name].ref = _this[name];
                };
                _this.noop = noop;
                _this.noopAsync = noopAsync;

                // attach instance reflector
                _this._ = _this._ || {};
                _this._.type = 'instance';
                _this._.name = className;
                _this._.id = guid();
                _this._.instanceOf = _this._.instanceOf || [];
                if (!inherits) {
                    _this._.instanceOf.push({name: 'Object', type: Object, meta: [], mixins: [], interfaces: []});
                }
                _this._.instanceOf.push({name: className, type: Class, meta: meta, mixins: mixins, interfaces: interfaces});
                _this._.inherits = Class;
                _this._.isInstanceOf = (name) => {
                    return (_this._.instanceOf.findIndex((item) => { return item.name === name; }) !== -1);
                };
                _this._.raw = (name) => {
                    if (meta[name] && meta[name].raw) { return meta[name].raw; }
                    return null;
                },
                _this._.isMixed = (name) => {
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
                _this._.isImplements = (name) => {
                    let result = false;
                    for (let item of _this._.instanceOf) {
                        for(let _interface of item.interfaces) {
                            if (_interface._.name === name) {
                                result = true; break;
                            }
                            if (result) { break; }
                        }
                    }
                    return result;                    
                };
                _this._._ = {
                    hasAttr: hasAttr,
                    hasAttrEx: hasAttrEx,
                    isOwnMember: isOwnMember,
                    isDerivedMember: isDerivedMember,
                    isProtectedMember: isProtectedMember,
                    isSealedMember: isSealedMember,
                    isSerializableMember: isSerializableMember
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

                // abstract consideration
                if (_flag !== theFlag && isAbstractClass()) {
                    throw `Cannot create instance of an abstract class. (${className})`;
                }

                // apply mixins
                if (mixins.length !== 0) {
                    for(let mixin of mixins) {
                        if (mixin._.type === 'mixin') {
                            mixin_being_applied = mixin;
                            mixin.apply(_this, [attr]);
                            mixin_being_applied = null;
                        }
                    }
                }

                // remove definition helpers
                delete _this.func;
                delete _this.prop;
                delete _this.event;
                delete _this.noop;
                delete _this.noopAsync;

                // weave members with configured advises
                weave();

                // // top level class
                if (!isNeedProtected) { 
                    // constructor
                    if (typeof _this._constructor === 'function') {
                        _this._.constructing = true;
                        _this._constructor(...classArgs);
                        _this._.constructor = this._constructor;
                        delete _this._constructor;
                        delete _this._.constructing;
                    }

                    // dispose
                    if (typeof _this._dispose === 'function') {
                        _this._._dispose = _this._dispose;
                        delete _this._dispose;
                    }
                }

                // get exposable _this
                let isCopy = false;
                doCopy('_'); // '_' is a very special member
                for(let member in _this) {
                    isCopy = false;
                    if (_this.hasOwnProperty(member)) {
                        isCopy = true;
                        if (isOwnMember(member)) {
                            if (isPrivateMember(member)) { isCopy = false; }
                            if (isCopy && (isProtectedMember(member) && !isNeedProtected)) { isCopy = false; }
                        } else {  // some derived member (protected or public) OR some directly added member
                            if (isProtectedMember(member) && !isNeedProtected) { isCopy = false; }
                            if (isCopy && !isDerivedMember(member)) { isCopy = false; } // some directly added member
                        } 
                    }
                    if (isCopy && isHiddenMember(member)) { isCopy = false; }
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

                // validate that all intefaces are implemeted on exposed_this
                if (interfaces.length !== 0) {
                    for(let _interface of interfaces) {
                        for(let _memberName in _interface) {
                            if (_interface.hasOwnProperty(_memberName) && _memberName !== '_') {
                                let _member = _interface[_memberName],
                                    _type = typeof _exposed_this[_memberName];
                                if (_type === 'undefined') { throw `${_interface._.name}.${_memberName} is not defined.`; }
                                switch(_member.type) {
                                    case 'func':
                                        if (_type !== 'function') { throw `${_interface._.name}.${_memberName} is not a function.`; } 
                                        break;
                                    case 'prop':
                                        if (_type === 'function') { throw `${_interface._.name}.${_memberName} is not a property.`; }
                                        break;
                                    case 'event':
                                        if (_type !== 'function' || typeof _exposed_this[_memberName].subscribe !== 'function') {
                                            throw `${_interface._.name}.${_memberName} is not an event.`;
                                        }
                                        break;
                                }
                            }
                        }
                    }
                }

                // public and (protected+private) instance interface
                _this._.pu = (isNeedProtected ? null : _exposed_this);
                _this._.pr = (isNeedProtected ? null : _this);

                // singleton
                if (isSingletonClass()) { // store for next use
                    Class._.isSingleton = () => { return true; };
                    Class._.singleInstance = () => { return Object.freeze(_exposed_this); }; // assume it sealed as well
                    Class._.singleInstance.clear = () => { 
                        Class._.singleInstance = () => { return null; };
                        Class._.isSingleton = () => { return false; };
                    };
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
                interfaces: interfaces,
                name: className,
                type: 'class',
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
                isMixed: (name) => {
                   let result = false;
                   for(let mixin of mixins) {
                       if (mixin._.name === name) {
                           result = true; break;
                       }
                   }
                    return result;                    
                },
                isImplements: (name) => {
                   let result = false;
                   for(let _interface of interfaces) {
                       if (_interface._.name === name) {
                           result = true; break;
                       }
                   }
                    return result;                    
                },
                static: {}
            };
            Class._.singleInstance.clear = () => { }; // no operation

            // return
            return Class;
        };

        // Mixin
        // Mixin(mixinName, function() {})
        oojs.Mixin = (mixinName, factory) => {
            // add name
            factory._ = {
                name: mixinName,
                type: 'mixin'
            };

            // return
            return factory;
        };

        // Interface
        // Interface(interfaceName, function() {})
        oojs.Interface = (interfaceName, factory) => {
            let meta = {},
                _this = {};

            // definition helpers
            _this.func = (name) => {
                if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
                meta[name] = [];
                meta[name].type = 'func';
            };
            _this.prop = (name) => {
                if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
                meta[name] = [];
                meta[name].type = 'prop';
            };
            _this.event = (name) => {
                if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
                meta[name] = [];
                meta[name].type = 'event';
            };

            // run factory
            factory.apply(_this);

            // add name
            meta._ = {
                name: interfaceName,
                type: 'interface'
            };

            // return
            return meta;
        };

        // Enum
        // Enum(enumName, {key: value})
        oojs.Enum = (enumName, keyValuePairs) => {
            let _enum = keyValuePairs;
            _enum._ = {
                name: enumName,
                type: 'enum',
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

        // Structure
        // Structure(structureName, factoryFn(args) {})
        oojs.Structure = (structureName, factoryFn) => {
            let _structure = factoryFn;
            _structure._ = {
                name: structureName,
                type: 'structure'
            };

            // return
            return _structure;
        };

        // Assembly
        // Assembly(asmName, {namespace: member})
        oojs.Assembly = (asmName, nestedStructure) => {
            let _asm = nestedStructure;
            _asm._ = {
                name: asmName,
                type: 'assembly'
            };

            // return
            return Object.freeze(_asm);
        };

        // using
        // using(object, scopeFn)
        oojs.using = (obj, scopeFn) => {
            try {
                scopeFn(obj);
            } finally {
                if (obj._ && typeof obj._.dispose === 'function') {
                    obj._.dispose();
                }
            }
        };

        // as
        // as(object, intf)
        //  intf: can be an interface reference or 'public', 'protected', 'private'
        oojs.as = (obj, intf) => {
            if (typeof intf === 'string') {
                switch(intf) {
                    case 'public': 
                        return obj._.pu; break;
                    case 'protected': 
                    case 'private':
                        return obj._.pr; break;
                }
            } else {
                if (obj._.isImplements(intf._.name)) { return obj; }
            }
            return null;
        };

        // aspects
        let allAspects = {};
        oojs.Aspects = {};
        oojs.Aspects.register = (pointcut, Aspect) => {
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
        oojs.Container = {};
        // register(cls)
        // register(typeName, cls)
        oojs.Container.register = (typeName, cls) => {
            if (typeof typeName === 'function') {
                cls = typeName;
                typeName = cls._.name;
            }
            if (!container[typeName]) { container[typeName] = []; }
            container[typeName].push(cls);
        };
        oojs.Container.isRegistered = (typeName) => {
            return typeof container[typeName] !== 'undefined';
        };
        oojs.Container.get = (typeName) => {
            return (container[typeName] || []).slice();
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

        // attribute
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
        
        // async
        // async() 
        oojs.Container.register(oojs.Class('async', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['func'].indexOf(type) === -1) { throw `async attribute cannot be applied on ${type} members. (${className}.${name})`; }
                if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `async attribute cannot be applied on special function. (${className}.${name})`; }

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
        oojs.Container.register(oojs.Class('deprecate', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `deprecate attribute cannot be applied on special function. (${className}.${name})`; }

                // decorate
                let msg = `${name} is deprecated.`;
                if (typeof this.args[0] !== 'undefined') { msg += ' ' + this.args[0] };
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

        // enumerate
        // enumerate(flag)
        //  - flag: true/false
        oojs.Container.register(oojs.Class('enumerate', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `enumerate attribute cannot be applied on special function. (${className}.${name})`; }

                // decorate
                let flag = this.args[0];
                descriptor.enumerable = flag;
            });
        }));

        // inject
        // inject(type, [typeArgs])
        //  - type: 
        //      type class itself to inject, OR
        //      type class name, OR
        //      type class name on server | type class name on client
        //  - typeArgs: constructor args to pass when type class instance is created
        // NOTE: types being referred here must be available in container so sync resolve can happen
        oojs.Container.register(oojs.Class('inject', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['func', 'prop'].indexOf(type) === -1) { throw `inject attribute cannot be applied on ${type} members. (${className}.${name})`; }
                if (['_constructor', '_dispose'].indexOf(name) !== -1) { throw `inject attribute cannot be applied on special function. (${className}.${name})`; }

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

        // multiinject
        // multiinject(type, [typeArgs])
        //  - type: 
        //      type class name, OR
        //      type class name on server | type class name on client
        //  - typeArgs: constructor args to pass when type class instance is created
        // NOTE: types being referred here must be available in container so sync resolve can happen
        oojs.Container.register(oojs.Class('multiinject', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['func', 'prop'].indexOf(type) === -1) { throw `multiinject attribute cannot be applied on ${type} members. (${className}.${name})`; }
                if (['_constructor', '_dispose'].indexOf(name) !== -1) { throw `multiinject attribute cannot be applied on special function. (${className}.${name})`; }

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
                    throw `multiinject attribute does not support direct type injections. (${className}.${name})`;
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

        // Serializer
        oojs.Serializer = {};
        oojs.Serializer.serialize = (instance) => { 
            return instance._.serialize(); 
        };
        oojs.Serializer.deserialize = (Type, json) => {
            let instance = new Type();
            instance._.deserialize(json);
            return instance;
        };

        // Reflector
        oojs.Reflector = {};
        oojs.Reflector.get = (forTarget) => {
            // define
            const CommonTypeReflector = function(target) {
                this.getType = () => { return target._.type; }
                this.getName = () => { return target._.name || ''; }
                this.getTarget = () => { return target; }
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
                            attrs = item.meta[name];
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
                return refl;
            };
            const PropReflector = function(target, name, ref) {
                let refl = new CommonInstanceMemberReflector('prop', target, name, ref);
                refl.getValue = () => { return ref.get(); }
                refl.setValue = (value) => { return ref.set(value); }
                refl.isReadOnly = () => { return target._._.hasAttrEx('readonly', name); };
                refl.isSetOnce = () => { return target._._.hasAttrEx('readonly', name) && target._._.hasAttrEx('once', name); };
                refl.isStatic = () => { return target._._.hasAttrEx('static', name); };
                refl.isSerializable = () => { return target._._.isSerializableMember(name); }
                return refl;
            };
            const FuncReflector = function(target, name, ref, raw) {
                let refl = new CommonInstanceMemberReflector('func', target, name, ref);
                refl.invoke = (...args) => { return ref(...args); };
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
            const AsmMemberReflector = function(target, name, member) {
                let refl = new CommonMemberReflector(member._.type, target, name);
                refl.getMember = () => { return oojs.Reflector.get(member); }
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
                    }
                    getMembers = (oneMember) => {
                        let members = [],
                            attrs = [],
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
                                            lastMember = new EventReflector(target, name, instance.meta[name].ref);
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
                refl.getMembers = () => { return getMembers(); };
                refl.getMember = (name) => { return getMembers(name); };
                refl.isSingleton = () => { return refl.getClass().isSingleton(); };                       
                refl.isInstanceOf = (name) => { return target._.isInstanceOf(name); };
                refl.isMixed = (name) => { return target._.isMixed(name); };
                refl.isImplements = (name) => { return target._.isImplements(name); };
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
            const StructureReflector = function(target) {
                let refl = new CommonTypeReflector(target);
                return refl;
            };            
            const AssemblyReflector = function(target) {
                let refl = new CommonTypeReflector(target);
                refl.getMembers = () => { 
                    let members = [];
                    const findMembers = (obj, ns) => {
                        for(let key in obj) {
                            if (obj.hasOwnProperty(key) && key !== '_') {
                                if (typeof obj[key]._ === 'undefined') { // this is a namespace
                                    findMembers(obj[key], ns + '.' + key);
                                } else { // this is a member
                                    members.push(new AsmMemberReflector(target, ns + '.' + obj[key]._.name, obj[key]));
                                }
                            }
                        }
                    };
                    findMembers(target, target._.name);
                    return members;
                };
                refl.getMember = (qualifiedName) => {
                    let items = qualifiedName.split('.');
                    if (items.length > 0) { 
                        items.shift(); // remove assembly name from namespace
                        qualifiedName = items.join('.');
                    }
                    if (typeof target[qualifiedName] === 'undefined') { throw `${qualifiedName} is not defined.`; }
                    return oojs.Reflector.get(target[qualifiedName]);
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
                case 'class': ref = new ClassReflector(forTarget); break;
                case 'enum': ref = new EnumReflector(forTarget); break;
                case 'structure': ref = new StructureReflector(forTarget); break;
                case 'assembly': ref = new AssemblyReflector(forTarget); break;
                case 'mixin': ref = new MixinReflector(forTarget); break;
                case 'interface': ref = new InterfaceReflector(forTarget); break;
                default:
                    throw 'Unknown type';
            }

            // return
            return ref;
        };

        // expose to global environment
        if (!options.supressGlobals) { 
            let g = options.global;
            g.Class = oojs.Class; g.Mixin = oojs.Mixin; g.Interface = oojs.Interface; g.Structure = oojs.Structure;  g.Enum = oojs.Enum; g.Assembly = oojs.Assembly;
            g.Attribute = oojs.Attribute; g.Aspect = oojs.Aspect; 
            g.Aspects = oojs.Aspects; g.Container = oojs.Container;
            g.Serializer = oojs.Serializer; g.Reflector = oojs.Reflector;
            g.using = oojs.using; g.as = oojs.as; 
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