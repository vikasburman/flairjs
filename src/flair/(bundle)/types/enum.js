/**
 * @name Enum
 * @description Constructs a Enum type
 * @example
 *  Enum(name, factory)
 * @params
 *  name: string - name of the enum
 *                 >> simple, e.g.,
 *                    MyEnum
 *                 >> auto naming, e.g., 
 *                    '(auto)'
 *                    Use this only when putting only one enum in a file and using flair.cli builder to build assembly
 *                    And in that case, filename will be used as enum name. So if file name is 'MyEnum.js', name would be 'MyEnum' (case sensitive)
 *                    To give namespace to a type, use $$('ns', 'com.product.feature');
 *                    Apply this attribute on enum definition itself. then enum can be accessed as getType('com.product.feature.MyEnum');
 *                    To give automatic namespaces to types based on the folder structure under assembly folder, use
 *                    $$('ns', '(auto)'); In this case if MyEnum was put in a folder hierarchy as com/product/feature, it will
 *                    be given namespace com.product.feature
 *                    To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and
 *                    use $$('ns', '(auto)');
 *                    Then enum can be accessed as getType('MyEnum');
 *  factory: function - factory function to build enum definition
 * @returns type - constructed flair enum type
 */
const _Enum = (name, factory) => {
    let args = _Args('name: string, factory: cfunction')(name, factory);
    if (args.isInvalid) { throw args.error; }

    // builder config
    let cfg = {
        const: true,
        prop: true,
        numOnlyProps: true,
        types: {
            instance: 'enum',
            type: 'enum'
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
a2f('Enum', _Enum);
