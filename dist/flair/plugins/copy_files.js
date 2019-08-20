const path = require('path');
const fsx = require('fs-extra');
const copyDir = require('copy-dir');

const wildcardMatch = (find, source) => { // for future use when we support basic wildcard in copy definitions
    find = find.replace(/[\-\[\]\/\{\}\(\)\+\.\\\^\$\|]/g, "\\$&");
    find = find.replace(/\*/g, ".*");
    find = find.replace(/\?/g, ".");
    var regEx = new RegExp(find, "i");
    return regEx.test(source);
};

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

    options.logger(0, 'copy', '', true);  

    // copy all files or folders as is in dest
    let src = '',
        dest = '';

    let copyThis = (_fileOrFolder, _src, _dest) => {
        options.logger(1, '', './' + path.join(options.src, _fileOrFolder));
        if (fsx.lstatSync(_src).isDirectory()) {
            fsx.ensureDirSync(_dest);
            copyDir.sync(_src, _dest, {
                utimes: true,
                mode: true,
                cover: true
              });
        } else {
            fsx.ensureDirSync(path.dirname(_dest));
            fsx.copyFileSync(_src, _dest);
        }        

    };
    for(let fileOrFolder of options.profiles.current.copy) {
        src = path.resolve(path.join(options.src, path.join(options.profiles.current.root, fileOrFolder)));
        dest = path.resolve(path.join(options.profiles.current.dest, fileOrFolder))
        if (options.clean || options.fullBuild) { // cleaned or full build    
            copyThis(fileOrFolder, src, dest);
        } else if (!fsx.existsSync(dest)) { // file does not exists
            copyThis(fileOrFolder, src, dest);
        } else { // file exists
            if (fsx.statSync(src).mtime > fsx.statSync(dest).mtime) { // file updated
                copyThis(fileOrFolder, src, dest);
            } else {
                options.logger(1, '', './' + path.join(options.src, fileOrFolder) + ' [exists, copy skipped]');
            }
        }
    }

    // done
    cb();
};