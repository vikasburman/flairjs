// assembly closure init (start)
/* eslint-disable no-unused-vars */

// flair types, variables and functions
const { Class, Struct, Enum, Interface, Mixin, Aspects, AppDomain, $$, attr, bring, Container, include, Port, on, post, telemetry,
        Reflector, Serializer, Tasks, as, is, isComplies, isDerivedFrom, isAbstract, isSealed, isStatic, isSingleton, isDeprecated,
        isImplements, isInstanceOf, isMixed, getAssembly, getAttr, getContext, getResource, getRoute, getType, ns, getTypeOf,
        getTypeName, typeOf, dispose, using, Args, Exception, noop, nip, nim, nie, event } = flair;
const { TaskInfo } = flair.Tasks;
const { env } = flair.options;
const { forEachAsync, replaceAll, splitAndTrim, findIndexByProp, findItemByProp, which, guid, isArrowFunc, isASyncFunc, sieve,
        b64EncodeUnicode, b64DecodeUnicode } = flair.utils;

// inbuilt modifiers and attributes compile-time-safe support
const { $$static, $$abstract, $$virtual, $$override, $$sealed, $$private, $$privateSet, $$protected, $$protectedSet, $$readonly, $$async,
        $$overload, $$enumerate, $$dispose, $$post, $$on, $$timer, $$type, $$args, $$inject, $$resource, $$asset, $$singleton, $$serialize,
        $$deprecate, $$session, $$state, $$conditional, $$noserialize, $$ns } = $$;

// access to DOC
const DOC = ((env.isServer || env.isWorker) ? null : window.document);

// current for this assembly
const __currentContextName = AppDomain.context.current().name;
const __currentFile = __asmFile;
const __currentPath = __currentFile.substr(0, __currentFile.lastIndexOf('/') + 1);
AppDomain.loadPathOf('<<asm>>', __currentPath);

// settings of this assembly
let settings = JSON.parse('<<settings>>');
let settingsReader = flair.Port('settingsReader');
if (typeof settingsReader === 'function') {
let externalSettings = settingsReader('<<asm>>');
if (externalSettings) { settings = Object.assign(settings, externalSettings); }
}
settings = Object.freeze(settings);

// config of this assembly
let config = JSON.parse('<<config>>');
config = Object.freeze(config);

/* eslint-enable no-unused-vars */
// assembly closure init (end)

// assembly global functions (start)
<<asm_functions>>
// assembly global functions (end)

// set assembly being loaded
AppDomain.context.current().currentAssemblyBeingLoaded('<<which_file>>');

// assembly types (start)
<<asm_types>>
// assembly types (end)

// assembly embedded resources (start)
<<asm_resources>>
// assembly embedded resources (end)        

// clear assembly being loaded
AppDomain.context.current().currentAssemblyBeingLoaded('');