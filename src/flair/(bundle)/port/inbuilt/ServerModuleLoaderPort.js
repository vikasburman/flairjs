
/**
 * @name ServerModuleLoaderPort
 * @description Default server module loading implementation
 */
const ServerModuleLoaderPort = function() {
    this.name = 'serverModule';

    this.require = async (module) => {
        if (typeof module !== 'string') { throw _Exception.InvalidArgument('module'); }
        return require(module); // both worker and normal scenarios, same loading technique
    };
    this.undef = (module) => {
        if (typeof module !== 'string') { throw _Exception.InvalidArgument('module'); }
        delete require.cache[require.resolve(module)]
    };
};
