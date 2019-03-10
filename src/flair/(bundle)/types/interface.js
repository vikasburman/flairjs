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
 *                    '(auto)'
 *                    Use this only when putting only one interface in a file and using flair.cli builder to build assembly
 *                    And in that case, filename will be used as interface name. So if file name is 'IInterfaceName.js', name would be 'IInterfaceName' (case sensitive)
 *                    To give namespace to a type, use $$('ns', 'com.product.feature');
 *                    Apply this attribute on interface definition itself. then interface can be accessed as getType('com.product.feature.IInterfaceName');
 *                    To give automatic namespaces to types based on the folder structure under assembly folder, use
 *                    $$('ns', '(auto)'); In this case if IInterfaceName was put in a folder hierarchy as com/product/feature, it will
 *                    be given namespace com.product.feature
 *                    To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and
 *                    use $$('ns', '(auto)');
 *                    Then interface can be accessed as getType('IInterfaceName');
 *  factory: function - factory function to build interface definition
 * @returns type - constructed flair interface type
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
