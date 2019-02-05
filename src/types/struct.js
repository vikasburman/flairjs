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
 *                    ~MyStruct
 *                 >> super special. e.g.,
 *                    MyNewType<NewTypeName>
 *         NOTE: Qualified names are automatically registered with Namespace while simple names are not.
 *               to register simple name on root Namespace, use special naming technique, it will register
 *               this with Namespace and will still keep the name without '~'
 *              
 *               'NewTypeName' will be tha type of the structure instance created from this structure instead of
 *               'sinstance' This is generally used to create additional flair types or flair objects and should
 *               be avoided when using for normal application development
 *  applications: array - An array of mixin and/or interface types which needs to be applied to this struct type
 *                        mixins will be applied in order they are defined here
 *  factory: function - factory function to build struct definition
 * @returns type - constructed flair struct type
 * @throws
 *  InvalidArgumentException
 */
flair.Struct = (name, mixinsAndInterfaces, factory) => {
    if (typeof name !== 'string') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (name)'); }
    if (_typeOf(mixinsAndInterfaces) === 'array') {
        if (typeof factory !== 'function') { throw new _Exception('InvalidArgument', 'Argument type is invalid. (factory)'); }
    } else if (typeof mixinsAndInterfaces !== 'function') {
        throw new _Exception('InvalidArgument', 'Argument type is invalid. (factory)');
    } else {
        factory = mixinsAndInterfaces;
        mixinsAndInterfaces = [];
    }

    // extract custom type instance name, if specified 
    let instanceType = 'sinstance';
    if (name.indexOf('<') !== -1 && name.indexOf('>') !== -1) {
        instanceType = name.substr(name.indexOf('<') + 1)
        instanceType = instanceType.substr(0, instanceType.indexOf('>')).trim();
        name = name.substr(0, name.indexOf('<')).trim();
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
            readonly: true,
        event: true,
        conditional: true,
        duplicate: true,
        customAttrs: true,
        hide: true
    };
    cfg.params = {
        typeName: name,
        inherits: null,
        mixinsAndInterfaces: mixinsAndInterfaces,
        factory: factory
    };
    cfg.instance = {
        type: instanceType
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

// add to members list
flair.members.push('Struct');