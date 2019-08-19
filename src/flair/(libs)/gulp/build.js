const fsx = require('fs-extra');
const argv = require('minimist')(process.argv.slice(2));

// do
const doTask = (done) => {
    // get options file
    let options = argv.options || '',
        custom = argv.custom || '',
        forcedFullBuild = argv.full,
        forcedQuickBuild = argv.quick,
        optionsJSON = null;
    if (!options) {
        console.log('Build options definition is not configured. Use --options <options-file> to configure build script in package.json'); // eslint-disable-line no-console
        return;
    }

    // load options
    optionsJSON = fsx.readJSONSync(options, 'utf8');
    if (forcedFullBuild) { optionsJSON.fullBuild = true; }
    if (forcedQuickBuild && !forcedFullBuild) { optionsJSON.quickBuild = true; }
    if (custom) { // custom config defined from outside, overwrite
        optionsJSON.customBuild = true;
        optionsJSON.customBuildConfig = custom;
    }
    let engine = optionsJSON.engine || '../flairBuild.js';
    if (!engine) {
        console.log('Build engine is not configured. Define correct path of flairBuild.js at "engine" option in build options file.'); // eslint-disable-line no-console
    }

    // load and run engine
    let flairBuild = require(engine);
    flairBuild(optionsJSON, done);
};

exports.build = function(cb) {
    doTask(cb);
};