const path = require('path');

/**
 * @name minify_files
 * @description minify misc files for current profile, if configured
 * @example
 *  exec(settings, options, cb)
 * @params
 *  settings: object - plugin settings object
 *  options: object - build configuration object
 *  cb: function - callback function
 * @returns void
 */
exports.exec = async function(settings, options, cb) { // eslint-disable no-unused-vars
    if (!options.minify || !options.minifyConfig) { cb(); return; }
    if (!options.profiles.current.minify || options.profiles.current.minify.length === 0) { cb(); return; }

    options.logger(0, 'minify', '', true);

    // minify misc files on dest location
    let src = '';
    for(let toMinifyfile of options.profiles.current.minify) {
        src = path.resolve(path.join(options.profiles.current.dest, toMinifyfile));
        options.logger(1, '', toMinifyfile);
        await options.funcs.minifyFile(src);
    }

    // done
    cb();
};