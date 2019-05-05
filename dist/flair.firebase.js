/**
 * @preserve
 * Flair.js
 * True Object Oriented JavaScript
 * 
 * Assembly: flair.firebase
 *     File: ./flair.firebase.js
 *  Version: 0.50.40
 *  Sun, 05 May 2019 02:31:43 GMT
 * 
 * (c) 2017-2019 Vikas Burman
 * Licensed under MIT
 */
(() => {
'use strict';

/* eslint-disable no-unused-vars */
const flair = (typeof global !== 'undefined' ? require('flairjs') : (typeof WorkerGlobalScope !== 'undefined' ? WorkerGlobalScope.flair : window.flair));
const { Class, Struct, Enum, Interface, Mixin, Aspects, AppDomain, $$, attr, bring, Container, include, Port, on, post, telemetry,
				Reflector, Serializer, Tasks, as, is, isComplies, isDerivedFrom, isAbstract, isSealed, isStatic, isSingleton, isDeprecated,
				isImplements, isInstanceOf, isMixed, getAssembly, getAttr, getContext, getResource, getRoute, getType, ns, getTypeOf,
				getTypeName, typeOf, dispose, using, Args, Exception, noop, nip, nim, nie, event } = flair;
const { TaskInfo } = flair.Tasks;
const { env } = flair.options;
const DOC = ((env.isServer || env.isWorker) ? null : window.document);
const { forEachAsync, replaceAll, splitAndTrim, findIndexByProp, findItemByProp, which, guid, isArrowFunc, isASyncFunc, sieve,
				b64EncodeUnicode, b64DecodeUnicode } = flair.utils;
const { $$static, $$abstract, $$virtual, $$override, $$sealed, $$private, $$privateSet, $$protected, $$protectedSet, $$readonly, $$async,
				$$overload, $$enumerate, $$dispose, $$post, $$on, $$timer, $$type, $$args, $$inject, $$resource, $$asset, $$singleton, $$serialize,
				$$deprecate, $$session, $$state, $$conditional, $$noserialize, $$ns } = $$;

// define current context name
const __currentContextName = AppDomain.context.current().name;

// define loadPathOf this assembly
let __currentFile = (env.isServer ? __filename : window.document.currentScript.src.replace(window.document.location.href, './'));
let __currentPath = __currentFile.substr(0, __currentFile.lastIndexOf('/') + 1);
AppDomain.loadPathOf('flair.firebase', __currentPath)

// assembly level error handler
const __asmError = (err) => { AppDomain.onError(err); };
/* eslint-enable no-unused-vars */

// default assembly settings
let settings = {}; // eslint-disable-line no-unused-vars
let settingsReader = flair.Port('settingsReader');
if (typeof settingsReader === 'function') {
let externalSettings = settingsReader('flair.firebase');
if (externalSettings) { settings = Object.assign(settings, externalSettings); }}
settings = Object.freeze(settings);

// default assembly config
let config = {}; // eslint-disable-line no-unused-vars
config = Object.freeze(config);

AppDomain.context.current().currentAssemblyBeingLoaded('./flair.firebase{.min}.js');

try{

(async () => { // ./src/flair.firebase/flair.app.server/FirebaseServer.js
try{
// const fs = await include('fs | x');
// const http = await include('http | x');
// const https = await include('https | x');
// const httpShutdown = await include('http-shutdown | x');

/**
 * @name FirebaseServer
 * @description Firebase Server implementation
 */

$$('ns', 'flair.app.server');
Mixin('FirebaseServer', function() {
    
    $$('override');
    this.start = async (base) => { 
        base();
    };

    $$('override');
    this.ready = (base) => { 
        base();
    };

    $$('override');
    this.stop = async (base) => { 
        base();
    };    
});
} catch(err) {
	__asmError(err);
}
})();

} catch(err) {
	__asmError(err);
}

AppDomain.context.current().currentAssemblyBeingLoaded('');

AppDomain.registerAdo('{"name":"flair.firebase","file":"./flair.firebase{.min}.js","mainAssembly":"flair","desc":"True Object Oriented JavaScript","title":"Flair.js","version":"0.50.40","lupdate":"Sun, 05 May 2019 02:31:43 GMT","builder":{"name":"<<name>>","version":"<<version>>","format":"fasm","formatVersion":"1","contains":["initializer","functions","types","enclosureVars","enclosedTypes","resources","assets","routes","selfreg"]},"copyright":"(c) 2017-2019 Vikas Burman","license":"MIT","types":["flair.app.server.FirebaseServer"],"resources":[],"assets":[],"routes":[]}');

if(typeof onLoadComplete === 'function'){ onLoadComplete(); onLoadComplete = noop; } // eslint-disable-line no-undef

})();
