const fsx = require('fs-extra');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

// do
const doTask = (done) => {
    // change active flag of current build in dest
    let options = argv.options || '',
        active = argv.active || '',
        optionsJSON = null
    if (!options) {
        console.log('Build options definition is not configured. Use --options <options-file> to configure build script in package.json'); // eslint-disable-line no-console
        done(); return;
    }
    if (!active) {
        console.log('Active flag definition is not configured. Use --active <flagName> to configure active flag of current build.'); // eslint-disable-line no-console
        done(); return;
    }

    // load options
    optionsJSON = fsx.readJSONSync(options, 'utf8');
    
    // update flags.json file from __active field with current active flag
    let fileName = path.join(optionsJSON.dest, 'flags.json'),
        flags = null,
        content = '';
    if (fsx.existsSync(fileName)) {
        flags = JSON.parse(fileName);
        if (flags[flag]) { // update active flag only if this flag exists
            flags.__active = flag; // mark this as active
            content = JSON.stringify(flags);
            fsx.writeFileSync(fileName, content, 'utf8');
        } else {
            console.log(`Active marked flag: '${flag}' does not exists. Could not flag the build.`); // eslint-disable-line no-console
        }
    } else {
        console.log(`${fileName} file does not exists. Could not flag the build.`); // eslint-disable-line no-console
    }

    done();
};

exports.flag = function(cb) {
    doTask(cb);
};