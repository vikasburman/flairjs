const path = require('path');
const fsx = require('fs-extra');

/**
 * @name set_symbols
 * @description generate a symbols.js file at dest having all defined symbols
 * @example
 *  exec(settings, options, cb)
 * @params
 *  settings: object - plugin settings object
 *  options: object - build configuration object
 *  cb: function - callback function
 * @returns void
 */
exports.exec = function(settings, options, cb) { // eslint-disable no-unused-vars
    if (!options.profiles.current.symbols || options.profiles.current.symbols.length === 0) { cb(); return; }

    options.logger(0, 'set_symbols', '', true);  

    // write symbols file
    let fileName = 'symbols.js';
    let dest = path.resolve(path.join(options.profiles.current.dest, fileName);
    fsx.writeFileSync(dest, `window.FLAIR_SYMBOLS="${options.profiles.current.symbols.toString()}"`, 'utf8';)

    options.logger(1, '', './' + fileName + ` generated with ${options.profiles.current.symbols.length} symbols`;

    // done
    cb();
};