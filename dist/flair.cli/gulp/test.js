const fsx = require('fs-extra');
const argv = require('minimist')(process.argv.slice(2));

// do
const doTask = (done) => {
    // get options file
    let options = argv.options || '',
        clientMode = argv.client,
        optionsJSON = null;
    if (!options) {
        console.log('Test options definition is not configured. Use --options <options-file> to configure test script in package.json');  // eslint-disable-line no-console
        return;
    }

    // load options
    optionsJSON = fsx.readJSONSync(options, 'utf8');

    // run tests
    if (clientMode) {
        const runner = optionsJSON.jasmine.specRunner;
        const open = require('open');
        open(runner);


    } else {
        const Jasmine = require('jasmine');
        const jasmine = new Jasmine();
        jasmine.loadConfig(optionsJSON.jasmine);
        jasmine.onComplete(done);
        jasmine.execute();        
    }
};
exports.test = function(cb) {
    doTask(cb);
};