const fsx = require('fs-extra');
const path = require('path');
const del = require('del');
const copyDir = require('copy-dir');
const npmPkgConfig = JSON.parse(fsx.readFileSync('./build/config/.npmpkg.json', 'utf8'));

let delAll = (root) => {
    del.sync([root + '/**', '!' + root]);
};

// do
const doTask = (done) => {
    // delete all files of package
    delAll(npmPkgConfig.dest);
   
    // copy files to package, so that it can be published
    // via npm publish <package>
    let files = npmPkgConfig.files;
    
    let _src, _dest = '';
    for(let file of files) {
        _src = file.src;
        if (fsx.lstatSync(_src).isDirectory()) {
            _dest = file.dest || npmPkgConfig.dest;
            copyDir.sync(_src, _dest);
        } else {
            _dest = npmPkgConfig.dest + '/' + (file.dest || path.basename(_src));
            fsx.ensureDirSync(path.dirname(_dest));
            fsx.copyFileSync(_src, _dest);
        }
    }

    // done
    done();
};
exports.pack = function(cb) {
    doTask(cb);
};