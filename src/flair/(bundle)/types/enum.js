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
*                    ''
 *                    Use this only when putting only one type in a file and using flairBuild builder to build assembly
 *                    And in that case, filename will be used as type name. So if file name is 'MyType.js', name would be 'MyType' (case sensitive)
 *                    To give namespace to a type, use $$('ns', 'com.product.feature');
 *                    Apply this attribute on type definition itself. then type can be accessed as getType('com.product.feature.MyType');
 *                    To put a type in root namespace, use $$('ns' '(root)') or just put it in '(root)' folder and use auto-naming
 *                    Then type can be accessed as getType('MyType');
 *                    Note: When auto-naming is being used, namespace is also added automatically, and $$('ns') should not be applied
 *  factory: function - factory function to build enum definition
 * @returns type - constructed flair enum type
 */
const _Enum = (name, factory) => {
    let args = _Args('name: string, factory: cfunction')(name, factory); args.throwOnError(_Enum);

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
        },
        mex: {   // meta extensions
            instance: {
                getName: function (value) { 
                    // get internal information { instance.{obj, def, attrs, modifiers}, type.{Type, def, attrs, modifiers}}
                    let obj = this.instance.obj,
                        def = this.instance.def;

                    // check where this value is
                    let name = '';
                    for(let memberName in def.members) {
                        if (def.members.hasOwnProperty(memberName)) {
                            if (def.members[memberName] === 'prop') {
                                if (obj[memberName] === value) {
                                    name = memberName; break;
                                }
                            }
                        }
                    }

                    // return
                    return name;
                },
                getNames: function () { 
                    // get internal information { instance.{obj, def, attrs, modifiers}, type.{Type, def, attrs, modifiers}}
                    let def = this.instance.def;

                    let names = [];
                    for(let memberName in def.members) {
                        if (def.members.hasOwnProperty(memberName)) {
                            if (def.members[memberName] === 'prop') {
                                names.push(memberName);
                            }
                        }
                    }

                    // return
                    return names;
                },
                getValues: function () {
                    // get internal information { instance.{obj, def, attrs, modifiers}, type.{Type, def, attrs, modifiers}}
                    let def = this.instance.def,
                        obj = this.instance.obj;

                    let values = [];
                    for(let memberName in def.members) {
                        if (def.members.hasOwnProperty(memberName)) {
                            if (def.members[memberName] === 'prop') {
                                values.push(obj[memberName]);
                            }
                        }
                    }

                    // return
                    return values;
                }          
            }
        }
    };

    // return built type
    return builder(cfg);
};

// enum static methods
_Enum.getName = (enumType, enumValue) => {
    let args = _Args('enumType: enum, enumValue: number')(enumType, enumValue); args.throwOnError(_Enum.getName);
    return enumType[meta].getName(enumValue);
};
_Enum.getNames = (enumType) => {
    let args = _Args('enumType: enum')(enumType); args.throwOnError(_Enum.getNames);
    return enumType[meta].getNames();
};
_Enum.getValues = (enumType) => {
    let args = _Args('enumType: enum')(enumType); args.throwOnError(_Enum.getValues);    
    return enumType[meta].getValues();
};
_Enum.isDefined = (enumType, nameOrValue) => {
    let args = _Args('enumType: enum, nameOrValue: number',
                     'enumType: enum, nameOrValue: string')(enumType, nameOrValue); args.throwOnError(_Enum.isDefined);
    if (args.index === 1) { // i.e., nameOrValue = string
        return (enumType[meta].getNames().indexOf(nameOrValue) !== -1);
    } 
    return (enumType[meta].getName(nameOrValue) !== '');
};

// attach to flair
a2f('Enum', _Enum);
