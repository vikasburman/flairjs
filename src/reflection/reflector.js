// Reflector
flair.Reflector = {};
flair.Reflector.get = (forTarget) => {
    // define
    const CommonTypeReflector = function(target) {
        this.getType = () => { return target._.type; };
        this.getName = () => { return target._.name || ''; };
        this.getNamespace = () => { 
            let _Namespace = target._.namespace;
            if (_Namespace) { return new NamespaceReflector(_Namespace); }
            return null; 
        };
        this.getAssembly = () => {
            let _Assembly = flair.Assembly.get(target._.type);
            if (_Assembly) { return new AssemblyReflector(_Assembly); }
            return null;
        }
        this.getTarget = () => { return target; };
        this.isInstance = () => { return target._.type === 'instance'; };
        this.isClass = () => { return target._.type === 'class'; };
        this.isEnum = () => { return target._.type === 'enum'; };
        this.isProc = () => { return target._.type === 'proc'; };
        this.isStructure = () => { return target._.type === 'structure'; };
        this.isStructureInstance = () => { return target._.type === 'sinstance'; };
        this.isNamespace = () => { return target._.type === 'namespace'; };
        this.isResource = () => { return target._.type === 'resource'; };
        this.isAssembly = () => { return target._.type === 'assembly'; };
        this.isMixin = () => { return target._.type === 'mixin'; };
        this.isInterface = () => { return target._.type === 'interface'; };
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
        refl.getRef = () => { return ref; };
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
                    let attrs = item.meta[name];
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
        refl.isInterfaceEnforced = () => { return refl.getInterfaces().length > 0; };
        refl.getInterfaces = () => {
            let items = [],
                interfaces = [];
            for (let item of target._.instanceOf) {
                if (item.meta[name]) {
                    interfaces = item.meta[name].interfaces;
                    for(let iface of interfaces) {
                        items.push(new InterfaceReflector(iface, target));
                    }
                }
            }
            return items;                    
        };        
        refl.isProp = () => { return type === 'prop'; }
        refl.isFunc = () => { return type === 'func'; }
        refl.isEvent = () => { return type === 'event'; }
        return refl;
    };
    const PropReflector = function(target, name, ref) {
        let refl = new CommonInstanceMemberReflector('prop', target, name, ref);
        refl.getValue = () => { return target[name]; };
        refl.setValue = (value) => { return target[name] = value; };
        refl.getRaw = () => { return ref; };
        refl.isReadOnly = () => { return target._._.hasAttrEx('readonly', name); };
        refl.isSetOnce = () => { return target._._.hasAttrEx('readonly', name) && target._._.hasAttrEx('once', name); };
        refl.isStatic = () => { return target._._.hasAttrEx('static', name); };
        refl.isSerializable = () => { return target._._.isSerializableMember(name); }
        return refl;
    };
    const FuncReflector = function(target, name, ref, raw) {
        let refl = new CommonInstanceMemberReflector('func', target, name, ref);
        refl.invoke = (...args) => { return target[name](...args); };
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
            },
            getMembers = (oneMember) => {
                let members = [],
                    attrs = [], // eslint-disable-line no-unused-vars
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
                                    lastMember = new EventReflector(target, name, instance.meta[name].argNames, instance.meta[name].ref);
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
            // eslint-disable-next-line no-constant-condition
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
        refl.getMembers = (...attrs) => { 
            let members = getMembers();
            if (attrs.length !== 0) {
                return members.all(...attrs);
            }
            return members;
        };
        refl.getMember = (name) => { return getMembers(name); };
        refl.isSingleton = () => { return refl.getClass().isSingleton(); };                       
        refl.isInstanceOf = (name) => { return target._.isInstanceOf(name); };
        refl.isMixed = (name) => { return target._.isMixed(name); };
        refl.isImplements = (name) => { return target._.isImplements(name); };
        return refl;              
    };
    const StructureInstanceReflector = function(target) {
        let refl = new CommonTypeReflector(target);
        refl.getStructure = () => { 
            if (target._.inherits !== null) {
                return new StructureReflector(target._.inherits);
            }
            return null;
        };
        refl.getMembers = () => { 
            let keys = Object.keys(target),
                _At = keys.indexOf('_');
            if (_At !== -1) {
                keys.splice(_At, 1);
            }
            return keys;
        };
        refl.getMember = (name) => { return target[name]; };
        refl.invoke = (...args) => { return target[name](...args); };
        refl.isInstanceOf = (name) => { return target._.inherits._.name === name; };
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
            // eslint-disable-next-line no-constant-condition    
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
    const ProcReflector = function(target) {
        let refl = new CommonTypeReflector(target);
        refl.isASync = () => { target.isASync(); };
        refl.invoke = (...args) => { return target._.invoke(...args); }
        return refl;
    };    
    const ResourceReflector = function(target) {
        let refl = new CommonTypeReflector(target);
        refl.getFile = () => { return target.file(); };
        refl.getResType = () => { return target.type(); };
        refl.getContent = () => { return target.get(); };
        return refl;
    };
    const StructureReflector = function(target) {
        let refl = new CommonTypeReflector(target);
        return refl;
    };            
    const NamespaceReflector = function(target) {
        let refl = new CommonTypeReflector(target);
        refl.getMembers = () => { 
            let types = target.getTypes(),
                members = [];
            if (types) {
                for(let type of types) {
                    switch(type._.type) {
                        case 'class': members.push(new ClassReflector(type)); break;
                        case 'enum': members.push(new EnumReflector(type)); break;
                        case 'structure': members.push(new StructureReflector(type)); break;
                        case 'mixin': members.push(new MixinReflector(type)); break;
                        case 'interface': members.push(new InterfaceReflector(type)); break;                    
                    }
                }
            }
            return members;
        };
        refl.getMember = (qualifiedName) => {
            let Type = target.getType(qualifiedName),
                member = null;
            if (Type) {
                switch(Type._.type) {
                    case 'class': member = new ClassReflector(Type); break;
                    case 'enum': member = new EnumReflector(Type); break;
                    case 'structure': member = new StructureReflector(Type); break;
                    case 'mixin': member = new MixinReflector(Type); break;
                    case 'interface': member = new InterfaceReflector(Type); break;                    
                }
            }
            return member;
        };
        refl.createInstance = (qualifiedName, ...args) => {
            return target.createInstance(qualifiedName, ...args);
        };
        return refl;
    };
    const AssemblyReflector = function(target) {
        let refl = new CommonTypeReflector(target);
        refl.getTypes = () => { 
            return target.types();
        };
        refl.getAssets = () => { 
            return target.assets();
        };
        refl.getADO = () => { return target._.ado; }
        refl.load = () => {
            return target.load();
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
        case 'sinstance': ref = new StructureInstanceReflector(forTarget); break;
        case 'class': ref = new ClassReflector(forTarget); break;
        case 'enum': ref = new EnumReflector(forTarget); break;
        case 'proc': ref = new ProcReflector(forTarget); break;
        case 'resource': ref = new ResourceReflector(forTarget); break;
        case 'structure': ref = new StructureReflector(forTarget); break;
        case 'namespace': ref = new NamespaceReflector(forTarget); break;
        case 'assembly': ref = new AssemblyReflector(forTarget); break;
        case 'mixin': ref = new MixinReflector(forTarget); break;
        case 'interface': ref = new InterfaceReflector(forTarget); break;
        default:
            throw `Unknown type ${forTarget._.type}.`;
    }

    // return
    return ref;
};