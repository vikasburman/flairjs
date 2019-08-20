const path = require('path');
const fsx = require('fs-extra');

/**
 * @name write_flags
 * @description generate flags.json file at dest having all defined env variables
 *              and mark 'active' flag depending upon the build 'flag' is set in options
 *              flags.json is processed even before flair is loaded via flair-fabric start scripts
 * @example
 *  exec(settings, options, cb)
 * @params
 *  settings: object - plugin settings object
 *  options: object - build configuration object
 *  cb: function - callback function
 * @returns void
 */
exports.exec = function(settings, options, cb) { // eslint-disable no-unused-vars
    if (!options.profiles.current.flags) { cb(); return; }

    options.logger(0, 'flags', '', true);  

    // write flags file
    let fileName = 'flags.json',
        dest = path.resolve(path.join(options.profiles.current.dest, fileName)),
        flagsCopy = JSON.parse(JSON.stringify(options.profiles.current.flags)),
        content = '',
        active = options.activeFlag || settings.defaultFlag || '';
    
    // mark active
    if (!active) { console.log('Active flag is not defined. Use --flag <flagName> in package.json to define active flag.'); cb(); return; } // eslint-disable no-console
    flagsCopy.__active = active;
    content = JSON.stringify(flagsCopy);
    fsx.writeFileSync(dest, content, 'utf8');

    options.logger(1, '', './' + fileName + ` [${Object.keys(options.profiles.current.flags).length} flags]`);

    // done
    cb();
};