const gulp = require('gulp');
const eslint = require('gulp-eslint');
const uglifyjs = require('uglify-js-harmony');
const uglify = require('gulp-uglify');
const minifier = require('gulp-uglify/minifier');
const jasmineNode = require('gulp-jasmine');
const pkg = require('./package.json');
const uglifyConfig = require('./.uglify.json');
const rename = require('gulp-rename');

// error handler
const errorHandler = (name) => {
    return function (err) {
        console.error('Error in task: ' + name);
        console.error('Error: ' + err.toString());
    };
};

// task: build
gulp.task('build', (done) => {
    gulp.src('./oojs.js')
        // check for issues
        .pipe(eslint('.eslint.json'))
        // format errors, if any
        .pipe(eslint.format())
        // stop if errors
        .pipe(eslint.failAfterError())
        // minify
        .pipe(minifier(uglifyConfig.js, uglifyjs))
        .on('error', errorHandler('minifier'))
        // rename 
        .pipe(rename((path) => {
            path.extname = '.min.js'; // from <name.whatever>.js to <name.whatever>.min.js
        }))
        .on('error', errorHandler('rename'))
        // write to output again
        .pipe(gulp.dest('./'))
        .on('end', done)
        .on('error', errorHandler('dest'));
});

// task: test
gulp.task('test', (done) => {
    const jasminConfig = require('./.jasmine.json'),
        tests = ['./specs/*.spec.js'];
    gulp.src(tests)
        .pipe(jasmineNode(jasminConfig))
        .on('end', done)
        .on('error', errorHandler('jasmine'));
    // HACK: pipe() is not exising and hence end/error done() is not called via pipe, 
    // so calling done() manually below - this seems to be working so far
    // but need to be revisited for a better solution
    done(); 
});

// task: default
gulp.task('default', ['test', 'build'], () => {
});