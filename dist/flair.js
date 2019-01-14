/**
 * flair.js
 * True Object Oriented JavaScript
 * Version 0.15.5
 * (c) 2017-2019 Vikas Burman
 * MIT
 */
(function() {
    // the definition
    const def = (opts = null) => {
        let isServer = (new Function("try {return this===global;}catch(e){return false;}"))(),
            getGlobal = new Function("try {return (this===global ? global : window);}catch(e){return window;}");
        if (typeof opts === 'string') { // only symbols can be given as comma delimited string
            opts = {
                symbols: opts.split(',').map(item => item.trim())
            };
        }
        let flair = {},
            noop = () => {},
            sym = (opts.symbols || []),
            noopAsync = (resolve, reject) => { resolve(); },
            options = Object.freeze({
                symbols: Object.freeze(sym),
                env: Object.freeze({
                    type: opts.env || (isServer ? 'server' : 'client'),
                    isServer: isServer,
                    isClient: !isServer,
                    isProd: (sym.indexOf('PROD') !== -1),
                    isDebug: (sym.indexOf('DEBUG') !== -1),
                    global: getGlobal(),
                    supressGlobals: (typeof opts.supressGlobals === 'undefined' ? false : opts.supressGlobals),
                    args: (isServer ? process.argv : new URLSearchParams(location.search))
                }),
                loaders: Object.freeze({
                    module: Object.freeze({ // (file) => {} that gives a promise to resolve with the module object, on success
                        server: opts.moduleLoaderServer || null,
                        client: opts.moduleLoaderClient || null  
                    }),
                    file: Object.freeze({ // (file) => {} that gives a promise to resolve with file content, on success
                        server: opts.fileLoaderServer || null,
                        client: opts.fileLoaderClient || null
                    }),
                    define: (type, fn) => {
                        // NOTE: only once these can be defined after loading
                        let loaderOverrides = flair.options.loaderOverrides;
                        switch(type) {
                            case 'sm': loaderOverrides.moduleLoaderServer = loaderOverrides.moduleLoaderServer || fn; break;
                            case 'cm': loaderOverrides.moduleLoaderClient = loaderOverrides.moduleLoaderClient || fn; break;
                            case 'sf': loaderOverrides.fileLoaderServer = loaderOverrides.fileLoaderServer || fn; break;
                            case 'cf': loaderOverrides.fileLoaderClient = loaderOverrides.fileLoaderClient || fn; break;
                        }
                    }
                }),
                loaderOverrides: {
                    moduleLoaderServer: null,
                    moduleLoaderClient: null,
                    fileLoaderServer: null,
                    fileLoaderClient: null
                }
            });
        
        // special symbols
        if (options.env.isProd && options.env.isDebug) { // when both are given
            throw `DEBUG and PROD symbols are mutually exclusive. Use only one.`;
        }

        flair._ = Object.freeze({
            name: 'FlairJS',
            version: '0.15.5',
            copyright: '(c) 2017-2019 Vikas Burman',
            license: 'MIT',
            lupdate: new Date('Mon, 14 Jan 2019 23:14:20 GMT')
        });
        flair.options = options;

        // Exception
        // Exception(code, msg, error)
        flair.Exception = function(code, msg, error) {
            let _ex = this;
            
            this.code = code || '';
            this.message = msg || '';
            this.error = error || null;
        
            // return
            return Object.freeze(_ex);
        };
        

        // Assembly
        let asmFiles = {},
            asmTypes = {};
        flair.Assembly = () => {};
        flair.Assembly.register = (...ados) => { 
            // each ADO is an Assembly Definition Object with following structure:
            // {
            //      "name": "", 
            //      "file": "",
            //      "desc": "",
            //      "version": "",
            //      "copyright": "",
            //      "license": "",
            //      "types": ["", "", ...]
            // }
        
            for(let asm of ados) {
                if (typeof asm !== 'object' || Array.isArray(asm.type)) { continue; }
        
                // load assembly
                if (asmFiles[asm.file]) {
                    throw `Assembly ${asm.file} already registered.`;
                } else {
                    asmFiles[asm.file] = {
                        ado: asm,
                        status: 'not-loaded' // by default file is not loaded as yet
                    };
                }
        
                // load types
                for(let type of asm.types) {
                    // qualified names across anywhere should be unique
                    if (asmTypes[type]) {
                        throw `Type ${type} already registered.`;
                    } else {
                        asmTypes[type] = asm.file; // means this type can be loaded from this assembly file
                    }
                }
            }
        };
        flair.Assembly.isRegistered = (file) => {
            return typeof asmFiles[file] !== 'undefined';
        }
        flair.Assembly.load = (file) => {
            if (flair.Assembly.isRegistered(file)) {
                return new Promise((resolve, reject) => {
                    if (asmFiles[file] === 'loaded') {
                        resolve();
                    } else {
                        if (isServer) {
                            try {
                                require(file);
                                asmFiles[file].status = 'loaded';
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        } else {
                            const script = document.createElement('script');
                            script.onload = () => {
                                asmFiles[file].status = 'loaded';
                                resolve();
                            };
                            script.onerror = (e) => {
                                reject(e);
                            };
                            script.async = true;
                            script.src = file;
                            document.body.appendChild(script);
                        }
                    }
                  });
            } else {
                throw `Assembly ${file} must be registered first.`;
            }
        };
        flair.Assembly.isLoaded = (file) => {
            return typeof asmFiles[file] !== 'undefined' && asmFiles[file].status === 'loaded';
        };
        flair.Assembly.get = (type) => {
            return asmTypes[type] || ''; // name of the file where this type is bundled, else ''
        };
        // Namespace
        // Namespace(Type)
        flair.Namespace = (Type) => {
            // any type name can be in this format:
            // ~name <-- means, no namespace is given but still register this with root namespace
            // name <-- means, no namespace is given but since it is not forced, do not register this with root namespace
            // namespace.name
            
            // only valid types are allowed
            if (['class', 'enum', 'interface', 'mixin', 'resource', 'structure'].indexOf(Type._.type) === -1) { throw `Type (${Type._.type}) cannot be placed in a namespace.`; }
        
            // only unattached types are allowed
            if (Type._.namespace) { throw `Type (${Type._.name}) is already contained in a namespace.`; }
        
            // remove force register symbol (~) from name and also fix name
            let isForced = false;
            if (Type._.name.startsWith('~')) {
                Type._.name = Type._.name.substr(1); // remove ~
                isForced = true;
            }
        
            // merge/add type in namespace tree
            let nextLevel = flair.Namespace.root,
                nm = Type._.name,
                nsName = '',
                ns = nm.substr(0, nm.lastIndexOf('.'));
            nm = nm.substr(nm.lastIndexOf('.') + 1);
            if (ns) {
                nsList = ns.split('.');
                for(nsItem of nsList) {
                    if (nsItem) {
                        // special name not allowed
                        if (nsItem === '_') { throw `Special name "_" is used as namespace in ${Type._.name}.`; }
                        nextLevel[nsItem] = nextLevel[nsItem] || {};
                        nsName = nsItem;
        
                        // check if this is not a type itself
                        if (nextLevel[nsItem]._ && nextLevel[nsItem]._.type !== 'namespace') { throw `${Type._.name} cannot be contained in another type (${nextLevel[nsItem]._.name})`; }
        
                        // pick it
                        nextLevel = nextLevel[nsItem];
                    }
                }
            } else {
                if (!isForced) {
                    return; // don't do anything
                }
            }
        
                // add type at the bottom, if not already exists
            if (nextLevel[nm]) { throw `Type ${nm} already contained at ${ns}.`; }
            nextLevel[nm] = Type;
        
            // add namespace
            Type._.namespace = nextLevel;
        
            // define namespace meta
            nextLevel._ = nextLevel._ || {};
            nextLevel._.name = nextLevel._.name || nsName;
            nextLevel._.type = nextLevel._.type || 'namespace';
            nextLevel._.types = nextLevel._.types || [];
            
            // add to Namespace
            nextLevel._.types.push(Type);
        
            // attach Namespace functions
            let getTypes = () => { 
                return nextLevel._.types.slice(); 
            }
            let getType = (qualifiedName) => {
                let _Type = null,
                    level = nextLevel;
                if (qualifiedName.indexOf('.') !== -1) { // if a qualified name is given
                    let items = qualifiedName.split('.');
                    for(item of items) {
                        if (item) {
                            // special name not allowed
                            if (item === '_') { throw `Special name "_" is used as name in ${qualifiedName}.`; }
            
                            // pick next level
                            level = level[item];
                            if (!level) { break; }
                        }
                    }
                    _Type = level;
                } else {
                    _Type = level[qualifiedName];
                }
                if (!_Type || !_Type._ || ['class', 'enum', 'interface', 'mixin', 'resource', 'structure'].indexOf(_Type._.type) === -1) { return null; }
                return _Type;
            };
            let createInstance = (qualifiedName, ...args) => {
                let _Type = nextLevel.getType(qualifiedName);
                if (_Type && _Type._.type != 'class') { throw `${name} is not a class.`; }
                if (_Type) { return new _Type(...args); }
                return null;
            };   
            nextLevel.getTypes = nextLevel.getTypes || getTypes;
            nextLevel.getType = nextLevel.getType || getType;
            nextLevel.createInstance = nextLevel.createInstance || createInstance;
        };
        flair.Namespace.root = {};
        flair.Namespace.getType = (qualifiedName) => { 
            if (flair.Namespace.root.getType) {
                return flair.Namespace.root.getType(qualifiedName);
            }
            return null;
        };
        flair.Namespace.getTypes = () => {
            if (flair.Namespace.root.getTypes) {
                return flair.Namespace.root.getTypes();
            }
            return [];
        };
        flair.Namespace.createInstance = (qualifiedName, ...args) => {
            if (flair.Namespace.root.createInstance) {
                return flair.Namespace.root.createInstance(qualifiedName, ...args);
            }
            return null;
        };
        

        // Class
        // Class(className, function() {})
        // Class(className, inherits, function() {})
        // Class(className, [mixins/interfaces], function() {})
        // Class(className, inherits, [mixins/interfaces], function() {})
        flair.Class = (arg1, arg2, arg3, arg4) => {
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
                    bucket = [],
                    meta = {},
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
                const isSpecialMember = (member) => {
                    return ['constructor', 'dispose', '_constructor', '_dispose', '_'].indexOf(member) !== -1;
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
                const isConditionalMemberOK = (member) => {
                    let isOK = true,
                        _meta = meta[member],
                        condition = '';
                    if (_meta) {
                        for(let item of _meta) {
                            if (item.name === 'conditional') {
                                isOK = false;
                                condition = (item.args && item.args.length > 0 ? item.args[0] : '');
                                switch(condition) {
                                    case 'server':
                                        isOK = (options.env.isServer === true); break;
                                    case 'client':
                                        isOK = (options.env.isServer === false); break;
                                    default:
                                        isOK = options.symbols.indexOf(condition) !== -1; break;
                                }
                                break;                       
                            }
                        }
                    }
                    return isOK;
                };
                const doCopy = (member) => {
                    Object.defineProperty(_exposed_this, member, Object.getOwnPropertyDescriptor(_this, member));
                };            
                const isArrowFunction = (fn) => {
                    return (!(fn).hasOwnProperty('prototype'));
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
                const getAttrArgs = (attrName, member) => {
                    let attrArgs = null;
                    for(let item of _this._.instanceOf) {
                        if (item.meta[member]) {
                            for(let attrItem of item.meta[member]) {
                                if (attrItem.name === attrName) {
                                    attrArgs = attrItem.args;
                                    break;
                                }
                            }
                            if (attrArgs) { break; }
                        }
                    }
                    return (attrArgs !== null ? attrArgs : []);
                };
                const applyAttr = (targetName) => {
                    let Attr = null,
                        targetType = meta[targetName].type,
                        attrArgs = null,
                        attrInstance = null,
                        decorator = null;
                    for(let info of meta[targetName]) {
                        Attr = info.Attr;
                        if (Attr) {
                            attrArgs = info.args || [];
                            attrInstance = new Attr(...attrArgs);
                            decorator = attrInstance.decorator();
                            if (typeof decorator === 'function') {
                                let descriptor = Object.getOwnPropertyDescriptor(_this, targetName);
                                decorator(_this, targetType, targetName, descriptor);
                                Object.defineProperty(_this, targetName, descriptor);
                            }
                        }
                    }
                };
                const hasAttr = (attrName, _meta) => {
                    let has = false;
                    if (_meta) {
                        has = (_meta.findIndex((item) => { return item.name === attrName; }) !== -1);
                    }
                    return has;
                };
                const hasAttrEx = (attrName, member) => {
                    return (_this._.instanceOf.findIndex((item) => {
                        if (item.meta[member]) { return hasAttr(attrName, item.meta[member]); }
                        return false;
                    }) !== -1);           
                };
                const isDefined = (member, ignoreLast) => {
                    let result = false,
                        last = _this._.instanceOf.length,
                        i = 1;
                    for(let instance of _this._.instanceOf) {
                        if (instance.meta[member]) {
                            if (i !== last) {
                                result = true; break;
                            }
                        }
                        i++;
                    }
                    return result;
                };            
                const isPatternMatched = (pattern, name) => {
                    let isMatched = (pattern === '*' ? true : false);
                    if (!isMatched) {
                        if (pattern.indexOf('*') !== -1) { // wild card based match (only *abc OR abc* patterns supported)
                            pattern = pattern.replace('*', '[\\w]');
                            pRegEx = new RegExp(pattern);
                            isMatched = pRegEx.test(name); 
                        } else { // full name match
                            isMatched = (pattern === name);
                        }
                    }
                    return isMatched;
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
                            isASync = false,
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
                    for(member in _this) {
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
        
                _this.func = (name, fn) => {
                    // constructor shorthand definition
                    if (typeof name === 'function') { fn = name; name = 'constructor'; }
        
                    // validate
                    if (name === '_') { throw `${className}.${name} is not allowed.`; }
                    if (!fn) { fn = noop; }
        
                    // special names
                    if (isSpecialMember(name)) {
                        name = '_' + name;
                    }
        
                    // add mixed attr
                    if (mixin_being_applied !== null) {
                        attr('mixed', mixin_being_applied);
                    }
        
                    // collect attributes
                    meta[name] = [].concat(bucket);
                    meta[name].type = 'func';
                    meta[name].aspects = [];
                    meta[name].interfaces = [];
                    bucket = [];
                    let attrs = meta[name];
        
                    // conditional check
                    if (!isConditionalMemberOK(name)) {
                        delete meta[name]; return;
                    }
        
                    // define
                    if (hasAttr('override', attrs)) {
                        // check
                        let desc = Object.getOwnPropertyDescriptor(_this, name);
                        if (!desc || typeof desc.value !== 'function') {
                            if (name === '_constructor') { name = 'constructor'; }
                            if (name === '_dispose') { name = 'dispose'; }
                            throw `${className}.${name} is not a function to override.`;
                        }
                        if (hasAttrEx('sealed', name) && !hasAttr('sealed', attrs)) {
                            if (name === '_constructor') { name = 'constructor'; }
                            if (name === '_dispose') { name = 'dispose'; }
                            throw `${className}.${name} cannot override a sealed function.`;
                        }
        
                        // redefine
                        let base = _this[name].bind(_this);
                        Object.defineProperty(_this, name, {
                            value: function(...args) {
                                // run fn with base
                                let fnArgs = [base].concat(args);
                                if (isArrowFunction(fn)) {
                                    return fn(...fnArgs);
                                } else { // normal func
                                    return fn.apply(_this, fnArgs);
                                }
                            }.bind(_this)
                        });
                    } else {
                        // duplicate check
                        if (isDefined(name, true)) { 
                            if (name === '_constructor') { name = 'constructor'; }
                            if (name === '_dispose') { name = 'dispose'; }
                            throw `${className}.${name} is already defined.`; 
                        }
        
                        // define
                        Object.defineProperty(_this, name, {
                            configurable: true,
                            enumerable: true,
                            writable: false,
                            value: function(...args) {
                                if (isArrowFunction(fn)) {
                                    return fn(...args);
                                } else { // normal func
                                    return fn.apply(_this, args);
                                }
                            }.bind(_this)
                        });
                    }
        
                    // apply attributes in order they are defined
                    applyAttr(name);   
        
                    // finally hold the references for reflector
                    meta[name].ref = _this[name];
                    meta[name].raw = fn;
                };
                _this.construct = (...args) => {
                    _this.func.apply(_this, ['constructor'].concat(args));
                };
                _this.destruct = (...args) => {
                    _this.func.apply(_this, ['dispose'].concat(args));
                };
                _this.prop = (name, valueOrGetter, setter) => {
                    // special names
                    if (isSpecialMember(name)) {  throw `${className}.${name} can only be defined as a function.`; }
        
                    // default value
                    if (typeof valueOrGetter === 'undefined' && typeof setter === 'undefined') { valueOrGetter = null; }
        
                    // add mixed attr
                    if (mixin_being_applied !== null) {
                        attr('mixed', mixin_being_applied);
                    }
        
                    // collect attributes
                    meta[name] = [].concat(bucket);
                    meta[name].type = 'prop';
                    meta[name].aspects = [];
                    meta[name].interfaces = [];
                    bucket = [];
                    let attrs = meta[name];
        
                    // conditional check
                    if (!isConditionalMemberOK(name)) {
                        delete meta[name]; return;
                    }
                
                    // define
                    if (hasAttr('override', attrs)) {
                        // when overriding a property, it can only be redefined completely
                        // check
                        let desc = Object.getOwnPropertyDescriptor(_this, name);
                        if (!desc || typeof desc.get !== 'function') {
                            throw `Not a property to override. (${className}.${name})`;
                        }
                        if (hasAttrEx('sealed', name) && !hasAttr('sealed', attrs)) {
                            throw `Cannot override a sealed property. (${className}.${name})`;
                        }
                        if (hasAttrEx('static', name) && !hasAttr('static', attrs)) { 
                            throw `Cannot override a static property. (${className}.${name})`;
                        }
                    } else {
                        // duplicate check
                        if (isDefined(name, true)) { throw `${className}.${name} is already defined.`; }
                    }
        
                    // define or redefine
                    if (typeof valueOrGetter !== 'function') {
                        let propHost = null,
                            uniqueName = '',
                            isStorageHost = false;
                        if (hasAttrEx('static', name)) { 
                            uniqueName = name;
                            if (hasAttrEx('session', name) || hasAttrEx('state', name)) {
                                throw `A static property cannot be stored in session/state. (${className}.${name})`;
                            }
                            propHost = staticInterface;
                            if (!propHost[uniqueName]) { 
                                propHost[uniqueName] = valueOrGetter; // shared (static) copy
                            }
                        } else if (hasAttrEx('session', name)) {
                            if (!sessionStorage) {
                                throw `Session store (sessionStorage) is not available. (${className}.${name})`;
                            }
                            uniqueName = className + '_' + name;
                            propHost = sessionStorage;
                            isStorageHost = true;
                            if (typeof propHost[uniqueName] === 'undefined') {
                                propHost[uniqueName] = JSON.stringify({value: valueOrGetter}); 
                            }
                        } else if (hasAttrEx('state', name)) {
                            if (!sessionStorage) {
                                throw `State store (localStorage) is not available. (${className}.${name})`;
                            }
                            uniqueName = className + '_' + name;
                            propHost = localStorage;
                            isStorageHost = true;
                            if (typeof propHost[uniqueName] === 'undefined') {
                                propHost[uniqueName] = JSON.stringify({value: valueOrGetter});
                            }
                        } else {
                            uniqueName = name;
                            propHost = props;
                            propHost[uniqueName] = valueOrGetter; // private copy
                        }
                        Object.defineProperty(_this, name, {
                            __proto__: null,
                            configurable: true,
                            enumerable: true,
                            get: () => { 
                                if (isStorageHost) { 
                                    return JSON.parse(propHost[uniqueName]).value;
                                } else {
                                    return propHost[uniqueName]; 
                                }
                            },
                            set: hasAttr('readonly', attrs) ? (value) => {
                                if (_this._.constructing || (hasAttr('once', attrs) && !propHost[uniqueName])) {
                                    if (isStorageHost) {
                                        propHost[uniqueName] = JSON.stringify({value: value});
                                    } else {
                                        propHost[uniqueName] = value;
                                    }
                                } else {
                                    throw `${name} is readonly.`;
                                }
                            } : (value) => {
                                if (isStorageHost) { 
                                    propHost[uniqueName] = JSON.stringify({value: value});
                                } else {
                                    propHost[uniqueName] = value;
                                }
                            }                            
                        });
                    } else {
                        if (hasAttr('static', attrs)) { throw `Static properties cannot be defined with a getter/setter. (${className}.${name})`; }
                        if (hasAttr('session', attrs) || hasAttr('state', attrs)) { throw `Properties defined with a getter/setter cannot be stored in session/state. (${className}.${name})`; }
                        Object.defineProperty(_this, name, {
                            __proto__: null,
                            configurable: true,
                            enumerable: true,
                            get: valueOrGetter,
                            set: hasAttr('readonly', attrs) ? (value) => { 
                                if (_this._.constructing || (hasAttr('once', attrs) && !valueOrGetter())) {
                                    if (typeof setter === 'function') { setter(value); }
                                } else {
                                    throw `${name} is readonly.`;
                                }
                            } : (value) => {
                                if (typeof setter === 'function') { setter(value); }
                            }
                        });
                    };       
        
                    // apply attributes in order they are defined
                    applyAttr(name);
        
                    // finally hold the reference for reflector
                    meta[name].ref = {
                        get: () => { return _this[name]; },
                        set: (value) => { _this[name] = value; }
                    };
                };
                _this.event = (name, argProcessor) => {
                    // special names
                    if (isSpecialMember(name)) {  throw `${className}.${name} can only be defined as a function.`; }
        
                    // duplicate check
                    if (isDefined(name, true)) { throw `${className}.${name} is already defined.`; }
        
                    // add meta
                    meta[name] = [];
                    meta[name].type = 'event';  
                    meta[name].aspects = [];
                    meta[name].interfaces = [];
                    
                    // discard attributes
                    if (bucket.length > 0) {
                        console.warn(`Attributes can only be applied to properties or functions. ${className}.${name} is an event.`);
                        bucket = []; 
                    }
        
                    // define event
                    let _event = function(...args) {
                        // preprocess args
                        let processedArgs = {};
                        if (typeof argProcessor === 'function') {
                            processedArgs = argProcessor(...args);
                        }
        
                        // define event arg
                        let e = {
                                name: name,
                                args: processedArgs,
                                stop: false
                            };
                        for(let handler of events) {
                            handler(e);
                            if (e.stop) { break; }
                        }
                    }.bind(_this);
                    _event.subscribe = (fn) => {
                        events.push(fn);
                    };
                    _event.subscribe.all = () => {
                        return events.slice();
                    };
                    _event.unsubscribe = (fn) => {
                        let index = events.indexOf(fn);
                        if (index !== -1) {
                            events.splice(index, 1);
                        }
                    };
                    _event.unsubscribe.all = () => {
                        events = [];
                    };
                    Object.defineProperty(_this, name, {
                        configurable: false,
                        enumerable: true,
                        value: _event,
                        writable: false
                    });
        
                    // finally hold the reference for reflector
                    meta[name].ref = _this[name];
                };
                _this.noop = noop;
                _this.noopAsync = noopAsync;
        
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
                    return (_this._.instanceOf.findIndex((item) => { return item.name === name; }) !== -1);
                };
                _this._.raw = (name) => {
                    if (meta[name] && meta[name].raw) { return meta[name].raw; }
                    return null;
                },
                _this._.isMixed = (name) => {
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
                _this._.isImplements = (name) => {
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
                    let result = (name === 'Object'),
                        prv = inherits;
                    if (!result) {
                        while(true) {
                            if (prv === null) { break; }
                            if (prv._.name === name) { result = true; break; }
                            prv = prv._.inherits;
                        }
                    }
                    return result;
                },
                isMixed: (name) => {
                    let result = false;
                    for(let mixin of mixins) {
                        if (mixin._.name === name) {
                            result = true; break;
                        }
                    }
                    return result;                    
                },
                isImplements: (name) => {
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
        
        // Mixin
        // Mixin(mixinName, function() {})
        flair.Mixin = (mixinName, factory) => {
            // add name
            factory._ = {
                name: mixinName,
                type: 'mixin',
                namespace: null        
            };
        
            // register type with namespace
            flair.Namespace(factory);
        
            // return
            return factory;
        };
        
        // Interface
        // Interface(interfaceName, function() {})
        flair.Interface = (interfaceName, factory) => {
            let meta = {},
                _this = {};
        
            // definition helpers
            const isSpecialMember = (member) => {
                return ['constructor', 'dispose', '_constructor', '_dispose', '_'].indexOf(member) !== -1;
            };     
            _this.func = (name) => {
                if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
                if (isSpecialMember(name)) { throw `${interfaceName}.${name} can only be defined for a class.`; }
                meta[name] = [];
                meta[name].type = 'func';
            };
            _this.prop = (name) => {
                if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
                if (isSpecialMember(name)) { throw `${interfaceName}.${name} can only be defined as a function for a class.`; }
                meta[name] = [];
                meta[name].type = 'prop';
            };
            _this.event = (name) => {
                if (typeof meta[name] !== 'undefined') { throw `${interfaceName}.${name} is already defined.`; }
                if (isSpecialMember(name)) { throw `${interfaceName}.${name} can only be defined as a function for a class.`; }
                meta[name] = [];
                meta[name].type = 'event';
            };
        
            // add name
            meta._ = {
                name: interfaceName,
                type: 'interface',
                namespace: null        
            };
        
            // register type with namespace
            flair.Namespace(meta);
        
            // run factory
            factory.apply(_this);
        
            // remove definition helpers
            delete _this.func;
            delete _this.prop;
            delete _this.event;
        
            // return
            return meta;
        };
        // Enum
        // Enum(enumName, {key: value})
        flair.Enum = (enumName, keyValuePairsOrArray) => {
            let _enum = keyValuePairsOrArray;
            if (Array.isArray(keyValuePairsOrArray)) {
                let i = 0;
                _enum = {};
                for(key of keyValuePairsOrArray) {
                    _enum[key] = i;
                    i++;
                }
            } 
            _enum._ = {
                name: enumName,
                type: 'enum',
                namespace: null,        
                keys: () => {
                    let items = [];
                    for(let i in keyValuePairs) {
                        if (keyValuePairs.hasOwnProperty(key) && key !== '_') {
                            items.push(key);
                        }
                    }
                    return items;
                },
                values: () => {
                    let items = [];
                    for(let key in keyValuePairs) {
                        if (keyValuePairs.hasOwnProperty(key) && key !== '_') {
                            items.push(keyValuePairs[key]);
                        }
                    }
                    return items;
                }
            };
        
            // register type with namespace
            flair.Namespace(_enum);
        
            // return
            return Object.freeze(_enum);
        };
        flair.Enum.getKeys = (enumObj) => {
            if (enumObj._ && enumObj._.type === 'enum') {
                return enumObj._.keys();
            }
            enumName = ((enumObj._ && enumObj._.name) ? enumObj._.name : 'unknown');
            throw `${enumName} is not an Enum.`;
        };
        flair.Enum.getValues = (enumObj) => {
            if (enumObj._ && enumObj._.type === 'enum') {
                return enumObj._.values();
            }
            enumName = ((enumObj._ && enumObj._.name) ? enumObj._.name : 'unknown');
            throw `${enumName} is not an Enum.`;
        };
        flair.Enum.isDefined = (enumObj, keyOrValue) => {
            if (enumObj._ && enumObj._.type === 'enum') {
                return (enumObj._.keys.indexOf(keyOrValue) !== -1 || enumObj._.values.indexOf(keyOrValue) !== -1) ? true : false;
            }
            enumName = ((enumObj._ && enumObj._.name) ? enumObj._.name : 'unknown');
            throw `${enumName} is not an Enum.`;
        };
        
        // Resource
        // Resource(resName, resFile)
        flair.Resource = (resName, resFile, data) => {
            // start: this will be processed by build engine
            let resData = data || '';
        
            let isLoaded = false;
            let _res = {
                file: () => { return resFile; },
                type: () => { return resFile.substr(resFile.lastIndexOf('.') + 1).toLowerCase(); },
                get: () => { return resData; },
                load: Object.freeze({
                    asJSON: () => {
                        return JSON.parse(resData);
                    },
                    asCSS: () => {
                        if (flair.options.env.isClient) {
                            if (!isLoaded) {
                                let css = flair.options.env.global.document.createElement('style');
                                css.type = 'text/css';
                                css.name = resFile;
                                css.innerHTML = resData;
                                flair.options.env.global.document.head.appendChild(css);
                                isLoaded = true;
                            }
                            return isLoaded;
                        }
                        return false;
                    },
                    asHTML: (node, position = '') => {
                        // position can be: https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
                        // if empty, it will replace node html
                        if (flair.options.env.isClient) {
                            if (node) {
                                if (!isLoaded) {
                                    if (position) {
                                        node.innerHTML = resData;
                                    } else {
                                        node.insertAdjacentHTML(position, resData);
                                    }
                                    isLoaded = true;
                                }
                                return isLoaded;
                            }
                        }
                        return false;
                    },
                    asJS: (cb) => {
                        if (flair.options.env.isClient) {
                            if (!isLoaded) {
                                let js = flair.options.env.global.document.createElement('script');
                                js.type = 'text/javascript';
                                js.name = resFile;
                                js.src = resData;
                                if (typeof cb === 'function') {
                                    js.onload = cb;
                                    js.onerror = () => { isLoaded = false; }
                                }
                                flair.options.env.global.document.head.appendChild(js);
                                isLoaded = true;
                            }
                            return isLoaded;                    
                        }
                        return false;
                    }
                })
            };
            _res._ = {
                name: resName,
                type: 'resource',
                namespace: null,
                file: resFile,
                data: (data) => { 
                    if (data && !resData) { 
                        resData = data; // set only once
                    }
                    return resData;
                }
            };
        
            // set JSON automatically
            _res.JSON = {};
            try {
                _res.JSON = Object.freeze(_res.load.asJSON());
            } catch (e) {
                // ignore
            };
        
            // register type with namespace
            flair.Namespace(_res);
        
            // return
            return Object.freeze(_res);
        };
        flair.Resource.load = (resObj, ...args) => {
            if (resObj._ && resObj._.type === 'resource') {
                let type = resObj.type();
                switch(type) {
                    case 'json':
                        return resObj.load.asJSON(); break;
                    case 'css':
                        return resObj.load.asCSS(); break;
                    case 'js':
                        return resObj.load.asJS(...args); break;
                    case 'html':
                        return resObj.load.asHTML(...args); break;
                    default:
                        throw `Unknown resource type: ${type}.`;
                }
            }
            resName = ((resObj._ && resObj._.name) ? resObj._.name : 'unknown');
            throw `${resName} is not a Resource.`;
        };
        flair.Resource.get = (resName) => {
            let resObj = flair.Namespace.getType(resName);
            if (resObj._ && resObj._.type === 'resource') {
               return resType.get();
            }
            return null;
        };
        
        // Structure
        // Structure(structureName, factory(args) {})
        flair.Structure = (structureName, factory) => {
            // build structure definition
            let Structure = function(...args) {
                let _this = this;
        
                // attach instance reflector
                _this._ = _this._ || {};
                _this._.type = 'sinstance';
                _this._.name = structureName;
                _this._.inherits = Structure;
        
                // construct using factory
                factory.apply(_this, ...args);
        
                // return
                return _this;
            };
        
            // attach structure reflector
            Structure._ = {
                name: structureName,
                type: 'structure',
                namespace: null        
            };
        
            // register type with namespace
            flair.Namespace(Structure);
        
            // return
            return Structure;
        };
        
        
        
        // which
        // which(def, isFile)
        //  def: definition to check
        //  isFile: if definition is a file 
        flair.which = (def, isFile) => {
            if (isFile) { // debug/prod specific decision
                // pick minified or dev version
                if (def.indexOf('{.min}') !== -1) {
                    if (flair.options.env.isProd) {
                        return def.replace('{.min}', '.min'); // a{.min}.js => a.min.js
                    } else {
                        return def.replace('{.min}', ''); // a{.min}.js => a.js
                    }
                }
            } else { // server/client specific decision
                if (def.indexOf('|')) { 
                    let items = def.split('|'),
                        item = '';
                    if (flair.options.env.isServer) {
                        item = items[0].trim();
                    } else {
                        item = items[1].trim();
                    }
                    if (item === 'x') { item = ''; } // special case to explicitely mark absence of a type
                    return item;
                }            
            }
            return def; // as is
        };
        
        // using
        // using(object, scopeFn)
        flair.using = (obj, scopeFn) => {
            try {
                scopeFn(obj);
            } finally {
                if (obj._ && typeof obj._.dispose === 'function') {
                    obj._.dispose();
                }
            }
        };
        
        // as
        // as(object, intf)
        //  intf: can be a reference or 'public', 'protected', 'private'
        flair.as = (obj, intf) => {
            if (obj && obj._ && obj._.type === 'instance') {
                if (typeof intf === 'string') {
                    switch(intf) {
                        case 'public': 
                            return obj._.pu; break;
                        case 'protected': 
                        case 'private':
                            return obj._.pr; break;
                        default:
                            throw new flair.Exception('AS03', `Unknown scope type: ${intf}`);
                    }
                } else {
                    switch(intf._.type) {
                        case 'interface':
                            if (obj._.isImplements(intf._.name)) { return obj; }; break;
                        case 'mixin':
                            if (obj._.isMixed(intf._.name)) { return obj; }; break;
                        case 'class':
                            if (obj._.isInstanceOf(intf._.name)) { return obj; }; break;
                        default:
                            throw new flair.Exception('AS02', `Unknown/unsupported interface type: ${intf}`);
                    }
                }
            } else {
                throw new flair.Exception('AS01', `Unknown/unsupported object type: ${((obj && obj._ && obj._.type) ? obj._.type : '')}`);
            }
            return null;
        };
        // is
        // is(objOtType, intf)
        //  intf: can be a reference
        flair.is = (objOtType, intf) => {
        // TODO: check for all types as well
        
            if (typeof intf !== 'string') {
                return flair.as(obj) !== null;
            } else {
                throw new flair.Exception('IS01', `Scope types are not supported: ${intf}`);
            }
        };
        // classOf
        // classOf(obj)
        //  obj: object instance for which class type is required
        flair.classOf = (obj) => {
            if (obj._ && obj._.type === 'instance') {
                return obj._.inherits;
            } else {
                throw 'Invalid arguments.';
            }
        };
        // isDerivedFrom
        // isDerivedFrom(cls, parentCls)
        //  cls: Class type to check for hierarchy
        //  parentCls: Parent class type to look for
        flair.isDerivedFrom = (cls, parentCls) => {
            if (cls._ && cls._.type === 'class' && parentCls._ && parentCls._.type === 'class') {
                if (cls._.isDerivedFrom(parentCls._.name)) { return true; }
                return false;
            } else {
                throw 'Invalid arguments.';
            }
        };
        // isImplements
        // isImplements(objOrCls, intf)
        //  objOrCls: object or class to check for interface
        //  intf: Interface type for which implementation is to be checked
        flair.isImplements = (objOrCls, intf) => {
            if (objOrCls._ && (objOrCls._.type === 'class' || objOrCls._.type === 'instance') && intf._ && intf._.type === 'interface') {
                if (objOrCls._.isImplements(intf._.name)) { return true; }
                return false;
            } else {
                throw 'Invalid arguments.';
            }
        };
        // isInstanceOf
        // isInstanceOf(obj, cls)
        //  obj: object or class to check for class
        //  cls: Class type for which instance type to be checked
        flair.isInstanceOf = (obj, cls) => {
            if (obj._ && obj._.type === 'instance' && cls._ && cls._.type === 'class') {
                if (obj._.isInstanceOf(cls._.name)) { return true; }
                return false;
            } else {
                throw 'Invalid arguments.';
            }
        };
        // isMixed
        // isMixed(objOrCls, mix)
        //  objOrCls: object or class to check for mixin
        //  mix: Mixed type for which mixin is to be checked
        flair.isMixed = (objOrCls, mix) => {
            if (objOrCls._ && (objOrCls._.type === 'class' || objOrCls._.type === 'instance') && mix._ && mix._.type === 'mixin') {
                if (obj._.isMixed(mix._.name)) { return true; }
                return false;
            } else {
                throw 'Invalid arguments.';
            }
        };

        // Container
        let container = {};
        flair.Container = {};
        
        // register(type)
        // register(alias, type)
        //  alias: type alias to register a type with
        //  type: actual type to register against alias OR
        //        qualifiedName of the type to resolve with OR
        //        a JS file name that needs to be resolved 
        //        When qualifiedName of a JS file is being defined, it can also be defined using contextual format
        //        <serverContent> | <clientContext>
        flair.Container.register = (alias, type) => {
            if (typeof alias === 'function') {
                type = alias;
                alias = type._.name;
            }
            if (typeof alias === 'string' && typeof type === 'string') {
                // get contextual type
                type = flair.which(type);
                
                // get actual type
                type = flair.Namespace.getType(type); // type is qualifiedNane here, if not found it will throw error
            }
            if (!container[alias]) { container[alias] = []; }
            container[alias].push(type);
        };
        flair.Container.isRegistered = (alias) => {
            return typeof container[alias] !== 'undefined';
        };
        flair.Container.get = (alias) => {
            return (container[alias] || []).slice();
        };
        flair.Container.resolve = (alias, isMultiResolve, ...args) => {
            let result = null,
                getResolvedObject = (Type) => {
                    let obj = Type; // whatever it was
                    if (Type._ && Type._.type && ['class', 'structure'].indexOf(Type._.type) !== -1) { 
                        obj = new Type(...args); // only class and structure need a new instance
                    }
                    return obj;
                }
            if (container[alias] && container[alias].length > 0) { 
                if (isMultiResolve) {
                    result = [];
                    for(let Type of container[alias]) {
                        result.push(getResolvedObject(Type));
                    }
                } else {
                    let Type = container[alias][0];
                    result = getResolvedObject(Type);
                }
            }
            return result;
        };
        

        // Attribute
        flair.Attribute = flair.Class('Attribute', function(attr) {
            let decoratorFn = null;
            
            attr('abstract');
            this.construct((...args) => {
                // args can be static or dynamic or settings
                // static ones are defined just as is, e.g.,
                //  ('text', 012, false, Reference)
                // dynamic ones are defined as special string
                //  ('[publicPropOrFuncName]', 012, false, Reference)
                // when string is defined as '[...]', this argument is replaced by a 
                // function which can be called (with binded this) to get dynamic value of the argument
                // the publicPropName is the name of a public property or function
                // name of the same object where this attribute is applied
                // settings ones are defined as another special string
                this.args = [];
                for(let arg of args) {
                    if (typeof arg === 'string') {
                        if (arg.startsWith('[') && arg.endsWith(']')) {
                            let fnName = arg.replace('[', '').replace(']', ''),
                                fn = function() {
                                    let member = this[fnName]; // 'this' would change because of binding call when this function is called
                                    if (typeof member === 'function') {
                                        return member();
                                    } else {
                                        return member;
                                    }
                                };
                                this.args.push(fn);
                        } else {
                            this.args.push(arg);
                        }
                    } else {
                        this.args.push(arg);
                    }
                }
            });
            
            this.prop('args', []);
            this.func('decorator', (fn) => {
                if (typeof fn === 'function') {
                    decoratorFn = fn;
                }
                return decoratorFn;
            });
            this.func('resetEventInterface', (source, target) => {
                target.subscribe = source.subscribe;
                target.unsubscribe = source.unsubscribe;
                delete source.subscribe;
                delete source.unsubscribe;
            });
        });
        
        // async
        // async() 
        flair.Container.register(flair.Class('async', flair.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['func'].indexOf(type) === -1) { throw `async attribute cannot be applied on ${type} members. (${className}.${name})`; }
                if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `async attribute cannot be applied on special function. (${className}.${name})`; }
        
                // decorate
                let fn = descriptor.value;
                descriptor.value = function(...args) {
                    return new Promise((resolve, reject) => {
                        let fnArgs = [resolve, reject].concat(args);
                        fn(...fnArgs);
                    });
                }.bind(obj);
            });
        }));
        
        // deprecate
        // deprecate([message])
        //  - message: any custom message
        flair.Container.register(flair.Class('deprecate', flair.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `deprecate attribute cannot be applied on special function. (${className}.${name})`; }
        
                // decorate
                let msg = `${name} is deprecated.`;
                if (typeof this.args[0] !== 'undefined') { msg += ' ' + this.args[0] };
                switch(type) {
                    case 'prop':
                        if (descriptor.get) {
                            let _get = descriptor.get;                                
                            descriptor.get = function() {
                                console.warn(msg);
                                return _get();
                            }.bind(obj);
                        }
                        if (descriptor.set) {
                            let _set = descriptor.set;
                            descriptor.set = function(value) {
                                console.warn(msg);
                                return _set(value);
                            }.bind(obj);
                        }   
                        break;
                    case 'func':
                        let fn = descriptor.value;
                        descriptor.value = function(...args) {
                            console.warn(msg);
                            fn(...args);
                        }.bind(obj);
                        break;
                    case 'event':
                        let ev = descriptor.value;
                        descriptor.value = function(...args) {
                            console.warn(msg);
                                ev(...args);
                        }.bind(obj);
                        this.resetEventInterface(fn, descriptor.value);
                        break;
                }
            });
        }));
        
        // enumerate
        // enumerate(flag)
        //  - flag: true/false
        flair.Container.register(flair.Class('enumerate', flair.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `enumerate attribute cannot be applied on special function. (${className}.${name})`; }
        
                // decorate
                let flag = this.args[0];
                descriptor.enumerable = flag;
            });
        }));
        

        // inject
        // inject(type, [typeArgs])
        //  - type: 
        //      type class itself to inject, OR
        //      type class name, OR
        //      type class name on server | type class name on client
        //  - typeArgs: constructor args to pass when type class instance is created
        // NOTE: types being referred here must be available in container so sync resolve can happen
        flair.Container.register(flair.Class('inject', flair.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['func', 'prop'].indexOf(type) === -1) { throw `inject attribute cannot be applied on ${type} members. (${className}.${name})`; }
                if (['_constructor', '_dispose'].indexOf(name) !== -1) { throw `inject attribute cannot be applied on special function. (${className}.${name})`; }
        
                // decorate
                let Type = this.args[0],
                    typeArgs = this.args[1],
                    instance = null;
                if (!Array.isArray(typeArgs)) { typeArgs = [typeArgs]; }
                if (typeof Type === 'string') { 
                    // get contextual type
                    Type = flair.which(Type);
        
                    // get instance
                    instance = flair.Container.resolve(Type, false, ...typeArgs)
                } else {
                    instance = new Type(...typeArgs);
                }
                switch(type) {
                    case 'func':
                        let fn = descriptor.value;
                        descriptor.value = function(...args) {
                            fn(instance, ...args);
                        }.bind(obj);
                        break;
                    case 'prop':
                        obj[name] = instance;                        
                        break;
                }
            });
        }));
        
        // multiinject
        // multiinject(type, [typeArgs])
        //  - type: 
        //      type class name, OR
        //      type class name on server | type class name on client
        //  - typeArgs: constructor args to pass when type class instance is created
        // NOTE: types being referred here must be available in container so sync resolve can happen
        flair.Container.register(flair.Class('multiinject', flair.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['func', 'prop'].indexOf(type) === -1) { throw `multiinject attribute cannot be applied on ${type} members. (${className}.${name})`; }
                if (['_constructor', '_dispose'].indexOf(name) !== -1) { throw `multiinject attribute cannot be applied on special function. (${className}.${name})`; }
        
                // decorate
                let Type = this.args[0],
                    typeArgs = this.args[1],
                    instance = null;
                if (!Array.isArray(typeArgs)) { typeArgs = [typeArgs]; }
                if (typeof Type === 'string') {
                    // get contextual type
                    Type = flair.which(Type);
        
                    // get instance
                    instance = flair.Container.resolve(Type, true, ...typeArgs)
                } else {
                    throw `multiinject attribute does not support direct type injections. (${className}.${name})`;
                }
                switch(type) {
                    case 'func':
                        let fn = descriptor.value;
                        descriptor.value = function(...args) {
                            fn(instance, ...args);
                        }.bind(obj);
                        break;
                    case 'prop':
                        obj[name] = instance;                        
                        break;
                }
            });
        }));
        

        // Aspects
        let allAspects = [],
            regExpEscape = (s) => { return s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'); },
            wildcardToRegExp = (s) => { return new RegExp('^' + s.split(/\*+/).map(regExpEscape).join('.*') + '$'); };
        flair.Aspects = {};
        flair.Aspects.raw = () => { return allAspects; }
        flair.Aspects.register = (pointcut, Aspect) => {
            // pointcut: [namespace.]class[:func][/attr1[,attr2[,...]]]
            //      namespace/class/func:
            //          ~ - any
            //          *<text> - any name that ends with <text> 
            //          <text>* - any name that starts with <text>
            //          <text>  - exact name
            //      attribute:
            //          <text>  - exact name
            //
            //      Examples:
            //          ~                   - on all functions of all classes in all namespaces
            //          abc                 - on all functions of all classes names abc in root namespace (without any namespace)
            //          ~.abc               - on all functions of all classes names abc in all namespaces
            //          ~.abc:~             - on all functions of all classes names abc in all namespaces
            //          xyz.*               - on all functions of all classes in xyz namespace
            //          xyz.abc             - on all functions of class abc under xyz namespace
            //          xyz.abc:*           - on all functions of class abc under xyz namespace
            //          xyz.abc:f1          - on func f1 of class abc under xyz namespace
            //          xyz.abc:f*          - on all funcs that starts with f in class abc under xyz namespace
            //          xyz.xx*.abc         - on functions of all classes names abc under namespaces where pattern matches xyz.xx* (e.g., xyz.xx1 and xyz.xx2)
            //          xy*.xx*.abc         - on functions of all classes names abc under namespaces where pattern matches xyz.xx* (e.g., xy1.xx1 and xy2.xx1)
            //          abc/service         - on all functions of abc class in root namespace which has service attribute applied
            //          ~/service           - on all functions of all classes in all namespaces which has service attribute applied
            //          /service            - on all functions of all classes which has service attribute applied
            //          /service*           - on all functions of all classes which has service* attribute name pattern applied
        
        
            // split name and attributes
            let nm = pointcut || '~',
                ns = '',
                cls = '',
                fnc = '',
                attr = '~',
                bucket = '';
            if (nm.indexOf('/') !== -1) {
                let items = nm.split('/');
                nm = items[0].trim();
                attr = items[1].trim();
            }
        
            // get bucket to store in
            if (nm === '~') { 
                ns = '~';
                cls = '~';
                fnc = '~';
            } else if (nm === '') {
                ns = '^';
                cls = '~';
                fnc = '~';
            } else if (nm.indexOf('.') === -1) {
                ns = '^';
                if (nm.indexOf(':') === -1) {
                    cls = nm;
                    fnc = '~';
                } else {
                    let itms = nm.split(':');
                    cls = itms[0].trim();
                    fnc = itms[1].trim();
                }
            } else {
                ns = nm.substr(0, nm.lastIndexOf('.'));
                nm = nm.substr(nm.lastIndexOf('.') + 1);
                if (nm.indexOf(':') === -1) {
                    cls = nm;
                    fnc = '~';
                } else {
                    let itms = nm.split(':');
                    cls = itms[0].trim();
                    fnc = itms[1].trim();
                }        
            }
            if (ns === '*' || ns === '') { ns = '~'; }
            if (cls === '*' || cls === '') { cls = '~'; }
            if (fnc === '*' || fnc === '') { fnc = '~'; }
            if (attr === '*' || attr === '') { attr = '~'; }
            bucket = `${ns}=${cls}=${fnc}=${attr}`;
        
            // add bucket if not already there
            allAspects[bucket] = allAspects[bucket] || [];
            allAspects[bucket].push(Aspect);
        
            // allAspects[ns] = allAspects[ns] || {};
            // allAspects[ns][cls] = allAspects[ns][cls] || {};
            // allAspects[ns][cls][fnc] = allAspects[ns][cls][fnc] || {};
            // allAspects[ns][cls][fnc] = allAspects[ns][cls][fnc] || {};
            // allAspects[ns][cls][fnc][attr] = allAspects[ns][cls][fnc][attr] || {};
            // allAspects[ns][cls][fnc][attr].list = allAspects[ns][cls][fnc][attr].list || [];
        
            // // store
            // allAspects[ns][cls][fnc][attr].list.push(Aspect);
        };
        flair.Aspects.get = (className, funcName, attrs) => {
            // get parts
            let funcAspects = [],
                ns = '',
                cls = '',
                fnc = funcName.trim(),
                attr = '~',
                bucket = '';
        
            if (className.indexOf('.') !== -1) {
                ns = className.substr(0, className.lastIndexOf('.')).trim();
                cls = className.substr(className.lastIndexOf('.') + 1).trim(); 
            } else {
                ns = '^';
                cls = className.trim();
            }
        
            for(let bucket in allAspects) {
                let items = bucket.split('='),
                    thisNS = items[0],
                    rxNS = wildcardToRegExp(thisNS),
                    thisCls = items[1],
                    rxCls = wildcardToRegExp(thisCls),
                    thisFnc = items[2],
                    rxFnc = wildcardToRegExp(thisFnc),
                    thisAttr = items[3],
                    rxAttr = wildcardToRegExp(thisAttr),
                    isMatched = (thisAttr === '~');
                
                if (((ns === thisNS || rxNS.test(ns)) &&
                    (cls === thisCls || rxCls.test(cls)) &&
                    (fnc === thisFnc || rxFnc.test(fnc)))) {
                    if (!isMatched) {
                        for(let attr of attrs) {
                            if (attr.name === thisAttr || rxAttr.test(attr.name)) {
                                isMatched = true;
                                break; // matched
                            }
                        }
                    }
                    if (isMatched) {
                        for(let aspect of allAspects[bucket]) {
                            if (funcAspects.indexOf(aspect) === -1) {
                                funcAspects.push(aspect);
                            }
                        }                  
                    }
                }
            }
        
            // return
            return funcAspects;
        };
        
        // Aspect
        flair.Aspect = flair.Class('Aspect', function(attr) {
            let beforeFn = null,
                afterFn = null,
                aroundFn = null;
            attr('abstract');
            this.construct((...args) => {
                this.args = args;
            });
            
            this.prop('args', []);
            this.func('before', (fn) => {
                if (typeof fn === 'function') {
                    beforeFn = fn;
                }
                return beforeFn;
            });
            this.func('after', (fn) => {
                if (typeof fn === 'function') {
                    afterFn = fn;
                }
                return afterFn;
            });
            this.func('around', (fn) => {
                if (typeof fn === 'function') {
                    aroundFn = fn;
                }
                return aroundFn;
            });
        });
        

        // Serializer
        flair.Serializer = {};
        flair.Serializer.serialize = (instance) => { 
            if (instance._.type = 'instance') {
                return instance._.serialize(); 
            }
            return null;
        };
        flair.Serializer.deserialize = (Type, json) => {
            let instance = new Type();
            if (instance._.type = 'instance') {
                instance._.deserialize(json);
                return instance;
            }
            return null;
        };
        

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
                this.getTarget = () => { return target; };
                this.isInstance = () => { return target._.type === 'instance'; };
                this.isClass = () => { return target._.type === 'class'; };
                this.isEnum = () => { return target._.type === 'enum'; };
                this.isStructure = () => { return target._.type === 'structure'; };
                this.isStructureInstance = () => { return target._.type === 'sinstance'; };
                this.isNamespace = () => { return target._.type === 'namespace'; };
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
                    let keys = Object.keys(target);
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
                        for(type of types) {
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
                }
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
                }
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
                case 'resource': ref = new ResourceReflector(forTarget); break;
                case 'structure': ref = new StructureReflector(forTarget); break;
                case 'namespace': ref = new NamespaceReflector(forTarget); break;
                case 'mixin': ref = new MixinReflector(forTarget); break;
                case 'interface': ref = new InterfaceReflector(forTarget); break;
                default:
                    throw `Unknown type ${forTarget._.type}.`;
            }
        
            // return
            return ref;
        };

        // expose to global environment
        let g = options.env.global;
        if (!options.env.supressGlobals) { 
            g.Exception = Object.freeze(flair.Exception); 
            g.Class = Object.freeze(flair.Class); 
            g.Mixin = Object.freeze(flair.Mixin); 
            g.Interface = Object.freeze(flair.Interface); 
            g.Structure = Object.freeze(flair.Structure);  
            g.Enum = Object.freeze(flair.Enum); 
            g.Resource = Object.freeze(flair.Resource); 
            g.Assembly = Object.freeze(flair.Assembly);
            g.Namespace = Object.freeze(flair.Namespace);
            g.which = Object.freeze(flair.which); 
            g.bring = Object.freeze(flair.bring); 
            g.using = Object.freeze(flair.using); 
            g.as = Object.freeze(flair.as);
            g.is = Object.freeze(flair.is);
            g.isDerivedFrom = Object.freeze(flair.isDerivedFrom);
            g.isImplements = Object.freeze(flair.isImplements);
            g.isInstanceOf = Object.freeze(flair.isInstanceOf);
            g.isMixed = Object.freeze(flair.isMixed);
            g.classOf = Object.freeze(flair.classOf);
            g.Attribute = Object.freeze(flair.Attribute); 
            g.Aspects = Object.freeze(flair.Aspects); 
            g.Aspect = Object.freeze(flair.Aspect); 
            g.Container = Object.freeze(flair.Container);
            g.Serializer = Object.freeze(flair.Serializer); 
            g.Reflector = Object.freeze(flair.Reflector);
        }
        g.flair = flair; // this is still exposed, so can be used globally

        // return
        return Object.freeze(flair);
    };

    // export
    if (typeof (typeof module !== 'undefined' && module !== null ? module.exports : void 0) === 'object') {
        module.exports = def;
    } else if (typeof define === 'function' && typeof define.amd !== 'undefined') {
        define(function() { return def; });
    } else {
        this.flair = def;
    }
}).call(this);