/**
 * oojs.js
 * version 1.0.0
 * (C) 2017, Vikas Burman
 * MIT License 
 */
(function() {
    // the definition
    const oojs = (env) => {
        // weaving catalog builder
        let catalog = [];
        let oops = function(match, Advise) {
            // match: '',
            //      sec1:sec2:sec3
            //      sec1 can be:
            //          * - property function and event
            //          p - only property
            //          f - only functions
            //          e - only event
            //          <> - any combination of p, f or e -- for relevant
            //      sec2 can be:
            //          * - any class
            //          *<text> - any class name that ends with <text>
            //          <text>* - any class name that starts with <text>
            //          <text>  - exact class name
            //      sec3 can be:
            //          * - any member
            //          *<text> - any member name that ends with <text>
            //          <text>* - any member name that starts with <text>
            //          <text>  - exact member name
            // Advise: class definition that exposes functions like
            //      before
            //      after
            //      around
            catalog.push({match: match, Advise: Advise});
        };

        // Class
        oops.Class = (name, inherits, factory) => {
            if (typeof factory !== 'function') {
                factory = inherits;
                inherits = null;
            }

            // in-built attributes
            const Noop = function(targetType, targetName, target, obj) {
                // no operation
            };
            const ASync = function(targetType, targetName, target, obj) {
                // validate
                if (targetType !== 'func') {
                    throw `ASync attribute can only be applied to functions. ${targetName} is not a function.`;
                }
                if (targetName === '_constructor') {
                    throw `ASync attribute cannot be applied on constructor.`;
                }
                if (targetName === '_dispose') {
                    throw `ASync attribute cannot be applied on dispose.`;
                }                

                // wrap
                Object.defineProperty(obj, targetName, {
                    value: function(...args) {
                        return new Promise((resolve, reject) => {
                            target(resolve, reject, ...args);
                        });
                    }.bind(obj)
                });                
            };
            const Deprecate = function(targetType, targetName, target, obj) {
                // validate
                if (targetName === '_constructor') {
                    throw `Deprecate attribute cannot be applied on constructor.`;
                }
                if (targetName === '_dispose') {
                    throw `Deprecate attribute cannot be applied on dispose.`;
                }                

                // wrap
                switch(targetType) {
                    case 'prop':
                        let desc = Object.getOwnPropertyDescriptor(obj, targetName);
                        if (desc.get) {
                            let _get = desc.get;
                            Object.defineProperty(obj, targetName, {
                                get: function() {
                                    console.warn(`${targetName} is deprecated.`);
                                    return _get();
                                }.bind(obj)
                            });
                        }
                        if (desc.set) {
                            let _set = desc.set;
                            Object.defineProperty(obj, targetName, {
                                set: function(value) {
                                    console.warn(`${targetName} is deprecated.`);
                                    return _set(value);
                                }.bind(obj)
                            });
                        }   
                        break;                 
                    case 'func':
                        Object.defineProperty(obj, targetName, {
                            value: function(...args) {
                                console.warn(`${targetName} is deprecated.`);
                                target(...args);
                            }.bind(obj)
                        });  
                        break;                  
                }
            };
            const Skip = function(targetType, targetName, target, obj) {
                // validate
                if (targetName === '_constructor') {
                    throw `Skip attribute cannot be applied on constructor.`;
                }
                if (targetName === '_dispose') {
                    throw `Skip attribute cannot be applied on dispose.`;
                }   

                // redefine
                Object.defineProperty(obj, targetName, {
                    enumerable: false
                });
            };
            const Inject = function(targetType, targetName, target, obj, injectType, ...typeArgs) {
                // validate
                if (targetType !== 'func') {
                     throw `Inject attribute can only be applied to functions. ${targetName} is not a function.`;
                }
                if (targetName === '_constructor') {
                    throw `Inject attribute cannot be applied on constructor.`;
                }
                if (targetName === '_dispose') {
                    throw `Inject attribute cannot be applied on dispose.`;
                }

                // wrap
                Object.defineProperty(obj, targetName, {
                    value: function(...args) {
                        let instance = new injectType(...typeArgs);
                        target(instance, ...args);
                    }.bind(obj)
                }); 
            };
            const MultiInject = function(targetType, targetName, target, obj, ...injections) {
                // validate
                if (targetType !== 'func') {
                     throw `Inject attribute can only be applied to functions. ${targetName} is not a function.`;
                }
                if (targetName === '_constructor') {
                    throw `Inject attribute cannot be applied on constructor.`;
                }
                if (targetName === '_dispose') {
                    throw `Inject attribute cannot be applied on dispose.`;
                }

                // wrap
               Object.defineProperty(obj, targetName, {
                    value: function(...args) {
                        let instances = [],
                            _type = null,
                            _args = null;
                        for(_inject of injections) {
                            _type = _inject.type;
                            _args = _inject.args || [];
                            instances.push(new _type(..._args));
                        }
                        let InstancesAndFuncArgs = instances.concat(args);
                        target(...InstancesAndFuncArgs);
                    }.bind(obj)
                });
            };            

            // aspects weaver
            const weaver = (_this) => {
            };

            // build class definition
            let Class = function(...args) {
                let Parent = Class.Inherits,
                    _this = {},
                    bucket = [],
                    meta = {},
                    props = {},
                    events = [];

                // create parent instance
                if (Parent) {
                    _this = new Parent(...args);
                    if (Object.isFrozen(_this)) {
                        throw `${name} cannot inherit from a sealed class.`;
                    }
                }

                // definition helper
                const getAttr = (attr) => {
                    let Attr = null;
                    switch(attr) {
                        case 'ASync': Attr = ASync; break;
                        case 'Deprecate': Attr = Deprecate; break;
                        case 'Skip': Attr = Skip; break;
                        case 'Inject': Attr = Inject; break;
                        case 'MultiInject': Attr = MultiInject; break;
                        default: Attr = Noop; break;
                    }
                    return Attr;
                };
                const applyAttr = (targetName) => {
                   let _Attr = null,
                        targetType = meta[targetName].type,
                        attrArgs = null;
                    for(let info of meta[targetName]) {
                        _Attr = info.Attr;
                        attrArgs = info.args || [];
                        new _Attr(targetType, targetName, _this[targetName], _this, ...attrArgs);
                    }
                };
                const hasAttr = (attrName, meta) => {
                    let has = false;
                    for(let info of meta) {
                        if (info.name === attrName) {
                            has = true; break;
                        }
                    }
                    return has;
                };
                _this.attr = (attr, ...args) => {
                    if (typeof attr === 'string') {
                        bucket.push({name: attr, Attr: getAttr(attr), args: args});
                    } else {
                        bucket.push({name: attr.name, Attr: attr, args: args});
                    }
                };
                _this.func = (name, fn) => {
                    // special names
                    if (name === 'constructor') { name = '_' + name; }
                    if (name === 'dispose') { name = '_' + name; }
                    
                    // collect attributes
                    meta[name] = [].concat(bucket);
                    meta[name].type = 'func';
                    bucket = [];
                    let attrs = meta[name];

                    // define
                    if (hasAttr('Override', meta[name])) {
                        // check
                        let desc = Object.getOwnPropertyDescriptor(_this, name);
                        if (typeof desc.value !== 'function') {
                            throw `${name} is not a function to override.`;
                        }
                        if (!desc.configurable) {
                            throw `${name} cannot override a sealed function.`;
                        }                        

                        // redefine
                        let base = _this[name].bind(_this);
                        Object.defineProperty(_this, name, {
                            value: function(...args) {
                                return fn(base, ...args);
                            }.bind(_this)
                        });
                    } else {
                        // duplicate check
                        if (_this[name]) { throw `${name} already defined.`; }

                        // define
                        Object.defineProperty(_this, name, {
                            configurable: true,
                            enumerable: true,
                            writable: false,
                            value: fn
                        });
                    }

                    // apply attributes in order they are defined
                    applyAttr(name);                    
                };
                _this.prop = (name, valueOrGetter, setter) => {
                    // special names
                    if (name === 'constructor') { 
                         throw `${name} can only be defined as a function.`;
                    }
                    if (name === 'dispose') { 
                         throw `${name} can only be defined as a function.`; 
                    }

                    // collect attributes
                    meta[name] = [].concat(bucket);
                    meta[name].type = 'prop';
                    bucket = [];
                    let attrs = meta[name];
                    
                    // define
                    if (hasAttr('Override', meta[name])) {
                        // check
                        let desc = Object.getOwnPropertyDescriptor(_this, name);
                        if (typeof desc.get !== 'function') {
                            throw `${name} is not a property to override.`;
                        }
                        if (!desc.configurable) {
                            throw `${name} cannot override a sealed property.`;
                        }
                    } else {
                        // duplicate check
                        if (_this[name]) { throw `${name} already defined.`; }
                    }

                    // define or redefine
                    if (typeof valueOrGetter !== 'function') {
                        let prop = props[name] = valueOrGetter; // private copy
                        Object.defineProperty(_this, name, {
                            __proto__: null,
                            configurable: true,
                            enumerable: true,
                            get: () => { return prop; },
                            set: hasAttr('ReadOnly', attrs) ? (value) => { 
                                throw `${name} is readonly.`;
                            } : (value) => {
                                prop = value;
                            }                            
                            
                        });
                    } else {
                        Object.defineProperty(_this, name, {
                            __proto__: null,
                            configurable: true,
                            enumerable: true,
                            get: valueOrGetter,
                            set: hasAttr('ReadOnly', attrs) ? (value) => { 
                                throw `${name} is readonly.`;
                            } : (value) => {
                                if (typeof setter === 'function') { setter(value); }
                            }
                        });
                    };       

                    // apply attributes in order they are defined
                    applyAttr(name);
                };
                _this.event = (name) => {
                    // special names
                    if (name === 'constructor') { 
                         throw `${name} can only be defined as a function.`;
                    }
                    if (name === 'dispose') { 
                         throw `${name} can only be defined as a function.`; 
                    }

                    // add meta
                    meta[name] = [];
                    meta[name].type = 'event';                    

                    // discard attributes
                    if (bucket.length > 0) {
                        console.warn(`Attributes can only be applied to properties or functions. ${name} is an event.`);
                        bucket = []; 
                    }

                    // define event
                    let _event = (...args) => {
                        let e = {
                            name: name,
                            args: args,
                            stop: false
                        };
                        for(let handler of events) {
                            handler(e);
                            if (e.stop) { break; }
                        }
                    };
                    _event.Name = name;
                    _event.subscribe = (fn) => {
                        events.push(fn);
                    };
                    _event.unsubscribe = (fn) => {
                        let index = events.indexOf(fn);
                        if (index !== -1) {
                            events.splice(index, 1);
                        }
                    };
                    Object.defineProperty(_this, name, {
                        configurable: false,
                        enumerable: false,
                        value: _event,
                        writable: false
                    });
                };

                // get class definition
                factory.apply(_this);

                // expose meta
                _this._ = _this._ || {};
                _this._.instanceOf = _this._.instanceOf || [];
                if (!Parent) {
                    _this._.instanceOf.push({name: 'Object', type: Object, meta: []});
                }
                _this._.instanceOf.push({name: name, type: Class, meta: meta});
                _this._.Inherits = Class;

                // constructor
                if (typeof _this._constructor === 'function') {
                    _this._constructor(...args);
                    delete _this._constructor;
                }

                // remove definition helper after constructor (so that if need be constructor 
                // can still define props and functions at runtime)
                delete _this.attr;
                delete _this.func;
                delete _this.prop;

                // dispose
                if (typeof _this._dispose === 'function') {
                    _this._.dispose = _this._.dispose || [];
                    let dispose = _this._dispose;
                    _this._.dispose.push(dispose);
                    delete _this._dispose;
                }

                // weave advises as applicale in catalog
                weave(_this);

                // seal attribute for constructor, properties and functions
                // are handled at the end
                for(let member in meta) {
                    if (meta.hasOwnProperty(member)) {
                        if (hasAttr('Seal', meta[member])) {
                            switch(meta[member].type) {
                                case 'prop':
                                    Object.defineProperty(_this, member, {
                                        configurable: false
                                    });
                                    break;
                                case 'func':
                                    if (member === '_constructor') {
                                        _this = Object.freeze(_this);
                                    } else {
                                        Object.defineProperty(_this, member, {
                                            configurable: false
                                        });                                    
                                    }
                                    break;
                            }
                        }
                    }
                }

                // done
               return _this;
            };
            Class.Inherits = inherits;
            Class.Name = name;

            // return
            return Class;
        };

        // using
        oops.using = (obj, where) => {
            try {
                where(obj);
            } finally {
                if (obj._ && obj._.dispose.length > 0) {
                    obj._.dispose.reverse();
                    for(let dispose of obj._.dispose) {
                        dispose();
                    }
                }
            }
        };

        // expose to environment
        if (env) {
            env.Class = oops.Class;
            env.using = oops.using;
        }

        // return
        return Object.freeze(oops);
    };

    // export
    if (typeof (typeof module !== 'undefined' && module !== null ? module.exports : void 0) === 'object') {
        module.exports = oojs;
    } else if (typeof define === 'function' && define.amd) {
        define(function() { return oojs; });
    } else {
        this.oojs = oojs;
    }
}).call(this);
