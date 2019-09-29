/**
 * @name Struct
 * @description Constructs a Struct type
 * @example
 *  Struct(name, factory)
 * @params
 *  name: string - name of the struct
 *                 >> simple, e.g.,
 *                    MyStruct
 *                 >> auto naming, e.g., 
 *                    ''
 *                    Use this only when putting only one type in a file and using flairBuild builder to build assembly
 *                    And in that case, filename will be used as type name. So if file name is 'MyType.js', name would be 'MyType' (case sensitive)
 *                    To give namespace to a type, use $$('ns', 'com.product.feature');
 *                    Apply this attribute on type definition itself. then type can be accessed as getType('com.product.feature.MyType');
 *                    To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and use auto-naming
 *                    Then type can be accessed as getType('MyType');
 *                    Note: When auto-naming is being used, namespace is also added automatically, and $$('ns') should not be applied
 *  factory: function - factory function to build struct definition
 * @returns {type} - constructed flair struct type
 */
const _Struct = (name, factory) => {
    let args = _Args('name: string, factory: cfunction')(name, factory); args.throwOnError(_Struct);

    // builder config
    let cfg = {
        new: true,
        func: true,
        construct: true,
        prop: true,
        propGetterSetter: true,
        types: {
            instance: 'sinstance',
            type: 'struct'
        },
        params: {
            typeName: args.values.name,
            factory: args.values.factory
        }
    };

    // return built type
    return builder(cfg);
};

// attach to flair
a2f('Struct', _Struct);
