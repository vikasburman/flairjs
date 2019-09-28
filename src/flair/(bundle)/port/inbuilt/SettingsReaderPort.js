/**
 * @name SettingsReaderPort
 * @description Default settings reader implementation
 */
const SettingsReaderPort = function() {
    this.name = 'settingsReader';

    this.read = (asmName) => {
        if (typeof asmName !== 'string') { throw _Exception.InvalidArgument('asmName'); }

        /** 
         * NOTE: appConfig.json (on server) and webConfig.json (on client)
         * is the standard config file which can contain settings for every
         * assembly for various settings. Only defined settings will be overwritten 
         * over inbuilt settings of that assembly's setting.json
         * there can be two versions of settings for each assembly:
         * 1. when assembly is loaded in main thread
         * 2. when assembly is loaded on worker thread
         * these can be defined as:
         * {
         *      "assemblyName": { <-- this is used when assembly is loaded in main thread
         *          "settingName1": "settingValue",
         *          "settingName2": "settingValue"
         *      }
         *      "worker:assemblyName": { <-- this is used when assembly is loaded in worker thread
         *          "settingName1": "settingValue",
         *          "settingName2": "settingValue"
         *      }
         * }
         * Note: The whole settings of the assembly are merged in following order as:
         * A. When assembly is being loaded in main thread:
         *      settings.json <-- appConfig/webConfig.assemblyName section
         * B. When assembly is being loaded in worker thread:
         *      settings.json <-- appConfig/webConfig:assemblyName section <-- appConfig/webConfig:worker:assemblyName section
         * 
         * This means, when being loaded on worker, only differentials should be defined for worker environment
         * which can be worker specific settings
         * 
         * NOTE: under every "assemblyName", all settings underneath are deep-merged, except arrays
         *       arrays are always overwritten
        */

        // return relevant settings
        let settings = {},
            configFileJSON = _AppDomain.config();
        if (configFileJSON && configFileJSON[asmName]) { // pick non-worker settings
            settings = deepMerge([settings, configFileJSON[asmName]], false);
        }
        if (options.env.isWorker && configFileJSON && configFileJSON[`worker:${asmName}`]) { // overwrite with worker section if defined
            settings = deepMerge([settings, configFileJSON[`worker:${asmName}`]], false);
        }
        return settings;
    };
};
