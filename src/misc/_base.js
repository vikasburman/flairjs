const _Base = (type, name, mex, bex) => {
    let Base = function() {

    };



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

        const doCopy = (member) => {
            Object.defineProperty(_exposed_this, member, Object.getOwnPropertyDescriptor(_this, member));
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
                    isASync = false, // eslint-disable-line no-unused-vars
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
        const weave = () => {
            // validate
            if (['Attribute', 'Aspect'].indexOf(className) !== -1) { return; }
            if (_this._.isInstanceOf('Attribute') || _this._.isInstanceOf('Aspect')) { return; }

            let funcAspects = [];
            for(let entry in meta) {
                if (meta.hasOwnProperty(entry) && meta[entry].type === 'func' && !isSpecialMember(entry)) {
                    funcAspects = flair.Aspects.get(className, entry, meta[entry]);
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
            for(let member in _this) {
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
            if (name._ && name._.name) { name = name._.name; } // TODO: Fix it 
            return (_this._.instanceOf.findIndex((item) => { return item.name === name; }) !== -1);
        };
        _this._.raw = (name) => {
            if (meta[name] && meta[name].raw) { return meta[name].raw; }
            return null;
        },
        _this._.isMixed = (name) => { // TODO: if any derived class is mixed with this, it should also be checked.
            if (name._ && name._.name) { name = name._.name; } // TODO: Fix it 
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
        _this._.isImplements = (name) => { // TODO: If any derived class imolements this interface, it should check that as well
            if (name._ && name._.name) { name = name._.name; } // TODO: Fix it 
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
        namespace: null,
        singleInstance: () => { return null; },
        isSingleton: () => { return false; },
        isSealed: () => { return false; },
        isDerivedFrom: (name) => {
            if (name._ && name._.name) { name = name._.name; } // TODO: Fix it 
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
        },
        isMixed: (name) => { // TODO: if any parent class is mixed with this, it should also be checked.
            if (name._ && name._.name) { name = name._.name; } // TODO: Fix it 
            let result = false;
            for(let mixin of mixins) {
                if (mixin._.name === name) {
                    result = true; break;
                }
            }
            return result;                    
        },
        isImplements: (name) => { // TODO: if any parent class is mixed with this, it should also be checked.
            if (name._ && name._.name) { name = name._.name; } // TODO: Fix it 
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

    // register type with namespace
    flair.Namespace(Class);

    // return
    return Class;
};

// add to members list
flair.members.push('Class');