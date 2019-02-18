/**
 * @name Mixin
 * @description Constructs a Mixin type
 * @example
 *  Mixin(name, factory)
 * @params
 *  name: string - name of the mixin
 *                 it can take following forms:
 *                 >> simple, e.g.,
 *                    MyMixin
 *                 >> qualified, e.g., 
 *                    com.myCompany.myProduct.myFeature.MyMixin
 *                 >> special, e.g.,
 *                    .MyMixin
 *         NOTE: Qualified names are automatically registered with Namespace while simple names are not.
 *               to register simple name on root Namespace, use special naming technique, it will register
 *               this with Namespace at root, and will still keep the name without '.'
 *  factory: function - factory function to build mixin definition
 * @returns type - constructed flair mixin type
 */
const _Mixin = (name, factory) => {
    let args = _Args('name: string, factory: function')(name, factory);
    if (args.isInvalid) { throw args.error; }

    // builder config
    let cfg = {
        func: true,
        prop: true,
        event: true,
        customAttrs: true,
        types: {
            type: 'mixin'
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
a2f('Mixin', _Mixin);
