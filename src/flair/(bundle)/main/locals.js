/* eslint-disable no-unused-vars */
let isServer = new Function("try {return this===global;}catch(e){return false;}")(),
    isWorker = false,
    sym = [],
    symKey = 'FLAIR_SYMBOLS',
    symString = '',
    meta = Symbol('[meta]'),
    modulesRootFolder = 'modules',
    disposers = [],
    options = {},
    flairTypes = ['class', 'enum', 'interface', 'mixin', 'struct'],
    flairInstances = ['instance', 'sinstance'],
    settings = {},
    config = {},
    envX = null,
    envProps = {},
    isAppStarted = false;
/* eslint-enable no-unused-vars */

// worker setting
if (isServer) {
    try {
        let worker_threads = require('worker_threads');
        isWorker = worker_threads.isMainThread;
    } catch (err) { // eslint-disable-line no-unused-vars
        isWorker = false;
    }
} else { // client
    isWorker = (typeof WorkerGlobalScope !== 'undefined' ? true : false);
}

// read symbols from environment
// symbols can be pass in variety of formats: 
//  server: command line args (process.argv), environment variables (process.env.FLAIR_SYMBOLS)
//  worker-server: get whatever symbols collection server main thread had - passed as workerData.symbols
//  client: global variable (window.FLAIR_SYMBOLS)
//  worker-client: get whatever symbols collection client main thread had - set in WorkerGlobalScope
if (isServer) {
    if (isWorker) {
        // from workerData.symbols
        let workerData = require('worker_threads').workerData;
        symString = workerData.symbols || '';
    } else {
        // from process.argv
        let idx = process.argv.findIndex((item) => { return (item.startsWith(`--${symKey}`) ? true : false); });
        if (idx !== -1) { symString = process.argv[idx].substr(2).split('=')[1]; }

        // from process.env
        if (process.env[symKey]) { // add to list
            if (symString) { symString += ','; }
            symString += process.env[symKey];
        }
    }
} else { // client
    if (isWorker) {
        symString = WorkerGlobalScope[symKey] || '';
    } else {
        // from window
        symString += window[symKey] || '';
    }
}
if (symString) { sym = symString.split(',').map(item => item.trim()); }

// options
options.symbols = Object.freeze(sym);
options.env = Object.freeze({
    type: (isServer ? 'server' : 'client'),
    isServer: isServer,
    isClient: !isServer,
    isWorker : isWorker,
    isMain: !isWorker,
    cores: ((isServer ? (require('os').cpus().length) : window.navigator.hardwareConcurrency) || 4),
    isCordova: (!isServer && !!window.cordova),
    isNodeWebkit: (isServer && process.versions['node-webkit']),
    isProd: ((sym.indexOf('PROD') !== -1 || sym.indexOf('STAGE') !== -1) && sym.indexOf('DEV') === -1),
    isStage: (sym.indexOf('STAGE') !== -1 && sym.indexOf('DEV') === -1),        
    isDev: (sym.indexOf('DEV') !== -1),        
    isLocal: ((isServer ? require('os').hostname() : self.location.host).indexOf('local') !== -1),
    isDebug: (sym.indexOf('DEBUG') !== -1),
    isTest: (sym.indexOf('TEST') !== -1),
    isAppMode: () => { return isAppStarted; },
    x: (once) => { 
        if (!envX && once) { envX = Object.freeze(once); } // set once - extra env properties are added here during runtime, generally via reading from a config file - once
        return envX || {};
    },
    props: (ns, key, value) => {
        if (typeof value === 'undefined') {
            if (typeof key === 'undefined') {
                return envProps[ns] || {};
            } else {
                return (envProps[ns] ? envProps[ns][key] : null);
            }
        } else {
            envProps[ns] = envProps[ns] || {};
            if (value === null) {
                delete envProps[ns][key];
            } else {
                envProps[ns][key] = value;
            }
        }
    }
});
// Prod / Stage vs Dev are mutually exclusive environments
// Prod is set to true when either PROD or STAGE or both are present and DEV is not present
// Stage is true only when STAGE is present and DEV is not present
// Dev is true only when DEV is present even if PROD / STAGE is also present
// Local, Debug and Test can be true in any of these environments