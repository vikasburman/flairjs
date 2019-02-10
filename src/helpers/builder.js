const attributesAndModifiers = (def, memberName) => {
    let appliedAttrs = _attr.collect(), // [{name, cfg, attr, args}]
        attrBucket = null,
        modifierBucket = null,
        isTypeLevel = (def.level === 'type'),
        modifiers = modifierOrAttrRefl(true, def),
        attrs = modifierOrAttrRefl(false, def);
    if (isTypeLevel) {
        attrBucket = def.attrs.type;
        modifierBucket = def.modifiers.type;
    } else {
        attrBucket = def.attrs.members[memberName] = []; // create bucket
        modifierBucket = def.modifiers.members[memberName] = []; // create bucket
    }

    // validator
    const validator = (appliedAttr) => {
        let result = false,
            _supportedTypes = ['class', 'struct', 'enum', 'interface', 'mixin'],
            _supportedMemberTypes = ['prop', 'func', 'construct', 'dispose', 'event'],
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
                } else if (_supportedMemberTypes.indexOf(item.name) !== -1) {
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
                    item.value = (def.type === item.name); 
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
const modifierOrAttrRefl = (isModifier, def) => {
    let defItemName = (isModifier ? 'modifiers' : 'attrs');
    const probe = (name, memberName) => {
        let _probe = {
            anywhere: () => {
                return root.get(name, memberName) || root.get(name, memberName, true); 
            },
            current: () => {
                return root.get(name, memberName); 
            },
            inherited: () => {
                return root.get(name, memberName, true); 
            },
            only: {
                current: () => {
                    return root.get(name, memberName) && !root.get(name, memberName, true); 
                },
                inherited: () => {
                    return !root.get(name, memberName) && root.get(name, memberName, true); 
                }
            }
        };  
        return _probe;      
    };    
    let root_get = (name, memberName, isCheckInheritance) => {
        let isTypeLevel = (def.level === 'type'),
            result = null; 
        if (isTypeLevel) {
            if (!isCheckInheritance) {
                result = findItemByProp(def[defItemName].type, 'name', name);
            } else {
                // check from parent onwards, keep going up till find it or hierarchy ends
                let prv = def.previous();
                while(true) { // eslint-disable-line no-constant-condition
                    if (prv === null) { break; }
                    result = findItemByProp(prv[defItemName].type, 'name', name);
                    if (!result) { 
                        prv = prv.previous();
                    } else {
                        break;
                    }
                }
            }
        } else {
            if (!isCheckInheritance) {
                result = findItemByProp(def[defItemName].members[memberName], 'name', name);
            } else {
                let prv = def.previous();
                while(true) { // eslint-disable-line no-constant-condition
                    if (prv === null) { break; }
                    result = findItemByProp(prv[defItemName].members[memberName], 'name', name);
                    if (!result) { 
                        prv = prv.previous();
                    } else {
                        break;
                    }
                }
            }
        }
        return result; // {name, cfg, attr, args}
    };     
    let root_has = (name, memberName, isCheckInheritance) => {
        return root.get(name, memberName, isCheckInheritance) !== null;
    };        
    let root = {
        get: root_get,
        has: root_has,
        type: {
            get: (name, isCheckInheritance) => {
                return root.get(name, true, isCheckInheritance);
            },
            has: (attrName, isCheckInheritance) => {
                return root.has(name, true, isCheckInheritance);
            },
            all: (isJustName) => {
                if (isJustName) {
                    return def[defItemName].type.map(item => item.name);
                } else {
                    return def[defItemName].type.slice();
                }
            }
        },
        members: {
            get: root_get,
            has: root_has,
            all: (memberName, isJustName) => {
                if (isJustName) {
                    return def[defItemName].members[memberName].map(item => item.name);
                } else {
                    return def[defItemName].members[memberName].slice();
                }
            },
            probe: probe
        }
    };
    if (isModifier) {
        root.members.is = (modifierName, memberName) => {
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
        };
        root.members.type = (memberName) => {
            let isTypeLevel = (def.level === 'type'),
                result = ''; 
            if (!isTypeLevel) {
                let prv = def; // start from current
                while(true) { // eslint-disable-line no-constant-condition
                    if (prv === null) { break; }
                    result = prv.members[memberName];
                    if (!result) { 
                        prv = prv.previous();
                    } else {
                        break;
                    }   
                }         
            }
            return result;
        };
    }
    return root;
};
const buildTypeInstance = (cfg, Type, params, obj) => {
    if (cfg.singleton && params.isTopLevelInstance && Type._.singleInstance()) { return Type._.singleInstance(); }

    // define vars
    let exposed_obj = {},
        mixin_being_applied = null,
        _constructName = '_construct',
        _disposeName = '_dispose',
        _props = {}, // plain property values storage inside this closure
        _previousDef = null,
        def = { 
            name: cfg.params.typeName,
            type: cfg.types.type, // the type of the type itself: class, struct, etc.
            Type: Type,
            level: 'object',
            members: {}, // each named item here defines the type of member: func, prop, event, construct, etc.
            attrs: { 
                members: {} // each named item array in here will have: {name, cfg, attr, args}
            },
            modifiers: {
                members: {} // each named item array in here will have: {name, cfg, attr, args}
            },
            previous: () => {
                return _previousDef;
            }
        },
        proxy = null,
        isBuildingObj = false,
        _sessionStorage = _Port('sessionStorage'),
        _localStorage = _Port('localStorage');

    const applyCustomAttributes = (bindingHost, memberName, memberType, member) => {
        for(let appliedAttr of attrs.members.all(memberName)) {
            if (appliedAttr.isCustom) { // custom attribute instance
                if (memberType === 'prop') {
                    let newSet = appliedAttr.attr.decorate(memberName, memberType, member.get, member.set); // set must return a object with get and set members
                    if (newSet.get && newSet.set) {
                        newSet.get = newSet.get.bind(bindingHost);
                        newSet.set = newSet.set.bind(bindingHost);
                        member = newSet; // update for next attribute application
                    } else {
                        throw new _Exception('Unexpected', `${appliedAttr.name} decoration result is unexpected. (${memberName})`);
                    }
                } else { // func or event
                    let newFn = appliedAttr.attr.decorate(memberName, memberType, member);
                    if (newFn) {
                        member = newFn.bind(bindingHost); // update for next attribute application
                    } else {
                        throw new _Exception('Unexpected', `${appliedAttr.name} decoration result is unexpected. (${memberName})`);
                    }
                }

                // now since attribute is applied, this attribute instance is of no use,
                appliedAttr.attr = null;
            }
        }
        return member;           
    };
    const applyAspects = (memberName, member) => {
        let weavedFn = null,
            funcAspects = [];

        // get aspects that are applicable for this function
        funcAspects = _Aspects.get(def.name, memberName, attrs.members.all(memberName, true));
        def.aspects.members[memberName] = funcAspects; // store for reference
            
        // apply these aspects
        if (funcAspects.length > 0) {
            weavedFn = _Aspects.attach(member, def.name, memberName, funcAspects); 
            if (weavedFn) {
                member = weavedFn; // update member itself
            }
        }

        // return weaved or unchanged member
        return member;
    };
    const buildExposedObj = () => {
        let isCopy = false,
        doCopy = (memberName) => { Object.defineProperty(exposed_obj, memberName, Object.getOwnPropertyDescriptor(obj, memberName)); };
        
        // copy meta member as non-enumerable
        let desc = Object.getOwnPropertyDescriptor(exposed_obj, '_');
        desc.enumerable = false;
        Object.defineProperty(exposed_obj, '_', desc);
        
        // copy other members
        for(let memberName in obj) { 
            isCopy = false;
            if (obj.hasOwnProperty(memberName) && memberName !== '_') { 
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
                if (isCopy && !params.isNeedProtected && typeof obj[memberName].subscribe === 'function') { 
                    exposed_obj[memberName].strip(exposed_obj);
                }
            }
        }

        // extend with configured extensions only at top level, since (1) these will always be same at all levels
        // since these are of same object type, and since overwriting of this is allowed, add only at top level
        // and only missing ones
        if (params.isTopLevelInstance) {
            exposed_obj = extend(exposed_obj, cfg.ex.instance, false); // don;t overwrite, since overriding defaults are allowed
        }

        // expose def of this level for upper level to access if not on top level
        if (!params.isTopLevelInstance) {
            exposed_obj._.def = def; // this will be deleted as soon as picked at top level
        }
    };
    const validateInterfaces = () => {
        for(let _interfaceType of def.interfaces) { 
            // an interface define members just like a type
            // with but its function and event will be noop and
            // property values will be null
            let _interface = new _interfaceType(); // so we get to read members of interface
            for(let _memberName in _interface) {
                if (_interface.hasOwnProperty(_memberName) && _memberName !== '_') {
                    if (exposed_obj[_memberName]) {
                        let _interfaceMemberType = _interface._.modifiers.members.type(_memberName);
                        if (_interfaceMemberType !== def.members[_memberName]) { throw new _Exception('NotDefined', `Interface (${_interface._.name}) member is not defined as ${_interfaceMemberType}. (${_memberName})`); }
                    }
                }
            }
        }

        // delete it, no longer needed (a reference is available at Type level)
        delete def.interfaces;
    };
    const validatePreMemberDefinitionFeasibility = (memberName, memberType, memberDef) => { // eslint-disable-line no-unused-vars
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
        return memberType;
    };
    const validateMemberDefinitionFeasibility = (memberName, memberType, memberDef) => {
        let result = false;
        // conditional check
        let the_attr = attrs.members.probe('conditional', memberName).current();
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
        if (cfg.inheritance && attrs.members.probe('abstract', memberName).current() && (memberDef !== _noop || memberDef !== null) && (memberDef.get && memberDef.get !== _noop)) {
            throw new _Exception('InvalidDefinition', `Abstract member must point to noop function or a null value. (${memberName})`);
        }

        // constructor arguments check for a static type
        if (cfg.static && cfg.construct && memberName === _constructName && memberDef.length !== 0) {
            throw new _Exception('InvalidDefinition', `Static constructors cannot have arguments. (construct)`);
        }

        // dispose arguments check always
        if (cfg.dispose && memberName === _disposeName && memberDef.length !== 0) {
            throw new _Exception('InvalidDefinition', `Destructor method cannot have arguments. (dispose)`);
        }
        
        // duplicate check, if not overriding and its not a mixin factory running
        // mixins overwrite previous mixin's member, if any
        // at class/struct level, overwriting any mixin added member is allowed
        if (mixin_being_applied === null && typeof obj[memberName] !== 'undefined' &&
            (!attrs.members.probe('mixed', memberName).current()) &&
            (!cfg.inheritance || (cfg.inheritance && !attrs.members.probe('override', memberName).current()))) {
                throw new _Exception('InvalidOperation', `Member with this name is already defined. (${memberName})`); 
        }

        // overriding member must be present and of the same type
        if (cfg.inheritance && attrs.members.probe('override', memberName).current()) {
            if (typeof obj[memberName] === 'undefined') {
                throw new _Exception('InvalidOperation', `Member not found to override. (${memberName})`); 
            } else if (modifiers.members.type(memberName) !== memberType) {
                throw new _Exception('InvalidOperation', `Overriding member type is invalid. (${memberName})`); 
            }
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
    const buildProp = (memberName, memberType, memberDef) => {
        let _member = {
            get: null,
            set: null
        },
        _getter = _noop,
        _setter = _noop,
        _isReadOnly = attrs.members.probe('readonly', memberName).anywhere(),
        _isStatic = attrs.members.probe('static', memberName).anywhere(),
        _isSession = attrs.members.probe('session', memberName).anywhere(),
        _isState = attrs.members.probe('state', memberName).anywhere(),
        _deprecate_attr = attrs.members.probe('deprecate', memberName).current(),
        _isDeprecate = (_deprecate_attr !== null),
        _deprecate_message = (_isDeprecate ? (_deprecate_attr.args[0] || `Event is marked as deprecate. (${memberName})`) : ''),
        propHost = _props, // default place to store property values inside closure
        bindingHost = obj,
        uniqueName = def.name + '_' + memberName,
        isStorageHost = false;        

        // define or redefine
        if (memberDef.get || memberDef.set) { // normal property, cannot be static because static cannot have custom getter/setter
            if (memberDef.get && typeof memberDef.get === 'function') {
                _getter = memberDef.get;
            }
            if (memberDef.set && typeof memberDef.set === 'function') {
                _setter = memberDef.set;
            }
            _member.get = function() {
                if (_isDeprecate) {
                    console.log(_deprecate_message); // eslint-disable-line no-console
                }                
                if (isArrow(_getter)) { return _getter(); } else { return _getter.apply(bindingHost); }
            }.bind(bindingHost);
            _member.set = function(value) {
                if (_isDeprecate) {
                    console.log(_deprecate_message); // eslint-disable-line no-console
                }                
                if (_isReadOnly) { // readonly props can be set only when object is being constructed 
                    if (!obj._.constructing) { throw new _Exception('InvalidOperation', `Property is readonly. (${memberName})`); }
                }
                if (isArrow(_setter)) { return _setter(value); } else { return _setter.apply(bindingHost, [value]); }
            }.bind(bindingHost);            
        } else { // direct value
            if (cfg.static && _isStatic) {
                propHost = params.staticInterface._.props; // property values are stored on static interface itself in  ._.props
                bindingHost = params.staticInterface; // binding to static interface, so with 'this' object internals are not accessible
            } else if (cfg.storage && (_isSession || _isState)) {
                propHost = (_isSession ? _sessionStorage : _localStorage);
                isStorageHost = true;
                if (!propHost.key(uniqueName)) { 
                    propHost.setKey(uniqueName, JSON.stringify({value: memberDef})); 
                }
            } 
            _member.get = function() {
                if (_isDeprecate) {
                    console.log(_deprecate_message); // eslint-disable-line no-console
                }                
                if (isStorageHost) { 
                    return JSON.parse(propHost.getKey(uniqueName)).value; 
                }
                return propHost[uniqueName];             
            }.bind(bindingHost);
            _member.set = function(value) {
                if (_isDeprecate) {
                    console.log(_deprecate_message); // eslint-disable-line no-console
                }                
                if (_isReadOnly && !_isStatic) { // readonly props can be set only when object is being constructed 
                    if (!obj._.constructing) { throw new _Exception('InvalidOperation', `Property is readonly. (${memberName})`); }
                }
                if (isStorageHost) {
                    propHost.setKey(uniqueName, JSON.stringify({value: value}));
                } else {
                    propHost[uniqueName] = value;
                }
            }.bind(bindingHost);
        }

        // apply custom attributes
        if (cfg.customAttrs) {
            _member = applyCustomAttributes(bindingHost, memberName, memberType, _member);
        }

        // weave advices from aspects
        if (cfg.aop) {
            _member = applyAspects(memberName, _member);
        }        

        // return
        return _member;
    };
    const buildFunc = (memberName, memberType, memberDef) => {
        let _member = null,
            bindingHost = obj,
            _isOverriding = (cfg.inheritance && attrs.members.probe('override', memberName).current()),
            _isStatic = (cfg.static && attrs.members.probe('static', memberName).current()),
            _isASync = (modifiers.members.probe('async', memberName).current()),
            _deprecate_attr = attrs.members.probe('deprecate', memberName).current(),
            _isDeprecate = (_deprecate_attr !== null),
            _deprecate_message = (_isDeprecate ? (_deprecate_attr.args[0] || `Function is marked as deprecate. (${memberName})`) : ''),
            base = null,
            fnArgs = null;

        // override, if required
        if (_isOverriding) {
            base = obj[memberName].bind(bindingHost);
        } else if (_isStatic) {
            // shared (static) copy bound to staticInterface
            // so with 'this' it will be able to access only static properties
            bindingHost = params.staticInterface; // redefine binding host
        }

        // define
        if (_isASync) {
            _member = function(...args) {
                return new Promise(function(resolve, reject) {
                    if (_isDeprecate) {
                        console.log(_deprecate_message); // eslint-disable-line no-console
                    }                    
                    if (base) {
                        fnArgs = [base, resolve, reject].concat(args); 
                    } else {
                        fnArgs = [resolve, reject].concat(args); 
                    }
                    if (isArrow(memberDef)) { return memberDef(...fnArgs); } else { return memberDef.apply(bindingHost, fnArgs); }
                }.bind(bindingHost));
            }.bind(bindingHost);                 
        } else {
            _member = function(...args) {
                if (_isDeprecate) {
                    console.log(_deprecate_message); // eslint-disable-line no-console
                }                
                if (base) {
                    fnArgs = [base].concat(args); 
                } else {
                    fnArgs = args; 
                }
                if (isArrow(memberDef)) { return memberDef(...fnArgs); } else { return memberDef.apply(bindingHost, fnArgs); }
            }.bind(bindingHost);                  
        }

        // apply custom attributes
        if (cfg.customAttrs) {
            _member = applyCustomAttributes(bindingHost, memberName, memberType, _member);
        }

        // weave advices from aspects
        if (cfg.aop) {
            _member = applyAspects(memberName, _member);
        }

        // return
        return _member;
    };
    const buildEvent = (memberName, memberType, memberDef) => {
        let _member = null,
            argsProcessorFn = null,
            base = null,
            fnArgs = null,     
            _isOverriding = (cfg.inheritance && attrs.members.probe('override', memberName).current()), 
            _deprecate_attr = attrs.members.probe('deprecate', memberName).current(),
            _isDeprecate = (_deprecate_attr !== null),
            _deprecate_message = (_isDeprecate ? (_deprecate_attr.args[0] || `Event is marked as deprecate. (${memberName})`) : ''),
            bindingHost = obj;

        // override, if required
        if (_isOverriding) {
            // wrap for base call
            base = obj[memberName]._.processor;
        } 
   
        // define
        _member = function(...args) {
            if (_isDeprecate) {
                console.log(_deprecate_message); // eslint-disable-line no-console
            }
            if (base) {
                fnArgs = [base].concat(args); 
            } else {
                fnArgs = args; 
            }
            if (isArrow(memberDef)) { return memberDef(...fnArgs); } else { return memberDef.apply(bindingHost, fnArgs); }
        }.bind(bindingHost);                  

       // apply custom attributes (before event interface is added)
        if (cfg.customAttrs) {
            _member = applyCustomAttributes(bindingHost, memberName, memberType, _member);
        }

        // weave advices from aspects (before event interface is added)
        if (cfg.aop) {
            _member = applyAspects(memberName, _member);
        }

        // attach event interface
        argsProcessorFn = _member; 
        _member = function(...args) {
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
        }.bind(bindingHost);
        _member._ = Object.freeze({
            subscribers: [],
            processor: argsProcessorFn
        });
        _member.subscribe = (fn) => {
            if (typeof fn !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (fn)'); }
            _member._.subscribers.push(fn);
        };
        _member.subscribe.list = () => {
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
        _member.strip = (_exposed_obj) => {
            // returns the stripped version of the event without event raising ability
            let strippedEvent = Object.freeze(extend({}, _member, true, ['strip']));

            // delete strip feature now, it is no longer needed
            delete _member.strip;
            delete _exposed_obj.strip;

            // return
            return strippedEvent;
        }

        // return
        return _member;
    };
    const addMember = (memberName, memberType, memberDef) => {
        // validate pre-definition feasibility of member definition - throw when failed - else return updated or same memberType
        memberType = validatePreMemberDefinitionFeasibility(memberName, memberType, memberDef); 

        // set/update member meta
        def.members[memberName] = memberType;
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
        let memberValue = null,
            _isStatic = ((cfg.static && attrs.members.probe('static', memberName).current())),
            bindingHost = (_isStatic ? params.staticInterface : obj);
        switch(memberType) {
            case 'func':
                memberValue = buildFunc(memberName, memberType, memberDef);
                Object.defineProperty(bindingHost, memberName, {
                    configurable: true, enumerable: true,
                    value: memberValue
                });
                break;
            case 'prop':
                memberValue = buildProp(memberName, memberType, memberDef);
                Object.defineProperty(bindingHost, memberName, {
                    configurable: true, enumerable: true,
                    get: memberValue.get, set: memberValue.set
                });
                break;
            case 'event':
                memberValue = buildEvent(memberName, memberType, memberDef);
                Object.defineProperty(obj, memberName, { // events are always defined on objects, and static definition is not allowed
                    configurable: true, enumerable: true,
                    value: memberValue
                });
                break;
        }

        // finally hold the references for reflector
        def.members[memberName] = memberValue;
    };
    const modifiers = modifierOrAttrRefl(true, def);
    const attrs = modifierOrAttrRefl(false, def);
    
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

            // construct base object (the inherited one)
            obj = new Parent(params._flagName, params.staticInterface, params.args); // obj reference is now parent of object

            // pick previous level def
            _previousDef = obj._.def;
            delete obj._.def;
        }
    }

     // set object meta
     if (typeof obj._ === 'undefined') {
        obj._ = extend({}, cfg.mex.instance, false); // these will always be same, since inheritance happen in same types, and these are defined at a type configuration level, so these will always be same and should behave just like the next set of definitions here
        if (cfg.mixins) {
            def.mixins = cfg.params.mixins; // mixin types that were applied to this type, will be deleted after apply
        }
        if (cfg.interfaces) {
            def.interfaces = cfg.params.interfaces; // interface types that were applied to this type, will be deleted after validation
        }
     }
     obj._.type = cfg.types.instance; // as defined for this instance by builder, this will always be same for all levels -- class 'instance' at all levels will be 'instance' only
    if (params.isTopLevelInstance) {
        obj._.id = guid();
        obj._.Type = Type; // top level Type (all inheritance for these types will come from Type._.inherits)
        obj._.isInstanceOf = (name) => {
            if (!name) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            if (name._ && name._.name) { name = name._.name; } // could be the 'Type' itself
            return (obj._.Type._.name === name) || Type._.isDerivedFrom(name); 
        };
        if (cfg.mixins) {
            obj._.isMixed = (name) => { return obj._.Type._.isMixed(name); };
        }
        if (cfg.interfaces) {
            obj._.isImplements = (name) => { return obj._.Type._.isImplements(name); };
        }
        obj._.modifiers = modifiers;
        obj._.attrs = attrs;
    }

    // building started
    isBuildingObj = true; 

    // define proxy for clean syntax inside factory
    proxy = new Proxy({}, {
        get: (_obj, name) => { return obj[name]; },
        set: (_obj, name, value) => {
            if (isBuildingObj) {
                // get member type
                let memberType = '';
                if (name === 'construct') {
                    memberType = 'construct'; 
                } else if (name === 'dispose') {
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
                addMember(name, memberType, value);
            } else {
                // a function or event is being redefined
                if (typeof value === 'function') { throw new _Exception('InvalidOperation', `Redefinition of members is not allowed. (${name})`); }

                // allow setting property values
                obj[name] = value;
            }
            return true;
        }
    });

    // apply mixins
    if (cfg.mixins) { 
        for(let mixin of def.mixins) {
            mixin_being_applied = mixin;
            mixin.apply(proxy); // run mixin's factory too having 'this' being proxy object
            mixin_being_applied = null;
        }

        // delete it, its no longer needed (a reference is available at Type level)
        delete def.mixins;
    }

    // construct using factory having 'this' being proxy object
    params.factory.apply(proxy);

    // clear any (by user's error left out) attributes, so that are not added by mistake elsewhere
    _attr.clear();

    // building ends
    isBuildingObj = false; 

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
        exposed_obj._ = Object.freeze(exposed_obj._); // freeze meta information
        exposed_obj = Object.seal(exposed_obj);
    }

    // return
    return exposed_obj;
};
const builder = (cfg) => {
    // process cfg
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
    cfg.types.instance = cfg.types.instance || 'unknown';
    cfg.types.type = cfg.types.type || 'unknown';
    cfg.mex.instance = ((cfg.mex && cfg.mex.instance) ? cfg.mex.instance : {});
    cfg.mex.type = ((cfg.mex && cfg.mex.type) ? cfg.mex.type : {})
    cfg.ex.instance = ((cfg.ex && cfg.ex.instance) ? cfg.ex.instance : {});
    cfg.ex.type = ((cfg.ex && cfg.ex.type) ? cfg.ex.type : {});
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

    // object extensions
    let _oex = { // every object of every type will have this, that means all types are derived from this common object
    }; 
    cfg.ex.instance = extend(cfg.ex.instance, _oex, false); // don't override, which means defaults overriding is allowed

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

    // extend type itself
    _Object = extend(_Object, cfg.ex.type, false); // don't overwrite while adding type extensions, this means defaults override is allowed

    // type def
    let typeDef = { 
        name: cfg.params.typeName,
        type: cfg.types.type, // the type of the type itself: class, struct, etc.
        Type: _Object,
        level: 'type',
        members: {}, // each named item here defines the type of member: func, prop, event, construct, etc.
        attrs: { 
            type: [], // will have: {name, cfg, attr, args}
        },
        modifiers: {
            type: [], // will have: {name, cfg, attr, args}
        },
        previous: () => {
            return _Object._.inherits ? _Object._.inherits._.def() : null;
        }
    };
    const modifiers = modifierOrAttrRefl(true, typeDef);
    const attrs = modifierOrAttrRefl(false, typeDef);

    // type level attributes pick here
    attributesAndModifiers(typeDef, cfg.params.typeName);

    // set type meta
    _Object._ = extend({}, cfg.mex.type, true);
    _Object._.name = cfg.params.typeName;
    _Object._.type = cfg.types.type;
    _Object._.id = guid();
    _Object._.namespace = null;
    _Object._.assembly = () => { return _Assembly.get(_Object._.name) || null; };
    _Object._.inherits = null;
    if (cfg.inheritance) {
        _Object._.inherits = cfg.params.inherits || null;
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

        // warn for type deprecate at the time of inheritance
        if (_Object._.inherits) {
            let deprecateMessage = _Object._.inherits._.isDeprecated();
            if (deprecateMessage) {
                console.log(deprecateMessage); // eslint-disable-line no-console
            }
        }
    }
    if (cfg.static) {
        _Object._.isStatic = () => { return modifiers.type.has('static'); };
        _Object._.props = {}; // static property values host
    }
    if (cfg.singleton) {
        _Object._.isSingleton = () => { return attrs.type.has('singleton'); };
        _Object._.singleInstance = () => { return null; };
        _Object._.singleInstance.clear = _noop;
    }
    if (cfg.mixins) {
        _Object._.mixins = cfg.params.mixins; // mixin types that were applied to this type
        _Object._.isMixed = (name) => {
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            if (name._ && name._.name) { name = name._.name; }
            let result = false,
                prv = _Object; // look from this itself
            while(true) { // eslint-disable-line no-constant-condition
                if (prv === null) { break; }
                result = (findItemByProp(prv._.mixins, 'name', name) !== -1);
                if (result) { break; }
                prv = prv._.inherits;
            }
            return result;
        };
    }
    if (cfg.interfaces) {
        _Object._.interfaces = cfg.params.interfaces,     
        _Object._.isImplements = (name) => {
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            if (name._ && name._.name) { name = name._.name; }
            let result = false,
                prv = _Object; // look from this itself
            while(true) { // eslint-disable-line no-constant-condition
                if (prv === null) { break; }
                result = (findItemByProp(prv._.interfaces, 'name', name) !== -1);
                if (result) { break; }
                prv = prv._.inherits;
            }
            return result;
        };                
    }
    _Object._.isDeprecated = () => { 
        let the_attr = attrs.type.get('deprecate');
        if (the_attr) {
            return the_attr.args[0] || `Type is marked as deprecated. (${_Object._.name})`;
        } else {
            return false;
        }
    };
    _Object._.def = () => { return typeDef; };
    _Object._.modifiers = modifiers;
    _Object._.attrs = attrs;

    // register type with namespace
    _Namespace(_Object); 

    // freeze object meta
    _Object._ = Object.freeze(_Object._);

    // return 
    if (_Object._.isStatic()) {
        return new _Object();
    } else { // return type
        return Object.freeze(_Object);
    }
};
