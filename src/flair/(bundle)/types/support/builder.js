const attributesAndModifiers = (def, typeDef, memberName, isTypeLevel, isCustomAllowed) => {
    let appliedAttrs = _attr.collect(), // [{name, cfg, isCustom, attr, args}]
        attrBucket = null,
        modifierBucket = null,
        modifiers = modifierOrAttrRefl(true, def, typeDef),
        attrs = modifierOrAttrRefl(false, def, typeDef);
    if (isTypeLevel) {
        attrBucket = typeDef.attrs.type;
        modifierBucket = typeDef.modifiers.type;
    } else {
        attrBucket = def.attrs.members[memberName]; // pick bucket
        modifierBucket = def.modifiers.members[memberName]; // pick bucket
    }

    // throw if custom attributes are applied but not allowed
    if (!isCustomAllowed) {
        for(let item of appliedAttrs) {
            if (item.isCustom) {
                throw _Exception('CustomAttributesNotAllowed', `Custom attribute cannot be applied. (${item.name})`, attributesAndModifiers);
            }
        }
    }

    // validator
    const validator = (appliedAttr) => {
        let result = false,
            _supportedTypes = flairTypes,
            _supportedMemberTypes = ['prop', 'func', 'construct', 'dispose', 'event'],
            _supportedModifiers = ['static', 'abstract', 'sealed', 'virtual', 'override', 'private', 'protected', 'readonly', 'async'],
            _list = [], // { withWhat, matchType, original, name, value }
            _list2 = [], // to store all struct types, which needs to be processed at end, else replaceAll causes problem and 'struct' state is replaced on 'construct' too
            dump = [],
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
                            item.value = ((item.name === typeDef.name) || typeDef.Type._.isDerivedFrom(item.name)); break;
                        case 'inherited':
                            item.value = typeDef.Type._.isDerivedFrom(item.name); break;
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
        result = (new Function("try {return (" + constraintsLex + ");}catch(e){return false;}")());
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
            probe: members_probe,
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
                    return _probe.anywhere() && !(members_probe.anywhere('virtual', memberName) || members_probe.anywhere('override', memberName)); 
                case 'virtual':
                    return _probe.anywhere() && !members_probe.anywhere('override', memberName); 
                case 'override':
                    return _probe.anywhere() && !members_probe.anywhere('sealed', memberName); 
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
const buildTypeInstance = (cfg, Type, obj, _flag, _static, ...args) => {
    // define parameters and context
    let typeDef = Type._.def(),
        _flagName = '___flag___',
        params = {
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
        params.staticInterface = Type;
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
    if (cfg.singleton && !typeDef.staticConstructionCycle && params.isTopLevelInstance && Type._.singleInstance()) { return Type._.singleInstance(); }

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
        _member_dispatcher = null,
        _sessionStorage = (cfg.storage ? _Port('sessionStorage') : null),
        _localStorage = (cfg.storage ? _Port('localStorage') : null);

    // dump this def for builder to process at the end
    cfg.dump.push(def); // TODO: check how it is being used

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
                        throw new _Exception('Unexpected', `${appliedAttr.name} decoration result is unexpected. (${memberName})`);
                    }
                } else { // func or event
                    let newFn = null;
                    if (memberType === 'func') { // func
                        newFn = appliedAttr.attr.decorateFunction(def.name, memberName, member);
                    } else { // event
                        newFn = appliedAttr.attr.decorateEvent(def.name, memberName, member);
                    }
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

        // get aspects that are applicable for this function (NOTE: Optimization will be needed here, eventually)
        funcAspects = _get_Aspects(def.name, memberName);
        def.aspects.members[memberName] = funcAspects; // store for reference
            
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
        let desc = Object.getOwnPropertyDescriptor(obj, '_');
        desc.enumerable = false;
        Object.defineProperty(exposed_obj, '_', desc);
        
        // copy other members, excluding static members
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
                if (isCopy && !params.isNeedProtected && modifiers.members.isEvent(memberName)) { 
                    exposed_obj[memberName].strip(exposed_obj);
                }
            }
        }

        // extend with configured extensions only at top level, since (1) these will always be same at all levels
        // since these are of same object type, and since overwriting of this is allowed, add only at top level
        // and only missing ones
        if (params.isTopLevelInstance) {
            exposed_obj = shallowCopy(exposed_obj, cfg.ex.instance, false); // don;t overwrite, since overriding defaults are allowed
        }

        // expose def of this level for upper level to access if not on top level
        if (!params.isTopLevelInstance) {
            exposed_obj._.def = def; // this will be deleted as soon as picked at top level
        }
    };
    const validateMember = (memberName, interface_being_validated) => {
        // member must exists check + member type must match
        if (typeof exposed_obj[memberName] === 'undefined' || modifiers.members.type(memberName) !== interface_being_validated._.modifiers.members.type(memberName)) {
            if (memberName === 'dispose' && (typeof exposed_obj[_disposeName] === 'function' || 
                                             typeof exposed_obj._.dispose === 'function')) {
                // its ok, continue below
            } else {
                throw new _Exception('NotImplemented', `Interface member is not implemented. (${memberName})`); 
            }
        }

        // Note: type and args checking is intentionally not done, considering the flexible type nature of JavaScript

        // pick interface being validated at this time
        _attr('interface', interface_being_validated._.name);

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
            throw new _Exception('InvalidDefinition', `Abstract member must point to nip, nim or nie values. (${memberName})`);
        }

        // for a static type, constructor arguments check and dispose check
        the_attr = modifiers.type.probe('static').current();
        if (the_attr && cfg.static) {
            if (Type._.isStatic()) {
                if (cfg.construct && memberName === _constructName && memberDef.length !== 0) {
                    throw new _Exception('InvalidDefinition', `Static constructors cannot have arguments. (construct)`);
                }
                if (cfg.dispose && memberName === _disposeName) {
                    throw new _Exception('InvalidDefinition', `Static types cannot have destructors. (dispose)`);
                }        
            } else {
                if (cfg.construct && memberName === _constructName) {
                    throw new _Exception('InvalidDefinition', `Non-static types cannot have static constructors. (construct)`);
                }
                if (cfg.dispose && memberName === _disposeName) {
                    throw new _Exception('InvalidDefinition', `Static destructors cannot be defined. (dispose)`);
                }        
            }
        }

        // dispose arguments check always
        if (cfg.dispose && memberName === _disposeName && memberDef.length !== 0) {
            throw new _Exception('InvalidDefinition', `Destructor method cannot have arguments. (dispose)`);
        }
        
        // duplicate check, if not overriding 
        if (typeof obj[memberName] !== 'undefined' && 
            (!cfg.inheritance || (cfg.inheritance && !modifiers.members.probe('override', memberName).current()))) {
                throw new _Exception('InvalidOperation', `Member with this name is already defined. (${memberName})`); 
        }

        // overriding member must be present and of the same type
        if (cfg.inheritance && modifiers.members.probe('override', memberName).current()) {
            if (typeof obj[memberName] === 'undefined') {
                throw new _Exception('InvalidOperation', `Member not found to override. (${memberName})`); 
            } else if (modifiers.members.type(memberName) !== memberType) {
                throw new _Exception('InvalidOperation', `Overriding member type is invalid. (${memberName})`); 
            }
        }

        // static members cannot be arrow functions and properties cannot have custom getter/setter
        if (cfg.static && (modifiers.members.probe('static', memberName).current() || Type._.isStatic())) {
            if (memberType === 'func') {
                if (isArrow(memberDef)) { 
                    throw new _Exception('InvalidOperation', `Static functions cannot be defined as an arrow function. (${memberName})`); 
                }
            } else if (memberType === 'prop') {
                if (memberDef.get && typeof memberDef.get === 'function') {
                    if (isArrow(memberDef)) { 
                        throw new _Exception('InvalidOperation', `Static property getters cannot be defined as an arrow function. (${memberName})`); 
                    }
                }
                if (memberDef.set && typeof memberDef.set === 'function') {
                    if (isArrow(memberDef)) { 
                        throw new _Exception('InvalidOperation', `Static property setters cannot be defined as an arrow function. (${memberName})`); 
                    }
                }
            }
        }

        // session/state properties cannot have custom getter/setter and also relevant port must be configured
        if (cfg.storage && attrs.members.probe('session', memberName).current()) {
            if (memberDef.get && typeof memberDef.get === 'function') {
                throw new _Exception('InvalidOperation', `Session properties cannot be defined with a custom getter/setter. (${memberName})`); 
            }
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
        _isReadOnly = modifiers.members.probe('readonly', memberName).anywhere(),
        _isStatic = modifiers.members.probe('static', memberName).anywhere(),
        _isSession = attrs.members.probe('session', memberName).anywhere(),
        _isState = attrs.members.probe('state', memberName).anywhere(),
        _deprecate_attr = attrs.members.probe('deprecate', memberName).current(),
        inject_attr = attrs.members.probe('inject', memberName).current(),
        type_attr = attrs.members.probe('type', memberName).current(),
        _isDeprecate = (_deprecate_attr !== null),
        _deprecate_message = (_isDeprecate ? (_deprecate_attr.args[0] || `Event is marked as deprecate. (${memberName})`) : ''),
        propHost = _props, // default place to store property values inside closure
        bindingHost = obj,
        uniqueName = def.name + '_' + memberName,
        isStorageHost = false,
        _injections = [];     

        // NOTE: no check for isOverriding, because properties are always fully defined

        // define or redefine
        if (memberDef.get || memberDef.set) { // normal property, cannot be static because static cannot have custom getter/setter
            if (!cfg.propGetterSetter) {
                throw new _Exception('InvalidOperation', `Getter/Setter are not allowed. (${memberName})`);
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
                if (_isReadOnly && !bindingHost._.constructing) { throw new _Exception('InvalidOperation', `Property is readonly. (${memberName})`); } // readonly props can be set only when object is being constructed 
                if (type_attr && type_attr.args[0] && !_is(value, type_attr.args[0])) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (value)'); } // type attribute is defined
                return _setter.apply(bindingHost, [value]);
            }.bind(bindingHost);
        } else { // direct value
            if (cfg.static && _isStatic) {
                propHost = params.staticInterface._.props; // property values are stored on static interface itself in  ._.props
                bindingHost = params.staticInterface; // binding to static interface, so with 'this' object internals are not accessible
                if (type_attr && type_attr.args[0] && !_is(memberDef, type_attr.args[0])) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (value)'); } // type attribute is defined
                propHost[uniqueName] = memberDef;
            } else if (cfg.storage && (_isSession || _isState)) {
                propHost = (_isSession ? _sessionStorage : _localStorage);
                isStorageHost = true;
                uniqueName = obj._.id + '_' + uniqueName; // because multiple instances of same object will have different id
                addDisposable((_isSession ? 'session' : 'state'), uniqueName);
                if (!propHost.key(uniqueName)) { 
                    if (type_attr && type_attr.args[0] && !_is(memberDef, type_attr.args[0])) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (value)'); } // type attribute is defined
                    propHost.setItem(uniqueName, JSON.stringify({value: memberDef})); 
                }
            } else { // normal value
                if (type_attr && type_attr.args[0] && !_is(memberDef, type_attr.args[0])) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (value)'); } // type attribute is defined
                if (cfg.numOnlyProps && typeof memberDef !== 'number') { throw new _Exception('InvalidArgument', 'Value type is invalid.'); } 
                propHost[uniqueName] = memberDef;
            }
            _member.get = function() {
                if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                if (isStorageHost) { return JSON.parse(propHost.getItem(uniqueName)).value; }
                return propHost[uniqueName];             
            }.bind(bindingHost);
            _member.set = function(value) {
                if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                if (_isReadOnly && !bindingHost._.constructing) { throw new _Exception('InvalidOperation', `Property is readonly. (${memberName})`); } // readonly props can be set only when object is being constructed 
                if (type_attr && type_attr.args[0] && !_is(value, type_attr.args[0])) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (value)'); } // type attribute is defined
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
            let _injectWhat = inject_attr.args[0],                                          // aliasName || qualifiedTypeName || Type itself || array ot Types // TODO: Map this that container.resolve() can work on all these
                _injectWith = (inject_attr.args.length > 0 ? inject_attr.args[1] : []),     // [..., ...] <- any parameters to pass to constructor of type(s) being injected
                _injectMany = (inject_attr.args.length > 1 ? inject_attr.args[2] : false);  // true | false <- if multi injection to be done

            _injections = _Container.resolve(_injectWhat, _injectWith, _injectMany);
            if (!Array.isArray(_injections)) { _injections = [_injections]; }

            _member.set(_injections); // set injected value now - this includes the case of customer setter
        }

        // disposable
        if (attrs.members.probe('dispose', memberName).anywhere() || inject_attr) { // if injected or marked for disposal
            addDisposable('prop', memberName);
        }

        // apply custom attributes
        if (cfg.customAttrs) {
            _member = applyCustomAttributes(bindingHost, memberName, memberType, _member);
        }

        // return
        return _member;
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
            timer_attr = attrs.members.probe('timer', memberName).current(),          // always look for current auto
            args_attr = attrs.members.probe('args', memberName).current(),
            _isDeprecate = (_deprecate_attr !== null),
            _deprecate_message = (_isDeprecate ? (_deprecate_attr.args[0] || `Function is marked as deprecate. (${memberName})`) : ''),
            base = null,
            _injections = [];

        // override, if required
        if (_isOverriding) {
            base = obj[memberName].bind(bindingHost);
            // handle abstract definition scenario
            if (base.ni === true) {
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
        if (_isASync) {
            _member = function(...args) {
                return new Promise(function(resolve, reject) {
                    if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                    let fnArgs = [];
                    if (base) { fnArgs.push(base); }                                // base is always first, if overriding
                    if (_injections.length > 0) { fnArgs.push(_injections); }       // injections comes after base or as first, if injected
                    fnArgs.push(resolve);                                           // resolve, reject follows, in async mode
                    fnArgs.push(reject);
                    if (args_attr && args.attr.args.length > 0) {
                        let argsObj = _Args(...args.attr.args)(...args);
                        if (argsObj.isInvalid) { reject(argsObj.error); return; }
                        fnArgs.push(argsObj);                                       // push a single args processor's result object
                    } else {
                        fnArgs.concat(args);                                        // add args as is
                    }
                    return memberDef.apply(bindingHost, fnArgs);
                }.bind(bindingHost));
            }.bind(bindingHost);                 
        } else {
            _member = function(...args) {
                if (_isDeprecate) { console.log(_deprecate_message); } // eslint-disable-line no-console
                let fnArgs = [];
                if (base) { fnArgs.push(base); }                                // base is always first, if overriding
                if (_injections.length > 0) { fnArgs.push(_injections); }       // injections comes after base or as first, if injected
                if (args_attr && args.attr.args.length > 0) {
                    let argsObj = _Args(...args.attr.args)(...args);
                    if (argsObj.isInvalid) { throw argsObj.error; }
                    fnArgs.push(argsObj);                                       // push a single args processor's result object
                } else {
                    fnArgs.concat(args);                                        // add args as is
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
            _member = applyAspects(memberName, _member);
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
                if (!bindingHost._.constructing && !isInTimerCode) {
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
            _deprecate_message = (_isDeprecate ? (_deprecate_attr.args[0] || `Event is marked as deprecate. (${memberName})`) : ''),
            bindingHost = obj;

        // create dispatcher, if not already created
        if (!_member_dispatcher) {
            _member_dispatcher = new Dispatcher();
            addDisposable('event', _member_dispatcher); // so it can be cleared on dispose
        }

        // override, if required
        if (_isOverriding) {
            // wrap for base call
            base = obj[memberName]._.processor;
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
            _member_dispatcher.dispatch(name, processedArgs);

            // post, if configured
            if (_post_attr && _post_attr.args.length > 0) { // post always happens for current() configuration, in case of overriding, any post defined on inherited event is lost
                _post(_post_attr.args[0], processedArgs);   // .args[0] is supposed to the channel name on which to post, so there is no conflict
            }
        }.bind(bindingHost);
        _member._ = Object.freeze({
            processor: argsProcessorFn
        });
        _member.add = (handler) => { _member_dispatcher.add(name, handler); };
        _member.remove = (handler) => { _member_dispatcher.remove(name, handler); };
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
                _attr('mixin', mixin_being_applied._.name);
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
        obj._.disposables.push({type: disposableType, data: data});
    }
    const modifiers = modifierOrAttrRefl(true, def, typeDef);
    const attrs = modifierOrAttrRefl(false, def, typeDef);
    
    // construct base object from parent, if applicable
    if (cfg.inheritance) {
        if (params.isTopLevelInstance && !typeDef.staticConstructionCycle) {
            if (modifiers.type.probe('abstract').current()) { throw new _Exception('InvalidOperation', `Cannot create instance of an abstract type. (${def.name})`); }
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
            if (Parent._.context && Parent._.context.isUnloaded()) {
                throw new _Exception('InvalidOperation', `Parent context is not active anymore. (${Parent._.name})`); 
            }

            // construct base object (the inherited one)
            obj = new Parent(params._flagName, params.staticInterface, params.args); // obj reference is now parent of object

            // pick previous level def
            _previousDef = obj._.def;
            delete obj._.def;
        } else {
            // check for own context
            if (Type._.context && Type._.context.isUnloaded()) {
                throw new _Exception('InvalidOperation', `Type context is not active anymore. (${Type._.name})`); 
            }
        }
    }

     // set object meta
     if (typeof obj._ === 'undefined') {
        obj._ = shallowCopy({}, cfg.mex.instance, false); // these will always be same, since inheritance happen in same types, and these are defined at a type configuration level, so these will always be same and should behave just like the next set of definitions here
        if (cfg.dispose) {
            obj._.disposables = []; // can have {type: 'session', data: 'unique name'} OR {type: 'state', data: 'unique name'} OR {type: 'prop', data: 'prop name'} OR {type: 'event', data: dispatcher object} OR {type: 'handler', data: {name: 'event name', handler: exact func that was attached}}
        }
     }
     if (cfg.mixins) {
        def.mixins = cfg.params.mixins; // mixin types that were applied to this type, will be deleted after apply
    }
    if (cfg.interfaces) {
        def.interfaces = cfg.params.interfaces; // interface types that were applied to this type, will be deleted after validation
    }
     obj._.id = obj._.id || guid(); // inherited one or create here
     obj._.type = cfg.types.instance; // as defined for this instance by builder, this will always be same for all levels -- class 'instance' at all levels will be 'instance' only
    if (params.isTopLevelInstance) {
        obj._.Type = Type; // top level Type (all inheritance for these types will come from Type._.inherits)
        if (cfg.new) {
            obj._.isInstanceOf = (name) => {
                if (name._ && name._.name) { name = name._.name; } // could be the 'Type' itself
                if (!name) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
                return (obj._.Type._.name === name) || Type._.isDerivedFrom(name); 
            };
        }
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
        get: (_obj, name) => { 
            return obj[name]; 
        },
        set: (_obj, name, value) => {
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
                if (typeof value === 'function') { throw new _Exception('InvalidOperation', `Redefinition of members is not allowed. (${name})`); }

                // allow setting property values
                obj[name] = value;
            }
            return true;
        }
    });

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

    // move constructor and dispose out of main object
    if (params.isTopLevelInstance && !typeDef.staticConstructionCycle) { // so that till now, a normal override behavior can be applied to these functions as well
        if (cfg.construct && typeof obj[_constructName] === 'function') {
            obj._.construct = obj[_constructName]; delete obj[_constructName];
        }
        if (cfg.dispose && typeof obj[_disposeName] === 'function') {
            // wrap dispose to clean all types of disposables
            let customDisposer = obj[_disposeName]; delete obj[_disposeName];
            obj._.dispose = () => {
                // clear all disposables
                for(let item of obj._.disposables) {
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
                obj._.disposables.length = 0; 
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
    if (cfg.static && Type._.isStatic() && typeDef.staticConstructionCycle) {
        if (Type.construct && typeof Type[_constructName] === 'function') {
            Type._.construct = Type[_constructName]; delete Type[_constructName];
        }
    }

    // prepare protected and public interfaces of object
    buildExposedObj();

    // validate interfaces of type
    if (cfg.interfaces && !typeDef.staticConstructionCycle) {
        validateInterfaces();
    }

    // call constructor
    if (cfg.construct && params.isTopLevelInstance && !typeDef.staticConstructionCycle && typeof exposed_obj._.construct === 'function') {
        exposed_obj._.constructing = true;
        exposed_obj._.construct(...params.args);
        delete exposed_obj._.constructing;
    }
    if (cfg.construct && typeDef.staticConstructionCycle && typeof Type._.construct === 'function') {
        Type._.constructing = true;
        Type._.construct();
        delete Type._.constructing;
    }

    // add/update meta on top level instance
    if (params.isTopLevelInstance && !typeDef.staticConstructionCycle) {
        if (cfg.singleton && attrs.type.probe('singleton').current()) {
            Type._.singleInstance = () => { return exposed_obj; }; 
            Type._.singleInstance.clear = () => { 
                Type._.singleInstance = () => { return null; };
            };
        }
    }

    // seal object, so nothing can be added/deleted from outside
    // also, keep protected version intact for 
    if (params.isTopLevelInstance && !typeDef.staticConstructionCycle) {
        exposed_obj._ = Object.freeze(exposed_obj._); // freeze meta information
        exposed_obj = Object.seal(exposed_obj);
    }

    // building ends
    isBuildingObj = false;     

    // return
    return exposed_obj;
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
    if (!cfg.params.typeName || cfg.params.typeName.indexOf('.') !== -1) { throw  `Type name is invalid. (${cfg.params.typeName})`; } // dots are not allowed in names
    // peer ns attribute on type and if found merge it with name
    let ns_attr = _attr.get('ns'),
        ns = ns_attr ? ns_attr.args[0] : '';
    if (ns) {
        switch(ns) {
            case '(auto)':  // this is a placeholder that gets replaced by assembly builder with dynamic namespace based on folder structure, so if is it left, it is wrong
                throw  `Namespace '(auto)' should be used only when bundling the type in an assembly. (${ns})`;
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
            if (item._ && item._.type) {
                switch (item._.type) {
                    case 'mixin': cfg.params.mixins.push(item); break;
                    case 'interface': cfg.params.interfaces.push(item); break;
                }
            }
        }
    }
    delete cfg.params.mixinsAndInterfaces;

    // object extensions
    let _oex = { // every object of every type will have this, that means all types are derived from this common object
    }; 
    cfg.ex.instance = shallowCopy(cfg.ex.instance, _oex, false); // don't override, which means defaults overriding is allowed

    // collect complete hierarchy defs while the type is building
    cfg.dump = []; // TODO: Check what is happening with this, not implemented yet, idea is to collect all hierarchy and made it available at Type level for reflector

    // pick current context in which this type is being registered
    let currentContext = _AppDomain.context.current();

    // pick current assembly in which this type was bundled
    let currentAssembly = currentContext.currentAssemblyBeingLoaded() || '';

    // base type definition
    let _Object = null;
    if (cfg.new) { // class, struct
        _Object = function(_flag, _static, ...args) {
            return buildTypeInstance(cfg, _Object, {}, _flag, _static, ...args);
        };
    } else { // mixin, interface, enum
        if(cfg.const) { // enum, interface
            _Object = function() {
                return buildTypeInstance(cfg, _Object, {});
            };            
        } else { // mixin
            _Object = function() {
                if (new.target) { // called with new which is not allowed
                    throw _Exception('NewNotAllowed', `Cannot construct. (${cfg.params.typeName})`, _Object);
                } else {
                    cfg.params.factory.apply(this);
                }
            }
        }
    }

    // extend type itself
    _Object = shallowCopy(_Object, cfg.ex.type, false); // don't overwrite while adding type extensions, this means defaults override is allowed

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
    const modifiers = modifierOrAttrRefl(true, null, typeDef);
    const attrs = modifierOrAttrRefl(false, null, typeDef);

    // set type meta
    _Object._ = shallowCopy({}, cfg.mex.type, true);
    _Object._.name = cfg.params.typeName;
    _Object._.type = cfg.types.type;
    _Object._.id = guid();
    _Object._.namespace = null;
    _Object._.assembly = () => { return currentContext.getAssembly(currentAssembly) || null; };
    _Object._.context = currentContext;
    _Object._.inherits = null;
    if (cfg.inheritance) {
        _Object._.inherits = cfg.params.inherits || null;
        _Object._.isAbstract = () => { return modifiers.type.probe('abstract').current() ? true : false; };
        _Object._.isSealed = () => { return modifiers.type.probe('sealed').current() ? true : false; };
        _Object._.isDerivedFrom = (name) => { 
            if (name._ && name._.name) { name = name._.name; }
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
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
            let the_attr = attrs.type.probe('deprecate').anywhere();
            if (the_attr) {
                let deprecateMessage = the_attr.args[0] || `Type is marked as deprecated. (${_Object._.name})`;
                console.log(deprecateMessage); // eslint-disable-line no-console
            }            
        }
    }
    if (cfg.static) {
        _Object._.isStatic = () => { return modifiers.type.probe('static').current() ? true : false; };
        _Object._.props = {}; // static property values host
    }
    if (cfg.singleton) {
        _Object._.isSingleton = () => { return attrs.type.probe('singleton').current() ? true : false; };
        _Object._.singleInstance = () => { return null; };
        _Object._.singleInstance.clear = _noop;
    }
    if (cfg.mixins) {
        _Object._.mixins = cfg.params.mixins; // mixin types that were applied to this type
        _Object._.isMixed = (name) => {
            if (name._ && name._.name) { name = name._.name; }
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            let result = false,
                prv = _Object; // look from this itself
            while(true) { // eslint-disable-line no-constant-condition
                if (prv === null) { break; }
                if (prv._.mixins) { result = (findItemByProp(prv._.mixins, 'name', name) !== -1); }
                if (result) { break; }
                prv = prv._.inherits;
            }
            return result;
        };
    }
    if (cfg.interfaces) {
        _Object._.interfaces = cfg.params.interfaces,     
        _Object._.isImplements = (name) => {
            if (name._ && name._.name) { name = name._.name; }
            if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
            let result = false,
                prv = _Object; // look from this itself
            while(true) { // eslint-disable-line no-constant-condition
                if (prv === null) { break; }
                if (prv._.interfaces) { result = (findItemByProp(prv._.interfaces, 'name', name) !== -1); }
                if (result) { break; }
                prv = prv._.inherits;
            }
            return result;
        };                
    }
    _Object._.isDeprecated = () => { 
        return attrs.type.probe('deprecate').current() ? true : false;
    };
    _Object._.def = () => { return typeDef; };
    _Object._.modifiers = modifiers;
    _Object._.attrs = attrs;

    // type level attributes pick here
    attributesAndModifiers(null, typeDef, null, true, cfg.customAttrs);

    // validations
    if (cfg.static && modifiers.type.probe('static').current()) {
        if (cfg.params.interfaces.length > 0) {
            throw _Exception('InvalidOperation', 'Static types cannot implement interfaces.');
        }
        if (cfg.params.mixins.length > 0) {
            throw _Exception('InvalidOperation', 'Static types cannot implement mixins.');
        }
    }    

    // static construction cycle
    if (cfg.static) {
        typeDef.staticConstructionCycle = true;
        new _Object();
        delete typeDef.staticConstructionCycle;
    }

    // get final return value
    let _finalObject = null,
        toFreeze = false;
    if ((cfg.static && _Object._.isStatic()) || cfg.const) {
        _finalObject = new _Object();
        if (cfg.const) { toFreeze = true; }
    } else { // return type
        toFreeze = true;
        _finalObject = _Object;
    }

    // register type with current context of current load context
    if (ns) { // if actual namespace or '(root)' is there, then go and register
        _Object._.namespace = _AppDomain.context.current().registerType(_finalObject);
    }

    // freeze object meta
    _Object._ = Object.freeze(_Object._);

    // freeze final object
    if (toFreeze) { Object.freeze(_finalObject); }

    // return 
    return _finalObject;

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
