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
        isBuildingObj = false,
        _sessionStorage = _Port('sessionStorage'),
        _localStorage = _Port('localStorage');

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
                        if (!_sessionStorage) { throw new _Exception('NotConfigured', 'Port is not configured. (sessionStorage)'); }
                        propHost = _sessionStorage;
                        isStorageHost = true;
                    } 
                    if (attrs.has('state', name, true)) {
                        if (!_localStorage) { throw new _Exception('NotConfigured', 'Port is not configured. (localStorage)'); }
                        propHost = _localStorage;
                        isStorageHost = true;
                    }                
                    if (!propHost.key(uniqueName)) { // define only when not already defined (may be by some other instance of same type)
                        propHost.setKey(uniqueName, JSON.stringify({value: valueOrGetterOrGetSetObject})); 
                    }
                }

                if (!propHost) { // regular property
                    uniqueName = name;
                    propHost = props;
                    propHost[uniqueName] = valueOrGetterOrGetSetObject; // private copy
                }

                // getter/setter
                _getter = () => {
                    if (isStorageHost) { 
                        return JSON.parse(propHost.getKey(uniqueName)).value; 
                    }
                    return propHost[uniqueName];
                };
                if (attrs.has('readonly', name, true)) {
                    _setter = (value) => {
                        // readonly props can be set only - either when object is being constructed 
                        // OR if 'once' is applied, and value is not already set
                        if (obj._.constructing || (attrs.has('once', name, false) && !_getter())) { 
                            if (isStorageHost) {
                                propHost.setKey(uniqueName, JSON.stringify({value: value}));
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
                            propHost.setKey(uniqueName, JSON.stringify({value: value}));
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
