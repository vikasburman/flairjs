options = Object.freeze({
    symbols: Object.freeze(sym),
    env: Object.freeze({
        type: opts.env || (isServer ? 'server' : 'client'),
        isTesting: isTesting,
        isServer: isServer,
        isClient: !isServer,
        isProd: (sym.indexOf('PROD') !== -1),
        isDebug: (sym.indexOf('DEBUG') !== -1),
        global: _global,
        supressGlobals: (typeof opts.supressGlobals === 'undefined' ? false : opts.supressGlobals),
        args: _args
    }),
    loaders: Object.freeze({
        module: Object.freeze({ // (file) => {} that gives a promise to resolve with the module object, on success
            server: opts.moduleLoaderServer || null,
            client: opts.moduleLoaderClient || null  
        }),
        file: Object.freeze({ // (file) => {} that gives a promise to resolve with file content, on success
            server: opts.fileLoaderServer || null,
            client: opts.fileLoaderClient || null
        }),
        define: (type, fn) => {
            if (_Args('string, function')(type, fn).isInvalid()) { throw new _Exception('InvalidArgument', `Arguments type error. (${type})`); }
            let loaderOverrides = flair.options.loaderOverrides;
            switch(type) { // NOTE: only once these can be defined after loading
                case 'sm': loaderOverrides.moduleLoaderServer = loaderOverrides.moduleLoaderServer || fn; break;
                case 'cm': loaderOverrides.moduleLoaderClient = loaderOverrides.moduleLoaderClient || fn; break;
                case 'sf': loaderOverrides.fileLoaderServer = loaderOverrides.fileLoaderServer || fn; break;
                case 'cf': loaderOverrides.fileLoaderClient = loaderOverrides.fileLoaderClient || fn; break;
            }
        }
    }),
    loaderOverrides: {
        moduleLoaderServer: null,
        moduleLoaderClient: null,
        fileLoaderServer: null,
        fileLoaderClient: null
    }
});

// special symbols
if (options.env.isProd && options.env.isDebug) { // when both are given
    throw new _Exception('InvalidOption', `DEBUG and PROD symbols are mutually exclusive. Use only one of these symbols.`);
}