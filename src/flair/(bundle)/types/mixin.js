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
 *                    '(auto)'
 *                    Use this only when putting only one mixin in a file and using flair.cli builder to build assembly
 *                    And in that case, filename will be used as mixin name. So if file name is 'MyMixin.js', name would be 'MyMixin' (case sensitive)
 *                    To give namespace to a type, use $$('ns', 'com.product.feature');
 *                    Apply this attribute on mixin definition itself. then mixin can be accessed as getType('com.product.feature.MyMixin');
 *                    To give automatic namespaces to types based on the folder structure under assembly folder, use
 *                    $$('ns', '(auto)'); In this case if MyMixin was put in a folder hierarchy as com/product/feature, it will
 *                    be given namespace com.product.feature
 *                    To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and
 *                    use $$('ns', '(auto)');
 *                    Then mixin can be accessed as getType('MyMixin');
 *  factory: function - factory function to build mixin definition
 * @returns type - constructed flair mixin type
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
