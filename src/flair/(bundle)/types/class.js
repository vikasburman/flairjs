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
 *                 >> auto naming, e.g., 
 *                    '(auto)'
 *                    Use this only when putting only one class in a file and using flair.cli builder to build assembly
 *                    And in that case, filename will be used as class name. So if file name is 'MyClass.js', name would be 'MyClass' (case sensitive)
 *                    To give namespace to a type, use $$('ns', 'com.product.feature');
 *                    Apply this attribute on class definition itself. then class can be accessed as getType('com.product.feature.MyClass');
 *                    To give automatic namespaces to types based on the folder structure under assembly folder, use
 *                    $$('ns', '(auto)'); In this case if MyClass was put in a folder hierarchy as com/product/feature, it will
 *                    be given namespace com.product.feature
 *                    To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and
 *                    use $$('ns', '(auto)');
 *                    Then class can be accessed as getType('MyClass');
 *  inherits: type - A flair class type from which to inherit this class
 *  mixints: array - An array of mixin and/or interface types which needs to be applied to this class type
 *                        mixins will be applied in order they are defined here
 *  factory: function - factory function to build class definition
 * @returns type - constructed flair class type
 */
const _Class = (name, inherits, mixints, factory) => {
    let args = _Args('name: string, inherits: class, factory: cfunction',
                     'name: string, inherits: class, mixints: array, factory: cfunction',
                     'name: string, factory: cfunction', 
                     'name: string, mixints: array, factory: cfunction')(name, inherits, mixints, factory);
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
        propGetterSetter: true,
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