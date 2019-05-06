const nodeEnv = await include('node-env-file | x');
const { Bootware } = ns('flair.app');

/**
 * @name NodeEnv
 * @description Node Environment Settings
 */
$$('sealed');
$$('ns', '(auto)');
Class('(auto)', Bootware, function() {
    $$('override');
    this.construct = (base) => {
        base('Node Server Environment');
    };

    $$('override');
    this.boot = async (base) => {
        base();
        
        if (settings.envVars.length > 0) {
            for(let envVar of settings.envVars) {
                nodeEnv(AppDomain.resolvePath(envVar), settings.envVarsLoadOptions);
            }
        }
    };
});
