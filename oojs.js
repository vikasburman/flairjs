/**
 * oojs.js
 * version 1.0.0
 * (C) 2017, Vikas Burman
 * MIT License 
 */
(function() {
    // the definition
    const def = (env) => {
        let oojs = {};

        // Class
        oojs.Class = (className, inherits, factory) => {
            if (typeof factory !== 'function') {
                factory = inherits;
                inherits = null;
            }         

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
                const attr = (attrName, ...args) => {
                    attrName = attrName.replace('@', ''); // remove @ from name
                    bucket.push({name: attrName, Attr: getAttr(attrName), args: args});
                };                
                const getAttr = (attrName) => {
                    return attributes[attrName] || attributes['noop'];
                };
                const applyAttr = (targetName) => {
                   let Attr = null,
                        targetType = meta[targetName].type,
                        attrArgs = null,
                        attrInstance = null,
                        decorator = null;
                    for(let info of meta[targetName]) {
                        Attr = info.Attr;
                        attrArgs = info.args || [];
                        attrInstance = new Attr(...attrArgs);
                        decorator = attrInstance.decorator();
                        if (typeof decorator === 'function') {
                            let descriptor = Object.getOwnPropertyDescriptor(_this, targetName);
                            decorator(_this, targetType, targetName, descriptor);
                            Object.defineProperty(_this, targetName, descriptor);
                        }
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

                        // around func
                        let newFn = fn;
                        for(let aroundFn of around) {
                            newFn = aroundFn(ctx, newFn);
                        }                    
                        try {
                            ctx.result(newFn(...args));
                        } catch (err) {
                            error = err;
                        }

                        // after func
                        for(let afterFn of after) {
                            try {
                                afterFn(ctx);
                            } catch (err) {
                                error = err;
                            }
                        }

                        // return
                        return ctx.result();
                    }.bind(_this);

                    // done
                    return weavedFn;
                };
                const getClassAspects = () => {
                    let classAspects = {};
                    for(let entry in aspects) {
                        if (aspects.hasOwnProperty(entry)) {
                            if (isPatternMatched(entry.split('.')[0], className)) {
                                classAspects[entry] = aspects[entry];
                            }
                        }
                    }
                    return classAspects;
                };
                const getFuncAspects = (classAspects, funcName) => {
                    let funcAspects = [];
                    for(let entry in classAspects) {
                        if (classAspects.hasOwnProperty(entry)) {
                            if (isPatternMatched(entry.split('.')[1], funcName)) {
                                funcAspects.push(...classAspects[entry]);
                            }
                        }
                    }
                    return funcAspects;
                };
                const weave = () => {
                    let classAspects = getClassAspects(),
                        funcAspects = [];
                    for(let entry in meta) {
                        if (meta.hasOwnProperty(entry) && meta[entry].type === 'func' && ['_constructor', '_dispose'].indexOf(entry) === -1) {
                            funcAspects = getFuncAspects(classAspects, entry);
                            if (funcAspects.length > 0) {
                                Object.defineProperty(_this, entry, {
                                    value: applyAspects(entry, funcAspects)
                                });
                            }
                        }
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
                    if (hasAttr('override', meta[name])) {
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
                                // run fn with base
                                let fnArgs = [base].concat(args);                                
                                return fn(...fnArgs);
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
                    if (['constructor', 'dispose'].indexOf(name) !== -1) {  throw `${name} can only be defined as a function.`; }

                    // collect attributes
                    meta[name] = [].concat(bucket);
                    meta[name].type = 'prop';
                    bucket = [];
                    let attrs = meta[name];
                    
                    // define
                    if (hasAttr('override', meta[name])) {
                        // when overriding a property, it can only be redefined completely
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
                            set: hasAttr('readonly', attrs) ? (value) => { 
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
                            set: hasAttr('readonly', attrs) ? (value) => { 
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
                    if (['constructor', 'dispose'].indexOf(name) !== -1) {  throw `${name} can only be defined as a function.`; }

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

                // run factory
                factory.apply(_this, [attr]);

                // expose meta
                _this._ = _this._ || {};
                _this._.instanceOf = _this._.instanceOf || [];
                if (!Parent) {
                    _this._.instanceOf.push({name: 'Object', type: Object, meta: []});
                }
                _this._.instanceOf.push({name: className, type: Class, meta: meta});
                _this._.Inherits = Class;

                // constructor
                if (typeof _this._constructor === 'function') {
                    _this._constructor(...args);
                    delete _this._constructor;
                }

                // remove definition helper after constructor (so that if need be constructor 
                // can still define props and functions at runtime)
                delete _this.func;
                delete _this.prop;

                // dispose
                if (typeof _this._dispose === 'function') {
                    _this._.dispose = _this._.dispose || [];
                    let dispose = _this._dispose;
                    _this._.dispose.push(dispose);
                    delete _this._dispose;
                }

                // weave members with configured advises
                // except on Attribute and Aspect classes
                if (['Attribute', 'Aspect'].indexOf(inherits) === -1 && 
                    ['Attribute', 'Aspect'].indexOf(className) === -1) {
                    weave();
                }

                // seal attribute for constructor, properties and functions
                // are handled at the end
                for(let member in meta) {
                    if (meta.hasOwnProperty(member)) {
                        if (hasAttr('seal', meta[member])) {
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
            Class.Name = className;

            // return
            return Class;
        };

        // using
        oojs.using = (obj, where) => {
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

        // Attribute
        let attributes = {};
        oojs.Attributes = (Attribute) => {
            // register
            attributes[Attribute.Name] = Attribute;
        };
        oojs.Attribute = oojs.Class('Attribute', function() {
            let decoratorFn = null;
            this.func('constructor', (...args) => {
                this.args = args;
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

        // in-built attributes
        oojs.Attributes(oojs.Class('noop', oojs.Attribute, function() { 
        }));
        oojs.Attributes(oojs.Class('async', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['func'].indexOf(type) === -1) { throw `@async attribute cannot be applied on ${type} members. (${name})`; }
                if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `@async attribute cannot be applied on special function. (${name})`; }

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
        oojs.Attributes(oojs.Class('deprecate', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `@deprecate attribute cannot be applied on special function. (${name})`; }

                // decorate
                switch(type) {
                    case 'prop':
                        if (descriptor.get) {
                            let _get = descriptor.get;
                            descriptor.get = function() {
                                console.warn(`${name} is deprecated.`);
                                return _get();
                            }.bind(obj);
                        }
                        if (descriptor.set) {
                            let _set = descriptor.set;
                           descriptor.set = function(value) {
                                console.warn(`${name} is deprecated.`);
                                return _set(value);
                            }.bind(obj);
                        }   
                        break;
                    case 'func':
                        let fn = descriptor.value;
                        descriptor.value = function(...args) {
                            console.warn(`${name} is deprecated.`);
                            fn(...args);
                        }.bind(obj);
                        break;
                    case 'event':
                        let ev = descriptor.value;
                        descriptor.value = function(...args) {
                            console.warn(`${name} is deprecated.`);
                             ev(...args);
                        }.bind(obj);
                        this.resetEventInterface(fn, descriptor.value);
                        break;
                }
            });
        }));
        oojs.Attributes(oojs.Class('enumerate', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `@enumerate attribute cannot be applied on special function. (${name})`; }

                // decorate
                let flag = this.args[0];
                descriptor.enumerable = flag;
            });
        }));
        oojs.Attributes(oojs.Class('inject', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['func'].indexOf(type) === -1) { throw `@inject attribute cannot be applied on ${type} members. (${name})`; }
                if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `@inject attribute cannot be applied on special function. (${name})`; }

                // decorate
                let fn = descriptor.value,
                    Type = this.args[0],
                    typeArgs = this.args[1];
                if (!Array.isArray(typeArgs)) { typeArgs = [typeArgs]; }
                descriptor.value = function(...args) {
                    let instance = new Type(...typeArgs);
                    fn(instance, ...args);
                }.bind(obj);
            });
        }));
        oojs.Attributes(oojs.Class('multiinject', oojs.Attribute, function() {
            this.decorator((obj, type, name, descriptor) => {
                // validate
                if (['func'].indexOf(type) === -1) { throw `@multiinject attribute cannot be applied on ${type} members. (${name})`; }
                if (['_constructor', '_dispose'].indexOf(type) !== -1) { throw `@multiinject attribute cannot be applied on special function. (${name})`; }

                // decorate
                let fn = descriptor.value,
                    injections = this.args,
                    instances = [],
                    Type = null,
                    typeArgs = null;
                for(entry of injections) {
                    Type = entry.Type;
                    typeArgs = entry.typeArgs || [];
                    if (!Array.isArray(typeArgs)) { typeArgs = [typeArgs]; }
                    instances.push(new Type(...typeArgs));
                }
                descriptor.value = function(...args) {
                    let cumulativeArgs = instances.concat(args);
                    fn(...cumulativeArgs);
                }.bind(obj);
            });
        }));     

        // Aspect
        let aspects = {};
        oojs.Aspects = (pointcut, Aspect) => {
            // pointcut: classNamePattern.funcNamePattern
            //      classNamePattern:
            //          * - any class
            //          *<text> - any class name that ends with <text>
            //          <text>* - any class name that starts with <text>
            //          <text>  - exact class name
            //      funcNamePattern:
            //          * - any function
            //          *<text> - any func name that ends with <text>
            //          <text>* - any func name that starts with <text>
            //          <text>  - exact func name
            if (!aspects[pointcut]) {
                aspects[pointcut] = [];
            }
            aspects[pointcut].push(Aspect);
        };
        oojs.Aspect = oojs.Class('Aspect', function() {
            let beforeFn = null,
                afterFn = null,
                aroundFn = null;
            this.func('constructor', (...args) => {
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

        // expose to environment
        if (env) {
            env.Class = oojs.Class;
            env.using = oojs.using;
            env.Attribute = oojs.Attribute;
            env.Attributes = oojs.Attributes;
            env.Aspect = oojs.Aspect;
            env.Aspects = oojs.Aspects;            
        }

        // return
        return Object.freeze(oojs);
    };

    // export
    if (typeof (typeof module !== 'undefined' && module !== null ? module.exports : void 0) === 'object') {
        module.exports = def;
    } else if (typeof define === 'function' && define.amd) {
        define(function() { return def; });
    } else {
        this.oojs = def;
    }
}).call(this);