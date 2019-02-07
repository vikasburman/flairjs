/**
 * @name Struct
 * @description Constructs a Struct type.
 * @example
 *  Struct(name, factory)
 *  Struct(name, applications, factory)
 * @params
 *  name: string - name of the struct
 *                 it can take following forms:
 *                 >> simple, e.g.,
 *                    MyStruct
 *                 >> qualified, e.g., 
 *                    com.myCompany.myProduct.myFeature.MyStruct
 *                 >> special, e.g.,
 *                    .MyStruct
 *         NOTE: Qualified names are automatically registered with Namespace while simple names are not.
 *               to register simple name on root Namespace, use special naming technique, it will register
 *               this with Namespace at root, and will still keep the name without '.'
 *  applications: array - An array of mixin and/or interface types which needs to be applied to this struct type
 *                        mixins will be applied in order they are defined here
 *  factory: function - factory function to build struct definition
 * @returns type - constructed flair struct type
 * @throws
 *  InvalidArgumentException
 */
const _Struct = (name, mixinsAndInterfaces, factory) => {
    if (typeof name !== 'string') { throw _Exception.InvalidArgument('name'); }
    if (_typeOf(mixinsAndInterfaces) === 'array') {
        if (typeof factory !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (factory)'); }
    } else if (typeof mixinsAndInterfaces !== 'function') {
        throw new _Exception('InvalidArgument', 'Argument type is invalid. (factory)');
    } else {
        factory = mixinsAndInterfaces;
        mixinsAndInterfaces = [];
    }

    // builder config
    let cfg = {};
    cfg.config = {
        mixins: true,
        interfaces: true,
        static: true,
        func: true,
        construct: true,
        prop: true,
        event: true,
        customAttrs: true
    };
    cfg.params = {
        typeName: name,
        inherits: null,
        mixinsAndInterfaces: mixinsAndInterfaces,
        factory: factory
    };
    cfg.instance = {
        type: 'sinstance'
    };
    cfg.type = {
        type: 'struct'
    };
    cfg.instance.mex = {
    };
    cfg.type.mex = {
    }; 

    // return built type
    return builder(cfg);
};

// attach
flair.Struct = _Struct;
flair.members.push('Struct');