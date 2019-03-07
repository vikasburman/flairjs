/**
 * @name Class
 * @description Constructs a Class type.
 * @example
 *  Class(name, factory)
 *  Class(name, inherits, factory)
 *  Class(name, mixints, factory)
 *  Class(name, inherits, mixints, factory)
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
 *  mixints: array - An array of mixin and/or interface types which needs to be applied to this class type
 *                        mixins will be applied in order they are defined here
 *  factory: function - factory function to build class definition
 * @returns type - constructed flair class type
 */
const _Class = (name, inherits, mixints, factory) => {
    let args = _Args('name: string, factory: function', 
                     'name: string, inherits: class, factory: function',
                     'name: string, mixints: array, factory: function',
                     'name: string, inherits: class, mixints: array, factory: function')(name, inherits, mixints, factory);
    if (args.isInvalid) { throw args.error; }

    // builder config (full set of configuration)
    let cfg = {
        new: true,
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
        types: {
            instance: 'instance',
            type: 'class'
        },
        params: {
            typeName: args.values.name,
            inherits: args.values.inherits,
            mixinsAndInterfaces: args.values.mixints,
            factory: args.values.factory
        },
        mex: {  // meta extensions (under <>._ property)
            instance: {},
            type: {}
        },
        ex: {   // extensions (on <> itself)
            instance: {},
            type: {}
        }
    };
    
    // return built type
    return builder(cfg);
};

// attach to flair
a2f('Class', _Class);