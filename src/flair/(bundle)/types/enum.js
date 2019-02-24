/**
 * @name Enum
 * @description Constructs a Enum type
 * @example
 *  Enum(name, factory)
 * @params
 *  name: string - name of the enum
 *                 it can take following forms:
 *                 >> simple, e.g.,
 *                    MyEnum
 *                 >> qualified, e.g., 
 *                    com.myCompany.myProduct.myFeature.MyEnum
 *                 >> special, e.g.,
 *                    .MyEnum
 *         NOTE: Qualified names are automatically registered with Namespace while simple names are not.
 *               to register simple name on root Namespace, use special naming technique, it will register
 *               this with Namespace at root, and will still keep the name without '.'
 *  factory: function - factory function to build enum definition
 * @returns type - constructed flair enum type
 */
const _Enum = (name, factory) => {
    let args = _Args('name: string, factory: function')(name, factory);
    if (args.isInvalid) { throw args.error; }

    // builder config
    let cfg = {
        prop: true,
        types: {
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
