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

        if (settings.server.nsenvVars.vars.length > 0) {
            const nodeEnv = await include('node-env-file | x');

            if (nodeEnv) {
                for(let envVar of settings.server.envVars.vars) {
                    nodeEnv(AppDomain.resolvePath(envVar), settings.server.envVars.options);
                }
            }
        }
    };
});
