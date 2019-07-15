const path = require('path');
const fsx = require('fs-extra');
const copyDir = require('copy-dir');

/**
 * @name copy_files
 * @description copy files for current profile, if configured
 * @example
 *  exec(settings, options, cb)
 * @params
 *  settings: object - plugin settings object
 *  options: object - build configuration object
 *  cb: function - callback function
 * @returns void
 */
exports.exec = function(settings, options, cb) { // eslint-disable no-unused-vars
    if (!options.profiles.current.copy || options.profiles.current.copy.length === 0) { cb(); return; }

    options.logger(0, 'copy_files', '', true);  

    // copy all files or folders as is in dest
    let src = '',
        dest = '';
    for(let fileOrFolder of options.profiles.current.copy) {
        src = path.resolve(path.join(options.src, path.join(options.profiles.current.root, fileOrFolder)));
        dest = path.resolve(path.join(options.profiles.current.dest, fileOrFolder))
        if (options.clean || options.fullBuild || !fsx.existsSync(dest)) {         
            options.logger(1, '', './' + path.join(options.src, fileOrFolder));
            if (fsx.lstatSync(src).isDirectory()) {
                fsx.ensureDirSync(dest);
                copyDir.sync(src, dest, {
                    utimes: true,
                    mode: true,
                    cover: true
                  });
            } else {
                fsx.ensureDirSync(path.dirname(dest));
                fsx.copyFileSync(src, dest);
            }        
        } else {
            options.logger(1, '', './' + path.join(options.src, fileOrFolder) + ' [exists, copy skipped]');
        }
    }

    // done
    cb();
};