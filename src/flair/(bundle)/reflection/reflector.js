/**
 * @name Reflector
 * @description Reflection of flair type.
 * @example
 *  Reflector(Type)
 * @params
 *  Type: object - flair type to reflect on
 */
let isNewFromReflector = false;
const underReflection = [];
const _Reflector = function (Type) {
    if (!Type || !(Type[meta] || flairTypes.indexOf(Type[meta].type) === -1)) { throw new _Exception.InvalidArgument('Type'); }

    // define
    let TypeMeta = null,
        objMeta = null,
        target = null,
        obj = null,
        objDef = null,
        typeDef = null,
        objMembers = null; // { memberName: memberReflector }
    const ModifierReflector = function(item) {
        this.getType = () => { return 'modifier'; }
        this.getName = () => { return item.name; }
        this.getArgs = () => { return item.args.slice(); }
        this.getConstraints = () => { return item.cfg.constraints; }
    };
    const AttrReflector = function(item) {
        this.getType = () => { return 'attribute'; }
        this.getName = () => { return item.name; }
        this.getArgs = () => { return item.args.slice(); }
        this.getConstraints = () => { return item.cfg.constraints; }
        this.isCustom = () => { return item.isCustom; }
    };        
    const CommonTypeReflector = function() {
        this.getTarget = () => { return target; };
        this.getTargetType = () => { return TypeMeta.type; }
        this.getName = () => { return TypeMeta.name || ''; };
        this.getType = () => { return TypeMeta.type; };
        this.getId = () => { return TypeMeta.id; };
        this.getNamespace = () => { return TypeMeta.namespace; };
        this.getAssembly = () => { return TypeMeta.assembly(); };
        this.getContext = () => { return TypeMeta.context; };
        this.isClass = () => { return TypeMeta.type === 'class'; };
        this.isEnum = () => { return TypeMeta.type === 'enum'; };
        this.isStruct = () => { return TypeMeta.type === 'struct'; };
        this.isMixin = () => { return TypeMeta.type === 'mixin'; };
        this.isInterface = () => { return TypeMeta.type === 'interface'; };
        this.isDeprecated = () => { return TypeMeta.isDeprecated(); };
        this.getModifiers = () => { 
            let list = [];
            for(let item of typeDef.modifiers.type) {
                list.push(ModifierReflector(item));
            }
            return list; 
        };
        this.getAttributes = () => { 
            let list = [];
            for(let item of typeDef.attrs.type) {
                list.push(AttrReflector(item));
            }
            return list; 
        };
        this.getAttribute = (name) => { 
            let attribute = findItemByProp(typeDef.attrs.type, 'name', name);
            if (attribute) { return AttrReflector(attribute); }
            return null;
        };
        this.getModifier = (name) => { 
            let modifier = findItemByProp(typeDef.modifiers.type, 'name', name); 
            if (modifier) { return ModifierReflector(modifier); }
            return null;
        };
    };
    const addMixinsRefl = function(refl) {
        refl.getMixins = () => {
            let items = [];
            if (TypeMeta.mixins) {
                for(let _mixin of TypeMeta.mixins) {
                    items.push(_Reflector(_mixin));
                }
            }
            return items;
        };
        refl.isMixed = (name) => { return TypeMeta.isMixed ? TypeMeta.isMixed(name) : false; };
    };
    const addIntfRefl = function(refl) {
        refl.getInterfaces = () => {
            let items = [];
            if (TypeMeta.interfaces) {
                for(let _interface of TypeMeta.interfaces) {
                    items.push(_Reflector(_interface));
                }
            }            
            return items;
        };
        refl.isImplements = (name) => { return TypeMeta.isImplements ? TypeMeta.isImplements(name) : false; }
    };
    const addInstanceRefl = function(refl) {
        refl.getInstanceType = () => { return objMeta.type; };
        refl.isInstanceOf = (name) => { return objMeta.isInstanceOf ? objMeta.isInstanceOf(name) : false; }
    };
    const findMemberDef = (memberName) => {
        let def = objMeta.def; // start from this top one
        while(true) { // eslint-disable-line no-constant-condition
            if (def === null) { break; }
            if (def.members[memberName]) { break; }
            def = def.previous();
        }
        return def;
    };
    const buildMembersList = () => {
        let def = null,
            memberRefl = null;
        objMembers = {};
        for (let memberName in objMeta.obj) { // this obj is internal version which has all private, protected and public members of this object
            def = findMemberDef(memberName);
            switch(def.members[memberName]) {
                case 'prop': memberRefl = new PropReflector(memberName, def); break;
                case 'func': memberRefl = new FuncReflector(memberName, def); break;
                case 'event': memberRefl = new EventReflector(memberName, def); break;
                case 'construct': memberRefl = new FuncReflector(memberName, def); break;
                case 'dispose': memberRefl = new FuncReflector(memberName, def); break;
            }
            objMembers[memberName] = memberRefl;
        }
    };
    const ensureMembers = () => {
        if (!objMembers) { buildMembersList(); } // lazy loading
    };
    const CommonMemberReflector = function(memberName, def) {
        this.getType = () => { return 'member'; }
        this.getMemberType = () => { return def.members[memberName]; }
        this.getName = () => { return memberName; }
        this.getModifiers = () => { 
            let list = [];
            for(let item of objDef.modifiers[memberName]) {
                list.push(ModifierReflector(item));
            }
            return list; 
        };
        this.getAttributes = () => { 
            let list = [];
            for(let item of objDef.attrs[memberName]) {
                list.push(AttrReflector(item));
            }
            return list; 
        };
        this.getAttribute = (name) => { 
            let attribute = findItemByProp(objDef.attrs[memberName], 'name', name); 
            if (attribute) { return AttrReflector(attribute); }
            return null;
        };
        this.getModifier = (name) => { 
            let modifier = findItemByProp(objDef.modifiers[memberName], 'name', name); 
            if (modifier) { return ModifierReflector(modifier); }
            return null;
        };
        this.isPrivate = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'private') !== null; };
        this.isProtected = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'protected') !== null; };
        this.isPublic = () => { return (!this.isPrivate() && !this.isProtected()); };
        this.isStatic = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'static') !== null; };
        this.isSealed = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'sealed') !== null; };
        this.isAbstract = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'abstract') !== null; };
        this.isVirtual = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'virtual') !== null; };
        this.isOverride = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'virtual') !== null; };
        this.isEnumerable = () => { return Object.getOwnPropertyDescriptor(obj, memberName).enumerable; };
        this.isDeprecated = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'deprecate') !== null; };
        this.isConditional = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'conditional') !== null; };
        this.isMixed = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'mixin') !== null; };
        this.isInterfaced = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'interface') !== null; };
        this.getMixin = () => {
            let mixin = null;
            let mixin_attr = findItemByProp(objDef.attrs[memberName], 'name', 'mixin');
            if (mixin_attr && TypeMeta.mixins) {
                for(let _mixin of TypeMeta.mixins) {
                    if (_mixin === mixin_attr.name) {
                        mixin = _Reflector(_mixin); break;
                    }
                }
            }
            return mixin;
        };
        this.getInterface = () => {
            let intf = null;
            let intf_attr = findItemByProp(objDef.attrs[memberName], 'name', 'interface');
            if (intf_attr && TypeMeta.interfaces) {
                for(let _intf of TypeMeta.interfaces) {
                    if (_intf === intf_attr.name) {
                        intf = _Reflector(_intf); break;
                    }
                }
            }
            return intf;
        };        
    };   
    const PropReflector = function(memberName, def) {
        let refl = new CommonMemberReflector(memberName, def);
        refl.isReadOnly = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'readonly') !== null; };
        refl.isSerializable = () => { 
            return ((findItemByProp(objDef.attrs[memberName], 'name', 'serialize') !== null) ||
                    (findItemByProp(objDef.attrs[memberName], 'name', 'noserialize') === null && 
                    findItemByProp(typeDef.attrs.type, 'name', 'serialize') !== null));
        };
        refl.getValueType = () => {
            let type_attr = findItemByProp(objDef.attrs[memberName], 'name', 'type');
            if (type_attr) { return type_attr.args[0]; }
            return; // return nothing, so it remains undefined
        };
        refl.isDisposable = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'dispose') !== null; };
        refl.isInjectable = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'inject') !== null; };
        refl.isResource = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'resource') !== null; };
        refl.isAsset = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'asset') !== null; };
        refl.isSession = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'session') !== null; };
        refl.isState = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'state') !== null; };
        return refl;
    };
    const FuncReflector = function(memberName, def) {
        let refl = new CommonMemberReflector(memberName, def);
        refl.isASync = () => { return findItemByProp(objDef.modifiers[memberName], 'name', 'async') !== null; };
        refl.isConstructor = () => { return memberName === '_construct'; };
        refl.isDestructor = () => { return memberName === '_dispose'; };
        refl.isSub = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'on') !== null; };
        refl.isTimered = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'timer') !== null; };
        refl.isInjectable = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'inject') !== null; };
        refl.getArgs = () => {
            let args_attr = findItemByProp(objDef.attrs[memberName], 'name', 'args');
            if (args_attr) { return args_attr.args.slice(); }
            return null;
        };
        refl.getAspects = () => {
            if (objDef.aspects && objDef.aspects[memberName].length > 0) {
                let list = [];
                for(let item of objDef.aspects[memberName]) {
                    list.push(_Reflector(item));
                }
                return list;                
            }
            return null;
        };
        refl.getAspect = (name) => {
            if (objDef.aspects && objDef.aspects[memberName].length > 0) {
                let item = findItemByProp(objDef.aspects[memberName], 'name', name);
                if (item) { return _Reflector(item); }
            }
            return null;
        };        
        return refl;
    }; 
    const EventReflector = function(memberName, def) {
        let refl = new CommonMemberReflector(memberName, def);
        delete refl.isStatic;
        refl.isPub = () => { return findItemByProp(objDef.attrs[memberName], 'name', 'post') !== null; };
        return refl;
    };        
    const addMembersRefl = function(refl) {
        refl.getMembers = (filter) => {
            // set filter
            filter = filter || {};
            filter.types = filter.types || []; // name of member types
            filter.modifiers = filter.modifiers || []; // name of modifiers
            filter.attrs = filter.attrs || []; // name of attributes
            filter.aspects = filter.aspects || []; // name of aspect types
            filter.inherited = (typeof filter.inherited !== 'undefined' ? filter.inherited : true); // should include inherited members - or only own members
            
            ensureMembers();
            let memberRefl = null,
                isInclude = true,
                list = [];
            for(let memberName in objMembers) {
                isInclude = true;
                if (objMembers.hasOwnProperty(memberName)) {
                    memberRefl = objMembers[memberName];
                    if (filter.types.length > 0) { // member type check
                        if (filter.types.indexOf(memberRefl.getMemberType()) === -1) { 
                            isInclude = false;
                        } 
                    }
                    if (isInclude && !filter.inherited && !objDef.members[memberName]) { // inherited check
                        isInclude = false;
                    }
                    if (isInclude && filter.modifiers.length > 0) { // modifiers check
                        for(let modifier of filter.modifiers) {
                            if (findIndexByProp(objDef.modifiers[memberName], 'name', modifier) === -1) {
                                isInclude = false; break;
                            }
                        }
                    }
                    if (isInclude && filter.attrs.length > 0) { // attrs check
                        for(let attr of filter.attrs) {
                            if (findIndexByProp(objDef.attrs[memberName], 'name', attr) === -1) {
                                isInclude = false; break;
                            }
                        }
                    }
                    if (isInclude && filter.aspects.length > 0 && memberRefl.getMemberType() === 'func') { // aspects check
                        for(let aspect of filter.aspects) {
                            if (findIndexByProp(objDef.aspects[memberName], 'name', aspect) === -1) {
                                isInclude = false; break;
                            }
                        }
                    }                        
                    if (isInclude) {
                        list.push(objMembers[memberName]);
                    }
                }
            }
            return list;
        };
        refl.getMember = (memberName) => {
            ensureMembers();
            return objMembers[memberName] || null;
        };
    };
    const ClassReflector = function() {
        let refl = new CommonTypeReflector();
        refl.getParent = () => { 
            if (TypeMeta.inherits !== null) { return _Reflector(TypeMeta.inherits); }
            return null;
        };
        refl.isDerivedFrom = (name) => { return (TypeMeta.isDerivedFrom ? TypeMeta.isDerivedFrom(name) : false); };
        refl.getFamily = () => {
            let items = [],
                prv = TypeMeta.inherits;
            if (TypeMeta.inherits !== null) { items.push(_Reflector(TypeMeta.inherits)); }
            while(true) { // eslint-disable-line no-constant-condition    
                if (prv === null) { break; }
                items.push(_Reflector(prv));
                prv = prv[meta].inherits;
            }
            return items;
        };  
        refl.isSealed = () => { return (TypeMeta.isSealed ? TypeMeta.isSealed() : false); };
        refl.isAbstract = () => { return (TypeMeta.isAbstract ? TypeMeta.isAbstract() : false); };
        addMixinsRefl(refl);
        addIntfRefl(refl);
        refl.isSerializable = () => { return findItemByProp(typeDef.attrs.type, 'name', 'serialize') !== null; };        
        refl.isStatic = () => { return (TypeMeta.isStatic ? TypeMeta.isStatic() : false); };
        refl.isSingleton = () => { return (TypeMeta.isSingleton ? TypeMeta.isSingleton() : false); };                       
        refl.isSingleInstanceCreated = () => { return TypeMeta.singleInstance ? (TypeMeta.singleInstance() !== null) : false; };
        addInstanceRefl(refl);
        addMembersRefl(refl);
        return refl;        
    };
    const StructReflector = function() {
        let refl = new CommonTypeReflector();
        addMixinsRefl(refl);
        addIntfRefl(refl);
        refl.isSerializable = () => { return findItemByProp(typeDef.attrs.type, 'name', 'serialize') !== null; };        
        addInstanceRefl(refl);
        addMembersRefl(refl);
        return refl;              
    };
    const MixinReflector = function() {
        let refl = new CommonTypeReflector();
        addMembersRefl(refl);
        return refl;
    };
    const InterfaceReflector = function() {
        let refl = new CommonTypeReflector();
        addMembersRefl(refl);
        return refl;
    };
    const EnumReflector = function() {
        let refl = new CommonTypeReflector();
        refl.getNames = () => { 
            let list = [];
            for(let name of _Enum.getNames(obj)) {
                list.push(PropReflector(name, objDef));
            }
            return list; 
        };
        refl.getName = (enumValue) => { 
            let name = _Enum.getName(obj, enumValue); 
            if (name) { return PropReflector(name, objDef); }
            return null;
        };
        refl.getValues = () => { return _Enum.getValues(obj); };
        refl.isDefined = (nameOrValue) => { return _Enum.isDefined(obj, nameOrValue);}
        return refl;
    };
 
    // get reflector
    let ref = null,
        tempClass = null,
        isNewCreated = false;
    isNewFromReflector = true;
    switch(Type[meta].type) {
        case 'class': 
            target = Type; obj = new Type(); isNewCreated = true;
            ref = new ClassReflector();
            break;
        case 'struct': 
            target = Type; obj = new Type(); isNewCreated = true;
            ref = new StructReflector();
            break;
        case 'enum': 
            target = Type[meta].Type; obj = Type; 
            ref = new EnumReflector();
            break;
        case 'mixin': 
            target = Type;
            tempClass = _Class('temp', [target], function() {}); obj = new tempClass(); isNewCreated = true;
            ref = new MixinReflector();
            break;
        case 'interface': 
            target = Type[meta].Type; obj = Type; 
            ref = new InterfaceReflector();
            break;
    }
    isNewFromReflector = false; if (isNewCreated) { underReflection.push(obj); }
    TypeMeta = target[meta]; objMeta = obj[meta];
    objDef = objMeta.def; typeDef = objMeta.typeDef;

    // return
    return ref;
};
_Reflector.dispose = () => {
    if (underReflection.length > 0) {
        for(let item of underReflection) {
            _dispose(item);
        }
    }
    underReflection.length = 0;
}

// attach to flair
a2f('Reflector', _Reflector, () => {
    _Reflector.dispose();
});