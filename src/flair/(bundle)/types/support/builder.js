const attributesAndModifiers = (def, typeDef, memberName, isTypeLevel, isCustomAllowed) => {
    let appliedAttrs = _attr.collect(), // [{name, cfg, isCustom, attr, args}]
        attrBucket = null,
        modifierBucket = null,
        modifiers = modifierOrAttrRefl(true, def, typeDef),
        attrs = modifierOrAttrRefl(false, def, typeDef),
        errorInName = '';
    if (isTypeLevel) {
        attrBucket = typeDef.attrs.type;
        modifierBucket = typeDef.modifiers.type;
        errorInName = `${typeDef.name}`;
    } else {
        attrBucket = def.attrs.members[memberName]; // pick bucket
        modifierBucket = def.modifiers.members[memberName]; // pick bucket
        errorInName = `${def.name}::${memberName}`;
    }

    // throw if custom attributes are applied but not allowed
    if (!isCustomAllowed) {
        for(let item of appliedAttrs) {
            if (item.isCustom) {
                throw _Exception.InvalidOperation(`Custom attribute cannot be applied. (${item.name})`, builder);
            }
        }
    }

    // validator
    const validator = (appliedAttr) => {
        let result = false,
            _supportedTypes = flairTypes,
            _supportedMemberTypes = ['prop', 'func', 'construct', 'dispose', 'event'],
            _supportedModifiers = ['static', 'abstract', 'sealed', 'virtual', 'override', 'private', 'privateSet', 'protected', 'protectedSet', 'readonly', 'async'],
            _list = [], // { withWhat, matchType, original, name, value }
            _list2 = [], // to store all struct types, which needs to be processed at end, else replaceAll causes problem and 'struct' state is replaced on 'construct' too
            constraintsLex = appliedAttr.cfg.constraints; // logical version with filled booleans

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
            if (item.name === 'struct') {
                // note: 'struct' falls inside 'construct', so replaceAll happens to replace 'struct's state over 'construct'
                // too, and so, it being collected in _list2 and will be added at the end
                _list2.push(item);
            } else {
                _list.push(item);
            }
        }; 
        const extractConstraints = () => {
            // select everything except these !, &, |, (, and )
            let rex = new RegExp('[^!\&!|()]', 'g'), // eslint-disable-line no-useless-escape
                match = '',
                dump = [],
                idx = 0;
            while(true) { // eslint-disable-line no-constant-condition
                match = rex.exec(constraintsLex);
                if (match !== null) { dump.push(match); continue; }
                break; 
            }
            match = ''; idx = 0;
            for(let char of dump) {
                idx++;
                if (char[0] !== ' ') { 
                    match+= char[0];
                    if (idx === dump.length)  { 
                        if (match !== '') { sortAndStore(match); }
                        match = '';
                    }
                } else {
                    if (match !== '') { sortAndStore(match); }
                    match = '';
                }
            }

            // merge _list and _list
            _list = _list.concat(_list2);
        };    
        extractConstraints(); // this will populate _list 

        // get true/false value of each item in expression
        for(let item of _list) {
            switch(item.withWhat) {
                case 'typeName':
                    switch(item.matchType) {
                        case 'anywhere':
                            item.value = ((item.name === typeDef.name) || typeDef.Type[meta].isDerivedFrom(item.name)); break;
                        case 'inherited':
                            item.value = typeDef.Type[meta].isDerivedFrom(item.name); break;
                        case 'current':
                            item.value = (item.name === typeDef.name); break;
                    }
                    break;
                case 'typeType':
                    // matchType is always 'current' in this case 
                    item.value = (typeDef.type === item.name); 
                    break;
                case 'memberType':
                    // matchType is always 'current' in this case 
                    if (isTypeLevel) {
                        item.value = false; // member matching at type level is always false
                    } else {
                        item.value = (def.members[memberName] === item.name);
                    }
                    break;
                case 'modifier':
                    // call to configured probe's anywhere, inherited or current function
                    if (isTypeLevel) {
                        item.value = (modifiers.type.probe(item.name)[item.matchType]() ? true : false);
                    } else {
                        item.value = (modifiers.members.probe(item.name, memberName)[item.matchType]() ? true : false);
                    }
                    break;
                case 'attribute':
                    // call to configured probe's anywhere, inherited or current function
                    if (isTypeLevel) {
                        item.value = (attrs.type.probe(item.name)[item.matchType]() ? true : false);
                    } else {
                        item.value = (attrs.members.probe(item.name, memberName)[item.matchType]() ? true : false);
                    }
                    break;
            }
            constraintsLex = replaceAll(constraintsLex, item.original, item.value.toString());
        }
        
        // validate expression
        try {
            result = (new Function("try {return (" + constraintsLex + ");}catch(e){return false;}")());
            if (!result) {
                // TODO: send telemetry of _list, so it can be debugged
                throw _Exception.InvalidOperation(`${appliedAttr.cfg.isModifier ? 'Modifier' : 'Attribute'} ${appliedAttr.name} could not be applied. (${errorInName} --> [${constraintsLex}])`, builder);
            }
        } catch (err) {
            throw _Exception.OperationFailed(`${appliedAttr.cfg.isModifier ? 'Modifier' : 'Attribute'} ${appliedAttr.name} could not be applied. (${errorInName} --> [${constraintsLex}])`, err, builder);
        }

        // return
        return result;
    };

    // validate and collect
    for (let appliedAttr of appliedAttrs) {
        if (validator(appliedAttr)) {
            appliedAttr = sieve(appliedAttr, null, false, { type: (isTypeLevel ? typeDef.name : def.name) });
            if (appliedAttr.isCustom) { // custom attribute instance
                attrBucket.push(appliedAttr);
            } else { // inbuilt attribute or modifier
                if (appliedAttr.cfg.isModifier) { 
                    modifierBucket.push(appliedAttr);
                } else {
                    attrBucket.push(appliedAttr);
                }
            }
        }
    }
};
const modifierOrAttrRefl = (isModifier, def, typeDef) => {
    let defItemName = (isModifier ? 'modifiers' : 'attrs');
    let root_get = (name, memberName, isCheckInheritance, isTypeLevel) => {
        let result = null; 
        if (memberName && memberName === 'construct') { memberName = '_construct'; }
        if (memberName && memberName === 'dispose') { memberName = '_dispose'; }
        if (isTypeLevel) {
            if (!isCheckInheritance) {
                if (typeDef[defItemName] && typeDef[defItemName].type) { result = findItemByProp(typeDef[defItemName].type, 'name', name); }
            } else {
                // check from parent onwards, keep going up till find it or hierarchy ends
                let prv = typeDef.previous();
                while(true) { // eslint-disable-line no-constant-condition
                    if (prv === null) { break; }
                    if (prv[defItemName] && prv[defItemName].type) { result = findItemByProp(prv[defItemName].type, 'name', name); }
                    if (!result) {
                        prv = prv.previous();
                    } else {
                        break;
                    }
                }
            }
        } else {
            if (!isCheckInheritance) {
                if (def[defItemName] && def[defItemName].members[memberName]) { result = findItemByProp(def[defItemName].members[memberName], 'name', name); }
            } else {
                let prv = def.previous();
                while(true) { // eslint-disable-line no-constant-condition
                    if (prv === null) { break; }
                    if (prv[defItemName] && prv[defItemName].members[memberName]) { result = findItemByProp(prv[defItemName].members[memberName], 'name', name); }
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
    let root_has = (name, memberName, isCheckInheritance, isTypeLevel) => {
        return root_get(name, memberName, isCheckInheritance, isTypeLevel) !== null;
    }; 
    const members_probe = (name, memberName) => {
        let _probe = Object.freeze({
            anywhere: () => {
                return root_get(name, memberName, false, false) || root_get(name, memberName, true, false); 
            },
            current: () => {
                return root_get(name, memberName, false, false); 
            },
            inherited: () => {
                return root_get(name, memberName, true, false); 
            },
            only: Object.freeze({
                current: () => {
                    return root_get(name, memberName, false, false) && !root_get(name, memberName, true, false); 
                },
                inherited: () => {
                    return !root_get(name, memberName, false, false) && root_get(name, memberName, true, false); 
                }
            })
        });
        return _probe;      
    };    
    const type_probe = (name) => {
        let _probe = Object.freeze({
            anywhere: () => {
                return root_get(name, null, false, true) || root_get(name, null, true, true); 
            },
            current: () => {
                return root_get(name, null, false, true); 
            },
            inherited: () => {
                return root_get(name, null, true, true); 
            },
            only: Object.freeze({
                current: () => {
                    return root_get(name, null, false, true) && !root_get(name, null, true, true); 
                },
                inherited: () => {
                    return !root_get(name, null, false, true) && root_get(name, null, true, true); 
                }
            })
        });
        return _probe;
    };
    const members_all = (memberName) => {
        let _all = Object.freeze({
            current: () => {
                return def[defItemName].members[memberName].slice();
            },
            inherited: () => {
                let all_inherited_attrs = [],
                    prv_attrs = null;
                // check from parent onwards, keep going up till hierarchy ends
                let prv = def.previous();
                while(true) { // eslint-disable-line no-constant-condition
                    if (prv === null) { break; }
                    if (prv[defItemName] && prv[defItemName].members) { prv_attrs = findItemByProp(prv[defItemName].members, 'name', memberName); }
                    if (prv_attrs) { all_inherited_attrs.push(...prv_attrs); }
                    prv = prv.previous(); // go one level back now
                }
                return all_inherited_attrs;
            },
            anywhere: () => {
                return [..._all.current(), ..._all.inherited()];
            }
        });
        return _all;
    };
    const type_all = () => {
        let _all = Object.freeze({
            current: () => {
                return typeDef[defItemName].type.slice();
            },
            inherited: () => {
                let all_inherited_attrs = [],
                    prv_attrs = null;
                // check from parent onwards, keep going up till hierarchy ends
                let prv = typeDef.previous();
                while(true) { // eslint-disable-line no-constant-condition
                    if (prv === null) { break; }
                    if (prv[defItemName] && prv[defItemName].type) { prv_attrs = prv[defItemName].type.slice(); }
                    if (prv_attrs) { all_inherited_attrs.push(...prv_attrs); }
                    prv = prv.previous(); // go one level back now
                }
                return all_inherited_attrs;
            },
            anywhere: () => {
                return [..._all.current(), ..._all.inherited()];
            }
        });
        return _all;
    };
    const root = {
        type: Object.freeze({
            get: (name, isCheckInheritance) => {
                return root_get(name, null, isCheckInheritance, true);
            },
            has: (name, isCheckInheritance) => {
                return root_has(name, null, isCheckInheritance, true);
            },
            all: type_all,
            probe: type_probe
        }),
        members: {
            get: (name, memberName, isCheckInheritance) => {
                return root_get(name, memberName, isCheckInheritance, false);
            },
            has: (name, memberName, isCheckInheritance) => {
                return root_has(name, memberName, isCheckInheritance, false);
            }, 
            all: members_all,
            probe: members_probe
        }
    };
    if (isModifier) {
        root.members.is = (modifierName, memberName) => {
            // it applied modifiers' relative logic to identify 
            // if specified member is of that type depending upon
            // modifier definitions on current and previous levels
            let _probe = members_probe(modifierName, memberName); // local
            switch(modifierName) {
                case 'static': 
                    return _probe.anywhere(); 
                case 'abstract':
                    return _probe.anywhere() && !(members_probe('virtual', memberName).anywhere() || members_probe('override', memberName).anywhere()); 
                case 'virtual':
                    return _probe.anywhere() && !members_probe('override', memberName).anywhere(); 
                case 'override':
                    return _probe.anywhere() && !members_probe('sealed', memberName).anywhere(); 
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
                    if (prv.members[memberName]) { result = prv.members[memberName]; }
                    if (!result) { 
                        prv = prv.previous();
                    } else {
                        break;
                    }   
                }         
            }
            return result;
        };
        root.members.isProperty = (memberName) => { return root.members.type(memberName) === 'prop'; };
        root.members.isFunction = (memberName) => { return root.members.type(memberName) === 'func'; };
        root.members.isEvent = (memberName) => { return root.members.type(memberName) === 'event'; };
    }
    root.members = Object.freeze(root.members);
    return Object.freeze(root);
};
const defineExtensions = (cfg) => {
    // object extensions
    let _oex = { // every object of every type will have this, that means all types are derived from this common object
        getType: function() {
            // get internal information { instance.{obj, def, attrs, modifiers}, type.{Type, def, attrs, modifiers}}
            let def = this.instance.def;
            
            // return
            return def.Type;
        }
    }; 
    let _omex = { // every object's meta will have this
        id: guid() // property
    }; 
    cfg.ex.instance = shallowCopy(cfg.ex.instance, _oex, false); // don't override, which means defaults overriding is allowed
    cfg.mex.instance = shallowCopy(cfg.mex.instance, _omex, false); // don't override, which means defaults overriding is allowed

    // type extensions
    let _tex = { // every type will have this, that means all types are derived from this common type
        getName: function() {
            // get internal information { type.{Type, def, attrs, modifiers}}
            let typeDef = this.type.def;
            
            // return
            return typeDef.name;
        }
    }; 
    let _tmex = { // every type's meta will have this
        id: guid() // property
    }; 
    cfg.ex.type = shallowCopy(cfg.ex.type, _tex, false); // don't override, which means defaults overriding is allowed
    cfg.mex.type = shallowCopy(cfg.mex.type, _tmex, false); // don't override, which means defaults overriding is allowed
};
const addTypeExtensions = (typeEx, Type, addTarget, typeDef, type_attrs, type_modifiers) => {
    let bindWith = {
        type: {
            Type: Type,
            def: typeDef,
            attrs: type_attrs,
            modifiers: type_modifiers
        }
    }
    for(let ex in typeEx) {
        if (typeEx.hasOwnProperty(ex)) {
            if (typeof typeEx[ex] === 'function') {
                Object.defineProperty(addTarget, ex, {
                    configurable: true, enumerable: false,
                    value: typeEx[ex].bind(bindWith)
                });
            } else {
                Object.defineProperty(addTarget, ex, {
                    configurable: true, enumerable: false,
                    value: typeEx[ex]
                });
            }
        }
    }
};
const addInstanceExtensions = (instanceEx, obj, addTarget, Type, def, typeDef, attrs, modifiers, type_attrs, type_modifiers) => {
    let bindWith = {
        instance: {
            obj: obj,
            def: def,
            attrs: attrs,
            modifiers: modifiers
        },
        type: {
            Type: Type,
            typeDef: typeDef,
            attrs: type_attrs,
            modifiers: type_modifiers
        }
    }
    for(let ex in instanceEx) {
        if (typeof instanceEx[ex] === 'function') {
            Object.defineProperty(addTarget, ex, {
                configurable: true, enumerable: false,
                value: instanceEx[ex].bind(bindWith)
            });
        } else {
            Object.defineProperty(addTarget, ex, {
                configurable: true, enumerable: false,
                value: instanceEx[ex]
            });
        }
    }
};
const buildTypeInstance = (cfg, Type, obj, _flag, _static, ...args) => {
    // define parameters and context
    let TypeMeta = Type[meta],
        typeDef = TypeMeta.def(),
        _flagName = '___flag___',
        params = {
            _flagName: _flagName
        };
    if (typeof _flag !== 'undefined' && _flag === _flagName) { // inheritance in play
        params.isNeedProtected = true;
        params.isTopLevelInstance = false;
        params.staticInterface = cfg.static ? _static : null;
        params.args = args;
    } else {
        params.isNeedProtected = false;
        params.isTopLevelInstance = true;
        params.staticInterface = cfg.static ? Type : null;
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

    // singleton specific case
    if (cfg.singleton && !typeDef.staticConstructionCycle && !isNewFromReflector && params.isTopLevelInstance && TypeMeta.singleInstance.value) { return TypeMeta.singleInstance.value; }

    // define vars
    let exposed_obj = {},
        objMeta = null,
        exposed_objMeta = null,
        mixin_being_applied = null,
        _constructName = '_construct',
        _disposeName = '_dispose',
        _props = {}, // plain property values storage inside this closure
        _overloads = {}, // each named (funcName_type_type_...) overload of any function will be added here
        _previousDef = null,
        def = { 
            name: cfg.params.typeName,
            type: cfg.types.type, // the type of the type itself: class, struct, etc.
            Type: Type,
            level: 'object',
            members: {}, // each named item here defines the type of member: func, prop, event, construct, etc.
            attrs: { 
                members: {} // each named item array in here will have: {name, cfg, isCustom, attr, args}
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
        _member_dispatcher = null,
        _sessionStorage = (cfg.storage ? _Port('sessionStorage') : null),
        _localStorage = (cfg.storage ? _Port('localStorage') : null);

    const self = Object.freeze({
        id: replaceAll(def.name, '.', '_'),
        name: def.name,
        assemblyName: _getAssemblyOf(def.name),
        Type: def.Type,
        members: () => {
            let members = {};
            for(let memberName in def.members) {
                members[memberName] = {
                    name: memberName,
                    type: def.members[memberName],
                    modifiers: [],
                    attrs: []
                };
                for(let ___modifier of def.modifiers.members[memberName]) {
                    members[memberName].modifiers.push(___modifier.name)
                }
                for(let ___attr of def.attrs.members[memberName]) {
                    members[memberName].attrs.push(___attr.name)
                }
                members[memberName].modifiers = Object.freeze(members[memberName].modifiers);
                members[memberName].attrs = Object.freeze(members[memberName].attrs);
                members[memberName] = Object.freeze(members[memberName]);
            }
            return Object.freeze(members);
        }
    });
    const applyCustomAttributes = (bindingHost, memberName, memberType, member) => {
        for(let appliedAttr of attrs.members.all(memberName).current()) {
            if (appliedAttr.isCustom) { // custom attribute instance
                if (memberType === 'prop') {
                    let newSet = appliedAttr.attr.decorateProperty(def.name, memberName, member); // set must return a object with get and set members
                    if (newSet.get && newSet.set) {
                        newSet.get = newSet.get.bind(bindingHost);
                        newSet.set = newSet.set.bind(bindingHost);
                        member = newSet; // update for next attribute application
                    } else {
                        throw _Exception.OperationFailed(`${appliedAttr.name} decoration result is unexpected. (${def.name}::${memberName})`, builder);
                    }
                } else { // func or event
                    let newFn = null;
                    if (memberType === 'func') { // func
                        newFn = appliedAttr.attr.decorateFunction(def.name, memberName, member);
                        if (isASync(member) !== isASync(newFn)) { throw _Exception.OperationFailed(`${appliedAttr.name} decoration result is unexpected. (${def.name}::${memberName})`, builder); }
                    } else { // event
                        newFn = appliedAttr.attr.decorateEvent(def.name, memberName, member);
                    }
                    if (newFn) {
                        member = newFn.bind(bindingHost); // update for next attribute application
                    } else {
                        throw _Exception.OperationFailed(`${appliedAttr.name} decoration result is unexpected. (${def.name}::${memberName})`, builder);
                    }
                }

                // now since attribute is applied, this attribute instance is of no use,
                appliedAttr.attr = null;
            }
        }
        return member;           
    };
    const applyAspects = (memberName, member, cannedAspects) => {
        let weavedFn = null,
            funcAspects = [];

        // get aspects that are applicable for this function (NOTE: Optimization will be needed here, eventually)
        funcAspects = _get_Aspects(def.name, memberName, cannedAspects);
        def.aspects.members[memberName] = funcAspects; // store for reference by reflector
            
        // apply these aspects
        if (funcAspects.length > 0) {
            weavedFn = _attach_Aspects(member, def.name, memberName, funcAspects); 
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
        let desc = Object.getOwnPropertyDescriptor(obj, meta);
        desc.enumerable = false;
        Object.defineProperty(exposed_obj, meta, desc);
        exposed_objMeta = exposed_obj[meta];
        
        // copy other members, excluding static members
        for(let memberName in obj) { 
            isCopy = false;
            if (obj.hasOwnProperty(memberName) && memberName !== meta) { 
                isCopy = true;
                if (def.members[memberName]) { // member is defined here
                    if (modifiers.members.probe('private', memberName).current()) { isCopy = false; }   // private members don't get out
                    if (isCopy && (modifiers.members.probe('protected', memberName).current() && !params.isNeedProtected)) { isCopy = false; } // protected don't go out of top level instance
                } else { // some derived member (protected or public)
                    if (modifiers.members.probe('protected', memberName).anywhere() && !params.isNeedProtected) { isCopy = false; } // protected don't go out of top level instance
                }
                if (isCopy) { doCopy(memberName); }

                // special case of privateSet and protectedSet for properties
                if (isCopy && modifiers.members.isProperty(memberName)) { // if property that is copied
                    if (modifiers.members.probe('privateSet', memberName).current()) { // has private set
                        // take setter out
                        let propDesc = Object.getOwnPropertyDescriptor(exposed_obj, memberName);
                        propDesc.set = _noop;
                        Object.defineProperty(exposed_obj, memberName, propDesc);
                    } else if (modifiers.members.probe('protectedSet', memberName).current()) { // has protected set
                        if (!params.isNeedProtected) { // take setter out if protected is not needed
                            let propDesc = Object.getOwnPropertyDescriptor(exposed_obj, memberName);
                            propDesc.set = _noop;
                            Object.defineProperty(exposed_obj, memberName, propDesc);
                        }
                    }
                }

                // any abstract member should not left unimplemented now on top level instance
                // and if present at lower levels, those types must be marked as abstract
                if (isCopy && modifiers.members.is('abstract', memberName)) {
                    if (!params.isNeedProtected) {
                        throw _Exception.NotImplemented(`Abstract member is not implemented. (${def.name}::${memberName})`, builder);
                    } else {
                        if (!modifiers.type.probe('abstract').current()) {
                            throw _Exception.InvalidDefinition(`Abstract member can exists only in abstract type. (${def.name}::${memberName})`, builder);
                        }
                    }
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
                if (isCopy && !params.isNeedProtected && modifiers.members.isEvent(memberName)) { 
                    exposed_obj[memberName].strip(exposed_obj);
                }
            }
        }

        // extend with configured extensions only at top level, since (1) these will always be same at all levels
        // since these are of same object type, and since overwriting of this is allowed, add only at top level
        // and only missing ones
        if (params.isTopLevelInstance) {
            // add instance level extensions
            addInstanceExtensions(cfg.ex.instance, exposed_obj, exposed_obj, Type, def, typeDef, attrs, modifiers, TypeMeta.attrs, TypeMeta.modifiers); 

            // add instance meta level extensions
            addInstanceExtensions(cfg.mex.instance, exposed_obj, exposed_objMeta, Type, def, typeDef, attrs, modifiers, TypeMeta.attrs, TypeMeta.modifiers);
        }

        // expose def of this level for upper level to access if not on top level
        if (!params.isTopLevelInstance) {
            exposed_objMeta.def = def; // this will be deleted as soon as picked at top level
        }
    };
    const validateMember = (memberName, interface_being_validated) => {
        // member must exists check + member type must match
        if (Object.keys(exposed_obj).indexOf(memberName) === -1 || modifiers.members.type(memberName) !== interface_being_validated[meta].modifiers.members.type(memberName)) {
            if (memberName === 'dispose' && (typeof exposed_obj[_disposeName] === 'function' || 
                                             typeof exposed_objMeta.dispose === 'function')) {
                // its ok, continue below
            } else {
                throw _Exception.NotImplemented(`Interface member is not implemented. (${interface_being_validated[meta].name + ':' + memberName})`, builder); 
            }
        }

        // Note: type and args checking is intentionally not done, considering the flexible type nature of JavaScript

        // pick interface being validated at this time
        _attr('interface', interface_being_validated[meta].name);

        // collect attributes and modifiers - validate applied attributes as per attribute configuration - throw when failed
        attributesAndModifiers(def, typeDef, memberName, false, cfg.customAttrs);
    };       
    const validateInterfaces = () => {
        if (def.interfaces) {
            for(let _interfaceType of def.interfaces) { 
                // an interface define members just like a type
                // with but its functions, event and props will be nim, nie and nip respectively
                for(let __memberName in _interfaceType) {
                    if (_interfaceType.hasOwnProperty(__memberName)) {
                        validateMember(__memberName, _interfaceType)
                    }
                }
            }

            // delete it, no longer needed (a reference is available at Type level)
            delete def.interfaces;
        }
    };
    const validatePreMemberDefinitionFeasibility = (memberName, memberType, memberDef) => { // eslint-disable-line no-unused-vars
        if (['func', 'prop', 'event'].indexOf(memberType) !== -1 && memberName.startsWith('_')) { new _Exception('InvalidName', `Name is not valid. (${def.name}::${memberName})`); } // this is for some future usage, where internal names can be added starting with '_'
        switch(memberType) {
            case 'func':
                if (!cfg.func) { throw _Exception.InvalidOperation(`Function cannot be defined on this type. (${def.name})`, builder); }
                break;
            case 'prop':
                if (!cfg.prop) { throw _Exception.InvalidOperation(`Property cannot be defined on this type. (${def.name})`, builder); }
                break;
            case 'event':
                if (!cfg.event) { throw _Exception.InvalidOperation(`Event cannot be defined on this type. (${def.name})`, builder); }
                break;
            case 'construct':
                if (!cfg.construct) { throw _Exception.InvalidOperation(`Constructor cannot be defined on this type. (${def.name})`, builder); }
                memberType = 'func'; 
                break;
            case 'dispose':
                if (!cfg.dispose) { throw _Exception.InvalidOperation(`Dispose cannot be defined on this type. (${def.name})`, builder); }
                memberType = 'func'; 
                break;
        }
        return memberType;
    };
    const validateMemberDefinitionFeasibility = (memberName, memberType, memberDef) => {
        let result = true;
        // conditional check using AND - means, all specified conditions must be true to include this
        let the_attr = attrs.members.probe('conditional', memberName).current();
        if (the_attr) {
            let conditions = splitAndTrim(the_attr.args[0] || []);
            for (let condition of conditions) {
                condition = condition.toLowerCase();
                if (!(condition === 'test' && options.env.isTesting)) { result = false; break; }
                if (!(condition === 'server' && options.env.isServer)) { result = false; break; }
                if (!(condition === 'client' && options.env.isClient)) { result = false; break; }
                if (!(condition === 'worker' && options.env.isWorker)) { result = false; break; }
                if (!(condition === 'main' && options.env.isMain)) { result = false; break; }
                if (!(condition === 'debug' && options.env.isDebug)) { result = false; break; }
                if (!(condition === 'prod' && options.env.isProd)) { result = false; break; }
                if (!(condition === 'cordova' && options.env.isCordova)) { result = false; break; }
                if (!(condition === 'nodewebkit' && options.env.isNodeWebkit)) { result = false; break; }
                if (!(options.symbols.indexOf(condition) !== -1)) { result = false; break; }
            }
            if (!result) { return result; } // don't go to define, yet leave meta as is, so at a later stage we know that this was conditional and yet not available, means condition failed
        }
        
        // abstract check
        if (cfg.inheritance && modifiers.members.probe('abstract', memberName).current() && memberDef.ni !== true) {
            throw _Exception.InvalidDefinition(`Abstract member must not be implemented. (${def.name}::${memberName})`, builder);
        }

        // for a static type, constructor arguments check and dispose check
        the_attr = modifiers.type.probe('static').current();
        if (the_attr && cfg.static) {
            if (TypeMeta.isStatic()) {
                if (cfg.construct && memberName === _constructName && memberDef.length !== 0) {
                    throw _Exception.InvalidDefinition(`Static constructors cannot have arguments. (${def.name}::construct)`, builder);
                }
                if (cfg.dispose && memberName === _disposeName) {
                    throw _Exception.InvalidDefinition(`Static types cannot have destructors. (${def.name}::dispose)`, builder);
                }        
            } else {
                if (cfg.construct && memberName === _constructName) {
                    throw _Exception.InvalidDefinition(`Non-static types cannot have static constructors. (${def.name}::construct)`, builder);
                }
                if (cfg.dispose && memberName === _disposeName) {
                    throw _Exception.InvalidDefinition(`Static destructors cannot be defined. (${def.name}::dispose)`, builder);
                }        
            }
        }

        // dispose arguments check always
        if (cfg.dispose && memberName === _disposeName && memberDef.length !== 0) {
            if (memberDef.length > 1 || (memberDef.length === 1 && !modifiers.members.probe('override', memberName).current())) { // in case of override (base will be passed as param
                throw _Exception.InvalidDefinition(`Destructor method cannot have arguments. (${def.name}::dispose)`, builder);
            }
        }
        
        // duplicate check, if not overriding
        if (Object.keys(obj).indexOf(memberName) !== -1 && 
            (!cfg.inheritance || (cfg.inheritance && !modifiers.members.probe('override', memberName).current()))) {
                throw _Exception.Duplicate(def.name + '::' + memberName, builder); 
        }

        // overriding member must be present and of the same type
        if (cfg.inheritance && modifiers.members.probe('override', memberName).current()) {
            if (Object.keys(obj).indexOf(memberName) === -1) {
                throw _Exception.InvalidDefinition(`Member not found to override. (${def.name}::${memberName})`, builder); 
            } else if (modifiers.members.type(memberName) !== memberType) {
                throw _Exception.InvalidDefinition(`Overriding member type is invalid. (${def.name}::${memberName})`, builder); 
            }
        }

        // static members cannot be arrow functions and properties cannot have custom getter/setter
        if (cfg.static && (modifiers.members.probe('static', memberName).current() || TypeMeta.isStatic())) {
            if (memberType === 'func') {
                if (isArrow(memberDef)) { 
                    throw _Exception.InvalidDefinition(`Static functions cannot be defined as an arrow function. (${def.name}::${memberName})`, builder); 
                }
            } else if (memberType === 'prop') {
                if (memberDef.get && typeof memberDef.get === 'function') {
                    if (isArrow(memberDef)) { 
                        throw _Exception.InvalidDefinition(`Static property getters cannot be defined as an arrow function. (${def.name}::${memberName})`, builder); 
                    }
                }
                if (memberDef.set && typeof memberDef.set === 'function') {
                    if (isArrow(memberDef)) { 
                        throw _Exception.InvalidDefinition(`Static property setters cannot be defined as an arrow function. (${def.name}::${memberName})`, builder); 
                    }
                }
            }
        }

        // session/state properties cannot have custom getter/setter and also relevant port must be configured
        if (cfg.storage && attrs.members.probe('session', memberName).current()) {
            if (memberDef.get && typeof memberDef.get === 'function') {
                throw _Exception.InvalidDefinition(`Session properties cannot be defined with a custom getter/setter. (${def.name}::${memberName})`, builder); 
            }
        }
        if (cfg.storage && attrs.members.probe('state', memberName).current()) {
            if (memberDef.get && typeof memberDef.get === 'function') {
                throw _Exception.InvalidDefinition(`State properties cannot be defined with a custom getter/setter. (${def.name}::${memberName})`, builder); 
            }
            if (!_localStorage) { throw _Exception.InvalidOperation('Port is not configured. (localStorage)', builder); }
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
        _isReadOnly = modifiers.members.probe('readonly', memberName).anywhere(),
        _isStatic = modifiers.members.probe('static', memberName).anywhere(),
        _isSession = attrs.members.probe('session', memberName).anywhere(),
        _isState = attrs.members.probe('state', memberName).anywhere(),
        _deprecate_attr = attrs.members.probe('deprecate', memberName).current(),
        inject_attr = attrs.members.probe('inject', memberName).current(),
        asset_attr = attrs.members.probe('asset', memberName).current(),
        resource_attr = attrs.members.probe('resource', memberName).current(),
        type_attr = attrs.members.probe('type', memberName).current(),
        _isDeprecate = (_deprecate_attr !== null),
        _deprecate_message = (_isDeprecate ? (_deprecate_attr.args[0] || `Event is marked as deprecate. (${def.name}::${memberName})`) : ''),
        propHost = _props, // default place to store property values inside closure
        bindingHost = obj,
        uniqueName = def.name + '_' + memberName,
        isStorageHost = false,
        _injections = null;     

        // NOTE: no check for isOverriding, because properties are always fully defined,
        // when being overridden 

        // define or redefine
        if (memberDef && (memberDef.get || memberDef.set)) { // normal property, cannot be static because static cannot have custom getter/setter
            if (!cfg.propGetterSetter) {
                throw _Exception.InvalidDefinition(`Getter/Setter are not allowed. (${def.name}::${memberName})`, builder);
            }
            if (memberDef.get && typeof memberDef.get === 'function') {
                _getter = memberDef.get;
            }
            if (memberDef.set && typeof memberDef.set === 'function') {
                _setter = memberDef.set;
            }
            if (cfg.static && _isStatic) {
                bindingHost = params.staticInterface; // binding to static interface, so with 'this' object internals are not accessible
            }
            _member.get = function() {
                if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                return _getter.apply(bindingHost);
            }.bind(bindingHost);
            _member.set = function(value) {
                if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                if (_isReadOnly && !bindingHost[meta].constructing) { throw _Exception.InvalidOperation(`Property is readonly. (${def.name}::${memberName})`, builder); } // readonly props can be set only when object is being constructed 
                if (type_attr && type_attr.args[0] && !_is(value, type_attr.args[0])) { throw _Exception.InvalidArgument('value', builder); } // type attribute is defined
                return _setter.apply(bindingHost, [value]);
            }.bind(bindingHost);
        } else { // direct value
            if (cfg.static && _isStatic) {
                propHost = params.staticInterface[meta].props; // property values are stored on static interface itself in  .[meta].props
                bindingHost = params.staticInterface; // binding to static interface, so with 'this' object internals are not accessible
                if (type_attr && type_attr.args[0] && !_is(memberDef, type_attr.args[0])) { throw _Exception.InvalidArgument('value', builder); } // type attribute is defined
                propHost[uniqueName] = memberDef;
            } else if (cfg.storage && (_isSession || _isState)) {
                isStorageHost = true;
                if (_isSession) { // session
                    propHost = _sessionStorage;
                    uniqueName = obj[meta].id + '_' + uniqueName; // because multiple instances of same object will have different id
                } else { // state
                    propHost = _localStorage;
                    // no change in unique-name, so all instances of same object share same state, this is because at every new instance id is changed, and since state is supposed to persist, to reach back to same state, name has to be same
                }
                addDisposable((_isSession ? 'session' : 'state'), uniqueName);
                if (!propHost.key(uniqueName)) { 
                    if (type_attr && type_attr.args[0] && !_is(memberDef, type_attr.args[0])) { throw _Exception.InvalidArgument('value', builder); } // type attribute is defined
                    propHost.setItem(uniqueName, JSON.stringify({value: memberDef})); 
                }
            } else { // normal value
                if (type_attr && type_attr.args[0] && !_is(memberDef, type_attr.args[0])) { throw _Exception.InvalidArgument('value', builder); } // type attribute is defined
                if (cfg.numOnlyProps && typeof memberDef !== 'number') { throw _Exception.InvalidArgument('value', builder); } 
                propHost[uniqueName] = memberDef;
            }
            _member.get = function() {
                if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                if (isStorageHost) { return JSON.parse(propHost.getItem(uniqueName)).value; }
                return propHost[uniqueName];             
            }.bind(bindingHost);
            _member.set = function(value) {
                if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                if (_isReadOnly && !bindingHost[meta].constructing) { throw _Exception.InvalidOperation(`Property is readonly. (${def.name}::${memberName})`, builder); } // readonly props can be set only when object is being constructed 
                if (type_attr && type_attr.args[0] && !_is(value, type_attr.args[0])) { throw _Exception.InvalidArgument('value', builder); } // type attribute is defined
                if (isStorageHost) {
                    propHost.setItem(uniqueName, JSON.stringify({value: value}));
                } else {
                    propHost[uniqueName] = value;
                }
            }.bind(bindingHost);
        }

        // set injected value now
        if (inject_attr && !_isStatic && !isStorageHost) {
            // resolve injections
            let _injectWhat = inject_attr.args[0],                                          // aliasName || qualifiedTypeName || Type itself
                _injectWith = (inject_attr.args.length > 0 ? inject_attr.args[1] : []),     // [..., ...] <- any parameters to pass to constructor of type(s) being injected
                _injectMany = (inject_attr.args.length > 1 ? inject_attr.args[2] : false);  // true | false <- if multi injection to be done

            let _Type = null;
            try {
                switch(_typeOf(_injectWhat)) {
                    case 'class':
                    case 'struct':
                        _Type = _injectWith;
                        break;
                    case 'string':
                        _Type = _getType(_injectWhat);
                        if (!_Type) {
                            _injections = _Container.resolve(_injectWhat, _injectWith, _injectMany);
                            if (!Array.isArray(_injections)) { _injections = [_injections]; }
                        } else {
                            if (['class', 'struct'].indexOf(_typeOf(_Type)) === -1) {
                                throw _Exception.InvalidArgument('inject', builder);
                            }
                        }
                        break;
                    default:
                        throw _Exception.InvalidArgument('inject', builder);
                }
                if (!_injections && _Type) {
                    _injections = [];
                    if (_injectWith.length > 0) {
                        _injections.push(new _Type(..._injectWith)); 
                    } else {
                        _injections.push(new _Type());
                    }
                }
            } catch (err) {
                throw new _Exception(err, builder);
            }
            _member.set(_injections); // set injected value now - this includes the case of custom setter
        }

        // disposable
        if (attrs.members.probe('dispose', memberName).anywhere() || inject_attr) { // if injected or marked for disposal
            addDisposable('prop', memberName);
        }

        // set resource or asset
        if ((resource_attr || asset_attr) && !isStorageHost) {
            let resOrAssetData = null;
            if (resource_attr) {
                if (resource_attr.args[0]) { // qualified name of resource is given on attr parameter
                    resOrAssetData = _getResource(resource_attr.args[0]); 
                }
            } else { // asset_attr
                if (asset_attr.args[0]) { // asset file name with relative path within asset folder of assembly
                    let astPath = asset_attr.args[0];
                    if (astPath.startsWith('../')) { astPath = astPath.substr(3); }
                    if (astPath.startsWith('./')) { astPath = astPath.substr(2); }
                    if (astPath.startsWith('/')) { astPath = astPath.substr(1); }
                    resOrAssetData = _getAssemblyOf(def.name) + '/' + astPath;
                }
            }
            if (resOrAssetData) {
                _member.set(resOrAssetData); // set value now - this includes the case of custom setter
            }
        } 


        // apply custom attributes
        if (cfg.customAttrs) {
            _member = applyCustomAttributes(bindingHost, memberName, memberType, _member);
        }

        // return
        return _member;
    };
    const handleOverload = (memberName, memberType, memberDef) => {
        if (memberType === 'func') {
            let overload_attr = _attr.get('overload'); // peek
            if (overload_attr) {
                let _isStatic = (cfg.static && modifiers.members.probe('static', memberName).current()),
                bindingHost = (_isStatic ? params.staticInterface : obj);
                setOverloadFunc(memberName, memberDef, overload_attr); // define overload at central place

                // 2nd overload onwards, don't go via normal definition route,
                if (bindingHost[memberName]) { 
                    // throw, if any other attribute is defined other than overload
                    if (_attr.count() > 1) { throw _Exception.InvalidDefinition(`Overloaded function cannot define additional modifiers or attributes. (${def.name}::${memberName})`, builder); }
                    return true; // handled, don't go normal definition route
                }
            }
        }
        return false;
    };
    const setOverloadFunc = (memberName, memberDef, overload_attr) => {
        let _isStatic = (cfg.static && modifiers.members.probe('static', memberName).current()),
            bindingHost = (_isStatic ? params.staticInterface : obj),
            func_overloads = (_isStatic ? bindingHost[meta].overloads : _overloads),
            type_def_items = splitAndTrim(overload_attr.args[0]), // type, type, type, type, ...
            func_def = memberName + '_' + type_def_items.join('_');
        func_overloads[func_def] = memberDef; // store member for calling later
    };
    const getOverloadFunc = (memberName, ...args) => {
        let _isStatic = (cfg.static && modifiers.members.probe('static', memberName).current()),
            bindingHost = (_isStatic ? params.staticInterface : obj),
            func_overloads = (_isStatic ? bindingHost[meta].overloads : _overloads),
            type_def_items = '',
            func_def = '';
        for(let arg of args) { type_def_items += '_' + typeof(arg); }
        if (type_def_items.startsWith('_')) { type_def_items = type_def_items.substr(1); }
        func_def = memberName + '_' + type_def_items;
        return func_overloads[func_def] || null;
    };
    const buildFunc = (memberName, memberType, memberDef) => {
        let _member = null,
            bindingHost = obj,
            _isOverriding = (cfg.inheritance && modifiers.members.probe('override', memberName).current()),
            _isStatic = (cfg.static && modifiers.members.probe('static', memberName).current()),
            _isASync = (modifiers.members.probe('async', memberName).current()),
            _deprecate_attr = attrs.members.probe('deprecate', memberName).current(),
            inject_attr = attrs.members.probe('inject', memberName).current(),
            on_attr = attrs.members.probe('on', memberName).current(),              // always look for current on, inherited case would already be baked in
            timer_attr = attrs.members.probe('timer', memberName).current(),          // always look for current timer
            args_attr = attrs.members.probe('args', memberName).current(),
            aspects_attr = attrs.members.probe('aspects', memberName).current(),
            fetch_attr = attrs.members.probe('fetch', memberName).current(),
            overload_attr = attrs.members.probe('overload', memberName).current(),
            _isDeprecate = (_deprecate_attr !== null),
            _deprecate_message = (_isDeprecate ? (_deprecate_attr.args[0] || `Function is marked as deprecate. (${def.name}::${memberName})`) : ''),
            base = null,
            _fetchMethod = '',
            _fetchResponse = '',
            _fetchUrl = '',
            _api = null,
            _injections = [];

        // override, if required
        if (_isOverriding) {
            base = obj[memberName].bind(bindingHost);
            // handle abstract definition (and no-definition) scenario
            if (base.ni === true || base === _noop) {
                base = null; // so it is not available
            }
        } else if (_isStatic) {
            // shared (static) copy bound to staticInterface
            // so with 'this' it will be able to access only static properties
            bindingHost = params.staticInterface; // redefine binding host
        }

        // resolve injections first
        if (inject_attr) {  
            let _injectWhat = inject_attr.args[0],                                          // aliasName || qualifiedTypeName || Type itself
                _injectWith = (inject_attr.args.length > 0 ? inject_attr.args[1] : []),     // [..., ...] <- any parameters to pass to constructor of type(s) being injected
                _injectMany = (inject_attr.args.length > 1 ? inject_attr.args[2] : false);  // true | false <- if multi injection to be done

            _injections = _Container.resolve(_injectWhat, _injectWith, _injectMany);
            if (!Array.isArray(_injections)) { _injections = [_injections]; }
        }

        // define
        _isASync = _isASync || isASync(memberDef); // if memberDef is an async function, mark it as async automatically
        if (_isASync) {
            // resolve fetch parameters once
            if (fetch_attr && fetch_attr.args.length > 0) {
                _fetchMethod = fetch_attr.args[0]; // get, post, put, delete, etc.
                _fetchResponse = fetch_attr.args[1]; // json, text, blob, buffer, form
                _fetchUrl = fetch_attr.args[2]; // url to reach
                _api = (reqData = {}) => {
                    // add method, rest should come by the call itself
                    reqData.method = _fetchMethod;
                    
                    // make api call
                    return apiCall(_fetchUrl, _fetchResponse, reqData); // this returns a promise
                };
            } else {
                _api = null;
            }

            _member = async function(...args) {
                return new Promise(function(resolve, reject) {
                    if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                    let fnArgs = [];
                    if (base) { fnArgs.push(base); }                                // base is always first, if overriding
                    if (_api) { fnArgs.push(_api); }                                // api is always next to base, if fetch is used
                    if (_injections.length > 0) { fnArgs.push(_injections); }       // injections comes after base or as first, if injected
                    if (args_attr && args_attr.args.length > 0) {
                        let argsObj = _Args(...args_attr.args)(...args); 
                        if (argsObj.error) { reject(argsObj.error, memberDef); }
                        fnArgs.push(argsObj);                                       // push a single args processor's result object
                    } else {
                        fnArgs = fnArgs.concat(args);                               // add args as is
                    }
                    // get correct overload memberDef
                    if (overload_attr) {
                        memberDef = getOverloadFunc(memberName, ...fnArgs); // this may return null also, in that case it will throw below
                    }
                    try {
                        let memberDefResult = memberDef.apply(bindingHost, fnArgs);
                        if (memberDefResult && typeof memberDefResult.then === 'function') { // send result when it comes
                            memberDefResult.then(resolve).catch((err) => { reject(err, memberDef); });
                        } else {
                            resolve(memberDefResult); // send result as is
                        }
                    } catch (err) {
                        reject(err, memberDef);
                    }
                }.bind(bindingHost));
            }.bind(bindingHost);
        } else {
            _member = function(...args) {
                if (_isDeprecate) { console.log(_deprecate_message); }          // eslint-disable-line no-console
                let fnArgs = [];
                if (base) { fnArgs.push(base); }                                // base is always first, if overriding
                if (_injections.length > 0) { fnArgs.push(_injections); }       // injections comes after base or as first, if injected
                if (args_attr && args_attr.args.length > 0) {
                    let argsObj = _Args(...args_attr.args)(...args); argsObj.throwOnError(builder);
                    fnArgs.push(argsObj);                                       // push a single args processor's result object
                } else {
                    fnArgs = fnArgs.concat(args);                               // add args as is
                }
                // get correct overload memberDef
                if (overload_attr) {
                    memberDef = getOverloadFunc(memberName, ...fnArgs); // this may return null also, in that case it will throw below
                }                   
                return memberDef.apply(bindingHost, fnArgs);
            }.bind(bindingHost);                  
        }

        // apply custom attributes
        if (cfg.customAttrs) {
            _member = applyCustomAttributes(bindingHost, memberName, memberType, _member);
        }

        // weave advices from aspects
        if (cfg.aop) {
            let staticAspects = [];
            if (aspects_attr && aspects_attr.args.length > 0) { 
                // validate, each being of type Aspect
                aspects_attr.args.forEach(item => {
                    if (!_is(item, 'Aspect')) {
                        throw _Exception.InvalidArgument(`Only Aspect types can be statically weaved on function. (${def.name}::${memberName})`, builder); 
                    }
                });
                staticAspects = aspects_attr.args; 
            }
            // staticAspects are actual type references - cannot be just type names
            _member = applyAspects(memberName, _member, staticAspects);
        }

        // hook it to handle posted event, if configured
        if (on_attr && on_attr.args.length > 0) {
            _on(on_attr.args[0], _member); // attach event handler
            addDisposable('handler', {name: on_attr.args[0], handler: _member});
        }

        // hook it to run on timer if configured
        if (timer_attr && timer_attr.args.length > 0) {
            let isInTimerCode = false;
            let intervalId = setInterval(() => {
                // run only, when object construction is completed
                if (!bindingHost[meta].constructing && !isInTimerCode) {
                    isInTimerCode = true;
                    obj[memberName](); // call as if called from outside
                    isInTimerCode = false;
                }
            }, (timer_attr.args[0] * 1000));         // timer_attr.args[0] is number of seconds (not milliseconds)
            addDisposable('timer', intervalId);
        }

        // return
        return _member;
    };
    const buildEvent = (memberName, memberType, memberDef) => {
        let _member = null,
            argsProcessorFn = null,
            base = null,
            fnArgs = null,
            _isOverriding = (cfg.inheritance && modifiers.members.probe('override', memberName).current()), 
            _deprecate_attr = attrs.members.probe('deprecate', memberName).current(),
            _post_attr = attrs.members.probe('post', memberName).current(), // always post as per what is defined here, in case of overriding
            _isDeprecate = (_deprecate_attr !== null),
            _deprecate_message = (_isDeprecate ? (_deprecate_attr.args[0] || `Event is marked as deprecate. (${def.name}::${memberName})`) : ''),
            bindingHost = obj;

        // create dispatcher, if not already created
        if (!_member_dispatcher) {
            _member_dispatcher = new Dispatcher(def.name);
            addDisposable('event', _member_dispatcher); // so it can be cleared on dispose
        }

        // override, if required
        if (_isOverriding) {
            // wrap for base call
            base = obj[memberName][meta].processor;
            if (base.ni === true) {
                base = null; // so it is not available
            }
        } 
   
        // define
        _member = function(...args) {
            if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
            if (base) {
                fnArgs = [base].concat(args); 
            } else {
                fnArgs = args; 
            }
            return memberDef.apply(bindingHost, fnArgs);
        }.bind(bindingHost);                  

       // apply custom attributes (before event interface is added)
        if (cfg.customAttrs) {
            _member = applyCustomAttributes(bindingHost, memberName, memberType, _member);
        }

        // attach event interface
        argsProcessorFn = _member; 
        _member = function(...args) {
            // preprocess args
            let processedArgs = args;
            if (typeof argsProcessorFn === 'function') { processedArgs = argsProcessorFn(...args); }

            // dispatch
            _member_dispatcher.dispatch(memberName, processedArgs);

            // post, if configured
            if (_post_attr && _post_attr.args.length > 0) { // post always happens for current() configuration, in case of overriding, any post defined on inherited event is lost
                _post(_post_attr.args[0], processedArgs);   // .args[0] is supposed to the channel name on which to post, so there is no conflict
            }
        }.bind(bindingHost);
        _member[meta] = Object.freeze({
            processor: argsProcessorFn
        });
        _member.add = (handler) => { _member_dispatcher.add(memberName, handler); };
        _member.remove = (handler) => { _member_dispatcher.remove(memberName, handler); };
        _member.strip = (_exposed_obj) => {
            // returns the stripped version of the event without event raising ability
            let strippedEvent = shallowCopy({}, _member, true, ['strip']);

            // delete strip feature now, it is no longer needed
            delete _member.strip;
            delete _exposed_obj.strip;
            
            // redefine event function as event object
            Object.defineProperty(exposed_obj, memberName, {
                configurable: true, enumerable: true,
                value: Object.freeze(strippedEvent)
            });
        }

        // return
        return _member;
    };
    const addMember = (memberName, memberType, memberDef) => {
        // validate pre-definition feasibility of member definition - throw when failed - else return updated or same memberType
        memberType = validatePreMemberDefinitionFeasibility(memberName, memberType, memberDef); 

        // overload is defined only once, rest all times, it is just configured for the overload state
        // any attributes or modifiers are ignored the second time - and settings with first definition are taken
        if (handleOverload(memberName, memberType, memberDef)) { return; } // skip defining this member

        // set/update member meta
        // NOTE: This also means, when a mixed member is being overwritten either
        // because of other mixin or by being defined here, these values will be
        // overwritten as per last added member
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
                _attr('mixin', mixin_being_applied[meta].name);
            }
        }

        // collect attributes and modifiers - validate applied attributes as per attribute configuration - throw when failed
        attributesAndModifiers(def, typeDef, memberName, false, cfg.customAttrs);

        // static construction cycle specific control
        let memberValue = null,
            _isStatic = ((cfg.static && modifiers.members.probe('static', memberName).current())),
            bindingHost = (_isStatic ? params.staticInterface : obj);
        if (_isStatic) {  // a static member
            if (!typeDef.staticConstructionCycle) { return; } // don't process in a non static construction cycle
        } else { // non-static member
            if (typeDef.staticConstructionCycle) { return; } // don't process in a static construction cycle
        }

        // validate feasibility of member definition - throw when failed
        if (!validateMemberDefinitionFeasibility(memberName, memberType, memberDef)) { return; } // skip defining this member

        // member type specific logic
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
                Object.defineProperty(bindingHost, memberName, { // events are always defined on objects, and static definition is not allowed
                    configurable: true, enumerable: true,
                    value: memberValue
                });
                break;
        }
    };
    const addDisposable = (disposableType, data) => {
        objMeta.disposables.push({type: disposableType, data: data});
    }
    const modifiers = modifierOrAttrRefl(true, def, typeDef);
    const attrs = modifierOrAttrRefl(false, def, typeDef);
    
    // construct base object from parent, if applicable
    if (cfg.inheritance) {
        if (params.isTopLevelInstance && !typeDef.staticConstructionCycle && !isNewFromReflector) {
            if (modifiers.type.probe('abstract').current()) { throw _Exception.InvalidOperation(`Cannot create instance of an abstract type. (${def.name})`, builder); }
        }

        // create parent instance, if required, else use passed object as base object
        let Parent = TypeMeta.inherits,
            ParentMeta = null;
        if (Parent) {
            ParentMeta = Parent[meta];
            if (ParentMeta.isSealed() || ParentMeta.isSingleton() || ParentMeta.isStatic()) {
                throw _Exception.InvalidDefinition(`Cannot inherit from a sealed, static or singleton type. (${ParentMeta.name})`, builder); 
            }
            if (ParentMeta.type !== TypeMeta.type) {
                throw _Exception.InvalidDefinition(`Cannot inherit from another type family. (${ParentMeta.type})`, builder); 
            }
            if (ParentMeta.context && ParentMeta.context.isUnloaded()) {
                throw _Exception.InvalidOperation(`Parent context is not active anymore. (${ParentMeta.name})`, builder); 
            }

            // construct base object (the inherited one)
            obj = new Parent(params._flagName, params.staticInterface, params.args); // obj reference is now parent of object
            objMeta = obj[meta];

            // pick previous level def
            _previousDef = objMeta.def;
            delete objMeta.def;
        } else {
            // check for own context
            if (TypeMeta.context && TypeMeta.context.isUnloaded()) {
                throw _Exception.InvalidOperation(`Type context is not active anymore. (${TypeMeta.name})`, builder); 
            }
        }
    }

    // set object meta
    if (typeof obj[meta] === 'undefined') {
        // these will always be same, since inheritance happen in same types, and these are defined at a type configuration level, so these will always be same and should behave just like the next set of definitions here
        obj[meta] = {};
        objMeta = obj[meta];
        if (cfg.dispose) {
            objMeta.disposables = []; // can have {type: 'session', data: 'unique name'} OR {type: 'state', data: 'unique name'} OR {type: 'prop', data: 'prop name'} OR {type: 'event', data: dispatcher object} OR {type: 'handler', data: {name: 'event name', handler: exact func that was attached}}
        }
    }
    if (cfg.mixins) {
        def.mixins = cfg.params.mixins; // mixin types that were applied to this type, will be deleted after apply
    }
    if (cfg.interfaces) {
        def.interfaces = cfg.params.interfaces; // interface types that were applied to this type, will be deleted after validation
    }
    objMeta.type = cfg.types.instance; // as defined for this instance by builder, this will always be same for all levels -- class 'instance' at all levels will be 'instance' only
    if (params.isTopLevelInstance) {
        objMeta.Type = Type; // top level Type (all inheritance for these types will come from TypeMeta.inherits)
        if (cfg.new) {
            objMeta.isInstanceOf = (name) => {
                if (name[meta]) { name = name[meta].name; } // could be the 'Type' itself
                if (!name) { throw _Exception.InvalidArgument('name', builder); }
                return (TypeMeta.name === name) || TypeMeta.isDerivedFrom(name); 
            };
        }
        if (cfg.mixins) {
            objMeta.isMixed = (name) => { return TypeMeta.isMixed(name); };
        }
        if (cfg.interfaces) {
            objMeta.isImplements = (name) => { return TypeMeta.isImplements(name); };
        }
        objMeta.modifiers = modifiers;
        objMeta.attrs = attrs;
        if (isNewFromReflector) { // expose internals as well for reflector
            objMeta.def = def;
            objMeta.typeDef = typeDef;
            objMeta.obj = obj;
        }
    }

    // define proxy for clean syntax inside factory
    proxy = new Proxy({}, {
        get: (_obj, name) => { 
            if (cfg.new) {
                if (name === '$self') { return self; }
                if (name === '$static') { return params.staticInterface; }
            }
            return obj[name]; 
        },
        set: (_obj, name, value) => {
            if (cfg.new && ['$self', '$static'].indexOf(name) !== -1) { throw _Exception.InvalidOperation(`Special members cannot be custom defined. (${name})`, builder); }
            if (isBuildingObj) {
                // get member type
                let memberType = '';
                if (name === 'construct') {
                    memberType = 'construct'; 
                    name = _constructName;
                } else if (name === 'dispose') {
                    memberType = 'dispose'; 
                    name = _disposeName;
                } else {
                    if (typeof value === 'function') {
                        if (value.event === true) {
                            if(value !== _nie) {
                                delete value.event;
                            }
                            memberType = 'event'; 
                        } else {
                            memberType = 'func'; 
                        }
                    } else {
                        memberType = 'prop';
                    }
                }
                
                // add or validate member
                addMember(name, memberType, value);
            } else {
                // a function or event is being redefined or noop is being redefined
                if (typeof value === 'function') { throw _Exception.InvalidOperation(`Redefinition of members is not allowed. (${name})`, builder); }

                // allow setting property values
                obj[name] = value;
            }
            return true;
        }
    });

    // building started
    isBuildingObj = true; 

    // apply mixins
    if (cfg.mixins && def.mixins && !typeDef.staticConstructionCycle) { 
        for(let mixin of def.mixins) {
            mixin_being_applied = mixin;
            mixin.apply(proxy); // run mixin's factory too having 'this' being proxy object
            mixin_being_applied = null;
        }

        // delete it, its no longer needed (a reference is available at Type level)
        delete def.mixins;
    }

    // construct using factory having 'this' being proxy object
    cfg.params.factory.apply(proxy);

    // clear any (by user's error left out) attributes, so that are not added by mistake elsewhere
    _attr.clear();

    // building ends
    isBuildingObj = false;    

    // move constructor and dispose out of main object
    if (params.isTopLevelInstance) { // so that till now, a normal override behavior can be applied to these functions as well
        if (cfg.construct && typeof obj[_constructName] === 'function') {
            objMeta.construct = obj[_constructName]; delete obj[_constructName];
        }
        if (cfg.dispose && typeof obj[_disposeName] === 'function') {
            // wrap dispose to clean all types of disposables
            let customDisposer = obj[_disposeName]; delete obj[_disposeName];
            objMeta.dispose = () => {
                // clear all disposables
                for(let item of objMeta.disposables) {
                    switch(item.type) {
                        case 'session': _sessionStorage.removeItem(item.data); break;           // data = sessionStorage key name
                        case 'state': _localStorage.removeItem(item.data); break;               // data = localStorage key name
                        case 'prop': obj[item.data] = null; break;                              // data = property name
                        case 'event': item.data.clear(); break;                                 // data = dispatcher object
                        case 'handler': _on(item.data.name, item.data.handler, true); break;    // data = {name: event name, handler: handler func}
                        case 'timer': clearInterval(item.data); break;                          // data = id returned by the setInterval() call
                    }
                }

                // call customer disposer
                if (typeof customDisposer === 'function') {
                    customDisposer();
                }

                // clear all key references related to this object
                objMeta.disposables.length = 0; 
                _props = null;
                _previousDef = null;
                def = null;
                proxy = null;
                _member_dispatcher = null;
                exposed_obj = null;
                obj = null;
            };
        }  
    }

    // move static constructor out of main interface
    if (cfg.static && TypeMeta.isStatic() && typeDef.staticConstructionCycle) {
        if (Type.construct && typeof Type[_constructName] === 'function') {
            TypeMeta.construct = Type[_constructName]; delete Type[_constructName];
        }
    }

    // prepare protected and public interfaces of object
    buildExposedObj();

    // validate interfaces of type
    if (cfg.interfaces && !typeDef.staticConstructionCycle && !isNewFromReflector) {
        validateInterfaces();
    }

    // call constructor
    if (cfg.construct && params.isTopLevelInstance && !typeDef.staticConstructionCycle && !isNewFromReflector && typeof exposed_objMeta.construct === 'function') {
        exposed_objMeta.constructing = true;
        exposed_objMeta.construct(...params.args);
        delete exposed_objMeta.constructing;
    }
    if (cfg.construct && typeDef.staticConstructionCycle && typeof TypeMeta.construct === 'function') {
        TypeMeta.constructing = true;
        TypeMeta.construct();
        delete TypeMeta.constructing;
    }

    // add/update meta on top level instance
    if (params.isTopLevelInstance && !typeDef.staticConstructionCycle && !isNewFromReflector) {
        if (cfg.singleton && attrs.type.probe('singleton').current()) {
            TypeMeta.singleInstance.value = exposed_obj;
        }
    }

    // seal object, so nothing can be added/deleted from outside
    // also, keep protected version intact for 
    if (params.isTopLevelInstance && !typeDef.staticConstructionCycle && !isNewFromReflector) {
        exposed_objMeta = Object.freeze(exposed_objMeta); // freeze meta information
        exposed_obj = Object.seal(exposed_obj);
    }

    // return
    return exposed_obj;
};
const builder_dispose = () => {
    // all dispose time actions that builder need to do
    
    // clear sessionStorage
    let externalHandler = _Port('sessionStorage');   
    if (externalHandler) {
        externalHandler.clear();
    } else {
        if (isServer) {
            if (global.sessionStorage) { delete global.sessionStorage; }
        } else {
            sessionStorage.clear();
        }
    }
};
const builder = (cfg) => {
    // process cfg
    cfg.new = cfg.new || false;
    cfg.mixins = cfg.mixins || false;
    cfg.interfaces = cfg.interfaces || false;
    cfg.inheritance = cfg.inheritance || false;
    cfg.singleton = cfg.singleton || false;
    cfg.static = cfg.static || false;
    cfg.const = cfg.const || false;
    cfg.func = cfg.func || false;
    cfg.construct = cfg.construct || false;
    cfg.dispose = cfg.dispose || false;
    cfg.prop = cfg.prop || false;
    cfg.propGetterSetter = cfg.propGetterSetter || false;
    cfg.numOnlyProps = cfg.numOnlyProps || false;
    cfg.event = cfg.event || false;
    cfg.storage = cfg.storage || false;
    cfg.aop = cfg.aop || false;
    cfg.customAttrs = cfg.customAttrs || false;
    cfg.types = cfg.types || {};
    cfg.types.instance = cfg.types.instance || 'unknown';
    cfg.types.type = cfg.types.type || 'unknown';
    cfg.params = cfg.params || {};
    cfg.params.typeName = cfg.params.typeName || '';
    cfg.params.inherits = cfg.params.inherits || null;
    cfg.params.mixinsAndInterfaces = cfg.params.mixinsAndInterfaces || null; 
    cfg.params.factory = cfg.params.factory || null;
    cfg.mex = cfg.mex || {};
    cfg.mex.instance = ((cfg.mex && cfg.mex.instance) ? cfg.mex.instance : {});
    cfg.mex.type = ((cfg.mex && cfg.mex.type) ? cfg.mex.type : {})
    cfg.ex = cfg.ex || {};
    cfg.ex.instance = ((cfg.ex && cfg.ex.instance) ? cfg.ex.instance : {});
    cfg.ex.type = ((cfg.ex && cfg.ex.type) ? cfg.ex.type : {});
    cfg.params.ns = '';
    cfg.params.mixins = [];
    cfg.params.interfaces = [];
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
    }
    if (cfg.new) {
        cfg.const = false;
    }

    // type name and namespace validations
    if (!cfg.params.typeName || cfg.params.typeName.indexOf('.') !== -1) { throw _Exception.InvalidDefinition(`Type name is invalid. (${cfg.params.typeName})`, builder); } // dots are not allowed in names
    // peer ns attribute on type and if found merge it with name
    let ns_attr = _attr.get('ns'),
        ns = ns_attr ? ns_attr.args[0] : '';
    if (ns) {
        switch(ns) {
            case '(auto)':  // this is a placeholder that gets replaced by assembly builder with dynamic namespace based on folder structure, so if is it left, it is wrong
                throw _Exception.InvalidDefinition(`Namespace '(auto)' should be used only when bundling the type in an assembly. (${ns})`, builder);
            case '(root)':  // this is mark to instruct builder that register type at root namespace
                break; // go on
            default: // anything else
                // namespace name must not contain any special characters and must not start or end with .
                if (ns.startsWith('.') || ns.endsWith('.') || /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(ns)) { throw  `Namespace name is invalid. (${ns})`; } // eslint-disable-line no-useless-escape
                cfg.params.typeName = ns + '.' + cfg.params.typeName; // add namespace to name here onwards
                cfg.params.ns = ns;
                break;
        }
    }

    // extract mixins and interfaces
    if (cfg.params.mixinsAndInterfaces) {
        for(let item of cfg.params.mixinsAndInterfaces) {
            if (item[meta]) {
                switch (item[meta].type) {
                    case 'mixin': cfg.params.mixins.push(item); break;
                    case 'interface': cfg.params.interfaces.push(item); break;
                }
            }
        }
    }
    delete cfg.params.mixinsAndInterfaces;

    // define extensions
    defineExtensions(cfg);

    // pick current context in which this type is being registered
    let currentContext = _AppDomain.context.current();

    // pick current assembly in which this type was bundled
    let currentAssembly = currentContext.currentAssemblyBeingLoaded() || '';

    // base type definition
    let _Object = null,
        _ObjectMeta = null;
    if (cfg.new) { // class, struct
        if (cfg.inheritance) { // class
            if (cfg.params.inherits) {
                if (_isStatic(cfg.params.inherits) || _isSingleton(cfg.params.inherits) || _isSealed(cfg.params.inherits)) {
                    throw _Exception.InvalidDefinition(`Cannot inherit from a sealed, static or singleton type. (${cfg.params.inherits[meta].name})`, builder); 
                }
            }
            _Object = function(_flag, _static, ...args) {
                return buildTypeInstance(cfg, _Object, {}, _flag, _static, ...args);
            };
        } else { // struct
            _Object = function(...args) {
                return buildTypeInstance(cfg, _Object, {}, null, null, ...args);
            };
        }
    } else { // mixin, interface, enum
        if(cfg.const) { // enum, interface
            _Object = function() {
                return buildTypeInstance(cfg, _Object, {});
            };            
        } else { // mixin
            _Object = function(...args) {
                if (new.target) { // called with new which is not allowed
                    throw _Exception.InvalidOperation(`Construction cannot be done for this type. (${cfg.params.typeName})`, _Object);
                } else {
                    cfg.params.factory.apply(this, ...args);
                }
            }
        }
    }

    // type def
    let typeDef = { 
        name: cfg.params.typeName,
        type: cfg.types.type, // the type of the type itself: class, struct, etc.
        Type: _Object,
        level: 'type',
        attrs: { 
            type: [], // will have: {name, cfg, isCustom, attr, args}
        },
        modifiers: {
            type: [], // will have: {name, cfg, attr, args}
        },
        previous: () => {
            return _Object[meta].inherits ? _Object[meta].inherits[meta].def() : null;
        }
    };
    const modifiers = modifierOrAttrRefl(true, null, typeDef);
    const attrs = modifierOrAttrRefl(false, null, typeDef);

    // set type meta
    _Object[meta] = {};
    _ObjectMeta = _Object[meta];
    _ObjectMeta.name = cfg.params.typeName;
    _ObjectMeta.type = cfg.types.type;
    _ObjectMeta.namespace = null;
    _ObjectMeta.assembly = () => { return currentContext.getAssembly(currentAssembly) || null; };
    _ObjectMeta.context = currentContext;
    if (cfg.inheritance) {
        _ObjectMeta.inherits = cfg.params.inherits || null;
        _ObjectMeta.isAbstract = () => { return modifiers.type.probe('abstract').current() ? true : false; };
        _ObjectMeta.isSealed = () => { return modifiers.type.probe('sealed').current() ? true : false; };
        _ObjectMeta.isDerivedFrom = (name) => { 
            if (name[meta]) { name = name[meta].name; }
            if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _ObjectMeta.isDerivedFrom); }
            let result = false,
                prv = cfg.params.inherits; // look from parent onwards
            if (!result) {
                while(true) { // eslint-disable-line no-constant-condition
                    if (prv === null) { break; }
                    if (prv[meta].name === name) { result = true; break; }
                    prv = prv[meta].inherits;
                }
            }
            return result;
        };

        // warn for type deprecate at the time of inheritance
        if (_ObjectMeta.inherits) {
            let the_attr = attrs.type.probe('deprecate').anywhere();
            if (the_attr) {
                let deprecateMessage = the_attr.args[0] || `Type is marked as deprecated. (${_ObjectMeta.name})`;
                console.log(deprecateMessage); // eslint-disable-line no-console
            }            
        }
    }
    if (cfg.static) {
        _ObjectMeta.isStatic = () => { return modifiers.type.probe('static').current() ? true : false; };
        _ObjectMeta.props = {}; // static property values host
        _ObjectMeta.overloads = {}; // static overload functions host
    }
    if (cfg.singleton) {
        _ObjectMeta.isSingleton = () => { return attrs.type.probe('singleton').current() ? true : false; };
        _ObjectMeta.singleInstance = { value: null };
    }
    if (cfg.mixins) {
        _ObjectMeta.mixins = cfg.params.mixins; // mixin types that were applied to this type
        _ObjectMeta.isMixed = (name) => {
            if (name[meta]) { name = name[meta].name; }
            if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _ObjectMeta.isMixed); }
            let result = false,
                prv = _Object; // look from this itself
            while(true) { // eslint-disable-line no-constant-condition
                if (prv === null) { break; }
                if (prv[meta].mixins) { result = (findItemByProp(prv[meta].mixins, 'name', name) !== -1); }
                if (result) { break; }
                prv = prv[meta].inherits;
            }
            return result;
        };
    }
    if (cfg.interfaces) {
        _ObjectMeta.interfaces = cfg.params.interfaces,     
        _ObjectMeta.isImplements = (name) => {
            if (name[meta]) { name = name[meta].name; }
            if (typeof name !== 'string') { throw _Exception.InvalidArgument('name', _ObjectMeta.isImplements); }
            let result = false,
                prv = _Object; // look from this itself
            while(true) { // eslint-disable-line no-constant-condition
                if (prv === null) { break; }
                if (prv[meta].interfaces) { result = (findItemByProp(prv[meta].interfaces, 'name', name) !== -1); }
                if (result) { break; }
                prv = prv[meta].inherits;
            }
            return result;
        };                
    }
    _ObjectMeta.isDeprecated = () => { 
        return attrs.type.probe('deprecate').current() ? true : false;
    };
    _ObjectMeta.def = () => { return typeDef; };
    _ObjectMeta.modifiers = modifiers;
    _ObjectMeta.attrs = attrs;

    // type level attributes pick here
    attributesAndModifiers(null, typeDef, null, true, cfg.customAttrs);

    // validations
    if (cfg.static && modifiers.type.probe('static').current()) {
        if (cfg.params.interfaces.length > 0) {
            throw _Exception.InvalidDefinition('Static types cannot implement interfaces.', builder);
        }
        if (cfg.params.mixins.length > 0) {
            throw _Exception.InvalidDefinition('Static types cannot implement mixins.', builder);
        }
    }    

    // static construction cycle
    if (cfg.static) {
        let factoryCode = (cfg.params.factory ? cfg.params.factory.toString() : '');
        if (_ObjectMeta.isStatic() || factoryCode.indexOf(`$$('static')`) !== -1 || factoryCode.indexOf(`$$("static")`) !== -1) {
            typeDef.staticConstructionCycle = true;
            let tempObj = new _Object();
            _dispose(tempObj); // so any auto-wiring of events etc is cleaned up along with anything else done in types
            delete typeDef.staticConstructionCycle;
        }
    }

    // extend type itself with type's extensions
    // it may overwrite inbuilt defaults
    addTypeExtensions(cfg.ex.type, _Object, _Object, typeDef, attrs, modifiers);

    // extend type meta  with type's meta extensions
    // it may overwrite inbuilt defaults
    addTypeExtensions(cfg.mex.type, _Object, _ObjectMeta, typeDef, attrs, modifiers);

    // get final return value
    let _finalObject = null,
        toFreeze = false;
    if ((cfg.static && _ObjectMeta.isStatic()) || cfg.const) {
        _finalObject = new _Object();
        if (cfg.const) { toFreeze = true; }
    } else { // return type
        toFreeze = true;
        _finalObject = _Object;
    }

    // register type with current context of current load context
    if (ns) { // if actual namespace or '(root)' is there, then go and register
        _ObjectMeta.namespace = _AppDomain.context.current().registerType(_finalObject);
    }

    // freeze object meta
    _Object[meta] = Object.freeze(_ObjectMeta);

    // freeze final object
    if (toFreeze) { Object.freeze(_finalObject); }

    // return 
    return _finalObject;
};
