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
