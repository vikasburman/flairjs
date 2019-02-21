const path = require('path');
const fsx = require('fs-extra');
const argv = require('minimist')(process.argv.slice(2));

// do
const doTask = (done) => {
    // get options file
    let options = argv.options || '',
        forcedFullBuild = argv.full,
        optionsJSON = null;
    if (!options) {
        console.log('Build options definition is not configured. Use --options <options-file> to configure build script in package.json');
        return;
    }

    // load options
    optionsJSON = fsx.readJSONSync(options, 'utf8');
    if (forcedFullBuild) { optionsJSON.fullBuild = true; }
    let engine = path.resolve(optionsJSON.engine) || '';
    if (!engine || !fsx.existsSync(engine)) {
        console.log('Build engine is either not configured or not found. Define correct path of flair.build.js at "engine" option in build options file.');
        return;
    }
    
    // load and run engine
    let flairBuild = require(engine);
    flairBuild(optionsJSON, done);
};

exports.build = function(cb) {
    doTask(cb);
};