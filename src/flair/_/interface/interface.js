/**
 * @name Interface
 * @description Constructs a Interface type
 * @example
 *  Interface(name, factory)
 * @params
 *  name: string - name of the interface
 *                 it can take following forms:
 *                 >> simple, e.g.,
 *                    MyInterface
 *                 >> qualified, e.g., 
 *                    com.myCompany.myProduct.myFeature.MyInterface
 *                 >> special, e.g.,
 *                    .MyInterface
 *         NOTE: Qualified names are automatically registered with Namespace while simple names are not.
 *               to register simple name on root Namespace, use special naming technique, it will register
 *               this with Namespace at root, and will still keep the name without '.'
 *  factory: function - factory function to build interface definition
 * @returns type - constructed flair interface type
 */
const _Interface = (name, factory) => {
    let args = _Args('name: string, factory: function')(name, factory);
    if (args.isInvalid) { throw args.error; }

    // builder config
    let cfg = {
        func: true,
        prop: true,
        event: true,
        types: {
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
