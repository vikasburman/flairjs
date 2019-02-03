const guid = () => {
    return '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
const which = (def, isFile) => {
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
        if (def.indexOf('|') !== -1) { 
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

const flarizedType = (type, name, obj, mex = {}) => {
    // check
    if (!name || typeof name !== 'string') { throw new _Exception('InvalidArgument', `Argument type is invalid. (name)`); }

    // add meta information
    let _ = mex; // whatever meta extensions are provided
    _.name = name;
    _.type = type;
    _.namespace = null;
    _.assembly = () => { return flair.Assembly.get(name) || null; };
    _.id = guid();
    _.__ = {}; // store any dynamic information here under this unfreezed area

    // attach meta
    obj._ = _;

    // register obj with namespace
    flair.Namespace(obj); 

    // freeze meta 
    obj._ = Object.freeze(obj._);

    // return freezed
    return Object.freeze(obj);
};
const flarizedInstance = (type, obj, mex = {}) => {
    // add meta information
    let _ = mex; // whatever meta extensions are provided
    _.type = type;
    _.id = guid();
    _.instanceOf = _.instanceOf || [];
    _.__ = {}; // store any dynamic information here under this unfreezed area

    // attach freezed meta
    obj._ = Object.freeze(_);

    // return freezed
    return Object.freeze(obj);
};
const builder = (type, obj, mex, cfg) => {
    let _noop = noop,
        _noopAsync = noopAsync,
        bucket = [],
        meta = {};

    const member = {
        isSpecial: (memberName) => {
            return ['constructor', 'dispose', '_constructor', '_dispose', '_'].indexOf(memberName) !== -1;
        },
        properName: (memberName) => {
            if (memberName === '_constructor') { return 'constructor'; }
            if (memberName === '_dispose') { return 'dispose'; }
            return memberName;
        },
        isConditionalOK: (memberName) => {
            let isOK = true,
                attrArgs = attrs.getArgs('conditional', memberName, false),
                condition = (attrArgs.length > 0 ? attrArgs[0] : '');
            if (condition) {
                switch(condition) {
                    case 'server':
                        isOK = (options.env.isServer === true); break;
                    case 'client':
                        isOK = (options.env.isServer === false); break;
                    default:
                        isOK = options.symbols.indexOf(condition) !== -1; break;
                }
            } else { // conditional attr is there, but condition is not defined
                isOK = false;
            }
            return isOK;
        },
        isDefined = (memberName) => {
            let result = false,
                hierarchy = obj._.instanceOf.slice().reverse(); // start looking from last item first
                i = 0; 
            for(let item of hierarchy) {
                if (i !== 0) { // skip first item, which is current level
                    if (item.meta[memberName]) { result = true; break; }
                }
                i++;
            }
            return result;
        };         
    };
    const attrs = {
        get: (memberName) => {
            return meta[memberName];
        },
        has: (attrName, memberName, isDeepCheck) => {
            let finder = (_meta) => {
                    if (_meta) { return (_meta.findIndex((item) => { return item.name === attrName; }) !== -1); }
                    return false;
                };
            if (isDeepCheck) {
                return (obj._.instanceOf.findIndex((item) => {
                    if (item.meta[memberName]) { return finder(item.meta[memberName]); }
                    return false;
                }) !== -1); 
            } else {
                return finder(attrs.get(memberName));
            }
        },
        getArgs: (attrName, memberName, isDeepCheck) => {
            let attrArgs = null,
                hierarchy = null;
            if (isDeepCheck) {
                hierarchy = obj._.instanceOf.slice().reverse(); // start looking from last item first
            } else {
                hierarchy = [{meta: meta}]; // current meta
            }
            for(let item of hierarchy) {
                if (item.meta[memberName]) {
                    for(let attrItem of item.meta[memberName]) {
                        if (attrItem.name === attrName) {
                            attrArgs = attrItem.args;
                            break;
                        }
                    }
                    if (attrArgs) { break; }
                }
            }
            return (attrArgs !== null ? attrArgs : []);            
        },
        apply: (memberName) => {
            let Attr = null,
                targetType = meta[memberName].type,
                attrArgs = null,
                attrInstance = null,
                decorator = null;
            for(let info of meta[memberName]) {
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
    };
    const funcs = {
        isArrow: (fn) => {
            return (!(fn).hasOwnProperty('prototype'));
        }
    }
   
    // Remember: instanceOf should be pushed this level before these methods are used

    const _func = (name, fn) => {
        if (!name) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
        if (typeof name === 'function') { fn = name; name = 'constructor'; } // constructor shorthand definition
        if (name === '_') { new _Exception('InvalidName', `Name is not valid. (${name})`); }

        if (!fn) { fn = _noop; }
        if (member.isSpecial(name)) {
            if (!name.startsWith('_')) { name = '_' + name; }
        }

        // add mixed attr --- TODO: see how to bring it here
        if (mixin_being_applied !== null) {
            attr('mixed', mixin_being_applied);
        }

        // collect attributes
        meta[name] = [].concat(bucket);
        meta[name].type = 'func';
        if (cfg.aop) {
            meta[name].aspects = []; // which all aspects are applied to this method
        }
        if (cfg.interfaces) {
            meta[name].interfaces = []; // to which all interfaces this method complies to
        }        
        bucket = [];

        // conditional check
        if (cfg.conditional) {
            if (!member.isConditionalOK(name)) { delete meta[name]; return; }
        }

        // override check
        let isDefinedHere = false,
            properName = member.properName(name);
        if (cfg.override) {
            if (attr.has('override', name)) {
                // check to find what to override
                let desc = Object.getOwnPropertyDescriptor(obj, properName);
                if (!desc || typeof desc.value !== 'function') { 
                    throw new _Exception('InvalidOperation', `Function is not found to override. (${properName})`); 
                }

                // check if in parent and here it is not sealed
                if (attrs.has('sealed', name, true)) {
                    throw new _Exception('InvalidOperation', `Cannot override a sealed function. (${properName})`); 
                }
    
                // redefine
                let base = obj[properName].bind(obj);
                Object.defineProperty(obj, properName, {
                    value: function(...args) {
                        let fnArgs = [base].concat(args); // run fn with base as first parameter
                        if (funcs.isArrow(fn)) { // arrow function
                            return fn(...fnArgs);
                        } else { // normal func
                            return fn.apply(obj, fnArgs);
                        }
                    }.bind(obj)
                });
                isDefinedHere = true;
            } 
        } 

        // duplicate check
        if (cfg.duplicate && !isDefinedHere) {
            if (member.isDefined(name)) { 
                throw new _Exception('InvalidOperation', `Function is already defined. (${properName})`); 
            }
        }
        
        // define fresh
        if (!isDefinedHere) {
            Object.defineProperty(obj, properName, {
                configurable: true,
                enumerable: true,
                writable: false,
                value: function(...args) {
                    if (funcs.isArrow(fn)) {
                        return fn(...args);
                    } else { // normal func
                        return fn.apply(obj, args);
                    }
                }.bind(obj)
            });
            isDefinedHere = true;
        }

        // apply custom attributes
        if (cfg.customAttrs) {
            attrs.apply(name);
        }
        
        // finally hold the references for reflector
        meta[name].ref = obj[name];
        meta[name].raw = fn;
    };
    const _construct = (...args) => {
        _func.apply(obj, ['constructor'].concat(args));
    };
    const _destruct = (...args) => {
        _func.apply(_this, ['dispose'].concat(args));
    };
    const _prop = (name, valueOrGetterOrGetSetObject, setter) => {
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
            if (isDefined(name)) { throw `${className}.${name} is already defined.`; }
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
        }     

        // apply attributes in order they are defined
        applyAttr(name);

        // finally hold the reference for reflector
        meta[name].ref = {
            get: () => { return _this[name]; },
            set: (value) => { _this[name] = value; }
        };
    };
    const _event = (name, argProcessor) => {
        // special names
        if (isSpecialMember(name)) {  throw `${className}.${name} can only be defined as a function.`; }

        // duplicate check
        if (isDefined(name)) { throw `${className}.${name} is already defined.`; }

        // add meta
        meta[name] = [];
        meta[name].type = 'event';  
        meta[name].aspects = [];
        meta[name].interfaces = [];
        
        // discard attributes
        if (bucket.length > 0) {
            // eslint-disable-next-line no-console
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

    return {
        start: () => {
            // attach builder
            if (cfg.func) { obj.func = _func; }
            if (cfg.prop) { obj.prop = _prop; }
            if (cfg.event) { obj.event = _event; }
            if (cfg.construct) { obj.construct = _construct; }
            if (cfg.destruct) { obj.destruct = _destruct; }
            if (cfg.noop) { obj.noop = _noop; }
            if (cfg.noop) { obj.noopAsync = _noopAsync; }
        },
        end: () => {
            // detach builder
            if (cfg.func) { delete obj.func; }
            if (cfg.prop) { delete obj.prop; }
            if (cfg.event) { delete obj.event; }
            if (cfg.construct) { delete obj.construct; }
            if (cfg.destruct) { delete obj.destruct; }
            if (cfg.noop) { delete obj.noop; }
            if (cfg.noop) { delete obj.noopAsync; }

            // flarized
            return flarizedInstance(type, obj, mex);
        }
    };
}