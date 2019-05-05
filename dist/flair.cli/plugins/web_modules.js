const path = require('path');
const fsx = require('fs-extra');
const copyDir = require('copy-dir');

/**
 * @name web_modules
 * @description copy defined node_modules for current profile, if configured
 * @example
 *  exec(settings, options, cb)
 * @params
 *  settings: object - plugin settings object
 *  options: object - build configuration object
 *  cb: function - callback function
 * @returns void
 */
exports.exec = function(settings, options, cb) { // eslint-disable no-unused-vars
    if (!options.profiles.current.modules || options.profiles.current.modules.length === 0) { cb(); return; }

    options.logger(0, 'modules', '', true);    

    // copy all defined modules from node_modules to destination's "modules" folder at root
    let src = '',
        dest = '';
    for(let module of options.profiles.current.modules) {
        src = path.resolve(path.join('node_modules', module));
        if (module.indexOf('/') !== -1) { // module and a folder is defined
            module = module.split('/')[0]; // pick first part only
        }
        dest = path.resolve(path.join(options.profiles.current.dest, 'modules', module))
        options.logger(1, '', module);
        fsx.ensureDirSync(dest);
        copyDir.sync(src, dest);
    }

    // done
    cb();
};