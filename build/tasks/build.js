const gulp = require('gulp');
const eslint = require('gulp-eslint');
const uglifyjs = require('uglify-js-harmony');
const uglify = require('gulp-uglify');
const minifier = require('gulp-uglify/minifier');
const uglifyConfig = require('../config/.uglify.json');
const rename = require('gulp-rename');
const inject = require('gulp-inject-file');
const replace = require('gulp-string-replace');
const replaceOptions = { logs: enabled = false };
const fsx = require('fs-extra');
const path = require('path');
const packageJSON = JSON.parse(fsx.readFileSync('./package.json', 'utf8'));
const destName = 'flair';

// error handler
let errorHandler = (name) => {
    return function (err) {
        console.error('Error in task: ' + name);
        console.error('Error: ' + err.toString());
    };
};

// do
const doTask = (done) => {
    gulp.src('./src/index.js', {base: './src/'})

    // assemble pieces
    .pipe(inject())
    .on('error', errorHandler('assemble'))

    // write assembled
    .pipe(rename((path) => {
        path.basename = destName;
    }))
    .on('error', errorHandler('rename'))     
    .pipe(replace('<basename>', packageJSON.name, replaceOptions))
    .pipe(replace('<title>', packageJSON.title, replaceOptions))
    .pipe(replace('<desc>', packageJSON.description, replaceOptions))
    .pipe(replace('<version>', packageJSON.version, replaceOptions))
    .pipe(replace('<copyright>', packageJSON.copyright, replaceOptions))
    .pipe(replace('<license>', packageJSON.license, replaceOptions))
    .pipe(replace('<link>', packageJSON.link, replaceOptions))
    .pipe(replace('<datetime>', new Date().toUTCString(), replaceOptions))
    .pipe(gulp.dest('./dist'))
    .on('error', errorHandler('write-assembled'))

    // check for issues
    .pipe(eslint('./build/config/.eslint.json'))
    // format errors, if any
    .pipe(eslint.format())
    // stop if errors
    .pipe(eslint.failAfterError())
    
    // minify
    .pipe(minifier(uglifyConfig.js, uglifyjs))
    .on('error', errorHandler('minifier'))
    
    // write minified
    .pipe(rename((path) => {
        path.extname = '.min.js'; // from <name.whatever>.js to <name.whatever>.min.js
    }))
    .on('error', errorHandler('rename'))
    .pipe(replace(destName + '.js', destName + '.min.js', replaceOptions))
    .pipe(gulp.dest('./dist'))
    .on('end', () => {
        // copy build engine
        fsx.copyFileSync('./build/build-asm/engine.js', './dist/' + destName + '.build.js');

        // update examples copy as well
        fsx.copyFileSync('./dist/' + destName + '.js', './docs/examples/kitchensink/js/' + destName + '.js');

        // done, print stats
        let stat = fsx.statSync('./dist/' + destName + '.js'),
            stat_min = fsx.statSync('./dist/' + destName + '.min.js');
        console.log('==> ' + destName + '.js (' + Math.round(stat.size / 1024) + 'kb, ' + Math.round(stat_min.size / 1024) + 'kb minified)\n');
        done();
    })
    .on('error', errorHandler('write-minified'));
};
exports.build = function(cb) {
    doTask(cb);
};