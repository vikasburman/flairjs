/**
 * @name Interface
 * @description Constructs a Interface type
 * @example
 *  Interface(name, factory)
 * @params
 *  name: string - name of the interface
 *                 it can take following forms:
 *                 >> simple, e.g.,
 *                    IInterfaceName
 *                 >> auto naming, e.g., 
 *                    ''
 *                    Use this only when putting only one type in a file and using flairBuild builder to build assembly
 *                    And in that case, filename will be used as type name. So if file name is 'MyType.js', name would be 'MyType' (case sensitive)
 *                    To give namespace to a type, use $$('ns', 'com.product.feature');
 *                    Apply this attribute on type definition itself. then type can be accessed as getType('com.product.feature.MyType');
 *                    To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and use auto-naming
 *                    Then type can be accessed as getType('MyType');
 *                    Note: When auto-naming is being used, namespace is also added automatically, and $$('ns') should not be applied
 *  factory: function - factory function to build interface definition
 * @returns {type} - constructed flair interface type
 */
const _Interface = (name, factory) => {
    let args = _Args('name: string, factory: cfunction')(name, factory); args.throwOnError(_Interface);

    // builder config
    let cfg = {
        const: true,
        func: true,
        dispose: true,
        prop: true,
        propGetterSetter: true, // note: because of allowing 'nip'
        event: true,
        types: {
            instance: 'interface',
            type: 'interface'
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
a2f('Interface', _Interface);
