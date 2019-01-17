const fsx = require('fs-extra');
const path = require('path');
const delAll = require('../utils.js').delAll;

// do
const doTask = (done) => {
    // delete all files of package
    delAll('./package');
   
    // copy files to package, so that it can be published
    // via npm publish ./package
    let files = [
        { src: './build/build-asm/engine.js', dest: './package/flair.build.js' },
        { src: './dist/flair.js' },
        { src: './dist/flair.min.js' },
        { src: './package.json'},
        { src: './LICENSE' },
        { src: './README.md' }
    ],
    _src, _dest = '';
    for(let file of files) {
        _src = file.src;
        _dest = file.dest || './package/' + path.basename(_src);
        fsx.ensureDirSync(path.dirname(_dest));
        fsx.copyFileSync(_src, _dest);
    }

    // done
    done();
};
exports.pack = function(cb) {
    doTask(cb);
};