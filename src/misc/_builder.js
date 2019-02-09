const attributesAndModifiers = (def, memberName) => {
    let appliedAttrs = _attr.collect(), // [{name, cfg, attr, args}]
        attrBucket = null,
        modifierBucket = null,
        isTypeLevel = (def.level === 'type'),
        attrs = attrsRefl(def),
        modifiers = modifiersRefl(def);
    if (isTypeLevel) {
        attrBucket = def.typeDef().attrs.type;
        modifierBucket = def.typeDef().modifiers.type;
    } else {
        attrBucket = def.attrs.members[memberName] = []; // create bucket
        modifierBucket = def.modifiers.members[memberName] = []; // create bucket
    }

    // validator
    const validator = (appliedAttr) => {
        let result = false,
            _supportedTypes = ['class', 'struct', 'enum', 'interface', 'mixin', 'resource'],
            _supportedMembers = ['prop', 'func', 'construct', 'dispose', 'event'],
            _supportedModifiers = ['static', 'abstract', 'sealed', 'virtual', 'override', 'private', 'protected', 'readonly', 'async'],
            _list = [], // { withWhat, matchType, original, name, value }
            dump = [],
            constraintsLex = appliedAttr.constraints; // logical version with filled booleans

        // extract names
        const sortAndStore = (match) => {
            let item = {
                withWhat: '',
                matchType: '',
                original: match,
                name: '',
                value: false
            };

            // which type of match
            switch(match.substr(0, 1)) { 
                case '$': 
                    item.matchType = 'anywhere';
                    item.name = match.substr(1);
                    break;
                case '@':
                    item.matchType = 'inherited';
                    item.name = match.substr(1);
                    break;
                default:
                    item.matchType = 'current';
                    item.name = match;
                    break;
            }

            // match with what
            if (match.endsWith('^')) { // type name
                item.withWhat = 'typeName';
                item.name = item.name.replace('^', ''); // remove ^
            } else { // members, types, modifiers or attributes
                if (_supportedTypes.indexOf(item.name) !== -1) {
                    item.withWhat = 'typeType';
                    item.matchType = 'current'; // match type in this case is always taken as current
                } else if (_supportedMembers.indexOf(item.name) !== -1) {
                    item.withWhat = 'memberType';
                    item.matchType = 'current'; // match type in this case is always taken as current
                } else if (_supportedModifiers.indexOf(item.name) !== 0-1) {
                    item.withWhat = 'modifier';
                } else { // inbuilt or custom attribute name
                    item.withWhat = 'attribute';
                }
            }

            // store
            _list.push(item);
        }; 
        const extractConstraints = () => {
            // select everything except these !, &, |, (, and )
            let rex = new RegExp('/[^!\&!|()]/g'), // eslint-disable-line no-useless-escape
            match = '';
            while(true) { // eslint-disable-line no-constant-condition
                match = rex.exec(constraintsLex);
                if (match !== null) { dump.push(match); continue; }
                break; 
            }
            match = '';
            for(let char of dump) {
                if (char[0] !== ' ') { 
                    match+= char[0]; 
                } else {
                    if (match !== '') { sortAndStore(match); }
                    match = '';
                }
            }
        };    
        extractConstraints(); // this will populate _list

        // get true/false value of each item in expression
        for(let item of _list) {
            switch(item.withWhat) {
                case 'typeName':
                    switch(item.matchType) {
                        case 'anywhere':
                            item.value = ((item.name === memberName) || def.Type._.isDerivedFrom(item.name)); break;
                        case 'inherited':
                            item.value = def.Type._.isDerivedFrom(item.name); break;
                        case 'current':
                            item.value = (item.name === memberName); break;
                    }
                    break;
                case 'typeType':
                    // matchType is always 'current' in this case 
                    item.value = (def.types.type === item.name); 
                    break;
                case 'memberType':
                    // matchType is always 'current' in this case 
                    item.value = (def.members[memberName] === item.name);
                    break;
                case 'modifier':
                    // call to configured probe's anywhere, inherited or current function
                    item.value = (modifiers.members.probe(item.name, memberName)[item.matchType]() ? true : false);
                    break;
                case 'attribute':
                    // call to configured probe's anywhere, inherited or current function
                    item.value = (attrs.members.probe(item.name, memberName)[item.matchType]() ? true : false);
                    break;
            }
            constraintsLex = replaceAll(constraintsLex, item.original, item.value.toString());
        }
        
        // validate expression
        result = (new Function("try {return constraintsLex;}catch(e){return false;}"))();
        if (!result) {
            // TODO: send telemetry of _list, so it can be debugged
            throw new _Exception('InvalidOperation', `${appliedAttr.cfg.isModifier ? 'Modifier' : 'Attribute'} ${appliedAttr.name} could not be applied. (${memberName})`);
        }

        // return
        return result;
    };

    // validate and collect
    for (let appliedAttr of appliedAttrs) {
        if (validator(appliedAttr)) {
            if (appliedAttr.isCustom) { // custom attribute instance
                attrBucket.push(appliedAttr);
            } else { // inbuilt attribute or modifier
                if(appliedAttr.cfg.isModifier) { 
                    modifierBucket.push(appliedAttr);
                } else {
                    attrBucket.push(appliedAttr);
                }
            }
        }
    }
};
const modifiersRefl = (def) => {
    const probe = (modifierName, memberName) => {
        let _probe = {
            anywhere: () => {
                return modifiers.get(modifierName, memberName) || modifiers.get(modifierName, memberName, true); 
            },
            current: () => {
                return modifiers.get(modifierName, memberName); 
            },
            inherited: () => {
                return modifiers.get(modifierName, memberName, true); 
            },
            only: {
                current: () => {
                    return modifiers.get(modifierName, memberName) && !modifiers.get(modifierName, memberName, true); 
                },
                inherited: () => {
                    return !modifiers.get(modifierName, memberName) && modifiers.get(modifierName, memberName, true); 
                }
            }
        };
        return _probe;
    };
    let modifiers = {
        get: (modifierName, memberName, isCheckInheritance) => {
            let isTypeLevel = (def.level === 'type'),
                result = null;
            if (isTypeLevel) {
                if (!isCheckInheritance) {
                    result = findItemByProp(def.typeDef().modifiers.type, 'name', modifierName);
                } else {
                    // check from parent onwards, keep going up till find it or hierarchy ends
                    let previousDef = def.previous();
                    while(true) { // eslint-disable-line no-constant-condition
                        if (previousDef === null) { break; }
                        result = findItemByProp(previousDef.modifiers.type, 'name', modifierName);
                        if (!result) { 
                            previousDef = previousDef.previous();
                        } else {
                            break;
                        }
                    }
                }
            } else {
                if (!isCheckInheritance) {
                    result = findItemByProp(def.modifiers.members[memberName], 'name', modifierName);
                } else {
                    // check from parent onwards, keep going up till find it or hierarchy ends
                    let previousDef = def.previous();
                    while(true) { // eslint-disable-line no-constant-condition
                        if (previousDef === null) { break; }
                        result = findItemByProp(previousDef.modifiers.members[memberName], 'name', modifierName);
                        if (!result) { 
                            previousDef = previousDef.previous();
                        } else {
                            break;
                        }
                    }
                }
            }
            return result; // {name, cfg, attr, args}
        },
        has: (modifierName, memberName, isCheckInheritance) => {
            return modifiers.get(modifierName, memberName, isCheckInheritance) !== null;
        },
        type: {
            get: (modifierName, isCheckInheritance) => {
                return modifiers.get(modifierName, true, isCheckInheritance);
            },
            has: (modifierName, isCheckInheritance) => {
                return modifiers.has(modifierName, true, isCheckInheritance);
            },
            all: (isJustName) => {
                if (isJustName) {
                    return def.modifiers.type.map(item => item.name);
                } else {
                    return def.modifiers.type.slice();
                }
            }            
        },
        members: {
            get: modifiers.get,
            has: modifiers.has,
            all: (memberName, isJustName) => {
                if (isJustName) {
                    return def.modifiers.members[memberName].map(item => item.name);
                } else {
                    return def.modifiers.members[memberName].slice();
                }
            },            
            probe: probe,
            is: (modifierName, memberName) => {
                // it applied modifiers' relative logic to identify 
                // if specified member is of that type depending upon
                // modifier definitions on current and previous levels
                let _probe = probe(modifierName, memberName); // local
                switch(modifierName) {
                    case 'static': 
                        return _probe.anywhere(); 
                    case 'abstract':
                        return _probe.anywhere() && !(probe.anywhere('virtual', memberName) || probe.anywhere('override', memberName)); 
                    case 'virtual':
                        return _probe.anywhere() && !probe.anywhere('override', memberName); 
                    case 'override':
                        return _probe.anywhere() && !probe.anywhere('sealed', memberName); 
                    case 'sealed':
                        return _probe.anywhere(); 
                    case 'private':
                        return _probe.anywhere(); 
                    case 'protected':
                        return _probe.anywhere(); 
                    case 'readonly':
                        return _probe.anywhere(); 
                    case 'async':
                        return _probe.anywhere(); 
                }
            }
        }
    };
    return modifiers;
};
const attrsRefl = (def) => {
    const probe = (attrName, memberName) => {
        let _probe = {
            anywhere: () => {
                return attrs.get(attrName, memberName) || attrs.get(attrName, memberName, true); 
            },
            current: () => {
                return attrs.get(attrName, memberName); 
            },
            inherited: () => {
                return attrs.get(attrName, memberName, true); 
            },
            only: {
                current: () => {
                    return attrs.get(attrName, memberName) && !attrs.get(attrName, memberName, true); 
                },
                inherited: () => {
                    return !attrs.get(attrName, memberName) && attrs.get(attrName, memberName, true); 
                }
            }
        };  
        return _probe;      
    };    
    let attrs = {
        get: (attrName, memberName, isCheckInheritance) => {
            let isTypeLevel = (def.level === 'type'),
                result = null; 
            if (isTypeLevel) {
                if (!isCheckInheritance) {
                    result = findItemByProp(def.typeDef().attrs.type, 'name', attrName);
                } else {
                    // check from parent onwards, keep going up till find it or hierarchy ends
                    let previousDef = def.previous();
                    while(true) { // eslint-disable-line no-constant-condition
                        if (previousDef === null) { break; }
                        result = findItemByProp(previousDef.attrs.type, 'name', attrName);
                        if (!result) { 
                            previousDef = previousDef.previous();
                        } else {
                            break;
                        }
                    }
                }
            } else {
                if (!isCheckInheritance) {
                    result = findItemByProp(def.attrs.members[memberName], 'name', attrName);
                } else {
                    let previousDef = def.previous();
                    while(true) { // eslint-disable-line no-constant-condition
                        if (previousDef === null) { break; }
                        result = findItemByProp(previousDef.attrs.members[memberName], 'name', attrName);
                        if (!result) { 
                            previousDef = previousDef.previous();
                        } else {
                            break;
                        }
                    }
                }
            }
            return result; // {name, cfg, attr, args}
        },
        has: (attrName, memberName, isCheckInheritance) => {
            return attrs.get(attrName, memberName, isCheckInheritance) !== null;
        },
        type: {
            get: (attrName, isCheckInheritance) => {
                return attrs.get(attrName, true, isCheckInheritance);
            },
            has: (attrName, isCheckInheritance) => {
                return attrs.has(attrName, true, isCheckInheritance);
            },
            all: (isJustName) => {
                if (isJustName) {
                    return def.attrs.type.map(item => item.name);
                } else {
                    return def.attrs.type.slice();
                }
            }
        },
        members: {
            get: attrs.get,
            has: attrs.has,
            all: (memberName, isJustName) => {
                if (isJustName) {
                    return def.attrs.members[memberName].map(item => item.name);
                } else {
                    return def.attrs.members[memberName].slice();
                }
            },
            probe: probe
        }
    };
    return attrs;
};
const buildTypeInstance = (cfg, Type, params, obj) => {
    if (cfg.singleton && params.isTopLevelInstance && Type._.singleInstance()) { return Type._.singleInstance(); }

    // define vars
    let _noop = noop,
        exposed_obj = {},
        mixin_being_applied = null,
        _constructName = '_construct',
        _disposeName = '_dispose',
        _props = {}, // plain property values storage inside this closure
        def = { 
            name: cfg.params.typeName,
            type: cfg.types.type, // the type of the type itself: class, struct, etc.
            Type: Type,
            level: 'object',
            position: 0, // gets set based on its position added in hierarchy
            types: {
                members: {} // each named item here defines the type of member: func, prop, event, construct, etc.
            },
            attrs: { 
                members: {} // each named item array in here will have: {name, cfg, attr, args}
            },
            modifiers: {
                members: {} // each named item array in here will have: {name, cfg, attr, args}
            },
            typeDef: () => { return Type._.def(); },
            previous: () => {
                return def.position !== 0 ? obj._.hierarchy[def.position - 1] : null;
            }
        },
        proxy = null,
        isBuildingObj = false,
        _sessionStorage = _Port('sessionStorage'),
        _localStorage = _Port('localStorage');

    const applyCustomAttributes = (memberName, memberType) => {
        for(let appliedAttr of attrs.members.all(memberName)) {
            if (appliedAttr.isCustom) { // custom attribute instance
                if (memberType === 'prop') {
                    let desc = Object.getOwnPropertyDescriptor(obj, memberName);
                    let newSet = appliedAttr.attr.decorate(memberName, memberType, desc.get, desc.set); // set must return a object with get and set members
                    if (newSet.get && newSet.set) {
                        Object.defineProperty(obj, memberName, {
                            configurable: true, enumerable: true,
                            get: newSet.get.bind(obj),
                            set: newSet.set.base(obj)
                        });
                    } else {
                        throw new _Exception('Unexpected', `${appliedAttr.name} decoration result is unexpected. (${memberName})`);
                    }
                } else { // func or event
                    let newFn = appliedAttr.attr.decorate(memberName, memberType, obj[memberName]);
                    if (newFn) {
                        Object.defineProperty(obj, memberName, {
                            configurable: true, enumerable: true,
                            value: newFn.bind(obj)
                        });                        
                    } else {
                        throw new _Exception('Unexpected', `${appliedAttr.name} decoration result is unexpected. (${memberName})`);
                    }
                }

                // now since attribute is applied, this attribute instance is of no use,
                appliedAttr.attr = null;
            }
        }           
    };
    const applyAspects = () => {
        // when not on base types of this functionality itself
        if (['Aspect'].indexOf(cfg.params.typeName) === -1 && !obj._.isInstanceOf('Aspect')) { 
            let weavedFn = null,
                funcAspects = [];
            for(let memberName in def.types.members) {
                if (def.types.members.hasOwnProperty(memberName) && def.types.members[memberName] === 'func' && !memberName.startsWith('_')) {
                    // get aspects that are applicable for this function
                    funcAspects = _Aspects.get(cfg.params.typeName, memberName, attrs.members.all(memberName, true));
                    def.aspects.members[memberName] = funcAspects; // store for reference
                    
                    // apply these aspects
                    if (funcAspects.length > 0) {
                        weavedFn = _Aspects.attach(obj[memberName], def.name, memberName, funcAspects); 
                        if (weavedFn) {
                            Object.defineProperty(obj, memberName, {
                                configurable: true, enumerable: true,
                                value: weavedFn.bind(obj)
                            });
                        }
                    }
                }
            }
        }   
    };
    const buildExposedObj = () => {
        let isCopy = false,
        doCopy = (memberName) => { Object.defineProperty(exposed_obj, memberName, Object.getOwnPropertyDescriptor(obj, memberName)); };
        
        // copy meta member
        doCopy('_'); 
        
        // copy other members
        for(let memberName in obj) { 
            isCopy = false;
            if (obj.hasOwnProperty(memberName)) { 
                isCopy = true;
                if (def.members[memberName]) { // member is defined here
                    if (modifiers.members.probe('private', memberName).current()) { isCopy = false; }   // private members don't get out
                    if (isCopy && (modifiers.members.probe('protected', memberName).current() && !params.isNeedProtected)) { isCopy = false; } // protected don't go out of top level instance
                } else { // some derived member (protected or public)
                    if (modifiers.members.probe('protected', memberName).anywhere() && !params.isNeedProtected) { isCopy = false; } // protected don't go out of top level instance
                }
                if (isCopy) { doCopy(memberName); }

                // any abstract member should not left unimplemented now
                if (isCopy && modifiers.members.is('abstract', memberName)) {
                    throw new _Exception('InvalidDefinition', `Abstract member is not implemented. (${memberName})`);
                }

                // apply enumerate attribute now
                if (isCopy) {
                    let the_attr = attrs.members.probe('enumerate', memberName).current();
                    if (the_attr && the_attr.args[0] === false) { // if attr('enumerate', false) is defined
                        let desc = Object.getOwnPropertyDescriptor(exposed_obj, memberName);
                        desc.enumerable = false;
                        Object.defineProperty(exposed_obj, memberName, desc);
                    } // else by default it is true anyways
                }

                // rewire event definition when at the top level object creation step
                if (isCopy && !params.isNeedProtected && obj[memberName].type === 'event') { // this .type is a temp flag, till the time rewiring is not done
                    exposed_obj[memberName].rewire(exposed_obj);
                }
            }
        }
    };
    const validateInterfaces = () => {
        for(let _interfaceType of def.interfaces.types) { 
            // an interface define members just like a type
            // with but its function and event will be noop and
            // property values will be null
            let _interface = new _interfaceType(), // so we get to read members of interface
                _interfaceInternalDef = _interface._.hierarchy.Current();
            for(let _memberName in _interface) {
                if (_interface.hasOwnProperty(_memberName) && _memberName !== '_') {
                    if (exposed_obj[_memberName]) {
                        let _interfaceMemberType = _interfaceInternalDef.types.members[_memberName],
                            _memberTypeHere = def.types.members[_memberName];
                        if (_interfaceMemberType !== _memberTypeHere) { throw new _Exception('NotDefined', `Interface (${_interface._.name}) member is not defined as ${_interfaceMemberType}. (${_memberName})`); }
                    }
                }
            }
        }
    };
    const validateMemberDefinitionFeasibility = (memberName, memberType, memberDef) => {
        let result = false;
        // conditional check
        let the_attr = attrs.members.get('conditional', memberName);
        if (the_attr) {
            let conditions = splitAndTrim(the_attr.args[0] || []);
            for (let condition of conditions) {
                if (condition === 'test' && isTesting) { result = true; break; }
                if (condition === 'server' && isServer) { result = true; break; }
                if (condition === 'client' && isClient) { result = true; break; }
                if (condition === 'debug' && isDebug) { result = true; break; }
                if (condition === 'prod' && isProd) { result = true; break; }
                if (options.symbols.indexOf(condition) !== -1) { result = true; break; }
            }
            if (!result) { return result; } // don't go to define, yet leave meta as is, so at a later stage we know that this was conditional and yet not available, means condition failed
        }
        
        // abstract check
        if (cfg.inheritance && attrs.members.probe('abstract', memberName).current() && memberDef !== _noop && (memberDef.get && memberDef.get !== _noop)) {
            throw new _Exception('InvalidDefinition', `Abstract member must point to noop function. (${memberName})`);
        }

        // overriding member must be present
        if (cfg.inheritance && attrs.members.probe('override', memberName).current() && typeof obj[memberName] === 'undefined') {
            throw new _Exception('InvalidOperation', `Member not found to override. (${memberName})`); 
        }
        
        // duplicate check, if not overriding
        if ((!cfg.inheritance || (cfg.inheritance && !attrs.members.probe('override', memberName).current())) && typeof obj[memberName] !== 'undefined') {
            throw new _Exception('InvalidOperation', `Member with this name is already defined. (${memberName})`); 
        }

        // static members cannot be arrow functions and properties cannot have custom getter/setter
        if (cfg.static && attrs.members.probe('static', memberName).current()) {
            if (memberType === 'func') {
                if (isArrow(memberDef)) { 
                    throw new _Exception('InvalidOperation', `Static functions cannot be defined as an arrow function. (${memberName})`); 
                }
            } else if (memberType === 'prop') {
                if (memberDef.get && typeof memberDef.get === 'function') {
                    throw new _Exception('InvalidOperation', `Static properties cannot be defined with a custom getter/setter. (${memberName})`); 
                }
            }
        }

        // session/state properties cannot have custom getter/setter and also relevant port must be configured
        if (cfg.storage && attrs.members.probe('session', memberName).current()) {
            if (memberDef.get && typeof memberDef.get === 'function') {
                throw new _Exception('InvalidOperation', `Session properties cannot be defined with a custom getter/setter. (${memberName})`); 
            }
            if (!_sessionStorage) { throw new _Exception('NotConfigured', 'Port is not configured. (sessionStorage)'); }
        }
        if (cfg.storage && attrs.members.probe('state', memberName).current()) {
            if (memberDef.get && typeof memberDef.get === 'function') {
                throw new _Exception('InvalidOperation', `State properties cannot be defined with a custom getter/setter. (${memberName})`); 
            }
            if (!_localStorage) { throw new _Exception('NotConfigured', 'Port is not configured. (localStorage)'); }
        }

        // return (when all was a success)
        return result;
    };
    const buildProp = (memberName, memberDef) => {
        let _member = {
            get: null,
            set: null
        },
        _getter = _noop,
        _setter = _noop,
        _isReadOnly = attrs.members.probe.anywhere('readonly', memberName),
        propHost = null,
        uniqueName = def.name + '_' + memberName,
        isStorageHost = false;        

        // define or redefine
        if (memberDef.get || memberDef.set) {
            if (memberDef.get && typeof memberDef.get === 'function') {
                _getter = memberDef.get;
            }
            if (memberDef.set && typeof memberDef.set === 'function') {
                _setter = memberDef.set;
            }
            _member.get = function() {
                if (isArrow(_getter)) { return _getter(); } else { return _getter.apply(obj); }
            }.bind(obj);
            _member.set = function(value) {
                if (_isReadOnly) { // readonly props can be set only when object is being constructed 
                    if (!obj._.constructing) { throw new _Exception('InvalidOperation', `Property is readonly. (${memberName})`); }
                }
                if (isArrow(_setter)) { return _setter(value); } else { return _setter.apply(obj, [value]); }
            }.bind(obj);            
        } else { // direct value
            if (cfg.static && attrs.members.probe.anywhere('static', memberName)) {
                propHost = params.staticInterface;
            }
            if (!propHost && cfg.storage && attrs.probe.anywhere('session', memberName)) {
                propHost = _sessionStorage;
                isStorageHost = true;
            }
            if (!propHost && cfg.storage && attrs.probe.anywhere('state', memberName)) {
                propHost = _localStorage;
                isStorageHost = true;
            }
            if (!propHost) { // regular property
                uniqueName = memberName;
                propHost = _props;
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
                _member.get = function() {
                    if (isStorageHost) { 
                        return JSON.parse(propHost.getKey(uniqueName)).value; 
                    }
                    return propHost[uniqueName];                
                }.bind(obj);
                _member.set = function(value) {
                    if (_isReadOnly) { // readonly props can be set only when object is being constructed 
                        if (!obj._.constructing) { throw new _Exception('InvalidOperation', `Property is readonly. (${memberName})`); }
                    }
                    if (isStorageHost) {
                        propHost.setKey(uniqueName, JSON.stringify({value: value}));
                    } else {
                        propHost[uniqueName] = value;
                    }
                }.bind(obj);
            }
        }

        // return
        return _member;
    };
    const buildFunc = (memberName, memberDef) => {
        let _member = null,
            bindedHost = null,
            base = null,
            fnArgs = null,
            isStaticMember = false;

        // override, if required
        if (cfg.inheritance && attrs.has('override', memberName)) {
            bindedHost = obj;
            base = obj[memberName].bind(obj);
        }

        // shared (static) copy bound to staticInterface
        // so with 'this' it will be able to access only static properties
        if (!bindedHost && cfg.static && attrs.has('static', memberName)) {
            bindedHost = params.staticInterface;
            isStaticMember = true;
        }

        // normal
        if (!bindedHost) { 
            bindedHost = obj;
        }
        
        // define call wrapper
        if (modifiers.has('async', memberName)) {
            _member = function(...args) {
                return new Promise(function(resolve, reject) {
                    if (base) {
                        fnArgs = [base, resolve, reject].concat(args); 
                    } else {
                        fnArgs = [resolve, reject].concat(args); 
                    }
                    if (isArrow(memberDef)) { return memberDef(...fnArgs); } else { return memberDef.apply(bindedHost, fnArgs); }
                }.bind(bindedHost));
            }.bind(bindedHost);                 
        } else {
            _member = function(...args) {
                if (base) {
                    fnArgs = [base].concat(args); 
                } else {
                    fnArgs = args; 
                }
                if (isArrow(memberDef)) { return memberDef(...fnArgs); } else { return memberDef.apply(bindedHost, fnArgs); }
            }.bind(bindedHost);                  
        }

        // define on static interface
        if (cfg.static && isStaticMember && !bindedHost[memberName]) {
            bindedHost[memberName] = _member;
        }

        // return
        return _member;
    };
    const buildEvent = (memberName, memberDef) => {
        let _member = null,
            argsProcessorFn = null;

        // override, if required
        if (cfg.inheritance && attrs.has('override', memberName)) {
            // wrap for base call
            let base = obj[memberName].bind(obj);
            _member = function(...args) {
                let fnArgs = [base].concat(args); // run fn with base as first parameter
                if (isArrow(memberDef)) { return memberDef(...fnArgs); } else { return memberDef.apply(obj, fnArgs); }
            }.bind(obj);
        }
   
        // normal
        if (!_member) { 
            _member = function(...args) {
                if (isArrow(memberDef)) { return memberDef(...args); } else { return memberDef.apply(obj, args); }
            }.bind(obj);
        }

        if (params.isTopLevelInstance) { // add event interface only on top level instance
            argsProcessorFn = _member; 
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
            _member.raise = function(...args) {
                // preprocess args
                let processedArgs = {};
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
            }.bind(obj);
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
        } else {
            // put a temp flag, so at the time of exposing the object, it can be identified
            _member.type = 'event';
        }

        // return
        return _member;
    };
    const addMember = (memberName, memberType, memberDef) => {
        if (['func', 'prop', 'event'].indexOf(memberType) !== -1 && memberName.startsWith('_')) { new _Exception('InvalidName', `Name is not valid. (${memberName})`); }
        switch(memberType) {
            case 'func':
                if (!cfg.func) { throw new _Exception('InvalidOperation', `Function cannot be defined on this type. (${def.name})`); }
                break;
            case 'prop':
                if (!cfg.prop) { throw new _Exception('InvalidOperation', `Property cannot be defined on this type. (${def.name})`); }
                break;
            case 'event':
                if (!cfg.event) { throw new _Exception('InvalidOperation', `Event cannot be defined on this type. (${def.name})`); }
                break;
            case 'construct':
                if (!cfg.construct) { throw new _Exception('InvalidOperation', `Constructor cannot be defined on this type. (${def.name})`); }
                memberType = 'func'; 
                break;
            case 'dispose':
                if (!cfg.dispose) { throw new _Exception('InvalidOperation', `Dispose cannot be defined on this type. (${def.name})`); }
                memberType = 'func'; 
                break;
        }

        // set/update member meta
        def.types.members[memberName] = memberType;
        def.attrs.members[memberName] = [];
        def.modifiers.members[memberName] = [];
        if (cfg.aop) {
            def.aspects = {
                members: {} // each named item array in here will have: [aspect type]
            };
        }

        // pick mixin being applied at this time
        if (cfg.mixins) {        
            if (mixin_being_applied !== null) {
                _attr('mixed', mixin_being_applied);
            }
        }

        // collect attributes and modifiers - validate applied attributes as per attribute configuration - throw when failed
        attributesAndModifiers(def, memberName);

        // validate feasibility of member definition - throw when failed
        if (!validateMemberDefinitionFeasibility(memberName, memberType, memberDef)) { return; } // skip defining this member

        // member type specific logic
        let memberValue = null;
        switch(memberType) {
            case 'func':
                memberValue = buildFunc(memberName, memberDef);
                if (!((cfg.static && attrs.has('static', memberName)))) { // if static  don't define on this interface, its defined on static interface already
                    Object.defineProperty(obj, memberName, {
                        configurable: true, enumerable: true,
                        value: memberValue
                    });
                }
                break;
            case 'prop':
                memberValue = buildProp(memberName, memberDef);
                if (!(cfg.static && attrs.has('static', memberName))) { // if static  don't define on this interface, its defined on static interface already
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
            applyCustomAttributes(memberName);
        }
        
        // finally hold the references for reflector
        def.members[memberName] = memberValue;
    };
    const modifiers = modifiersRefl(def);
    const attrs = attrsRefl(def);
    
    // construct base object from parent, if applicable
    if (cfg.inheritance) {
        if (params.isTopLevelInstance) {
            if (modifiers.type.has('abstract')) { throw new _Exception('InvalidOperation', `Cannot create instance of an abstract type. (${def.name})`); }
        }

        // create parent instance, if required, else use passed object as base object
        let Parent = Type._.inherits;
        if (Parent) {
            if (Parent._.isSealed() || Parent._.isSingleton() || Parent._.isStatic()) {
                throw new _Exception('InvalidOperation', `Cannot inherit from a sealed, static or singleton type. (${Parent._.name})`); 
            }
            if (Parent._.type !== Type._.type) {
                throw new _Exception('InvalidOperation', `Cannot inherit from another type family. (${Parent._.type})`); 
            }
            obj = new Parent(params._flagName, params.staticInterface, params.args); // obj reference is now parent of object
        }
    }

     // set object meta
     if (typeof obj._ === 'undefined') {
        obj._ = {}; 
        obj._.id = guid();
        obj._.hierarchy = []; // will have: 'def' of each hierarchy level in order type is constructed
        obj._.isInstanceOf = (name) => {
            if (!name) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            if (name._ && name._.name) { name = name._.name; } // could be the 'Type' itself
            return findIndexByProp(obj._.hierarchy, 'name', name) !== -1; // if this given type name found anywhere in hierarchy, so yes it is an instance of that type
        };
        obj._.def = () => { return obj._.hierarchy[obj._.hierarchy.length - 1]; }; // always gives def which is on top
        obj._.Type = () => { obj._.def().Type; }; // always gives top level, because that's what this is an instance of which comes to outside world
        if (cfg.serialize) {
            obj._.serialize = () => { return _Serializer.process(exposed_obj, exposed_obj, {}); };
            obj._.deserialize = (json) => { return _Serializer.process(exposed_obj, json, exposed_obj, true); };
        }
        if (cfg.mixins) {
            def.mixins = {
                types: cfg.params.mixins, // mixin types that were applied to this type
                names: namesOf(cfg.params.mixins)
            };
            obj._.isMixed = (name) => {
                if (!name) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                if (name._ && name._.name) { name = name._.name; } // could be mixin type itself
                let result = false;
                for (let defItem of obj._.hierarchy) {
                    if (defItem.mixins.type.names.indexOf(name) !== -1) {
                        result = true; break;
                    }
                }
                return result;                    
            };        
        }
        if (cfg.interfaces) {
            def.interfaces = {
                types: cfg.params.interfaces, // interface types that were applied to this type
                names: namesOf(cfg.params.interfaces)
            };           
            obj._.isImplements = (name) => {
                if (!name) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                if (name._ && name._.name) { name = name._.name; } // could be interface type itself
                let result = false;
                for (let defItem of obj._.hierarchy) {
                    if (defItem.interfaces.type.names.indexOf(name) !== -1) {
                        result = true; break;
                    }
                }
                return result;                   
            };        
        }
     }
     obj._.type = cfg.types.instance; // as defined for this instance by builder, this will always be same for all levels -- class 'instance' at all levels will be 'instance' only
     obj._.hierarchy.push(def); // this level
     def.position = obj._.hierarchy.length - 1; // store this as position index of this level
    if (params.isTopLevelInstance) {
        obj._.modifiers = modifiers;
        obj._.attrs = attrs;
    }

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
    params.factory.apply(proxy);

    // apply mixins
    if (cfg.mixins) { 
        for(let mixin of def.mixins.types) {
            mixin_being_applied = mixin;
            mixin.apply(proxy); // run mixin's factory too having 'this' being proxy object
            mixin_being_applied = null;
        }
    }    

    // clear any (by user's error left out) attributes, so that are not added by mistake elsewhere
    _attr.clear();

    // building ends
    isBuildingObj = false; 

    // weave advices from aspects
    if (cfg.aop) {
        applyAspects();
    }

    // move constructor and dispose out of main object
    if (cfg.construct && typeof obj[_constructName] === 'function') {
        obj._.construct = obj[_constructName]; delete obj[_constructName];
    }
    if (cfg.dispose && typeof obj[_disposeName] === 'function') {
        obj._.dispose = obj[_disposeName]; delete obj[_disposeName];
    }  

    // prepare protected and public interfaces of object
    buildExposedObj();

    // validate interfaces of type
    if (cfg.interfaces) {
        validateInterfaces();
    }

    // call constructor
    if (cfg.construct && params.isTopLevelInstance && typeof exposed_obj._[_constructName] === 'function') {
        exposed_obj._.constructing = true;
        exposed_obj._[_constructName](...params.args);
        delete exposed_obj._.constructing;
    }

    // add/update meta on top level instance
    if (params.isTopLevelInstance) {
        if (cfg.singleton && attrs.type.has('singleton')) {
            Type._.singleInstance = () => { return exposed_obj; }; 
            Type._.singleInstance.clear = () => { 
                Type._.singleInstance = () => { return null; };
            };
        }
    }

    // seal object, so nothing can be added/deleted from outside
    // also, keep protected version intact for 
    if (params.isTopLevelInstance) {
        exposed_obj = Object.seal(exposed_obj);
    }

    // return
    return exposed_obj;
};
const builder = (cfg) => {
    // fix cfg
    cfg.mixins = cfg.mixins || false;
    cfg.interfaces = cfg.interfaces || false;
    cfg.inheritance = cfg.inheritance || false;
    cfg.singleton = cfg.singleton || false;
    cfg.static = cfg.static || false;
    cfg.func = cfg.func || false;
    cfg.construct = cfg.construct || false;
    cfg.dispose = cfg.dispose || false;
    cfg.prop = cfg.prop || false;
    cfg.storage = cfg.storage || false;
    cfg.event = cfg.event || false;
    cfg.aop = cfg.aop || false;
    cfg.customAttrs = cfg.customAttrs || false;
    cfg.serialize = cfg.serialize || false;
    cfg.types.instance = cfg.types.instance || 'unknown';
    cfg.types.type = cfg.types.type || 'unknown';
    cfg.params.typeName = cfg.params.typeName || 'unknown';
    cfg.params.inherits = cfg.params.inherits || null;
    cfg.params.mixins = [];
    cfg.params.interfaces = [];
    cfg.params.factory = cfg.params.factory || null;
    if (!cfg.func) {
        cfg.construct = false;
        cfg.dispose = false;
    }
    if (!cfg.prop) {
        cfg.storage = false;
    }
    if (!cfg.inheritance) {
        cfg.singleton = false;
    }
    if (!cfg.func && !cfg.prop && !cfg.event) {
        cfg.aop = false;
        cfg.customAttrs = false;
    }

    // extract mixins and interfaces
    for(let item of cfg.params.mixinsAndInterfaces) {
       if (item._ && item._.type) {
            switch (item._.type) {
                case 'mixin': cfg.params.mixins.push(item); break;
                case 'interface': cfg.params.interfaces.push(item); break;
            }
       }
    }
    delete cfg.params.mixinsAndInterfaces;

    // top level definitions
    let _flagName = '___flag___';

    // base type definition
    let _Object = function(_flag, _static, ...args) {
        // define parameters and context
        let params = {
            _flagName: _flagName
        };
        if (typeof _flag !== 'undefined' && _flag === _flagName) { // inheritance in play
            params.isNeedProtected = true;
            params.isTopLevelInstance = false;
            params.staticInterface = _static;
            params.args = args;
        } else {
            params.isNeedProtected = false;
            params.isTopLevelInstance = true;
            params.staticInterface = _Object;
            if (typeof _flag !== 'undefined') {
                if (typeof _static !== 'undefined') {
                    params.args = [_flag, _static].concat(args); // one set
                } else {
                    params.args = [_flag]; // no other args given
                }
            } else {
                params.args = []; // no args
            }
        }

        // base object
        let _this = {};

        // build instance
        return buildTypeInstance(cfg, _Object, params, _this);
    };

    // type def
    let typeDef = { 
        name: cfg.params.typeName,
        type: cfg.types.type, // the type of the type itself: class, struct, etc.
        Type: _Object,
        level: 'type',
        position: 0, // for consistency sake w object def. this will always be zero 
        types: {
            type: cfg.types.type, // repeated here just for consistency
        },
        attrs: { 
            type: [], // will have: {name, cfg, attr, args}
        },
        modifiers: {
            type: [], // will have: {name, cfg, attr, args}
        },
        typeDef: () => { return typeDef; }, // so modifiers and attrs reflector don't need to worry
        previous: () => {
            return _Object._.inherits ? _Object._.inherits._.def() : null;
        }
    };
    const modifiers = modifiersRefl(typeDef);
    const attrs = attrsRefl(typeDef);

    // type level attributes pick here
    attributesAndModifiers(typeDef, cfg.params.typeName);

    // set type meta
    _Object._.name = cfg.params.typeName;
    _Object._.type = cfg.types.type;
    _Object._.id = guid();
    _Object._.namespace = null;
    _Object._.assembly = () => { return _Assembly.get(_Object._.name) || null; };
    _Object._.inherits = cfg.params.inherits || null;
    if (cfg.inheritance) {
        _Object._.isAbstract = () => { return modifiers.type.has('abstract'); };
        _Object._.isSealed = () => { return modifiers.type.has('sealed'); };
        _Object._.isDerivedFrom = (name) => { 
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            if (name._ && name._.name) { name = name._.name; }
            let result = false,
                prv = cfg.params.inherits; // look from parent onwards
            if (!result) {
                while(true) { // eslint-disable-line no-constant-condition
                    if (prv === null) { break; }
                    if (prv._.name === name) { result = true; break; }
                    prv = prv._.inherits;
                }
            }
            return result;
        };
    }
    if (cfg.static) {
        _Object._.isStatic = () => { return modifiers.type.has('static'); };
    }
    if (cfg.singleton) {
        _Object._.isSingleton = () => { return attrs.type.has('singleton'); };
        _Object._.singleInstance = () => { return null; };
        _Object._.singleInstance.clear = noop;
    }
    if (cfg.mixins) {
        typeDef.mixins = {
            types: cfg.params.mixins, // mixin types that were applied to this type
            names: namesOf(cfg.params.mixins)
        };        
        _Object._.isMixed = (name) => {
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            if (name._ && name._.name) { name = name._.name; }

            let result = false,
                prv = _Object._.def(); // look from this itself
            while(true) { // eslint-disable-line no-constant-condition
                if (prv === null) { break; }
                result = (prv.mixins.names.indexOf(name) !== -1);
                if (result) { break; }
                prv = prv.previous();
            }
            return result;
        };
    }
    if (cfg.interfaces) {
        typeDef.interfaces = {
            types: cfg.params.interfaces, // interface types that were applied to this type
            names: namesOf(cfg.params.interfaces)
        };          
        _Object._.isImplements = (name) => {
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            if (name._ && name._.name) { name = name._.name; }

            let result = false,
                prv = _Object._.def(); // look from this itself
            while(true) { // eslint-disable-line no-constant-condition
                if (prv === null) { break; }
                result = (prv.interfaces.names.indexOf(name) !== -1);
                if (result) { break; }
                prv = prv.previous();
            }
            return result;
        };                
    }
    _Object._.isDeprecated = () => { return attrs.type.has('deprecate'); };
    _Object._.def = () => { return typeDef; };
    _Object._.modifiers = modifiers;
    _Object._.attrs = attrs;

    // register type with namespace
    _Namespace(_Object); 

    // return 
    if (_Object._.isStatic()) {
        return new _Object();
    } else { // return type
        return _Object;
    }
};
