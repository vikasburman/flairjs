const fsx = require('fs-extra');
const path = require('path');
const fg = require('fast-glob');
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
        // create temp spec runner
        const runnerTemplate = optionsJSON.jasmine.specRunner;
        let tempDir = optionsJSON.jasmine.temp_dir;
        let tempRunner = path.join(tempDir, 'specRunner.html');
        fsx.ensureDirSync(tempDir);
        fsx.copyFileSync(runnerTemplate, tempRunner);

        // collect tests and helpers to include
        let specDir = optionsJSON.jasmine.spec_dir,
            relativePrefixBetweenSpecAndTempDir = optionsJSON.jasmine.relative_prefix,
            helperGlobs = [],
            specGlobs = [];
        if (optionsJSON.jasmine.helpers) {
            for(let file of optionsJSON.jasmine.helpers) {
                helperGlobs.push(path.join(specDir, file));
            }
        }
        if (optionsJSON.jasmine.spec_files) {
            for(let file of optionsJSON.jasmine.spec_files) {
                specGlobs.push(path.join(specDir, file));
            }
        }
        let helpers = helperGlobs.length > 0 ? fg.sync(helperGlobs) : [];
        let specs = specGlobs.length > 0 ? fg.sync(specGlobs) : [];

        // write files in specRunner
        let helpersScript = '',
            specsScript = '',
            tempRunnerHtml = fsx.readFileSync(tempRunner, 'utf8');
        for(let file of helpers) {
            helpersScript += `<script src="${relativePrefixBetweenSpecAndTempDir}${file}"></script>\n`;
        }
        for(let file of specs) {
            specsScript += `<script src="${relativePrefixBetweenSpecAndTempDir}${file}"></script>\n`;
        }
        tempRunnerHtml = tempRunnerHtml.replace('<!-- helpers -->', helpersScript);
        tempRunnerHtml = tempRunnerHtml.replace('<!-- specs -->', specsScript);
        fsx.writeFileSync(tempRunner, tempRunnerHtml, 'utf8');
    
        // open temp runner
        const open = require('open');
        open(tempRunner);
        done();
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