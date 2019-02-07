/**
 * @name Class
 * @description Constructs a Class type.
 * @example
 *  Class(name, factory)
 *  Class(name, inherits, factory)
 *  Class(name, applications, factory)
 *  Class(name, inherits, applications, factory)
 * @params
 *  name: string - name of the class
 *                 it can take following forms:
 *                 >> simple, e.g.,
 *                    MyClass
 *                 >> qualified, e.g., 
 *                    com.myCompany.myProduct.myFeature.MyClass
 *                 >> special, e.g.,
 *                    .MyClass
 *         NOTE: Qualified names are automatically registered with Namespace while simple names are not.
 *               to register simple name on root Namespace, use special naming technique, it will register
 *               this with Namespace at root, and will still keep the name without '.'
 *  inherits: type - A flair class type from which to inherit this class
 *  applications: array - An array of mixin and/or interface types which needs to be applied to this class type
 *                        mixins will be applied in order they are defined here
 *  factory: function - factory function to build class definition
 * @returns type - constructed flair class type
 * @throws
 *  InvalidArgumentException
 */
flair.Class = (name, inherits, mixinsAndInterfaces, factory) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
    switch(_typeOf(inherits)) {
        case 'function':
            factory = inherits;
            inherits = null;
            mixinsAndInterfaces = [];
            break;
        case 'array':
            if (typeof mixinsAndInterfaces !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (factory)'); }
            factory = mixinsAndInterfaces;
            mixinsAndInterfaces = inherits;
            inherits = null;
            break;
        case 'class':
            if (['array', 'function'].indexOf(_typeOf(mixinsAndInterfaces)) === -1) { throw new _Exception('InvalidArgument', 'Argument type is invalid. (factory)'); }
            if (typeof mixinsAndInterfaces === 'function') {
                factory = mixinsAndInterfaces;
                mixinsAndInterfaces = [];
            } else {
                if (typeof factory !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (factory)'); }
            }
            break;
        default:
            throw new _Exception('InvalidArgument', 'Argument type is invalid. (factory)'); 
    }

    // builder config
    let cfg = {};
    cfg.config = {
        mixins: true,
        interfaces: true,
        inheritance: true,
        singleton: true,
        static: true,
        func: true,
        construct: true,
        dispose: true,
        prop: true,
        event: true,
        storage: true,
        aop: true,
        customAttrs: true,
        serialize: true
    };
    cfg.params = {
        typeName: name,
        inherits: inherits,
        mixinsAndInterfaces: mixinsAndInterfaces,
        factory: factory
    };
    cfg.instance = {
        type: 'instance'
    };
    cfg.type = {
        type: 'class'
    };
    cfg.instance.mex = {
    };
    cfg.type.mex = {
    }; 

    // return built type
    return builder(cfg);
};

// add to members list
flair.members.push('Class');