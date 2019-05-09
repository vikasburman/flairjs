const path = require('path');
const fsx = require('fs-extra');
const del = require('del');
const copyDir = require('copy-dir');
const argv = require('minimist')(process.argv.slice(2));

const delAll = (root) => {
    del.sync([root + '/**', '!' + root]);
};
const NPM = (options) => {
    let dest = path.join(path.resolve(options.dest), 'npm');
    
    // delete all old files of package
    delAll(dest);
   
    // copy files to package, so it can be published using
    // via npm publish <package-folder>/npm
    let files = options.files;
    
    let _src, _dest = '';
    for(let file of files) {
        _src = path.resolve(file.src);
        if (fsx.lstatSync(_src).isDirectory()) {
            _dest = path.join(dest, (file.dest || '')) || dest; // if destination is defined for item level
            fsx.ensureDirSync(dest);
            copyDir.sync(_src, _dest);
        } else {
            _dest = path.join(dest, (file.dest || path.basename(_src)));
            fsx.ensureDirSync(path.dirname(_dest));
            fsx.copyFileSync(_src, _dest);
        }
    }
};

// do
const doTask = (done) => {
    // get options file
    let options = argv.options || '',
        optionsJSON = null;
    if (!options) {
        console.log('Package options definition is not configured. Use --options <options-file> to configure package script in package.json'); // eslint-disable-line no-console
        return;
    }

    // load options
    optionsJSON = fsx.readJSONSync(options, 'utf8');

    // process each supported type of packaging
    NPM(optionsJSON.npm);

    // done
    done();
};

exports.pack = function(cb) {
    doTask(cb);
};