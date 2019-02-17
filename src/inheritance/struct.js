/**
 * @name Struct
 * @description Constructs a Struct type
 * @example
 *  Struct(name, factory)
 *  Struct(name, implementations, factory)
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
 *  implementations: array - An array of mixin and/or interface types which needs to be applied to this struct type
 *                        mixins will be applied in order they are defined here
 *  factory: function - factory function to build struct definition
 * @returns type - constructed flair struct type
 */
const _Struct = (name, implementations, factory) => {
    if (typeof name !== 'string') { throw _Exception.InvalidArgument('name'); }
    if (_typeOf(implementations) === 'array') {
        if (typeof factory !== 'function') { throw _Exception.InvalidArgument('factory'); }
    } else if (typeof implementations !== 'function') {
        throw _Exception.InvalidArgument('factory');
    } else {
        factory = implementations;
        implementations = [];
    }

    // builder config
    let cfg = {
        mixins: true,
        interfaces: true,
        static: true,
        func: true,
        construct: true,
        prop: true,
        event: true,
        customAttrs: true,
        types: {
            instance: 'sinstance',
            type: 'struct'
        },
        params: {
            typeName: name,
            inherits: null,
            mixinsAndInterfaces: implementations,
            factory: factory
        }
    };

    // return built type
    return builder(cfg);
};

// attach
flair.Struct = Object.freeze(_Struct);
flair.members.push('Struct');
