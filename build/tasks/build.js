const path = require('path');
const rootPath = process.cwd();

// do
const doTask = (done, isFull) => {
    // configure
    let options = {};
    options.rootPath = rootPath;
    options.isFull = isFull;
    options.minify = isFull;
    options.gzip = isFull;
    options.gzipAssets = isFull;
    options.rootPath = rootPath;
    options.suppressLogging = false;
    options.processAsGroups = false; // if true, it will treat first level folders under src as groups and will process each folder as group, otherwise it will treat all folders under src as individual assemblies
    options.cb = done;

    // run
    let argsString = '';
    let idx = process.argv.findIndex((item) => { return (item.startsWith('--flairBuild') ? true : false); });
    if (idx !== -1) { argsString = process.argv[idx].substr(2).split('=')[1]; }
    if (argsString) {
        const flairBuild = require(path.join(rootPath, argsString));
        options.engine = argsString;
        flairBuild(options);
    } else {
        console.log('**** Build failed: flairBuild engine is not configured. Configure using --flairBuild=<path to flair.build.js file>')
        if (typeof done === 'function') { done(); }
    }
};

exports.build = function(cb, isFull) {
    doTask(cb, isFull);
};