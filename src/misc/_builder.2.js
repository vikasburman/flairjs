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
    if (cfg.singleton && Type._.singleInstance()) { return Type._.singleInstance(); }

    // define vars
    let _noop = noop,
        exposed_obj = {},
        mixin_being_applied = null,
        the_attr = null,
        typeArgs = [],
        staticInterface = Type, // Type itself is the static interface to begin
        isNeedProtected = false,
        theFlag = '__flag__',
        _typeMetaMemberName = '____type',
        _constructName = '_construct',
        _disposeName = '_dispose',
        def = { 
            name: typeName,
            type: Type,
            meta: {},
            mixins: mixins,
            interfaces: interfaces,
            props: {}
        },
        proxy = null,
        isBuildingObj = false,
        _sessionStorage = _Port('sessionStorage'),
        _localStorage = _Port('localStorage');

    const member = {
        isSpecial: (memberName) => {
            return [_constructName, _disposeName, _typeMetaMemberName, '_'].indexOf(memberName) !== -1;
        },
        isDefined: (memberName, ignoreCurrent) => {
            let hierarchy = obj._.instanceOf.slice().reverse(); // look from last added items first
                if (ignoreCurrent) { hierarchy.shift(); } // leave current one
            return (hierarchy.findIndex((item) => {
                return (item.meta[memberName] ? true : false);
            }) !== -1);
        },
        isOwn: (memberName) => {
            return typeof def.meta[memberName] !== 'undefined';
        },
        isDerived: (memberName) => {
            if (member.isOwn(memberName)) { return false; }
            return (obj._.instanceOf.findIndex((item) => {
                return (item.meta[memberName] ? true : false);
            }) !== -1);
        }, 
        type: (memberName) => {
            let idx = (obj._.instanceOf.findIndex((item) => {
                return (item.meta[memberName] ? true : false);
            }));
            return (idx !== -1 ? obj._.instanceOf[idx].meta[memberName].type : '');
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
            let result_meta = member.meta(memberName);
            let result = {
                current: result_meta.current.slice(),
                chained: [] // up in inheritance chain (in reverse order)
            };
            for(let result_attrs of chained) { // pick last applied attribute only of each type available
                for(let result_attr of result_attrs) {
                    if (chained.indexOf(result_attr) !== -1) {
                        chained.push(result_attr);
                    }
                }
            }
            return result;
        },
        meta: (memberName) => {
            let result = {
                current: def.meta[memberName] || [],
                chained: [] // up in inheritance chain
            };
            let hierarchy = obj._.instanceOf.slice().reverse(); // look from last added items first
                hierarchy.shift(); // leave current one
            for(let item of hierarchy) {
                if (typeof item.meta[memberName] !== 'undefined') {
                    result.chained.push(item.meta[memberName]);
                }
            }
            return result;
        },
        isStatic: (memberName) => {
            return attrs.has('static', memberName, true); 
        },
        isPrivate: (memberName) => {
            return attrs.has('private', memberName, true);
        },
        isProtected: (memberName) => {
            return attrs.has('protected', memberName, true);
        },
        isNew: (memberName) => {
            return attrs.has('new', memberName); // TODO: New should break the sequence of check
        },
        isAbstract: (memberName) => {
            return attrs.has('abstract', memberName);
        },
        isOverridden: (memberName) => {
            return attrs.has('override', memberName);
        },
        isVirtual: (memberName) => {
            return attrs.has('virtual', memberName) || attrs.has('abstract', memberName) || attrs.has('override', memberName);
        },
        isSealed: (memberName) => {
            return attrs.has('sealed', memberName);
        },
        isMixed: (memberName) => {
            return attrs.has('mixed', memberName);
        },
        isSessionProperty: (memberName) => {
            return attrs.has('session', memberName);
        },        
        isStateProperty: (memberName) => {
            return attrs.has('state', memberName);
        },
        isReadOnly: (memberName) => {
            return attrs.has('readonly', memberName) || (attrs.has('once', memberName) && obj[memberName]); // either readonly, or once with value defined already
        },  
        isSerializable: (memberName) => {
            return (attrs.has('serialize', memberName) || attrs.has('serialize', _typeMetaMemberName)) && attrs.has('noserialize', memberName);
        }, 
        isPublishing: (memberName) => {
            return attrs.has('publish', memberName);
        }, 
        isFetcher: (memberName) => {
            return attrs.has('fetch', memberName);
        },   
        isDeprecated: (memberName) => {
            return attrs.has('deprecate', memberName);
        },
        isEnumerable: (memberName) => {
            return Object.getOwnPropertyDescriptor(obj, memberName).enumerable;
        },   
        isAsync: (memberName) => {
            return attrs.has('async', memberName);
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
        }
    };
    const types = {
        isSingleton: () => { return attrs.has('singleton', _typeMetaMemberName); },
        isAbstract: () => { return attrs.has('abstract', _typeMetaMemberName); },
        isSealed: () => { return attrs.has('sealed', _typeMetaMemberName); },
        isStatic: () => { return attrs.has('sealed', _typeMetaMemberName); },
        isSerializable: () => { return attrs.has('serialize', _typeMetaMemberName); }
    };

    const addInstanceMeta = () => {
        // general meta information   
        obj._ = copyMembers([obj._, mex], {}); 
        obj._.type = type;
        obj._.Type = () => { return obj._.instanceOf[obj._.instanceOf.length - 1].type; };
        obj._.namespace = null;
        obj._.assembly = () => { return flair.Assembly.get(typeName) || null; };
        obj._.id = guid();

        // hierarchy information (even if inheritance is not configured)
        // when inheritance is not supported, it will have only two entries - one for Object and second for the type itself
        obj._.instanceOf = obj._.instanceOf || [];
        if (obj._.instanceOf.length === 0) { // nothing is defined as yet
            obj._.instanceOf.push({ 
                name: 'Object',
                type: Object,
                meta: {},
                mixins: mixins,
                interfaces: interfaces,
                props: {}
            }); // everything inherits from Object
        }
        obj._.instanceOf.push(def); // whatever is defined
        obj._.isInstanceOf = (name) => {
            if (!name) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            if (name._ && name._.name) { name = name._.name; } 
            return (obj._.instanceOf.findIndex((item) => { return item.name === name; }) !== -1);
        };
        
        // serialization support
        if (cfg.serialize) {
            obj._.serialize = () => { return processJson(exposed_obj, {}); };
            obj._.deserialize = (json) => { return processJson(json, exposed_obj, true); };
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
            if (def.meta[name] && def.meta[name].ref) { return def.meta[name].ref; }
            return null;
        };  
        obj._._.member = member;
        obj._._.attrs = attrs;
        obj._._.type = types;
    };
    const processJson = (source, target, isDeserialize) => {
        let mappedName = '';
        for(let memberName in exposed_obj) {
            if (exposed_obj.hasOwnProperty(memberName) && memberName !== '_') {
                if ((member.isProperty(memberName) &&
                     member.isSerializable(memberName) &&
                     !member.isReadOnly(memberName) && 
                     !member.isStatic(memberName) && 
                     !member.isPrivate(memberName) && 
                     !member.isProtected(memberName))) {
                        the_attr = attrs.get('serialize', memberName);
                        mappedName = (the_attr ? (the_attr.args[0] || memberName) : memberName);
                        if (isDeserialize) {
                            target[memberName] = source[memberName] || target[memberName];
                        } else {
                            target[memberName] = source[memberName];
                        }
                }
            }
        }
    };    
    const buildProp = (memberName, memberDef) => {
        let _member = {
            get: null,
            set: null
        },
        _getter = _noop,
        _setter = _noop,
        _isReadOnly = attrs.has('readonly', memberName),
        _isOnce = attrs.has('once', memberName),
        propHost = null,
        uniqueName = typeName + '_' + memberName,
        isStorageHost = false;        

        // override, if required
        if (cfg.inheritance && attrs.has('override', memberName)) {
            if (typeof obj[memberName] === 'function') { throw new _Exception('InvalidOperation', `Property is not found to override. (${memberName})`); }

            // property gets redefined completely, so no wrap call
        } else {
            // duplicate check, only when not overridden
            if (typeof obj[memberName] !== 'undefined' || isDefined(memberName, true)) { throw new _Exception('InvalidOperation', `A member with this name is already defined. (${memberName})`); }
        }
        
        // define or redefine
        if (memberDef.get || memberDef.set) {
            if (memberDef.get && typeof memberDef.get === 'function') {
                if (cfg.static && attrs.has('static', memberName)) { throw new _Exception('InvalidOperation', `Static properties cannot be defined with a custom getter/setter. (${memberName})`); } 
                if (cfg.storage && (attrs.has('session', memberName) || attrs.has('state', memberName))) { throw new _Exception('InvalidOperation', `Session/State properties cannot be defined with a custom getter/setter. (${memberName})`); }
                _getter = memberDef.get;
            }
            if (memberDef.set && typeof memberDef.set === 'function') {
                _setter = memberDef.set;
            }
            _member.get = function() {
                if (isArrow(_getter)) { return _getter(); } else { return _getter.apply(obj); }
            }.bind(obj);
            _member.set = function(value) {
                if (_isReadOnly) {
                    // readonly props can be set only - either when object is being constructed 
                    // OR if 'once' is applied, and value is not already set
                    if (!((obj._.constructing || isOnce) && !_member.get())) { throw new _Exception('InvalidOperation', `Property is readonly. (${memberName})`); }
                }
                if (isArrow(_setter)) { return _setter(value); } else { return _setter.apply(obj, [value]); }
            }.bind(obj);
        } else { // direct value
            if (cfg.static && attrs.has('static', memberName)) {
                propHost = staticInterface;
            }
            if (!propHost && cfg.storage && attrs.has('session', memberName)) {
                if (!_sessionStorage) { throw new _Exception('NotConfigured', 'Port is not configured. (sessionStorage)'); }
                propHost = _sessionStorage;
                isStorageHost = true;
            }
            if (!propHost && cfg.storage && attrs.has('state', memberName)) {
                if (!_localStorage) { throw new _Exception('NotConfigured', 'Port is not configured. (localStorage)'); }
                propHost = _localStorage;
                isStorageHost = true;
            }
            if (!propHost) { // regular property
                uniqueName = memberName;
                propHost = def.props;
            }
            if(propHost) {
                if (isStorageHost) {
                    if (!propHost.key(uniqueName)) { 
                        propHost.setKey(uniqueName, JSON.stringify({value: memberDef})); 
                    }
                } else {
                    if (typeof propHost[uniqueName] === 'undefined') {
                        propHost[uniqueName] = memberDef; 
                    }
                }
            }
            _member.get = function() {
                if (isStorageHost) { 
                    return JSON.parse(propHost.getKey(uniqueName)).value; 
                }
                return propHost[uniqueName];                
            }.bind(obj);
            _member.set = function(value) {
                if (_isReadOnly) {
                    // readonly props can be set only - either when object is being constructed 
                    // OR if 'once' is applied, and value is not already set
                    if (!(obj._.constructing || isOnce) && !_member.get()) { throw new _Exception('InvalidOperation', `Property is readonly. (${memberName})`); }
                }
                if (isStorageHost) {
                    propHost.setKey(uniqueName, JSON.stringify({value: value}));
                } else {
                    propHost[uniqueName] = value;
                }
            }.bind(obj);

        }

        // return
        return _member;
    };
    const buildFunc = (memberName, memberDef) => {
        let _member = null;

        // override, if required
        if (cfg.inheritance && attrs.has('override', memberName)) {
            if (typeof obj[memberName] !== 'function') { throw new _Exception('InvalidOperation', `Function is not found to override. (${memberName})`); }

            // wrap for base call
            let base = obj[memberName].bind(obj);
            _member = function(...args) {
                let fnArgs = [base].concat(args); // run fn with base as first parameter
                if (isArrow(memberDef)) { return memberDef(...fnArgs); } else { return memberDef.apply(obj, fnArgs); }
            }.bind(obj);
        }

        // duplicate check, if not overridden
        if (!_member && (typeof obj[memberName] !== 'undefined' || isDefined(memberName, true))) { throw new _Exception('InvalidOperation', `A member with this name is already defined. (${memberName})`); }

        // static definition, if not defined
        if (!_member && cfg.static && attrs.has('static', memberName)) {
            if (isArrow(memberDef)) { throw new _Exception('InvalidOperation', `Static functions must not be defined as arrow function. (${memberName})`); }

            // shared (static) copy bound to staticInterface
            // so with 'this' it will be able to access only static properties
            _member = function(...args) {
                return memberDef.apply(staticInterface, args);
            }.bind(staticInterface);
                        
            // define on static interface
            if (!staticInterface[memberName]) {
                staticInterface[memberName] = _member;
            }
        }

        // normal
        if (!_member) { 
            _member = function(...args) {
                if (isArrow(memberDef)) { return memberDef(...args); } else { return memberDef.apply(obj, args); }
            }.bind(obj);
        }

        // return
        return _member;
    };
    const buildEvent = (memberName, memberDef) => {
        let _member = null,
            argsProcessorFn = null;

        // override, if required
        if (cfg.inheritance && attrs.has('override', memberName)) {
            if (typeof obj[memberName] !== 'function') { throw new _Exception('InvalidOperation', `Event is not found to override. (${memberName})`); }

            // wrap for base call
            let base = obj[memberName].bind(obj);
            _theFn = function(...args) {
                let fnArgs = [base].concat(args); // run fn with base as first parameter
                if (isArrow(memberDef)) { return memberDef(...fnArgs); } else { return memberDef.apply(obj, fnArgs); }
            }.bind(obj);
        }

        // duplicate check, if not overridden
        if (!_member && (typeof obj[memberName] !== 'undefined' || isDefined(memberName, true))) { throw new _Exception('InvalidOperation', `A member with this name is already defined. (${memberName})`); }

        // normal
        if (!_member) { 
            _member = function(...args) {
                if (isArrow(memberDef)) { return memberDef(...args); } else { return memberDef.apply(obj, args); }
            }.bind(obj);
        }

        if (!isNeedProtected) { // add event interface only on top level instance
            def.meta[memberName].argsProcessor = _member; // store event args processor function at top level
            _member = {};
            _member._ = Object.freeze({
                subscribers: []
            });
            _member.subscribe = (fn) => {
                if (typeof fn !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (fn)'); }
                _member._.subscribers.push(fn);
            };
            _member.subscribe.all = () => {
                return _member._.subscribers.slice();
            };
            _member.unsubscribe = (fn) => {
                if (typeof fn !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (fn)'); }
                let index = _member._.subscribers.indexOf(fn);
                if (index !== -1) { _member._.subscribers.splice(index, 1); }
            };
            _member.unsubscribe.all = () => {
                _member._.subscribers.length = 0; // remove all
            };
            _member.raise = (...args) => {
                // preprocess args
                let processedArgs = {},
                    argsProcessorFn = def.meta[memberName].argsProcessor;
                if (typeof argsProcessorFn === 'function') { processedArgs = argsProcessorFn(...args); }
        
                // define event arg
                let e = {
                    name: name,
                    args: Object.freeze(processedArgs),
                    stop: false
                };
        
                // raise event
                for(let handler of _member._.subscribers) {
                    handler(e);
                    if (e.stop) { break; }
                }
            };
            _member.rewire = (targetObj) => {
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
        }

        // return
        return _member;
    };
    const addMember = (memberName, memberType, memberDef) => {
        if (['func', 'prop', 'event'].indexOf(memberType) !== -1 && member.isSpecial(memberName)) { new _Exception('InvalidName', `Name is not valid. (${memberName})`); }
        switch(memberType) {
            case 'func':
                if (!cfg.func) { throw new _Exception('InvalidOperation', `Function cannot be defined on this type. (${typeName})`); }
            case 'prop':
                if (!cfg.prop) { throw new _Exception('InvalidOperation', `Property cannot be defined on this type. (${typeName})`); }
            case 'event':
                if (!cfg.event) { throw new _Exception('InvalidOperation', `Event cannot be defined on this type. (${typeName})`); }
            case 'construct':
                if (!cfg.construct) { throw new _Exception('InvalidOperation', `Constructor cannot be defined on this type. (${typeName})`); }
                memberType = 'func'; break;
            case 'dispose':
                if (!cfg.dispose) { throw new _Exception('InvalidOperation', `Dispose cannot be defined on this type. (${typeName})`); }
                memberType = 'func'; break;
        }

        // pick mixin being applied at this time
        if (cfg.mixins) {        
            if (mixin_being_applied !== null) {
                _attr('mixed', mixin_being_applied);
            }
        }

        // collect attributes
        def.meta[memberName] = _attr.collect(); // collect and clear for next bunch on next member
        def.meta[memberName].type = memberType;
        if (cfg.aop) {
            def.meta[name].aspects = []; // which all aspects are applied to this member
        }
        if (cfg.interfaces) {
            def.meta[name].interfaces = []; // to which all interfaces this member complies to
        }        

        // conditional check
        the_attr = attrs.get('conditional', memberName);
        if (the_attr && the_attr.args.length > 0) {
            let isOK = true;
            condition = attrArgs[0].trim();
            if (condition) {
                switch(condition) {
                    case 'server': isOK = (options.env.isServer === true); break;
                    case 'client': isOK = (options.env.isServer === false); break;
                    default: isOK = options.symbols.indexOf(condition) !== -1; break;
                }
                if (!isOK) { delete def.meta[memberName]; return; }
            }        
        }
        
        // abstract check
        if (cfg.interfaces && attrs.has('abstract', memberName) && memberDef !== _noop && (memberDef.get && memberDef.get !== _noop)) {
            if (memberType === 'prop') {
                throw new _Exception('InvalidDefinition', `Abstract property must have a noop getter function. (${memberName})`);
            } else if (memberType !== 'event') {
                throw new _Exception('InvalidDefinition', `Abstract event must be a noop function. (${memberName})`); 
            } else {
                throw new _Exception('InvalidDefinition', `Abstract function must be a noop function. (${memberName})`);
            }
        }


        // validate applied attributes as per attribute configuration
        for(let __attr of def.meta[memberName]) {
            // TODO: validation and throw logic
        }
   
        // member type specific logic
        let memberValue = null;
        switch(memberType) {
            case 'func':
                memberValue = buildFunc(memberName, memberDef);
                if (!(cfg.static && attrs.has('static', memberName))) { // define only when not static, don't define on this interface, its defined on static interface already
                    Object.defineProperty(obj, memberName, {
                        configurable: true, enumerable: true,
                        value: memberValue
                    });
                }
                break;
            case 'prop':
                memberValue = buildProp(memberName, memberDef);
                if (!(cfg.static && attrs.has('static', memberName))) { // define only when not static, don't define on this interface, its defined on static interface already                
                    Object.defineProperty(obj, memberName, {
                        configurable: true, enumerable: true,
                        get: memberValue.get, set: memberValue.set
                    });
                }
                break;
            case 'event':
                memberValue = buildEvent(memberName, memberDef);
                Object.defineProperty(obj, memberName, {
                    configurable: true, enumerable: true,
                    value: memberValue
                });
                break;
        }

        // apply custom attributes
        if (cfg.customAttrs) {
            // TODO: Check Targets,  Fix and make it streamlined
            let Attr = null,
                targetType = def.meta[memberName].type,
                attrArgs = null,
                attrInstance = null,
                decorator = null;
            for(let info of def.meta[memberName]) {
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
        }
        
        // finally hold the references for reflector
        def.meta[memberName].ref = memberValue;
    };
 
    // separate mixins and interfaces
    if (cfg.mixins || cfg.interfaces) {
        let result = extractMixinsAndInterfaces(mixinsAndInterfaces);
        def.mixins = result.mixins;
        def.interfaces = result.interfaces;
    }

    // collect type level attributes
    def.meta[_typeMetaMemberName] = _attr.collect(); // collect and clear for next bunch on next member

    // construct base object
    typeArgs = params.args;
    if (cfg.inheritance) {
        // if coming from a parent construction call
        // keep protected interface
        if (params._flag && params._flag === theFlag) {
            isNeedProtected = true;

            // redefine static to be same as top level type which was passed at the beginning 
            // of construction chain
            if (cfg.static) {
                staticInterface = params._static; 
            }
        } else { // this is the top level
            if (types.isAbstract()) {
                throw new _Exception('InvalidOperation', `Cannot create instance of an abstract type. (${typeName})`); 
            } 
        }

        // create parent instance, if available
        // else use passed object as base object
        let Parent = Type._.inherits;
        if (Parent) {
            if (Parent._.isSealed() || Parent._.isSingleton() || Parent._.isStatic()) {
                throw new _Exception('InvalidOperation', `Cannot inherit from a sealed, static or singleton type. (${Parent._.name})`); 
            }
            if (Parent._.type !== Type._.type) {
                throw new _Exception('InvalidOperation', `Cannot inherit from another type family. (${Parent._.type})`); 
            }
            obj = new Parent(theFlag, staticInterface, ...typeArgs); // obj reference is now parent of object
        } else {
            if (params._flag !== theFlag && types.isAbstract()) {
                throw new _Exception('InvalidOperation', `Cannot create instance of an abstract type. (${typeName})`); 
            }               
        }
    }

     // set object meta
     addInstanceMeta();

    // building started
    isBuildingObj = true; 

    // define proxy for clean syntax inside factory
    proxy = new Proxy({}, {
        get: (_obj, prop) => { return obj[prop]; },
        set: (_obj, prop, value) => {
            if (isBuildingObj) {
                // get member type
                let memberType = '';
                if (prop === 'construct') { 
                    memberType = 'construct'; 
                } else if (prop === 'dispose') { 
                    memberType = 'dispose'; 
                } else {
                    if (typeof value === 'function') {
                        if (_attr.has('event')) { 
                            memberType = 'event'; 
                        } else { 
                            memberType = 'func'; 
                        }
                    } else { 
                        memberType = 'prop'; 
                    }
                }
                
                // add member
                addMember(prop, memberType, value);
            } else {
                // a function or event is being redefined
                if (typeof value === 'function') { throw new _Exception('InvalidOperation', `Redefinition of members at runtime is not allowed. (${prop})`); }

                // allow setting property values
                obj[prop] = value;
            }
            return true;
        }
    });

    // construct using factory having 'this' being proxy object
    factory.apply(proxy);

    // apply mixins
    if (cfg.mixins) { for(let mixin of def.mixins) {
        if (mixin._.type === 'mixin') {
            mixin_being_applied = mixin;
            mixin.apply(proxy); // run mixin's factory too having 'this' being proxy object
            mixin_being_applied = null;
        }
    }}    

    // clear any (by user's error left out) attributes, so that are not added by mistake elsewhere
    _attr.clear();

    // building ends
    isBuildingObj = false; 

    // weave advices from aspects
    if (cfg.aop) {
        // when not on base types of this functionality itself
        if (['Attribute', 'Aspect'].indexOf(typeName) === -1 && 
            !obj._.isInstanceOf('Attribute') && !obj._.isInstanceOf('Aspect')) { 
            let weavedFn = null;
            for(let memb in meta) {
                if (meta.hasOwnProperty(memb) && meta[memb].type === 'func' && !member.isSpecial(memb)) {
                    // get weaved function
                    weavedFn = _Aspects(obj, typeName, memb, meta[memb]);

                    // store aspects applied
                    meta[memb].aspects = weavedFn.aspects;
                    delete weavedFn.aspects;
                    
                    // redefine function
                    Object.defineProperty(obj, memb, {
                        configurable: true,
                        enumerable: true,
                        value: weavedFn
                    });
                }
            }
        }       
    }

    // move constructor and dispose out of main object
    if (cfg.construct && typeof obj[_constructName] === 'function') {
        obj._.construct = obj[_constructName]; delete obj[_constructName];
    }
    if (cfg.dispose && typeof obj[_disposeName] === 'function') {
        obj._.dispose = obj[_disposeName]; delete obj[_disposeName];
    }  

    // prepare protected and public interfaces of object
    let isCopy = false,
        doCopy = (memberName) => { Object.defineProperty(exposed_obj, memberName, Object.getOwnPropertyDescriptor(obj, memberName)); };
    doCopy('_'); // copy meta member
    for(let memberName in obj) { // copy other members
        isCopy = false;
        if (obj.hasOwnProperty(memberName)) { 
            isCopy = true;
            if (member.isOwn(memberName)) {
                if (member.isPrivate(memberName)) { isCopy = false; }   // private members don't get out
                if (isCopy && (member.isProtected(memberName) && !isNeedProtected)) { isCopy = false; } // protected don't go out of top level instance
            } else { // some derived member (protected or public)
                if (member.isProtected(memberName) && !isNeedProtected) { isCopy = false; } // protected don't go out of top level instance
                if (isCopy && !member.isDerived(memberName)) { isCopy = false; } // some directly added member
            }
            if (isCopy) { doCopy(memberName); }
            // rewire event definition when at the top level object creation step
            if (isCopy && !isNeedProtected && member.isEvent(memberName)) {
                exposed_obj[memberName].rewire(exposed_obj);
            }
        }
    }

    // validate interfaces
    if (cfg.interfaces) {
        for(let _interface of def.interfaces) { for(let _memberName in _interface) {
            if (_interface.hasOwnProperty(_memberName) && _memberName !== '_') {
                let _member = _interface[_memberName],
                    _type = typeof exposed_obj[_memberName],
                    _asType = '';
                switch(_member.type) {
                    case 'func': if (_type !== 'function') { _asType = 'function'; } break;
                    case 'prop': if (_type === 'function') { _asType = 'property'; } break;
                    case 'event': if (_type !== 'undefined' && typeof exposed_obj[_memberName].subscribe !== 'function') { _asType = 'event'; } break;
                }
                if (_asType) { throw new _Exception('NotDefined', `Interface (${_interface._.name}) member is not defined as ${_asType} (${_memberName})`); }
                
                // store interface in implements list
                if (meta[_memberName].interfaces.indexOf(_interface) === -1) { meta[_memberName].interfaces.push(_interface); }
            }
        }}
    }

    // call constructor
    if (cfg.construct && !isNeedProtected && typeof exposed_obj._[_constructName] === 'function') { // when on top level instance
        exposed_obj._.constructing = true;
        exposed_obj._[_constructName](...typeArgs);
        delete exposed_obj._.constructing;
    }

    // add type meta on top level type
    if (!isNeedProtected) {
        if (cfg.inheritance && types.isSealed()) { 
            Type._.isSealed = () => { return true; };
        }
        if (cfg.singleton && types.isSingleton()) {
            Type._.isSingleton = () => { return true; };
            Type._.singleInstance = () => { return exposed_obj; }; 
            Type._.singleInstance.clear = () => { 
                Type._.singleInstance = () => { return null; };
                Type._.isSingleton = () => { return false; };
            };
        }
        
    }

    // seal object, so nothing can be added/deleted from outside
    // also, keep protected version intact for 
    if (!isNeedProtected) {
        exposed_obj = Object.seal(exposed_obj);
    }

    // return
    return exposed_obj;
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
    _cfg.config.event = cfg.config.event || false;
    _cfg.config.aop = cfg.config.aop || false;
    _cfg.config.customAttrs = cfg.config.customAttrs || false;

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
    }
    if (!_cfg.config.inheritance) {
        _cfg.config.singleton = false;
    }
    if (!_cfg.config.func && !_cfg.config.prop && !_cfg.config.event) {
        _cfg.config.aop = false;
        _cfg.config.customAttrs = false;
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
