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
    if (_typeOf(enumType) !== 'enum') { throw _Exception('InvalidArgument', 'Argument type is invalid. (enumType)'); }
    if (typeof enumValue !== 'number') { throw _Exception('InvalidArgument', 'Argument type is invalid. (enumValue)'); }
    return enumType._.getName(enumValue);
};
_Enum.getNames = (enumType) => {
    if (_typeOf(enumType) !== 'enum') { throw _Exception('InvalidArgument', 'Argument type is invalid. (enumType)'); }
    return enumType._.getNames();
};
_Enum.getValues = (enumType) => {
    if (_typeOf(enumType) !== 'enum') { throw _Exception('InvalidArgument', 'Argument type is invalid. (enumType)'); }
    return enumType._.getValues();
};
_Enum.isDefined = (enumType, nameOrValue) => {
    if (_typeOf(enumType) !== 'enum') { throw _Exception('InvalidArgument', 'Argument type is invalid. (enumType)'); }
    if (typeof nameOrValue === 'string') {
        return (enumType._.getNames().indexOf(nameOrValue) !== -1);
    } else if (typeof nameOrValue === 'number') {
        return (enumType._.getName(nameOrValue) !== '');
    } else {
        throw _Exception('InvalidArgument', 'Argument type is invalid. (nameOrValue)');
    }
};

// attach to flair
a2f('Enum', _Enum);
