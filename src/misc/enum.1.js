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
 *  data: object - enum data in form of object literal. It can have:
 *                  { Key1, Key2, Key3, ... }
 *                  { Key1: startingValue, Key2, Key3, ... }
 *                  { Key1: value, Key2: value, Key3: value, ... }
 * 
 * TODO: https://www.alanzucconi.com/2015/07/26/enum-flags-and-bitwise-operators/
 * @returns type - constructed flair enum type
 */
const _Enum = (name, factory) => {
    if (typeof name !== 'string') { throw _Exception.InvalidArgument('name'); }
    if (typeof factory !== 'function') { throw _Exception.InvalidArgument('factory'); }

    // builder config
    let cfg = {
        prop: true, // TODO: fix this whole config
        types: {
            instance: 'einstance',
            type: 'enum'
        },
        params: {
            typeName: name,
            inherits: null,
            mixinsAndInterfaces: null,
            factory: factory
        }
    };

    // return built type
    return builder(cfg);
};

// attach
flair.Enum = Object.freeze(_Enum);
flair.members.push('Enum');


// // Enum
// // Enum(name, def)
// //  name: name of the enum
// //  def: object with key/values or an array of values
// flair.Enum = (name, data) => {
//     'use strict';

//     // args validation
//     if (!(typeof data === 'object' || Array.isArray(data))) { throw flair.Exception('ENUM01', 'Invalid enum data.'); }

//     // // enum type
//     // let _Enum = data;
//     // if (Array.isArray(data)) {
//     //     let i = 0,
//     //         _Enum = {};
//     //     for(let value of data) {
//     //         _Enum[i] = value; i++;
//     //     }
//     // } 

//     // // meta extensions
//     // let mex = {
//     //     keys: () => {
//     //         let keys = [];
//     //         for(let key in _Enum) {
//     //             if (_Enum.hasOwnProperty(key) && key !== '_') {
//     //                 keys.push(key);
//     //             }
//     //         }
//     //         return keys;
//     //     },
//     //     values: () => {
//     //         let values = [];
//     //         for(let key in _Enum) {
//     //             if (_Enum.hasOwnProperty(key) && key !== '_') {
//     //                 values.push(_Enum[key]);
//     //             }
//     //         }
//     //         return values;
//     //     }
//     // };

//     // return
//     //return flarizedType('enum', name, _Enum, mex);
// };
// flair.Enum.getKeys = (obj) => {
//     try {
//         return obj._.keys();
//     } catch (e) {
//         throw flair.Exception('ENUM02', 'Object is not an Enum.', e);
//     }
// };
// flair.Enum.getValues = (obj) => {
//     try {
//         return obj._.values();
//     } catch (e) {
//         throw flair.Exception('ENUM02', 'Object is not an Enum.', e);
//     }
// };
// flair.Enum.isDefined = (obj, keyOrValue) => {
//     return (flair.Enum.getKeys().indexOf(keyOrValue) !== -1 || flair.Enum.getValues().indexOf(keyOrValue) !== -1);
// };

