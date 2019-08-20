const fsx = require('fs-extra');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const readline = require('readline');

// do
const doTask = (done) => {
    // change active flag of current build in dest
    let options = argv.options || '',
        optionsJSON = null
    if (!options) {
        console.log('Build options definition is not configured. Use --options <options-file> to configure build script in package.json'); // eslint-disable-line no-console
        done(); return;
    }

    // load options
    optionsJSON = fsx.readJSONSync(options, 'utf8');    

    // ask flag name and folders where to flag the build
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Set active flag (dev, prod, <...>): ', (activeFlag) => {
        if (activeFlag) {
            rl.question(`On builds at ${options.dest} (<...>,<...>): `, (atFolders) => {
                let folders = [];
                if (atFolders) {
                    folders = atFolders.split(',')
                } 
                for(let fld of folders) {
                    // update flags.json file for __active field with current active flag
                    let fileName = path.join(optionsJSON.dest, fld, 'flags.json'),
                        flags = null,
                        content = '';
                    if (fsx.existsSync(fileName)) {
                        flags = JSON.parse(fileName);
                        if (flags[flag]) { // update active flag only if this flag exists
                            flags.__active = flag; // mark this as active
                            content = JSON.stringify(flags);
                            fsx.writeFileSync(fileName, content, 'utf8');
                        } else {
                            console.log(`Active marked flag: '${flag}' does not exists in '${fld}/flags.json. Could not flag the build.`); // eslint-disable-line no-console
                        }
                    } else {
                        console.log(`'${fld}/flags.json does not exists. Could not flag the build.`); // eslint-disable-line no-console
                    }                    
                }

                // done
                rl.close();
                done();
            });
        } else {
            rl.close();
            done();
        }
    });
};

exports.flag = function(cb) {
    doTask(cb);
};