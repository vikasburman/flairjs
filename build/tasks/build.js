const path = require('path');
const rootPath = process.cwd();
const flairBuild = require(path.join(rootPath, 'src/flair.build/_members/build-asm.js'));

// do
const doTask = (done) => {
    // configure
    let options = {};
    options.rootPath = rootPath;
    options.suppressLogging = false;
    options.processAsGroups = false; // if true, it will treat first level folders under src as groups and will process each folder as group, otherwise it will treat all folders under src as individual assemblies
    options.cb = done;

    // run
    flairBuild(options);
};

exports.build = function(cb) {
    doTask(cb);
};