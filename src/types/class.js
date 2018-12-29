// Class
// Class(className, function() {})
// Class(className, inherits, function() {})
// Class(className, [mixins/interfaces], function() {})
// Class(className, inherits, [mixins/interfaces], function() {})
flair.Class = (arg1, arg2, arg3, arg4) => {
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
                Attr = flair.Container.get(attrName)[0]; // get the first registered
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
            // constructor shorthand definition
            if (typeof name === 'function') { fn = name; name = 'constructor'; }

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
            meta[name].interfaces = [];
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
        _this.construct = (...args) => {
            _this.func.apply(_this, ['constructor'].concat(args));
        };
        _this.destruct = (...args) => {
            _this.func.apply(_this, ['dispose'].concat(args));
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
            meta[name].interfaces = [];
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
                    if (!sessionStorage) {
                        throw `Session store (sessionStorage) is not available. (${className}.${name})`;
                    }
                    uniqueName = className + '_' + name;
                    propHost = sessionStorage;
                    isStorageHost = true;
                    if (typeof propHost[uniqueName] === 'undefined') {
                        propHost[uniqueName] = JSON.stringify({value: valueOrGetter}); 
                    }
                } else if (hasAttrEx('state', name)) {
                    if (!sessionStorage) {
                        throw `State store (localStorage) is not available. (${className}.${name})`;
                    }
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
        _this.event = (name, argProcessor) => {
            // special names
            if (isSpecialMember(name)) {  throw `${className}.${name} can only be defined as a function.`; }

            // duplicate check
            if (isDefined(name, true)) { throw `${className}.${name} is already defined.`; }

            // add meta
            meta[name] = [];
            meta[name].type = 'event';  
            meta[name].aspects = [];
            meta[name].interfaces = [];
            
            // discard attributes
            if (bucket.length > 0) {
                console.warn(`Attributes can only be applied to properties or functions. ${className}.${name} is an event.`);
                bucket = []; 
            }

            // define event
            let _event = function(...args) {
                // preprocess args
                let processedArgs = {};
                if (typeof argProcessor === 'function') {
                    processedArgs = argProcessor(...args);
                }

                // define event arg
                let e = {
                        name: name,
                        args: processedArgs,
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

        // helper object that gets passed to factory
        // this itself is attr function, the most common use, and can be use as-is, attr(...)
        // but also can be used as hook to pass many more helpers, attr func being one of them, to support helper.attr(), helper.sumethingElse() type syntax
        const factoryHelper = attr;
        factoryHelper.attr = attr;        

        // construct using factory
        factory.apply(_this, [factoryHelper]);

        // abstract consideration
        if (_flag !== theFlag && isAbstractClass()) {
            throw `Cannot create instance of an abstract class. (${className})`;
        }

        // apply mixins
        if (mixins.length !== 0) {
            for(let mixin of mixins) {
                if (mixin._.type === 'mixin') {
                    mixin_being_applied = mixin;
                    mixin.apply(_this, [factoryHelper]);
                    mixin_being_applied = null;
                }
            }
        }

        // remove definition helpers
        delete _this.func;
        delete _this.construct;
        delete _this.destruct;
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
                _this._.dispose = _this._dispose;
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
                                if (meta[_memberName].interfaces.indexOf(_interface) === -1) { meta[_memberName].interfaces.push(_interface); }
                                break;
                            case 'prop':
                                if (_type === 'function') { throw `${_interface._.name}.${_memberName} is not a property.`; }
                                if (meta[_memberName].interfaces.indexOf(_interface) === -1) { meta[_memberName].interfaces.push(_interface); }
                                break;
                            case 'event':
                                if (_type !== 'function' || typeof _exposed_this[_memberName].subscribe !== 'function') { throw `${_interface._.name}.${_memberName} is not an event.`; }
                                if (meta[_memberName].interfaces.indexOf(_interface) === -1) { meta[_memberName].interfaces.push(_interface); }
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
        namespace: '',
        assembly: null,
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
