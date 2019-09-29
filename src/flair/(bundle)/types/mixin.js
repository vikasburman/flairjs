/**
 * @name Mixin
 * @description Constructs a Mixin type
 * @example
 *  Mixin(name, factory)
 * @params
 *  name: string - name of the mixin
 *                 >> simple, e.g.,
 *                    MyMixin
 *                 >> auto naming, e.g., 
 *                    ''
 *                    Use this only when putting only one type in a file and using flairBuild builder to build assembly
 *                    And in that case, filename will be used as type name. So if file name is 'MyType.js', name would be 'MyType' (case sensitive)
 *                    To give namespace to a type, use $$('ns', 'com.product.feature');
 *                    Apply this attribute on type definition itself. then type can be accessed as getType('com.product.feature.MyType');
 *                    To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and use auto-naming
 *                    Then type can be accessed as getType('MyType');
 *                    Note: When auto-naming is being used, namespace is also added automatically, and $$('ns') should not be applied
 *  factory: function - factory function to build mixin definition
 * @returns {type} - constructed flair mixin type
 */
const _Mixin = (name, factory) => {
    let args = _Args('name: string, factory: cfunction')(name, factory); args.throwOnError(_Mixin);

    // builder config
    let cfg = {
        func: true,
        prop: true,
        propGetterSetter: true,
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
