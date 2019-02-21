const fsx = require('fs-extra');
const argv = require('minimist')(process.argv.slice(2));

const jasmine = (options, done) => {
    const Jasmine = require('jasmine');
    const jasmine = new Jasmine();
    jasmine.loadConfig(options);
    jasmine.onComplete(done);
    jasmine.execute();
};

// do
const doTask = (done) => {
    // get options file
    let options = argv.options || '',
        optionsJSON = null;
    if (!options) {
        console.log('Test options definition is not configured. Use --options <options-file> to configure test script in package.json');
        return;
    }

    // load options
    optionsJSON = fsx.readJSONSync(options, 'utf8');

    // process supported type of testing
    jasmine(optionsJSON.jasmine, () => {
        done();
    });
};
exports.test = function(cb) {
    doTask(cb);
};