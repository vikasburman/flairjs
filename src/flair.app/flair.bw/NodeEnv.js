const env = require('node-env-file');
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
    this.boot = async () => {
        if (settings.envVars.length > 0) {
            for(let envVar of settings.envVars) {
                env(envVar, settings.envVarsLoadOptions);
            }
        }
    };
});
