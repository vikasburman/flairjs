const path = require('path');
const fsx = require('fs-extra');

/**
 * @name write_env
 * @description generate a env.js file at dest having all defined env variables
 *              these env variables are loaded even before flair is loaded
 *              via flair-fabric start scripts
 * @example
 *  exec(settings, options, cb)
 * @params
 *  settings: object - plugin settings object
 *  options: object - build configuration object
 *  cb: function - callback function
 * @returns void
 */
exports.exec = function(settings, options, cb) { // eslint-disable no-unused-vars
    if (!options.profiles.current.env || !options.profiles.current.env.vars) { cb(); return; }

    options.logger(0, 'write_env', '', true);  

    // write env file
    let fileName = 'env.js',
        type = options.profiles.current.env.type || 'client',
        _vars = options.profiles.current.env.vars,
        content = '';
    let dest = path.resolve(path.join(options.profiles.current.dest, fileName));
    if (type.toLowerCase() === 'server') {
        for(let _var in _vars) {
            content += `process.env['${_var}'] = "${_vars[_var]}";\n`;
        }
    } else { // client
        for(let _var in _vars) {
            content += `window['${_var}'] = "${_vars[_var]}";\n`;
        }
    }
    fsx.writeFileSync(dest, content, 'utf8');

    options.logger(1, '', './' + fileName + ` [${_vars.length} vars]`);

    // done
    cb();
};